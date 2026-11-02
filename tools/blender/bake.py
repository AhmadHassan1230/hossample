# Lightmap bake for the HoS studio.
#   blender -b --factory-startup -P tools/blender/bake.py -- <studio_export.glb> <outdir> preview|bake [samples]
# preview: Cycles render from the arrival camera (to calibrate lights)
# bake:    world-scale UVs, lightmap atlas (UV "LM") + vertex-colour bake for foliage, GLB export
import bpy, bmesh, sys, os, math
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT, MODE = argv[0], argv[1], argv[2]
SAMPLES = int(argv[3]) if len(argv) > 3 else (96 if MODE == "preview" else 512)
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HDRI = os.path.join(ROOT, "public/assets/ph/belfast_sunset_puresky_1k.hdr")
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
scene = bpy.context.scene

# ---------- Cycles on the GPU ----------
scene.render.engine = "CYCLES"
cprefs = bpy.context.preferences.addons["cycles"].preferences
for kind in ("METAL", "NONE"):
    try:
        cprefs.compute_device_type = kind
        break
    except TypeError:
        pass
cprefs.get_devices()
for d in cprefs.devices:
    d.use = d.type != "CPU" or cprefs.compute_device_type == "NONE"  # GPU only on Apple Silicon
scene.cycles.device = "GPU" if cprefs.compute_device_type != "NONE" else "CPU"
scene.cycles.samples = SAMPLES
scene.cycles.max_bounces = 6
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 2
scene.cycles.transparent_max_bounces = 8
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.cycles.blur_glossy = 1.0
scene.render.use_persistent_data = True
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy" if MODE == "preview" else "None"


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1.0,)


# Approximate albedo of each kit material (texture average x tint), roughness, metallic.
ALBEDO = {
    "wall": ("#463d39", 0.95, 0), "wallBox": ("#463d39", 0.95, 0), "ceiling": ("#2e2927", 0.95, 0),
    "floor": ("#2c2019", 0.5, 0), "beam": ("#3d2a1e", 0.8, 0), "oak": ("#7d5b3d", 0.6, 0),
    "oakLight": ("#9b7a58", 0.7, 0), "sheesham": ("#5a2d19", 0.45, 0), "walnut": ("#3b2417", 0.5, 0),
    "steelBlack": ("#131110", 0.4, 0.85), "steel": ("#a8a39c", 0.3, 1), "brass": ("#c49a58", 0.28, 1),
    "card": ("#e3ddd2", 0.8, 0), "paper": ("#e9e3d8", 0.85, 0), "brick": ("#7c3c26", 0.9, 0),
    "boucle": ("#e7ded1", 1.0, 0), "linen": ("#5b4f46", 1.0, 0), "rug": ("#776757", 1.0, 0),
    "terrazzo": ("#c7bfb3", 0.6, 0), "travertine": ("#857869", 0.7, 0), "concrete": ("#58524d", 0.9, 0),
    "stucco": ("#a59b92", 0.9, 0), "rose": ("#a46a59", 0.8, 0), "clay": ("#985436", 0.8, 0),
    "cork": ("#8a6647", 0.95, 0), "leaf": ("#3b5030", 0.7, 0), "leafDark": ("#2e3d24", 0.7, 0),
    "ink": ("#161210", 0.5, 0), "leather": ("#17110e", 0.45, 0), "cane": ("#b08a58", 0.7, 0),
    "porcelain": ("#d9d8e0", 0.15, 0), "ceramicCream": ("#e2d9cc", 0.35, 0), "ceramicBand": ("#5a3b28", 0.6, 0),
    "mirror": ("#d6d2cc", 0.03, 1), "screen": ("#0b0a09", 0.2, 0.3), "sweep": ("#b8ada3", 0.95, 0),
}
EMIT = {  # name: (colour, strength)
    "neon": ("#ff5414", 55.0), "bulb": ("#ffc98a", 80.0), "softbox": ("#fff1df", 30.0),
    "lampShade": ("#ffb46e", 9.0), "corridorGlow": ("#ff9a55", 1.4),
}
NOBAKE = {"glass", "neon", "bulb", "softbox", "lampShade", "corridorGlow", "mirror"}
FOLIAGE = ("pachira", "potted_plant", "calathea", "leaf")


def principled(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if bsdf is None:
        nt.nodes.clear()
        bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
        out = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(bsdf.outputs[0], out.inputs[0])
    return bsdf


PH = os.path.join(ROOT, "public/assets/ph")
_img_cache = {}


def img(path, colour=True):
    key = (path, colour)
    if key not in _img_cache:
        im = bpy.data.images.load(path, check_existing=True)
        im.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        _img_cache[key] = im
    return _img_cache[key]


# Scanned materials: (Poly Haven set, tint, tile size in metres, roughness scale, lacquer coat, bump)
TEXTURED = {
    "floor": ("herringbone_parquet", "#8a6a52", 2.0, 0.55, 0.65, 0.06),
    "wall": ("plastered_wall_04", "#6d625c", 2.2, 1.0, 0.0, 0.25),
    "wallBox": ("plastered_wall_04", "#6d625c", 2.2, 1.0, 0.0, 0.25),
    "ceiling": ("white_stucco", "#3f3936", 2.0, 1.0, 0.0, 0.15),
    "beam": ("oak_veneer_01", "#5c4030", 1.2, 0.9, 0.0, 0.05),
    "oak": ("oak_veneer_01", "#b98d62", 0.9, 0.8, 0.25, 0.03),
    "oakLight": ("oak_veneer_01", "#cfa57a", 0.9, 0.9, 0.0, 0.03),
    "sheesham": ("oak_veneer_01", "#7a3e22", 0.7, 0.6, 0.45, 0.02),
    "walnut": ("oak_veneer_01", "#55331f", 0.8, 0.7, 0.3, 0.02),
    "boucle": ("wool_boucle", "#f1e8dc", 0.35, 1.0, 0.0, 0.35),
    "linen": ("rough_linen", "#7a6a5c", 0.8, 1.0, 0.0, 0.2),
    "rug": ("rough_linen", "#9a8775", 0.6, 1.0, 0.0, 0.25),
    "terrazzo": ("terrazzo_tiles", "#e8e1d6", 0.9, 0.8, 0.3, 0.02),
    "travertine": ("terrazzo_tiles", "#a89a8a", 0.9, 0.9, 0.0, 0.03),
    "concrete": ("white_stucco", "#7b746d", 1.0, 1.0, 0.0, 0.2),
    "stucco": ("white_stucco", "#cfc5bb", 1.6, 1.0, 0.0, 0.15),
    "sweep": ("white_stucco", "#e2dad0", 3.0, 1.0, 0.0, 0.02),
    "cork": ("rough_linen", "#b08a62", 0.5, 1.0, 0.0, 0.3),
    "brick": ("white_stucco", "#a5553a", 0.4, 1.0, 0.0, 0.3),
}


def textured(mat, setname, tint, tile, rough_mul, coat, bump):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    N, L = nt.nodes, nt.links
    out = N.new("ShaderNodeOutputMaterial")
    b = N.new("ShaderNodeBsdfPrincipled")
    tc = N.new("ShaderNodeTexCoord")
    mp = N.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile, 1 / tile, 1 / tile)
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    d = N.new("ShaderNodeTexImage")
    d.image = img(os.path.join(PH, setname, "diff.jpg"))
    a = N.new("ShaderNodeTexImage")
    a.image = img(os.path.join(PH, setname, "arm.jpg"), colour=False)
    for t in (d, a):
        t.projection = "BOX"
        t.projection_blend = 0.25
        L.new(mp.outputs["Vector"], t.inputs["Vector"])
    mix = N.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.blend_type = "MULTIPLY"
    mix.inputs["Factor"].default_value = 1.0
    L.new(d.outputs["Color"], mix.inputs[6])
    mix.inputs[7].default_value = srgb(tint)
    L.new(mix.outputs[2], b.inputs["Base Color"])
    sep = N.new("ShaderNodeSeparateColor")
    L.new(a.outputs["Color"], sep.inputs["Color"])
    rm = N.new("ShaderNodeMath")
    rm.operation = "MULTIPLY"
    rm.inputs[1].default_value = rough_mul
    L.new(sep.outputs[1], rm.inputs[0])
    L.new(rm.outputs[0], b.inputs["Roughness"])
    bp = N.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    L.new(d.outputs["Color"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.06
    L.new(b.outputs[0], out.inputs[0])


for mat in bpy.data.materials:
    name = mat.name
    if name in TEXTURED:
        textured(mat, *TEXTURED[name])
        continue
    if name in ALBEDO:
        col, rough, metal = ALBEDO[name]
        b = principled(mat)
        for l in list(b.inputs["Base Color"].links):
            mat.node_tree.links.remove(l)
        b.inputs["Base Color"].default_value = srgb(col)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
    if name in EMIT:
        col, strength = EMIT[name]
        b = principled(mat)
        b.inputs["Base Color"].default_value = srgb(col)
        b.inputs["Emission Color"].default_value = srgb(col)
        b.inputs["Emission Strength"].default_value = strength
    if name == "glass":
        b = principled(mat)
        b.inputs["Alpha"].default_value = 0.0  # let light through the windows during the bake

# ---------- lights: replace the real-time lights with physical ones ----------
def world_loc(o):
    return o.matrix_world.to_translation()


for o in [o for o in bpy.data.objects if o.type == "LIGHT"]:
    bpy.data.objects.remove(o, do_unlink=True)


def add_light(kind, name, loc, energy, color="#ffc98a", size=0.05, aim=None, spot=None):
    data = bpy.data.lights.new(name, kind)
    data.energy = energy
    data.color = srgb(color)[:3]
    if kind in ("POINT", "SPOT"):
        data.shadow_soft_size = size
    if kind == "AREA":
        data.shape = "RECTANGLE"
        data.size, data.size_y = size if isinstance(size, tuple) else (size, size)
    if kind == "SPOT" and spot:
        data.spot_size = spot[0]
        data.spot_blend = spot[1]
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    o.location = loc
    if aim is not None:
        d = Vector(aim) - Vector(loc)
        o.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return o


# three (x, y, z) -> blender (x, -z, y)
T = lambda x, y, z: (x, -z, y)
add_light("SPOT", "pendant_arch", T(-3.2, 2.72, -1.47), 180, "#ffbf80", 0.06, aim=T(-3.2, 0.0, -1.47), spot=(math.radians(85), 0.6))
add_light("POINT", "pendant_furn", T(-0.95, 2.6, 0.9), 55, "#ffbd80", 0.05)
add_light("POINT", "floorlamp", T(-5.04, 1.42, 1.48), 45, "#ffb877", 0.12)
add_light("AREA", "softbox", T(4.88, 1.9, -1.98), 260, "#fff1e2", (0.6, 0.6), aim=T(3.9, 0.7, -3.7))
add_light("SPOT", "gallery", T(-2.85, 3.9, -2.6), 160, "#ffd7a6", 0.05, aim=T(-2.85, 1.7, -4.5), spot=(math.radians(70), 0.7))
add_light("SPOT", "exchange", T(2.66, 4.0, 2.22), 130, "#ffd2a0", 0.05, aim=T(2.6, 0.6, 1.7), spot=(math.radians(62), 0.8))
add_light("POINT", "corridor", T(0.4, 2.6, -7.6), 25, "#ffb070", 0.2)

# ---------- world: dusk sky, seen and felt only through the windows ----------
world = bpy.data.worlds.new("dusk")
scene.world = world
world.use_nodes = True
wn = world.node_tree
wn.nodes.clear()
env = wn.nodes.new("ShaderNodeTexEnvironment")
env.image = bpy.data.images.load(HDRI)
mapping = wn.nodes.new("ShaderNodeMapping")
coord = wn.nodes.new("ShaderNodeTexCoord")
mapping.inputs["Rotation"].default_value[2] = math.radians(-125)
bg = wn.nodes.new("ShaderNodeBackground")
bg.inputs["Strength"].default_value = 0.55
wout = wn.nodes.new("ShaderNodeOutputWorld")
wn.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
wn.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
wn.links.new(env.outputs["Color"], bg.inputs["Color"])
wn.links.new(bg.outputs["Background"], wout.inputs["Surface"])

# hidden front wall: the camera side is open, but light must only enter via the windows
bpy.ops.mesh.primitive_plane_add(size=1, location=T(0, 2.2, 4.62))
front = bpy.context.active_object
front.name = "BAKE_front_wall"
front.rotation_euler = (math.radians(90), 0, 0)
front.scale = (13.0, 4.6, 1.0)
fm = bpy.data.materials.new("BAKE_front")
principled(fm).inputs["Base Color"].default_value = srgb("#1d1918")
front.data.materials.append(fm)

if MODE == "preview":
    cam_data = bpy.data.cameras.new("cam")
    cam_data.sensor_fit = "VERTICAL"
    cam_data.angle_y = math.radians(38)
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    stops = {"arrive": ((0.5, 1.75, 8.6), (0.4, 1.75, -4.5)), "arch": ((-1.0, 2.0, 0.7), (-3.0, 0.95, -1.6)), "film": ((1.5, 1.7, 0.6), (3.9, 1.0, -3.3))}
    which = argv[4] if len(argv) > 4 else "arrive"
    p, t = stops[which]
    cam.location = T(*p)
    d = Vector(T(*t)) - Vector(T(*p))
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    front.visible_camera = False  # we look in through it; it still blocks light
    scene.render.resolution_x, scene.render.resolution_y = 1200, 750
    scene.cycles.use_denoising = True
    scene.render.filepath = os.path.join(OUT, f"preview_{which}.png")
    bpy.ops.render.render(write_still=True)
    print("PREVIEW", scene.render.filepath)
    sys.exit(0)

# ---------- animation: render the scroll journey as path-traced frames ----------
# Same stops and spline as components/atelier/stops.ts (three.js CatmullRomCurve3, centripetal).
STOPS = [
    ((0.5, 1.75, 8.6), (0.4, 1.75, -4.5)), ((1.9, 1.3, 3.6), (0.1, 0.5, 0.7)), ((4.3, 1.5, 4.4), (2.7, 0.8, 1.75)),
    ((3.2, 1.55, 1.7), (5.4, 1.15, -0.45)), ((3.4, 1.95, 0.7), (6.0, 1.95, -0.45)), ((1.5, 1.7, 0.6), (3.9, 1.0, -3.3)),
    ((0.4, 1.65, -0.3), (0.4, 1.8, -4.6)), ((-2.4, 1.8, -0.5), (-2.85, 1.85, -4.45)), ((-3.2, 1.75, -1.4), (-5.4, 1.0, -3.95)),
    ((-1.0, 2.0, 0.7), (-3.0, 0.95, -1.6)), ((-2.0, 1.45, 3.5), (-4.6, 0.8, 0.9)), ((0.2, 2.3, 8.9), (0.0, 1.35, -2.2)),
]


def catmull(points, t):
    """three.js CatmullRomCurve3.getPoint (centripetal, open curve)."""
    pts = [Vector(p) for p in points]
    l = len(pts)
    p = (l - 1) * t
    i = int(math.floor(p))
    w = p - i
    if w == 0 and i == l - 1:
        i = l - 2
        w = 1.0
    p0 = pts[i - 1] if i > 0 else (pts[0] - pts[1]) + pts[0]
    p1, p2 = pts[i], pts[i + 1]
    p3 = pts[i + 2] if i + 2 < l else (pts[l - 1] - pts[l - 2]) + pts[l - 1]
    def d(a, b):
        return max((b - a).length_squared ** 0.25, 1e-4)
    dt0, dt1, dt2 = d(p0, p1), d(p1, p2), d(p2, p3)
    if dt1 < 1e-4: dt1 = 1.0
    if dt0 < 1e-4: dt0 = dt1
    if dt2 < 1e-4: dt2 = dt1
    def comp(x0, x1, x2, x3):
        t1 = ((x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1) * dt1
        t2 = ((x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2) * dt1
        c0, c1 = x1, t1
        c2 = -3 * x1 + 3 * x2 - 2 * t1 - t2
        c3 = 2 * x1 - 2 * x2 + t1 + t2
        return c0 + c1 * w + c2 * w * w + c3 * w * w * w
    return Vector((comp(p0.x, p1.x, p2.x, p3.x), comp(p0.y, p1.y, p2.y, p3.y), comp(p0.z, p1.z, p2.z, p3.z)))


if MODE == "animate":
    PER_SEG = int(argv[4]) if len(argv) > 4 else 16
    RES = (int(argv[5]), int(argv[6])) if len(argv) > 6 else (1600, 900)
    ONLY = argv[7] if len(argv) > 7 else ""  # e.g. "0:1" to render a frame range
    frames = (len(STOPS) - 1) * PER_SEG + 1
    cam_data = bpy.data.cameras.new("cam")
    cam_data.sensor_fit = "VERTICAL"
    cam_data.angle_y = math.radians(38)
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam
    front.visible_camera = False
    pos_pts = [p for p, _ in STOPS]
    tgt_pts = [t for _, t in STOPS]
    for f in range(frames):
        t = f / (frames - 1)
        p = catmull(pos_pts, t)
        q = catmull(tgt_pts, t)
        cam.location = T(*p)
        cam.rotation_euler = (Vector(T(*q)) - Vector(T(*p))).to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location", frame=f + 1)
        cam.keyframe_insert("rotation_euler", frame=f + 1)
    for fc in cam.animation_data.action.fcurves if hasattr(cam.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
    scene.frame_start, scene.frame_end = 1, frames
    if ONLY:
        a, b = ONLY.split(":")
        scene.frame_start, scene.frame_end = int(a) + 1, int(b) + 1
    scene.render.resolution_x, scene.render.resolution_y = RES
    scene.render.resolution_percentage = 100
    scene.cycles.use_denoising = True
    scene.cycles.denoiser = "OPENIMAGEDENOISE"
    scene.cycles.use_adaptive_sampling = True
    scene.cycles.adaptive_threshold = 0.03
    scene.cycles.denoising_prefilter = "ACCURATE"
    scene.cycles.denoising_quality = "HIGH"
    scene.view_settings.exposure = 0.3
    scene.view_settings.look = "AgX - Punchy"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_depth = "8"
    scene.render.filepath = os.path.join(OUT, "f_")
    print("ANIMATE frames", frames, "range", scene.frame_start, scene.frame_end, "res", RES, "spp", SAMPLES)
    bpy.ops.render.render(animation=True)
    print("ANIMATE done")

# ---------- depth: per-frame depth maps for reprojection (no rendering, CPU ray casts) ----------
if MODE == "depth":
    import struct, time
    PER_SEG = int(argv[4]) if len(argv) > 4 else 16
    DW, DH = (int(argv[5]), int(argv[6])) if len(argv) > 6 else (320, 180)
    ONLY = argv[7] if len(argv) > 7 else ""
    frames = (len(STOPS) - 1) * PER_SEG + 1
    # rays must pass through glass and the hidden bake-only front wall
    for o in bpy.data.objects:
        if o.type == "MESH" and (o.name.startswith("BAKE_") or any(m and m.name == "glass" for m in o.data.materials)):
            o.hide_viewport = True
    dg = bpy.context.evaluated_depsgraph_get()
    fy = math.radians(38)
    aspect = 16 / 9
    th = math.tan(fy / 2)
    tw = th * aspect
    pos_pts = [p for p, _ in STOPS]
    tgt_pts = [t for _, t in STOPS]
    a, b = (0, frames - 1)
    if ONLY:
        a, b = (int(x) for x in ONLY.split(":"))
    out_path = os.path.join(OUT, f"depth_{DW}x{DH}.bin")
    mode = "r+b" if os.path.exists(out_path) else "wb"
    with open(out_path, mode) as fh:
        if mode == "wb":
            fh.truncate(frames * DW * DH * 2)
        t0 = time.time()
        for f in range(a, b + 1):
            t = f / (frames - 1)
            p = catmull(pos_pts, t)
            q = catmull(tgt_pts, t)
            P = Vector(T(*p))
            fwd = (Vector(T(*q)) - P).normalized()
            right = fwd.cross(Vector((0, 0, 1))).normalized()
            up = right.cross(fwd).normalized()
            buf = bytearray(DW * DH * 2)
            k = 0
            for j in range(DH):
                v = 1 - (j + 0.5) / DH * 2  # top row first (image order)
                for i in range(DW):
                    u = (i + 0.5) / DW * 2 - 1
                    d = (fwd + right * (u * tw) + up * (v * th)).normalized()
                    hit, loc, *_ = scene.ray_cast(dg, P, d, distance=60.0)
                    dist = (loc - P).length if hit else 60.0
                    struct.pack_into("<H", buf, k, min(65535, int(dist * 1000)))
                    k += 2
            fh.seek(f * DW * DH * 2)
            fh.write(buf)
            if f == a or (f - a) % 10 == 0:
                print(f"DEPTH frame {f} {time.time() - t0:.1f}s", flush=True)
    print("DEPTH done", out_path)
