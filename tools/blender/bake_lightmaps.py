# Overnight lightmap bake for the real-time studio: day + night irradiance per atlas (Cycles,
# Metal GPU), denoised with OIDN's lightmap filter, plus equirect environment probes for reflections.
#   blender -b _source/bake/studio_bake.blend -P tools/blender/bake_lightmaps.py -- [day|night|both] [atlases] [samples] [scale]
# Writes _source/bake/lightmaps/<mode>_<atlas>.exr (+ a tonemapped .png preview) and env_<mode>.exr.
import bpy, math, os, subprocess, sys, time
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
WHICH = argv[0] if argv and argv[0] else "both"
MODES = ["day", "night"] if WHICH == "both" else [WHICH]
ONLY = argv[1].split(",") if len(argv) > 1 and argv[1] else None
SAMPLES = int(argv[2]) if len(argv) > 2 and argv[2] else 256
SCALE = float(argv[3]) if len(argv) > 3 and argv[3] else 1.0       # 0.25 for a quick test
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "_source/bake/lightmaps")
os.makedirs(OUT, exist_ok=True)
OIDN = "/opt/homebrew/bin/oidnDenoise"
RES = {"floor": 4096, "shell": 4096, "left": 2048, "centre": 2048, "right": 2048, "court": 2048}
PROBES = {"env": (0.0, 6.5, 1.7), "env_left": (-6.6, 6.5, 1.7), "env_right": (6.6, 6.5, 1.7)}
PROBE_SAMPLES = 128

scene = bpy.context.scene
cp = bpy.context.preferences.addons["cycles"].preferences
cp.compute_device_type = "METAL"
cp.get_devices()
for d in cp.devices:
    d.use = d.type != "CPU"
scene.render.engine = "CYCLES"
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 5
scene.cycles.glossy_bounces = 2
scene.cycles.transmission_bounces = 6
scene.cycles.transparent_max_bounces = 16
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.render.bake.margin = 8
scene.render.bake.margin_type = "EXTEND"
LOG = open(os.path.join(OUT, "bake.log"), "a")

# lightmaps carry smooth-surface light only; bump/normal detail is added back by the web shader
for mt in bpy.data.materials:
    if mt.node_tree:
        for n in mt.node_tree.nodes:
            if n.type == "BSDF_PRINCIPLED" and n.inputs["Normal"].links:
                mt.node_tree.links.remove(n.inputs["Normal"].links[0])


def log(*a):
    msg = time.strftime("%H:%M:%S ") + " ".join(str(x) for x in a)
    print(msg, flush=True)
    LOG.write(msg + "\n")
    LOG.flush()


def set_mode(night):
    sun = bpy.data.objects["sun"]
    e, r, g, b, ang = sun["night" if night else "day"]
    sun.data.energy, sun.data.color, sun.data.angle = e, (r, g, b), ang
    wn = scene.world.node_tree
    bg = next(n for n in wn.nodes if n.type == "BACKGROUND")
    src = next(n for n in wn.nodes if n.type == ("VALTORGB" if night else "TEX_SKY"))
    for l_ in list(wn.links):
        if l_.to_node == bg and l_.to_socket.name == "Color":
            wn.links.remove(l_)
    wn.links.new(src.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0 if night else 0.9
    for mt in bpy.data.materials:
        if "glow_day" in mt.keys():
            b_ = next((n for n in mt.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if b_:
                b_.inputs["Emission Strength"].default_value = mt["glow_night" if night else "glow_day"]
    for o in scene.objects:
        if o.get("night_lamp"):
            o.hide_render = not night


def write_pfm(path, rgb):
    h, w, _ = rgb.shape
    with open(path, "wb") as f:
        f.write(f"PF\n{w} {h}\n-1.0\n".encode())
        f.write(np.ascontiguousarray(rgb, dtype="<f4").tobytes())


def read_pfm(path):
    with open(path, "rb") as f:
        assert f.readline().strip() == b"PF"
        w, h = map(int, f.readline().split())
        scale = float(f.readline())
        data = np.frombuffer(f.read(), dtype="<f4" if scale < 0 else ">f4")
    return data.reshape(h, w, 3)


def save_exr(img, path):
    img.filepath_raw = path
    img.file_format = "OPEN_EXR"
    img.save()


def preview_png(rgb, path, exposure=1.0):
    """Quick look only: filmic-ish curve + sRGB, written through a temporary Blender image."""
    x = rgb * exposure
    x = x / (1.0 + x)
    x = np.where(x <= 0.0031308, 12.92 * x, 1.055 * np.power(np.clip(x, 0, None), 1 / 2.4) - 0.055)
    h, w, _ = x.shape
    im = bpy.data.images.new("preview", w, h, alpha=True)
    px = np.ones((h, w, 4), np.float32)
    px[:, :, :3] = np.clip(x, 0, 1)
    im.pixels.foreach_set(px.ravel())
    im.filepath_raw = path
    im.file_format = "PNG"
    im.save()
    bpy.data.images.remove(im)


def bake_atlas(mode, atlas):
    objs = [o for o in scene.objects if o.type == "MESH" and o.get("atlas") == atlas]
    if not objs:
        return
    res = max(256, int(RES[atlas] * SCALE))
    img = bpy.data.images.new(f"lm_{mode}_{atlas}", res, res, alpha=False, float_buffer=True)
    mats = {sl.material for o in objs for sl in o.material_slots if sl.material}
    for mt in mats:
        nt = mt.node_tree
        n = nt.nodes.get("LM_TARGET") or nt.nodes.new("ShaderNodeTexImage")
        n.name = "LM_TARGET"
        n.image = img
        for other in nt.nodes:
            other.select = False
        n.select = True
        nt.nodes.active = n
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.hide_render = False
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    t0 = time.time()
    bpy.ops.object.bake(type="DIFFUSE", pass_filter={"DIRECT", "INDIRECT"}, uv_layer="lightmap",
                        margin=8, use_clear=True, target="IMAGE_TEXTURES")
    t1 = time.time()
    px = np.empty(res * res * 4, np.float32)
    img.pixels.foreach_get(px)
    rgb = px.reshape(res, res, 4)[:, :, :3].copy()
    raw, den = os.path.join(OUT, f"_{mode}_{atlas}.pfm"), os.path.join(OUT, f"_{mode}_{atlas}_dn.pfm")
    write_pfm(raw, rgb)
    r = subprocess.run([OIDN, "-f", "RTLightmap", "--hdr", raw, "-o", den, "-q", "high"], capture_output=True, text=True)
    if r.returncode == 0 and os.path.exists(den):
        rgb = read_pfm(den).copy()
        os.remove(den)
    else:
        log("OIDN failed", atlas, r.stderr[-300:])
    os.remove(raw)
    out = np.ones((res, res, 4), np.float32)
    out[:, :, :3] = np.clip(rgb, 0, None)
    img.pixels.foreach_set(out.ravel())
    save_exr(img, os.path.join(OUT, f"{mode}_{atlas}.exr"))
    preview_png(rgb, os.path.join(OUT, f"{mode}_{atlas}.png"), 1.0 if mode == "day" else 2.5)
    bpy.data.images.remove(img)
    log(f"baked {mode} {atlas} {res}px {len(objs)} objects in {t1 - t0:.0f}s (+denoise {time.time() - t1:.0f}s)")


def render_probe(mode, name, loc):
    cam = bpy.data.objects.get("probe_cam") or bpy.data.objects.new("probe_cam", bpy.data.cameras.new("probe_cam"))
    if cam.name not in scene.objects:
        scene.collection.objects.link(cam)
    cam.data.type = "PANO"
    cam.data.panorama_type = "EQUIRECTANGULAR"
    cam.location = loc
    cam.rotation_euler = (math.radians(90), 0, math.radians(-90))   # equirect centre looks down +Y
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = int(2048 * max(SCALE, 0.25)), int(1024 * max(SCALE, 0.25))
    scene.render.resolution_percentage = 100
    scene.cycles.use_denoising = True
    scene.cycles.samples = PROBE_SAMPLES
    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_depth = "16"
    scene.render.filepath = os.path.join(OUT, f"{name}_{mode}.exr")
    t0 = time.time()
    bpy.ops.render.render(write_still=True)
    scene.cycles.samples = SAMPLES
    im = bpy.data.images.load(scene.render.filepath)
    w, h = im.size
    px = np.empty(w * h * 4, np.float32)
    im.pixels.foreach_get(px)
    preview_png(px.reshape(h, w, 4)[:, :, :3], os.path.join(OUT, f"{name}_{mode}.png"), 1.0 if mode == "day" else 2.5)
    bpy.data.images.remove(im)
    log(f"probe {name} {mode} in {time.time() - t0:.0f}s")


for mode in MODES:
    set_mode(mode == "night")
    for atlas in RES:
        if ONLY and atlas not in ONLY:
            continue
        bake_atlas(mode, atlas)
    if not ONLY or "env" in ONLY:
        for name, loc in PROBES.items():
            render_probe(mode, name, loc)
log("DONE", MODES, "samples", SAMPLES, "scale", SCALE)
