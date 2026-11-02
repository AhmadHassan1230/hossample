# HoS studio v2 — "Kimbell x Lahore": three lime vaults with slot skylights, red sandstone
# arcades and jaali, marble floor, courtyard pool with the HoS arch as a brass gateway.
#   blender -b --factory-startup -P tools/blender/studio.py -- <outdir> render [samples] [views] [WxH] [day|night]
#   blender -b --factory-startup -P tools/blender/studio.py -- <outdir> save
# Blender coords: Z up, Y into the room (back wall at Y=13), X right. Front wall at Y=0.
import bpy, bmesh, json, math, os, sys
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else "/tmp/hos_studio"
MODE = argv[1] if len(argv) > 1 else "render"
SAMPLES = int(argv[2]) if len(argv) > 2 else 96
VIEWS = argv[3].split(",") if len(argv) > 3 and argv[3] else ["overview", "left", "centre", "right"]
RES = tuple(int(v) for v in argv[4].split("x")) if len(argv) > 4 and argv[4] else (1600, 900)
NIGHT = len(argv) > 5 and argv[5] == "night"   # blue hour outside, lamps + orange neon on inside
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PH = os.path.join(ROOT, "public/assets/ph")
WORK = os.path.join(ROOT, "public/work")
CAT = os.path.join(ROOT, "_source/catalog/images")
FONT = "/System/Library/Fonts/Supplemental/Bodoni 72.ttc"
os.makedirs(OUT, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ---------------------------------------------------------------- dimensions
XL, XR = -9.75, 9.75        # outer wall inner faces
AX = 3.25                   # arcade centre lines at ±AX (0.6 thick)
AT = 0.6
DEPTH = 13.0                # back wall inner face
S = 4.4                     # vault springing height
RISE = 1.5                  # vault rise
VT = 0.18                   # vault shell thickness
SLOT = 1.1                  # skylight slot width
BAYS = [2.35, 6.5, 10.65]   # arcade bay centres (y)


def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (1.0,)


# ---------------------------------------------------------------- materials
_imgs = {}


def img(path, colour=True):
    key = (path, colour)
    if key not in _imgs:
        im = bpy.data.images.load(path, check_existing=True)
        im.colorspace_settings.name = "sRGB" if colour else "Non-Color"
        _imgs[key] = im
    return _imgs[key]


def tex_path(setname, kind):
    for res in ("2k", "1k"):
        p = os.path.join(PH, setname, f"{kind}_{res}.jpg")
        if os.path.exists(p):
            return p
    return os.path.join(PH, setname, f"{kind}.jpg")


def node(nt, t, **kw):
    n = nt.nodes.new(t)
    for k, v in kw.items():
        setattr(n, k, v)
    return n


def scanned(name, setname, tint="#ffffff", tile=1.0, rough_mul=1.0, coat=0.0, bump=0.15, normal=0.6, mapping="BOX"):
    """Principled material from a Poly Haven scan, box-projected in object space (metres)."""
    m = bpy.data.materials.new(name)
    m["web"] = json.dumps({"k": "scan", "set": setname, "tint": tint, "tile": tile, "rough": rough_mul, "coat": coat})
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    L = nt.links
    out = node(nt, "ShaderNodeOutputMaterial")
    b = node(nt, "ShaderNodeBsdfPrincipled")
    tc = node(nt, "ShaderNodeTexCoord")
    mp = node(nt, "ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (1 / tile,) * 3
    L.new(tc.outputs["Object"], mp.inputs["Vector"])
    d = node(nt, "ShaderNodeTexImage", projection=mapping, projection_blend=0.2)
    d.image = img(tex_path(setname, "diff"))
    a = node(nt, "ShaderNodeTexImage", projection=mapping, projection_blend=0.2)
    a.image = img(tex_path(setname, "arm"), False)
    for t in (d, a):
        L.new(mp.outputs["Vector"], t.inputs["Vector"])
    mix = node(nt, "ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    mix.inputs["Factor"].default_value = 1.0
    L.new(d.outputs["Color"], mix.inputs[6])
    mix.inputs[7].default_value = srgb(tint)
    L.new(mix.outputs[2], b.inputs["Base Color"])
    sep = node(nt, "ShaderNodeSeparateColor")
    L.new(a.outputs["Color"], sep.inputs["Color"])
    rm = node(nt, "ShaderNodeMath", operation="MULTIPLY")
    rm.inputs[1].default_value = rough_mul
    L.new(sep.outputs[1], rm.inputs[0])
    L.new(rm.outputs[0], b.inputs["Roughness"])
    bp = node(nt, "ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    L.new(d.outputs["Color"], bp.inputs["Height"])
    L.new(bp.outputs["Normal"], b.inputs["Normal"])
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.04
    L.new(b.outputs[0], out.inputs[0])
    return m


def flat(name, color, rough=0.6, metal=0.0, emit=None, strength=0.0, alpha=1.0, transmission=0.0, ior=1.45, coat=0.0):
    m = bpy.data.materials.new(name)
    m["web"] = json.dumps({"k": "flat", "color": color, "rough": rough, "metal": metal, "emit": emit, "strength": strength, "trans": transmission, "coat": coat})
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = srgb(color)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Alpha"].default_value = alpha
    b.inputs["Transmission Weight"].default_value = transmission
    b.inputs["IOR"].default_value = ior
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    if emit:
        b.inputs["Emission Color"].default_value = srgb(emit)
        b.inputs["Emission Strength"].default_value = strength
    return m


def lattice_alpha(m, freq, width, families=3, scale_axes=("X", "Z")):
    """Cut a geometric jaali / cane pattern into a material's alpha (object space)."""
    web = json.loads(m.get("web", "{}"))
    web["lattice"] = [freq, width, families]
    m["web"] = json.dumps(web)
    nt = m.node_tree
    b = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tc = node(nt, "ShaderNodeTexCoord")
    sep = node(nt, "ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    u, v = sep.outputs[scale_axes[0]], sep.outputs[scale_axes[1]]
    acc = None
    for k in range(families):
        ang = k * math.pi / families
        ca, sa = math.cos(ang), math.sin(ang)
        m1 = node(nt, "ShaderNodeMath", operation="MULTIPLY")
        nt.links.new(u, m1.inputs[0]); m1.inputs[1].default_value = ca
        m2 = node(nt, "ShaderNodeMath", operation="MULTIPLY")
        nt.links.new(v, m2.inputs[0]); m2.inputs[1].default_value = sa
        ad = node(nt, "ShaderNodeMath", operation="ADD")
        nt.links.new(m1.outputs[0], ad.inputs[0]); nt.links.new(m2.outputs[0], ad.inputs[1])
        fq = node(nt, "ShaderNodeMath", operation="MULTIPLY")
        nt.links.new(ad.outputs[0], fq.inputs[0]); fq.inputs[1].default_value = freq
        fr = node(nt, "ShaderNodeMath", operation="PINGPONG")
        nt.links.new(fq.outputs[0], fr.inputs[0]); fr.inputs[1].default_value = 0.5
        lt = node(nt, "ShaderNodeMath", operation="LESS_THAN")
        nt.links.new(fr.outputs[0], lt.inputs[0]); lt.inputs[1].default_value = width
        if acc is None:
            acc = lt.outputs[0]
        else:
            mx = node(nt, "ShaderNodeMath", operation="MAXIMUM")
            nt.links.new(acc, mx.inputs[0]); nt.links.new(lt.outputs[0], mx.inputs[1])
            acc = mx.outputs[0]
    nt.links.new(acc, b.inputs["Alpha"])
    return m


def lime(name, color, var="#e6dccd", scale=1.6, bump=0.06):
    m = bpy.data.materials.new(name)
    m["web"] = json.dumps({"k": "lime", "color": color, "var": var, "scale": scale, "bump": bump})
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    tc = node(nt, "ShaderNodeTexCoord")
    nz = node(nt, "ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = 8.0
    nz.inputs["Roughness"].default_value = 0.6
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    ramp = node(nt, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = srgb(var)
    ramp.color_ramp.elements[1].color = srgb(color)
    ramp.color_ramp.elements[0].position = 0.35
    ramp.color_ramp.elements[1].position = 0.65
    nt.links.new(nz.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], b.inputs["Base Color"])
    fine = node(nt, "ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 90.0
    nt.links.new(tc.outputs["Object"], fine.inputs["Vector"])
    bp = node(nt, "ShaderNodeBump")
    bp.inputs["Strength"].default_value = bump
    nt.links.new(fine.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    b.inputs["Roughness"].default_value = 0.88
    return m


def image_mat(name, path, rough=0.55, emit=0.0):
    m = bpy.data.materials.new(name)
    m["web"] = json.dumps({"k": "image", "file": path, "rough": rough, "emit": emit})
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    t = node(nt, "ShaderNodeTexImage")
    t.image = img(path)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    if emit:
        nt.links.new(t.outputs["Color"], b.inputs["Emission Color"])
        b.inputs["Emission Strength"].default_value = emit
    return m


def ashlar(name, c1="#a5583f", c2="#bb7055", mortar="#cf967c", bw=0.9, rh=0.42):
    """Dressed red-sandstone ashlar: large courses projected tri-planar in object space,
    per-block tone, bedding streaks and grain from noise (no tiled photo, so no repeat)."""
    m = bpy.data.materials.new(name)
    m["web"] = json.dumps({"k": "ashlar", "c1": c1, "c2": c2, "mortar": mortar, "bw": bw, "rh": rh})
    m.use_nodes = True
    nt = m.node_tree
    L = nt.links
    b = nt.nodes.get("Principled BSDF")
    tc = node(nt, "ShaderNodeTexCoord")
    xyz = node(nt, "ShaderNodeSeparateXYZ")
    L.new(tc.outputs["Object"], xyz.inputs[0])
    geo = node(nt, "ShaderNodeNewGeometry")
    vt = node(nt, "ShaderNodeVectorTransform", vector_type="NORMAL", convert_from="WORLD", convert_to="OBJECT")
    L.new(geo.outputs["Normal"], vt.inputs[0])
    nsep = node(nt, "ShaderNodeSeparateXYZ")
    L.new(vt.outputs[0], nsep.inputs[0])
    ws = []
    for k in range(3):
        ab = node(nt, "ShaderNodeMath", operation="ABSOLUTE")
        L.new(nsep.outputs[k], ab.inputs[0])
        pw = node(nt, "ShaderNodeMath", operation="POWER")
        L.new(ab.outputs[0], pw.inputs[0])
        pw.inputs[1].default_value = 6.0
        ws.append(pw.outputs[0])
    s1 = node(nt, "ShaderNodeMath", operation="ADD")
    L.new(ws[0], s1.inputs[0]); L.new(ws[1], s1.inputs[1])
    s2 = node(nt, "ShaderNodeMath", operation="ADD")
    L.new(s1.outputs[0], s2.inputs[0]); L.new(ws[2], s2.inputs[1])
    col = fac = None
    for k, (u, v) in enumerate(((1, 2), (0, 2), (0, 1))):  # facing x → (Y,Z), facing y → (X,Z), facing z → (X,Y)
        wn = node(nt, "ShaderNodeMath", operation="DIVIDE")
        L.new(ws[k], wn.inputs[0]); L.new(s2.outputs[0], wn.inputs[1])
        cb = node(nt, "ShaderNodeCombineXYZ")
        L.new(xyz.outputs[u], cb.inputs[0]); L.new(xyz.outputs[v], cb.inputs[1])
        br = node(nt, "ShaderNodeTexBrick", offset=0.5, offset_frequency=2)
        L.new(cb.outputs[0], br.inputs["Vector"])
        br.inputs["Color1"].default_value = srgb(c1)
        br.inputs["Color2"].default_value = srgb(c2)
        br.inputs["Mortar"].default_value = srgb(mortar)
        br.inputs["Scale"].default_value = 1.0
        br.inputs["Mortar Size"].default_value = 0.0035
        br.inputs["Mortar Smooth"].default_value = 0.35
        br.inputs["Brick Width"].default_value = bw
        br.inputs["Row Height"].default_value = rh
        cs = node(nt, "ShaderNodeVectorMath", operation="SCALE")
        L.new(br.outputs["Color"], cs.inputs[0]); L.new(wn.outputs[0], cs.inputs["Scale"])
        fs = node(nt, "ShaderNodeMath", operation="MULTIPLY")
        L.new(br.outputs["Fac"], fs.inputs[0]); L.new(wn.outputs[0], fs.inputs[1])
        if col is None:
            col, fac = cs.outputs[0], fs.outputs[0]
        else:
            ca = node(nt, "ShaderNodeVectorMath", operation="ADD")
            L.new(col, ca.inputs[0]); L.new(cs.outputs[0], ca.inputs[1]); col = ca.outputs[0]
            fa = node(nt, "ShaderNodeMath", operation="ADD")
            L.new(fac, fa.inputs[0]); L.new(fs.outputs[0], fa.inputs[1]); fac = fa.outputs[0]
    # weathering + bedding streaks (sandstone is laid in horizontal beds)
    nz = node(nt, "ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = 1.8
    nz.inputs["Detail"].default_value = 10.0
    nz.inputs["Roughness"].default_value = 0.62
    L.new(tc.outputs["Object"], nz.inputs["Vector"])
    nr = node(nt, "ShaderNodeMapRange")
    nr.inputs["From Min"].default_value, nr.inputs["From Max"].default_value = 0.3, 0.7
    nr.inputs["To Min"].default_value, nr.inputs["To Max"].default_value = 0.8, 1.1
    L.new(nz.outputs["Fac"], nr.inputs["Value"])
    wv = node(nt, "ShaderNodeTexWave", wave_type="BANDS", bands_direction="Z")
    wv.inputs["Scale"].default_value = 2.6
    wv.inputs["Distortion"].default_value = 5.0
    wv.inputs["Detail"].default_value = 3.0
    L.new(tc.outputs["Object"], wv.inputs["Vector"])
    wr = node(nt, "ShaderNodeMapRange")
    wr.inputs["To Min"].default_value, wr.inputs["To Max"].default_value = 0.93, 1.03
    L.new(wv.outputs["Fac"], wr.inputs["Value"])
    m1 = node(nt, "ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    m1.inputs["Factor"].default_value = 1.0
    L.new(col, m1.inputs[6]); L.new(nr.outputs[0], m1.inputs[7])
    m2 = node(nt, "ShaderNodeMix", data_type="RGBA", blend_type="MULTIPLY")
    m2.inputs["Factor"].default_value = 1.0
    L.new(m1.outputs[2], m2.inputs[6]); L.new(wr.outputs[0], m2.inputs[7])
    L.new(m2.outputs[2], b.inputs["Base Color"])
    rr = node(nt, "ShaderNodeMapRange")
    rr.inputs["To Min"].default_value, rr.inputs["To Max"].default_value = 0.6, 0.82
    L.new(nz.outputs["Fac"], rr.inputs["Value"])
    L.new(rr.outputs[0], b.inputs["Roughness"])
    # fine grain bump, then recessed joints
    fine = node(nt, "ShaderNodeTexNoise")
    fine.inputs["Scale"].default_value = 140.0
    fine.inputs["Detail"].default_value = 4.0
    L.new(tc.outputs["Object"], fine.inputs["Vector"])
    b1 = node(nt, "ShaderNodeBump")
    b1.inputs["Strength"].default_value = 0.12
    L.new(fine.outputs["Fac"], b1.inputs["Height"])
    inv = node(nt, "ShaderNodeMath", operation="SUBTRACT")
    inv.inputs[0].default_value = 1.0
    L.new(fac, inv.inputs[1])
    b2 = node(nt, "ShaderNodeBump")
    b2.inputs["Strength"].default_value = 0.5
    b2.inputs["Distance"].default_value = 0.002
    L.new(inv.outputs[0], b2.inputs["Height"])
    L.new(b1.outputs["Normal"], b2.inputs["Normal"])
    L.new(b2.outputs["Normal"], b.inputs["Normal"])
    return m


def thin_glass(name, tint="#f6faf8"):
    """Architectural glazing: straight-through transmission + a Fresnel-only reflection (no milky slab)."""
    m = bpy.data.materials.new(name)
    m["web"] = json.dumps({"k": "glass", "tint": tint})
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = node(nt, "ShaderNodeOutputMaterial")
    tr = node(nt, "ShaderNodeBsdfTransparent")
    tr.inputs["Color"].default_value = srgb(tint)
    sp = node(nt, "ShaderNodeBsdfPrincipled")
    sp.inputs["Base Color"].default_value = (0, 0, 0, 1)
    sp.inputs["Roughness"].default_value = 0.0
    sp.inputs["IOR"].default_value = 1.52
    ad = node(nt, "ShaderNodeAddShader")
    nt.links.new(tr.outputs[0], ad.inputs[0])
    nt.links.new(sp.outputs[0], ad.inputs[1])
    nt.links.new(ad.outputs[0], out.inputs["Surface"])
    return m


M = {
    "plaster": lime("lime_plaster", "#f1e8db", "#e3d6c4", 1.4, 0.07),
    "plaster_vault": lime("vault_plaster", "#f7f1e8", "#ece2d4", 0.9, 0.04),
    "sandstone": ashlar("red_sandstone"),
    "sandstone_band": scanned("sandstone_band", "red_sandstone_pavement", "#c98d72", 1.2, 0.5, coat=0.5, bump=0.1),
    "marble": scanned("marble_floor", "marble_01", "#f3efe8", 2.2, 0.35, coat=0.8, bump=0.02),
    "paving": scanned("court_paving", "red_sandstone_pavement", "#e0b49a", 2.4, 1.0, bump=0.3),
    "oak": scanned("oak", "oak_veneer_01", "#c99a6a", 0.9, 0.7, coat=0.25, bump=0.03),
    "walnut": scanned("walnut", "oak_veneer_01", "#5e3b26", 0.8, 0.6, coat=0.35, bump=0.02),
    "sheesham": scanned("sheesham", "oak_veneer_01", "#7a3c20", 0.7, 0.5, coat=0.5, bump=0.02),
    "boucle": lime("boucle", "#f2ebe0", "#e2d8ca", 40.0, 0.35),
    "linen": scanned("linen", "rough_linen", "#cdbba3", 0.7, 1.0, bump=0.2),
    "rug": lime("rug", "#b99a78", "#a5835f", 30.0, 0.25),
    "card": lime("model_card", "#f6f2eb", "#ece6dc", 18.0, 0.015),
    "card_jaali": lattice_alpha(flat("card_jaali", "#f4f0e8", 0.85), 55.0, 0.085, 3),
    "glass_thin": thin_glass("glass_thin"),
    "shade": scanned("shade_linen", "rough_linen", "#efe4d4", 0.7, 1.0, bump=0.1),
    "jacaranda_model": flat("jacaranda_model", "#8d6fc6", 0.8),
    "basswood": flat("basswood", "#d8bf98", 0.75),
    "brass": flat("brass", "#c9a063", 0.22, 1.0),
    "brass_dark": flat("brass_dark", "#a8834e", 0.35, 1.0),
    "steel": flat("black_steel", "#151413", 0.38, 0.85),
    "alu": lattice_alpha(flat("reflector", "#d6d8da", 0.3, 1.0), 26.0, 0.3, 2, ("X", "Y")),
    "jaali": lattice_alpha(scanned("jaali_stone", "red_sandstone_wall", "#dba98d", 0.8, 1.0, bump=0.2), 4.2, 0.12, 3),
    "cane": lattice_alpha(flat("cane", "#c79c62", 0.6), 32.0, 0.16, 3, ("X", "Y")),
    "glass": flat("glass", "#ffffff", 0.0, transmission=1.0, ior=1.5),
    "water": flat("water", "#0f2a2c", 0.03, transmission=0.6, ior=1.33, coat=1.0),
    "paper": flat("paper", "#f5f1e9", 0.85),
    "leather": flat("leather", "#1d1511", 0.45, coat=0.3),
    "screen": flat("screen", "#0b0b0b", 0.2, emit="#a9b8d0", strength=0.6),
    "softbox": flat("softbox", "#ffffff", 1.0, emit="#fff4e8", strength=4.0),
    "neon": flat("neon", "#ffd6bb", 0.3, emit="#ff5a14", strength=0.0),
    "softbox_fabric": flat("softbox_fabric", "#0e0d0d", 0.75),
    "sweep": flat("sweep", "#e3ddd3", 0.95),
    "bulb": flat("bulb", "#fff6e8", 0.4, emit="#ffd9a6", strength=0.0),
}


# ---------------------------------------------------------------- geometry helpers
def link(o):
    scene.collection.objects.link(o)
    return o


def bevel(o, width=0.006, segs=3):
    m = o.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segs
    m.limit_method = "ANGLE"
    m.harden_normals = True
    try:
        o.data.shade_smooth()
    except Exception:
        pass
    return o


def box(name, size, loc, mat, rot=(0, 0, 0), bev=0.006):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(mat)
    if bev:
        bevel(o, min(bev, min(size) * 0.2))
    return o


def cyl(name, r, h, loc, mat, rot=(0, 0, 0), verts=64, bev=0.0):
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=h, location=loc, rotation=rot, vertices=verts)
    o = bpy.context.active_object
    o.name = name
    o.data.materials.append(mat)
    if bev:
        bevel(o, bev)
    else:
        o.data.shade_smooth()
    return o


def prism(name, profile, depth, loc, axis="y", mat=None):
    """Extrude a closed XZ profile along Y (axis='y') or along X (axis='x')."""
    bm = bmesh.new()
    f = [bm.verts.new((x, -depth / 2, z)) for x, z in profile]
    b = [bm.verts.new((x, depth / 2, z)) for x, z in profile]
    bm.faces.new(f)
    bm.faces.new(list(reversed(b)))
    n = len(profile)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([f[i], f[j], b[j], b[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.location = loc
    if axis == "x":
        o.rotation_euler = (0, 0, math.radians(90))
    if mat:
        o.data.materials.append(mat)
    return o


def arch_profile(w, h, segs=48):
    r = w / 2
    spring = max(h - r, 0)
    p = [(-r, 0.0), (r, 0.0), (r, spring)]
    for i in range(1, segs):
        a = i / segs * math.pi
        p.append((r * math.cos(a), spring + r * math.sin(a)))
    p.append((-r, spring))
    return p


def arch(name, w, h, depth, loc, axis="y", mat=None):
    return prism(name, arch_profile(w, h), depth, loc, axis, mat)


def arch_ring(name, w, h, band, depth, loc, axis="y", mat=None, segs=64):
    """Arch-shaped frame (outer arch minus inner arch), open at the bottom."""
    r, ri = w / 2, w / 2 - band
    spring = h - r
    outer = [(r, 0.0), (r, spring)] + [(r * math.cos(a), spring + r * math.sin(a)) for a in [i / segs * math.pi for i in range(1, segs)]] + [(-r, spring), (-r, 0.0)]
    inner = [(-ri, 0.0), (-ri, spring)] + [(ri * math.cos(a), spring + ri * math.sin(a)) for a in [math.pi - i / segs * math.pi for i in range(1, segs)]] + [(ri, spring), (ri, 0.0)]
    return prism(name, outer + inner, depth, loc, axis, mat)


def cut(target, cutter):
    mod = target.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.object = cutter
    mod.solver = "EXACT"
    bpy.context.view_layer.objects.active = target
    bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.data.objects.remove(cutter, do_unlink=True)


def plane_image(name, path, w, loc, rot, rough=0.55, emit=0.0):
    im = img(path)
    h = w * im.size[1] / max(im.size[0], 1)
    bpy.ops.mesh.primitive_plane_add(size=1, location=loc, rotation=rot)
    o = bpy.context.active_object
    o.name = name
    o.scale = (w, h, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(image_mat(name + "_m", path, rough, emit))
    return o, h


# ---------------------------------------------------------------- scanned models (instanced)
_lib, _imported = {}, {}


def asset(name, loc, rot_z=0.0, scale=1.0, variant=None):
    """Instance a Poly Haven model. Plant sets ship several variants laid out side by side;
    `variant` ("a", "b", ...) keeps just one, re-centred on the instance origin."""
    if name not in _imported:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(PH, name, f"{name}_1k.gltf"))
        new = [o for o in bpy.data.objects if o not in before]
        for o in new:
            for c in list(o.users_collection):
                c.objects.unlink(o)
        _imported[name] = new
    key = (name, variant)
    if key not in _lib:
        coll = bpy.data.collections.new(f"lib_{name}_{variant or 'all'}")
        roots = [o for o in _imported[name] if o.parent is None]
        if variant:
            roots = [o for o in roots if o.name.split(".")[0].endswith("_" + variant)]

        def add(o):
            coll.objects.link(o)
            for ch in o.children:
                add(ch)
        for r in roots:
            add(r)
        if variant and roots:
            coll.instance_offset = (roots[0].location.x, roots[0].location.y, 0.0)
        _lib[key] = coll
    inst = bpy.data.objects.new(name, None)
    inst.instance_type = "COLLECTION"
    inst.instance_collection = _lib[key]
    inst.location = loc
    inst.rotation_euler = (0, 0, math.radians(rot_z))
    inst.scale = (scale,) * 3
    return link(inst)


def asset_mats(name, match):
    seen = []
    for o in _imported.get(name, []):
        for sl in getattr(o, "material_slots", []):
            if sl.material and match in sl.material.name.lower() and sl.material not in seen:
                seen.append(sl.material)
    return seen


def principled(mt):
    return next((n for n in mt.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)


def tint_ramp(mt, lo, hi, p0=0.0, p1=1.0):
    """Recolour a scanned material: its own texture's luminance drives a lo→hi ramp."""
    b_ = principled(mt)
    if not b_ or not b_.inputs["Base Color"].links:
        return
    nt = mt.node_tree
    src = b_.inputs["Base Color"].links[0].from_socket
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    nt.links.new(src, bw.inputs[0])
    mt["ramp"] = json.dumps([lo, hi, p0, p1])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color, ramp.color_ramp.elements[0].position = srgb(lo), p0
    ramp.color_ramp.elements[1].color, ramp.color_ramp.elements[1].position = srgb(hi), p1
    nt.links.new(bw.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b_.inputs["Base Color"])


def glow(mt, strength, colour=None):
    b_ = principled(mt)
    if not b_:
        return
    if colour and not b_.inputs["Emission Color"].links:
        b_.inputs["Emission Color"].default_value = srgb(colour)
    b_.inputs["Emission Strength"].default_value = strength


def slab(name, pts, z, t, mat):
    """Horizontal slab from an XY outline (contour layers, plates)."""
    clean = []
    for p_ in pts:
        if not clean or (abs(p_[0] - clean[-1][0]) > 1e-4 or abs(p_[1] - clean[-1][1]) > 1e-4):
            clean.append(p_)
    if len(clean) > 2 and abs(clean[0][0] - clean[-1][0]) < 1e-4 and abs(clean[0][1] - clean[-1][1]) < 1e-4:
        clean.pop()
    bm = bmesh.new()
    lo = [bm.verts.new((x, y, z)) for x, y in clean]
    hi = [bm.verts.new((x, y, z + t)) for x, y in clean]
    bm.faces.new(lo)
    bm.faces.new(hi)
    n = len(clean)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([lo[i], lo[j], hi[j], hi[i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.data.materials.append(mat)
    return o


def shell(name, cx, cy, span, rise, thick, slot, length, zs, mat, n=24):
    """Segmental barrel-vault shell along Y with an open slot at the crown."""
    rho = (span * span / 4 + rise * rise) / (2 * rise)
    zc = zs + rise - rho
    th = math.asin(span / 2 / rho)
    ph = math.asin(slot / 2 / rho)
    for sgn in (-1, 1):
        prof = [(sgn * rho * math.sin(ph + (th - ph) * i / n), zc + rho * math.cos(ph + (th - ph) * i / n)) for i in range(n + 1)]
        prof += [(sgn * (rho + thick) * math.sin(ph + (th - ph) * i / n), zc + (rho + thick) * math.cos(ph + (th - ph) * i / n)) for i in range(n, -1, -1)]
        o = prism(name, prof, length, (cx, cy, 0), mat=mat)
        o.data.shade_smooth()


def aim(o, target, axis="-Z"):
    o.rotation_euler = (Vector(target) - Vector(o.location)).to_track_quat(axis, "Z" if axis not in ("Z", "-Z") else "Y").to_euler()
    return o


def mark():
    return set(scene.objects)


def tag(name, before):
    """Everything added to the scene since `before` becomes one clickable item in the web export."""
    for o in scene.objects:
        if o not in before and "item" not in o.keys():
            o["item"] = name


LIGHTS = []   # night-only lamps (hidden by day, see set_mode)


def lamp(kind, loc, power, colour, target=None, size=0.05, size_y=None, spot=math.radians(70), blend=0.4, name="lamp"):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = power
    ld.color = srgb(colour)[:3]
    if kind == "POINT":
        ld.shadow_soft_size = size
    elif kind == "SPOT":
        ld.shadow_soft_size = size
        ld.spot_size = spot
        ld.spot_blend = blend
    elif kind == "AREA":
        ld.shape = "RECTANGLE"
        ld.size = size
        ld.size_y = size_y if size_y is not None else size
    o = link(bpy.data.objects.new(name, ld))
    o.location = loc
    o.visible_camera = False
    if target is not None:
        aim(o, target)
    LIGHTS.append(o)
    return o


# ================================================================ ARCHITECTURE
W = XR - XL
floor = box("floor", (W + 1.0, DEPTH + 0.6, 0.2), (0, DEPTH / 2, -0.1), M["marble"], bev=0)
# sandstone inlay bands: under the arcades and across at the piers
for x in (-AX, AX):
    box("band_long", (0.9, DEPTH, 0.004), (x, DEPTH / 2, 0.002), M["sandstone_band"], bev=0)
for y in (4.425, 8.575):
    box("band_cross", (W, 0.32, 0.004), (0, y, 0.002), M["sandstone_band"], bev=0)
box("band_border", (W, 0.32, 0.004), (0, 0.4, 0.002), M["sandstone_band"], bev=0)

# outer walls (to springing height) and end walls (to above the crowns)
left = box("wall_left", (0.45, DEPTH + 0.9, S), (XL - 0.225, DEPTH / 2, S / 2), M["plaster"], bev=0)
right = box("wall_right", (0.45, DEPTH + 0.9, S), (XR + 0.225, DEPTH / 2, S / 2), M["plaster"], bev=0)
back = box("wall_back", (W + 0.9, 0.45, S + RISE + 0.6), (0, DEPTH + 0.225, (S + RISE + 0.6) / 2), M["plaster"], bev=0)
front = box("wall_front", (W + 0.9, 0.45, S + RISE + 0.6), (0, -0.225, (S + RISE + 0.6) / 2), M["plaster"], bev=0)
front.visible_camera = False  # we look in through it
for cx_ in (-6.5, 0.0, 6.5):  # Kimbell-like portico: one big arched opening per nave lets daylight in
    cut(front, arch(f"portico_{cx_}", 4.6, 5.2, 1.0, (cx_, -0.225, 0.0)))

# jaali windows in the left wall, aligned to the bays
for i, y in enumerate(BAYS):
    cut(left, arch(f"win_{i}", 1.9, 3.7, 0.9, (XL - 0.225, y, 0.5), axis="x"))
    ring = arch_ring(f"win_frame_{i}", 2.1, 3.85, 0.18, 0.5, (XL - 0.2, y, 0.42), axis="x", mat=M["sandstone"])
    jaali = arch(f"jaali_{i}", 1.9, 3.7, 0.06, (XL - 0.3, y, 0.5), axis="x", mat=M["jaali"])
    box(f"sill_{i}", (0.6, 2.1, 0.08), (XL - 0.12, y, 0.46), M["sandstone"])

# right wall: deep arched niche for the material library
cut(right, arch("lib_niche", 2.6, 3.4, 0.5, (XR + 0.1, 6.5, 0.0), axis="x"))
arch_ring("lib_frame", 2.8, 3.55, 0.12, 0.08, (XR - 0.02, 6.5, 0.0), axis="x", mat=M["sandstone"])

# centre back: huge glazed arch to the courtyard
cut(back, arch("court_arch", 5.0, 5.55, 1.0, (0, DEPTH + 0.225, 0.0)))
arch_ring("court_frame", 5.4, 5.75, 0.2, 0.55, (0, DEPTH + 0.2, 0.0), mat=M["sandstone"])
arch("court_glass", 5.0, 5.55, 0.02, (0, DEPTH + 0.35, 0.0), mat=M["glass_thin"])
for k in (-1, 1):  # slim brass mullions
    box("mullion", (0.035, 0.05, 3.0), (k * 1.25, DEPTH + 0.33, 1.5), M["brass_dark"])
box("transom", (5.0, 0.05, 0.035), (0, DEPTH + 0.33, 3.05), M["brass_dark"])

# red sandstone arcades between the naves
for side, x in (("L", -AX), ("R", AX)):
    wall = box(f"arcade_{side}", (AT, DEPTH, S), (x, DEPTH / 2, S / 2), M["sandstone"], bev=0)
    for j, y in enumerate(BAYS):
        cut(wall, arch(f"arc_{side}{j}", 3.5, 3.85, AT + 0.4, (x, y, 0.0), axis="x"))
    box(f"capital_{side}", (AT + 0.12, DEPTH, 0.14), (x, DEPTH / 2, S - 0.07), M["sandstone"])


# lime vaults with slot skylights (segmental), one per nave
def vault(cx, span, name):
    rho = (span * span / 4 + RISE * RISE) / (2 * RISE)
    zc = S + RISE - rho
    th = math.asin(span / 2 / rho)
    ph = math.asin(SLOT / 2 / rho)
    for sgn in (-1, 1):
        prof = []
        n = 40
        for i in range(n + 1):
            a = ph + (th - ph) * i / n
            prof.append((sgn * rho * math.sin(a), zc + rho * math.cos(a)))
        for i in range(n, -1, -1):
            a = ph + (th - ph) * i / n
            prof.append((sgn * (rho + VT) * math.sin(a), zc + (rho + VT) * math.cos(a)))
        o = prism(f"{name}_{'L' if sgn < 0 else 'R'}", prof, DEPTH + 0.9, (cx, DEPTH / 2, 0), mat=M["plaster_vault"])
        o.data.shade_smooth()
    # skylight glazing + Kimbell-style perforated reflector under the slot
    box(f"{name}_sky", (SLOT + 0.2, DEPTH, 0.02), (cx, DEPTH / 2, S + RISE + VT + 0.02), M["glass"], bev=0)
    refl = []
    for i in range(25):
        u = -1 + 2 * i / 24
        refl.append((u * 1.15, -0.32 * (u * u) + 0.0))
    for i in range(24, -1, -1):
        u = -1 + 2 * i / 24
        refl.append((u * 1.15, -0.32 * (u * u) - 0.012))
    r = prism(f"{name}_reflector", refl, DEPTH - 1.2, (cx, DEPTH / 2, S + RISE - 0.35), mat=M["alu"])
    r.data.shade_smooth()
    return rho, zc


vault(0.0, 2 * (AX - AT / 2), "vault_C")
vault((XL + (-AX - AT / 2)) / 2, (-AX - AT / 2) - XL, "vault_LN")
vault((XR + (AX + AT / 2)) / 2, XR - (AX + AT / 2), "vault_RN")
# roof slabs over the vault haunches (keeps light coming only through the slots)
for cx, span in ((0.0, 2 * (AX - AT / 2)), ((XL - AX - AT / 2) / 2, -AX - AT / 2 - XL), ((XR + AX + AT / 2) / 2, XR - AX - AT / 2)):
    for sgn in (-1, 1):
        box("roof", (span / 2 - SLOT / 2 + 0.3, DEPTH + 0.9, 0.12), (cx + sgn * (span / 4 + SLOT / 4 + 0.15), DEPTH / 2, S + RISE + VT + 0.25), M["plaster"], bev=0)

# ================================================================ COURTYARD (beyond the glass arch)
CY0 = DEPTH + 0.45
box("court_ground", (32, 16, 0.2), (0, CY0 + 8, -0.1), M["paving"], bev=0)
for x in (-12.5, 12.5):
    box("court_wall_side", (0.5, 16, 4.2), (x, CY0 + 8, 2.1), M["plaster"], bev=0)
cw = box("court_wall_back", (25.5, 0.5, 4.2), (0, CY0 + 15.5, 2.1), M["plaster"], bev=0)
for i, x in enumerate((-7.5, -3.75, 0.0, 3.75, 7.5)):
    cut(cw, arch(f"cw_{i}", 1.6, 3.0, 0.8, (x, CY0 + 15.5, 0.6)))
    arch(f"cw_jaali_{i}", 1.6, 3.0, 0.05, (x, CY0 + 15.5, 0.6), mat=M["jaali"])
# reflecting pool (Shalimar channel) with sandstone coping
box("pool_coping", (3.8, 10.4, 0.18), (0, CY0 + 7.2, 0.09), M["sandstone"])
box("pool_cut", (3.2, 9.8, 0.25), (0, CY0 + 7.2, 0.12), M["water"], bev=0)
box("pool_water", (3.2, 9.8, 0.02), (0, CY0 + 7.2, 0.14), M["water"], bev=0)
# the HoS arch-door as a brass gateway standing in the pool, with H and S either side
_m = mark()
arch_ring("hos_gateway", 2.2, 4.0, 0.12, 0.12, (0, CY0 + 8.4, 0.15), mat=M["brass"])
box("hos_threshold", (5.2, 0.12, 0.14), (0, CY0 + 8.4, 2.35), M["brass"])
box("hos_knob", (0.07, 0.07, 0.07), (0.62, CY0 + 8.33, 1.95), M["brass"])
if os.path.exists(FONT):
    font = bpy.data.fonts.load(FONT)
    for ch, x in (("H", -1.9), ("S", 1.9)):
        cu = bpy.data.curves.new(ch, "FONT")
        cu.body = ch
        cu.font = font
        cu.size = 1.25
        cu.extrude = 0.05
        cu.align_x = "CENTER"
        t = link(bpy.data.objects.new("hos_" + ch, cu))
        t.location = (x, CY0 + 8.4, 2.43)
        t.rotation_euler = (math.radians(90), 0, 0)
        t.data.materials.append(M["brass"])
tag("gateway", _m)
asset("jacaranda_tree", (-6.5, CY0 + 9.5, 0), 30, 0.9)
asset("potted_plant_01", (3.4, CY0 + 3.0, 0), 0, 1.6)
asset("brass_pot_01", (-2.8, CY0 + 2.6, 0), 0, 2.2)

# west garden beyond the jaali windows (sunlit wall + plants catch the light)
box("garden_ground", (6, DEPTH + 4, 0.2), (XL - 3.6, DEPTH / 2, -0.1), M["paving"], bev=0)
box("garden_wall", (0.4, DEPTH + 4, 3.0), (XL - 6.2, DEPTH / 2, 1.5), M["plaster"], bev=0)
asset("pachira_aquatica_01", (XL - 3.0, 4.2, 0), 10, 1.6, "b")
asset("potted_plant_01", (XL - 2.6, 9.0, 0), 80, 1.8)

# ================================================================ LEFT NAVE — architecture
LN = (XL + (-AX - AT / 2)) / 2   # nave centre x ≈ -6.65
# selected-work gallery on the back wall (real HoS projects, framed)
WORKS = [("overdose-technopark", -8.15, 2.55, 1.15), ("loop-bukhari", -6.7, 2.7, 0.95), ("overdose-sialkot", -5.25, 2.5, 0.75),
         ("overdose-mm-alam", -8.0, 1.55, 0.8), ("od-loop-tipu", -6.65, 1.6, 0.85), ("loop-dolmen", -5.3, 1.55, 0.8)]
for i, (slug, x, z, w) in enumerate(WORKS):
    _m = mark()
    p, h = plane_image(f"work_{i}", os.path.join(WORK, slug, "1.jpg"), w, (x, DEPTH - 0.04, z), (math.radians(90), 0, 0))
    box(f"work_mat_{i}", (w + 0.14, 0.012, h + 0.14), (x, DEPTH - 0.025, z), M["paper"], bev=0.002)
    box(f"work_frame_{i}", (w + 0.2, 0.035, h + 0.2), (x, DEPTH - 0.012, z), M["walnut"], bev=0.004)
    tag(f"work_{slug}", _m)
# walnut plan chest with brass pulls under the gallery
_m = mark()
box("plan_chest", (4.2, 0.85, 0.82), (-6.65, DEPTH - 0.45, 0.41), M["walnut"], bev=0.01)
for k in range(4):
    for j in range(3):
        box("pull", (0.18, 0.02, 0.018), (-8.2 + k * 1.03, DEPTH - 0.88, 0.2 + j * 0.25), M["brass"], bev=0.004)
asset("brass_diya_lantern", (-8.1, DEPTH - 0.45, 0.82), 0, 1.0)
asset("antique_ceramic_vase_01", (-5.2, DEPTH - 0.4, 0.82), 0, 1.3)
asset("book_encyclopedia_set_01", (-6.6, DEPTH - 0.5, 0.82), 0, 1.0)
tag("plan_chest", _m)
# drafting table: oak top on black steel, real HoS plans on it
dt = (-6.9, 6.3)
_m = mark()
box("draft_top", (2.2, 1.15, 0.045), (dt[0], dt[1], 0.96), M["oak"], rot=(math.radians(-10), 0, math.radians(6)), bev=0.008)
for dx in (-0.95, 0.95):
    box("draft_leg_a", (0.05, 0.05, 0.95), (dt[0] + dx, dt[1] - 0.4, 0.475), M["steel"])
    box("draft_leg_b", (0.05, 0.05, 0.95), (dt[0] + dx, dt[1] + 0.4, 0.475), M["steel"])
    box("draft_rail", (0.04, 0.85, 0.04), (dt[0] + dx, dt[1], 0.2), M["steel"])
PLANS = sorted(f for f in os.listdir(CAT) if f.startswith(("p012", "p013", "p022", "p090")))[:3] if os.path.isdir(CAT) else []
for k, f in enumerate(PLANS):
    _p = mark()
    plane_image(f"plan_{k}", os.path.join(CAT, f), 0.75, (dt[0] - 0.55 + k * 0.5, dt[1] + 0.05 * k, 0.99 + k * 0.002), (math.radians(-10), 0, math.radians(6 + (k - 1) * 7)), 0.85)
    tag(f"plan_{k}", _p)
asset("desk_lamp_arm_01", (dt[0] + 0.85, dt[1] + 0.35, 0.99), -140, 1.0)
asset("wooden_stool_01", (dt[0] + 0.2, dt[1] - 1.05, 0), 20, 1.0)
tag("drafting_table", _m)
# architectural study models on sandstone plinths: a shifted slab-and-column frame,
# a courtyard house with an inner arcade, and a pavilion wrapped in a jaali skin
PL = [(-8.4, 2.6, 0.95), (-6.8, 1.7, 0.8), (-5.2, 2.9, 1.05)]
for i, (x, y, ph) in enumerate(PL):
    _m = mark()
    box(f"plinth_{i}", (0.85, 0.85, ph), (x, y, ph / 2), M["sandstone"], bev=0.01)
    box(f"model_board_{i}", (0.74, 0.74, 0.022), (x, y, ph + 0.011), M["basswood"], bev=0.003)
    tag(["model_frame", "model_courtyard", "model_jaali"][i], _m)


def mini_tree(x, y, z, h=0.07, r=0.03, mat=None):
    cyl("mt_trunk", 0.003, h, (x, y, z + h / 2), M["basswood"], verts=8)
    bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=3, location=(x, y, z + h + r * 0.4))
    c_ = bpy.context.active_object
    c_.scale = (1, 1, 0.8)
    c_.data.materials.append(mat or M["basswood"])
    c_.data.shade_smooth()


# 0 — frame: six basswood plates on a dowel grid, alternate plates shifted, a card core
_m = mark()
x0, y0, ph0 = PL[0]
zt = ph0 + 0.022
for f in range(6):
    zf = zt + 0.014 + f * 0.072
    sh = 0.035 if f % 2 else -0.02
    box(f"frame_plate_{f}", (0.44, 0.3, 0.008), (x0 + sh, y0, zf), M["basswood"], bev=0.001)
    if f < 5:
        for cx in (-0.15, -0.05, 0.05, 0.15):
            for cy in (-0.11, 0.0, 0.11):
                box("frame_col", (0.006, 0.006, 0.064), (x0 + cx, y0 + cy, zf + 0.036), M["basswood"], bev=0)
box("frame_core", (0.09, 0.075, 0.37), (x0 - 0.01, y0 + 0.04, zt + 0.195), M["card"], bev=0.001)
mini_tree(x0 + 0.27, y0 - 0.22, zt)
mini_tree(x0 - 0.27, y0 + 0.24, zt, 0.06, 0.026)
tag("model_frame", _m)

# 1 — courtyard house: card walls, inner arcade on all four sides, roof ring, pool + tree
_m = mark()
x1, y1, ph1 = PL[1]
zt = ph1 + 0.022
S1, C1, H1, T1 = 0.52, 0.24, 0.095, 0.007
for k, (dx, dy, sx, sy) in enumerate(((0, -S1 / 2, S1, T1), (0, S1 / 2, S1, T1), (-S1 / 2, 0, T1, S1), (S1 / 2, 0, T1, S1))):
    w = box(f"ch_wall_{k}", (sx, sy, H1), (x1 + dx, y1 + dy, zt + H1 / 2), M["card"], bev=0)
    if k == 0:
        cut(w, arch("ch_door", 0.07, 0.07, 0.04, (x1, y1 - S1 / 2, zt)))
for k, (dx, dy, sx, sy, ax_) in enumerate(((0, -C1 / 2, C1, T1, "y"), (0, C1 / 2, C1, T1, "y"), (-C1 / 2, 0, T1, C1, "x"), (C1 / 2, 0, T1, C1, "x"))):
    w = box(f"ch_court_{k}", (sx, sy, H1), (x1 + dx, y1 + dy, zt + H1 / 2), M["card"], bev=0)
    for t_ in (-0.07, 0.0, 0.07):
        loc = (x1 + dx + (t_ if ax_ == "y" else 0), y1 + dy + (t_ if ax_ == "x" else 0), zt)
        cut(w, arch("ch_arc", 0.05, 0.065, 0.03, loc, axis="x" if ax_ == "x" else "y"))
rw = (S1 - C1) / 2
for k, (dx, dy, sx, sy) in enumerate(((0, -(C1 / 2 + rw / 2), S1, rw), (0, C1 / 2 + rw / 2, S1, rw), (-(C1 / 2 + rw / 2), 0, rw, C1), (C1 / 2 + rw / 2, 0, rw, C1))):
    box(f"ch_roof_{k}", (sx + T1, sy + T1, 0.006), (x1 + dx, y1 + dy, zt + H1 + 0.003), M["card"], bev=0)
box("ch_pool", (0.06, 0.12, 0.003), (x1, y1, zt + 0.0015), M["water"], bev=0)
mini_tree(x1 + 0.07, y1 + 0.06, zt, 0.06, 0.028, M["jacaranda_model"])
tag("model_courtyard", _m)

# 2 — jaali pavilion: warm basswood core inside a perforated card skin, cantilevered roof
_m = mark()
x2, y2, ph2 = PL[2]
zt = ph2 + 0.022
box("pv_base", (0.48, 0.38, 0.016), (x2, y2, zt + 0.008), M["card"], bev=0.001)
box("pv_core", (0.28, 0.18, 0.2), (x2, y2, zt + 0.116), M["basswood"], bev=0.001)
for k, (dx, dy, w_, rz) in enumerate(((0, -0.13, 0.4, 0), (0, 0.13, 0.4, 0), (-0.2, 0, 0.26, 90), (0.2, 0, 0.26, 90))):
    box(f"pv_screen_{k}", (w_, 0.004, 0.21), (x2 + dx, y2 + dy, zt + 0.121), M["card_jaali"], rot=(0, 0, math.radians(rz)), bev=0)
box("pv_roof", (0.56, 0.42, 0.012), (x2 + 0.03, y2, zt + 0.232), M["card"], bev=0.001)
mini_tree(x2 - 0.19, y2 - 0.25, zt, 0.08, 0.034)
mini_tree(x2 + 0.26, y2 + 0.22, zt, 0.06, 0.027)
tag("model_jaali", _m)
asset("fern_02", (-9.25, 12.25, 0), 0, 1.25, "b")
asset("anthurium_botany_01", (-4.4, 11.9, 0), 40, 1.3, "b")
# brass gallery rail with three adjustable spots over the selected work
box("gallery_rail", (4.3, 0.025, 0.025), (-6.65, DEPTH - 0.14, 3.55), M["brass_dark"], bev=0.004)
for gx in (-8.6, -4.7):
    box("rail_bracket", (0.02, 0.14, 0.02), (gx, DEPTH - 0.07, 3.55), M["brass_dark"], bev=0)
for gx in (-8.0, -6.65, -5.3):
    cyl("rail_stem", 0.006, 0.08, (gx, DEPTH - 0.14, 3.5), M["brass_dark"], verts=12)
    cyl("spot_head", 0.032, 0.11, (gx, DEPTH - 0.18, 3.44), M["brass_dark"], rot=(math.radians(37), 0, 0), verts=32)
    lamp("SPOT", (gx, DEPTH - 0.22, 3.4), 45, "#ffd2a0", target=(gx, DEPTH, 2.1), size=0.03, spot=math.radians(55), blend=0.5, name="gallery_spot")

# ================================================================ CENTRE NAVE — the HoS story
_m = mark()
box("table_top", (6.0, 1.7, 0.07), (0, 6.8, 0.78), M["oak"], bev=0.012)
for dx in (-2.6, 2.6):
    box("table_leg", (0.14, 1.3, 0.74), (dx, 6.8, 0.37), M["steel"], bev=0.01)
tag("long_table", _m)
_m = mark()
# a big site model: a low courtyard building with three slotted vaults over arcades,
# a back court with a pool, a jacaranda and the HoS gateway, set on contoured basswood terrain
mx, my, mz = 0.0, 6.8, 0.815
box("tm_plinth", (2.9, 1.36, 0.05), (mx, my, mz + 0.025), M["walnut"], bev=0.004)
gz = mz + 0.05
box("tm_ground", (2.8, 1.26, 0.012), (mx, my, gz + 0.006), M["basswood"], bev=0.001)
gz += 0.012


def contour(cx, cy, r0, layers, seed):
    rr = __import__("random").Random(seed)
    p1, p2 = rr.uniform(0, 6.28), rr.uniform(0, 6.28)
    for k in range(layers):
        r = r0 * (1 - k / (layers + 0.8))
        pts = []
        for i in range(56):
            a = i / 56 * math.tau
            rad = r * (1 + 0.13 * math.sin(3 * a + p1 + k * 0.4) + 0.07 * math.sin(5 * a + p2 - k * 0.3))
            px = min(max(cx + rad * math.cos(a), -1.4), 1.4)
            py = min(max(cy + rad * 0.8 * math.sin(a), -0.63), 0.63)
            pts.append((mx + px, my + py))
        slab("tm_contour", pts, gz + k * 0.011, 0.011, M["basswood"])
        if k == layers - 1:
            return gz + layers * 0.011


topA = contour(-1.42, 0.42, 0.52, 6, 3)
topB = contour(1.42, -0.5, 0.42, 4, 9)
for (tx, ty, tz) in ((-1.25, 0.32, topA - 0.022), (-1.05, 0.5, gz + 0.033), (-1.3, 0.05, gz + 0.022), (-0.98, 0.15, gz + 0.011),
                     (1.25, -0.42, topB - 0.011), (1.05, -0.3, gz + 0.011), (1.2, -0.12, gz), (0.95, 0.45, gz), (1.25, 0.35, gz)):
    mini_tree(mx + tx, my + ty, tz, 0.06, 0.03)

bx0, by0 = mx, my - 0.12
BW, BD, BH, BT = 1.5, 0.74, 0.1, 0.012
box("tm_floor", (BW, BD, 0.006), (bx0, by0, gz + 0.003), M["card"], bev=0)
for k, xw in enumerate((-BW / 2, -BW / 6, BW / 6, BW / 2)):
    w = box(f"tm_wall_{k}", (BT, BD, BH), (bx0 + xw, by0, gz + BH / 2), M["card"], bev=0)
    if k in (1, 2):
        for yy in (-0.24, 0.0, 0.24):
            cut(w, arch("tm_arc", 0.15, 0.087, 0.05, (bx0 + xw, by0 + yy, gz), axis="x"))
fw = box("tm_front", (BW + BT, BT, BH), (bx0, by0 - BD / 2, gz + BH / 2), M["card"], bev=0)
bk = box("tm_back", (BW + BT, BT, BH), (bx0, by0 + BD / 2, gz + BH / 2), M["card"], bev=0)
for xx in (-BW / 3, 0.0, BW / 3):
    cut(fw, arch("tm_portico", 0.32, 0.09, 0.05, (bx0 + xx, by0 - BD / 2, gz)))
cut(bk, arch("tm_court_arch", 0.2, 0.092, 0.05, (bx0, by0 + BD / 2, gz)))
for xx in (-BW / 3, 0.0, BW / 3):
    shell("tm_vault", bx0 + xx, by0, BW / 3 - BT, 0.06, 0.006, 0.03, BD + 0.02, gz + BH, M["basswood"])
# back court
cy0_, cy1_ = by0 + BD / 2, my + 0.6
for xs in (-BW / 2, BW / 2):
    box("tm_cwall_side", (BT, cy1_ - cy0_, 0.06), (bx0 + xs, (cy0_ + cy1_) / 2, gz + 0.03), M["card"], bev=0)
cwb = box("tm_cwall_back", (BW + BT, BT, 0.06), (bx0, cy1_, gz + 0.03), M["card"], bev=0)
for xx in (-0.5, -0.25, 0.0, 0.25, 0.5):
    cut(cwb, arch("tm_cw_arc", 0.07, 0.05, 0.04, (bx0 + xx, cy1_, gz)))
box("tm_pool_coping", (0.16, 0.23, 0.005), (bx0, (cy0_ + cy1_) / 2, gz + 0.0025), M["card"], bev=0)
box("tm_pool", (0.12, 0.19, 0.003), (bx0, (cy0_ + cy1_) / 2, gz + 0.0055), M["water"], bev=0)
arch_ring("tm_gate", 0.06, 0.1, 0.006, 0.006, (bx0, (cy0_ + cy1_) / 2 + 0.02, gz + 0.006), mat=M["brass"])
mini_tree(bx0 - 0.48, (cy0_ + cy1_) / 2, gz, 0.07, 0.05, M["jacaranda_model"])
mini_tree(bx0 + 0.52, (cy0_ + cy1_) / 2 + 0.03, gz, 0.05, 0.03)
box("tm_path", (0.3, 0.2, 0.003), (bx0, by0 - BD / 2 - 0.1, gz + 0.0015), M["card"], bev=0)
tag("site_model", _m)
for i, (x, y) in enumerate([(-1.0, 6.2), (0.0, 6.2), (1.0, 6.2), (-1.0, 7.45), (0.0, 7.45), (1.0, 7.45)]):
    asset("dining_chair_02", (x * 1.6, y + (-0.25 if y < 7 else 0.25), 0), 180 if y < 7 else 0, 1.0)
for x in (-1.9, 0.0, 1.9):
    asset("modern_ceiling_lamp_01", (x, 6.8, 2.75), 0, 1.0)
    cyl("lamp_cord", 0.004, S + RISE - 2.75 - 0.4, (x, 6.8, (S + RISE + 2.75) / 2 + 0.1), M["steel"], verts=8)
asset("carved_wooden_plate", (2.2, 6.6, 0.815), 0, 1.0)
asset("ceramic_vase_02", (-2.4, 6.9, 0.815), 0, 1.0)

# ================================================================ RIGHT NAVE — furniture · interiors · content · filming
RN = (XR + (AX + AT / 2)) / 2   # ≈ 6.65
box("rug", (3.6, 2.8, 0.014), (RN, 2.9, 0.007), M["rug"], bev=0.004)
# HoS oak & cane bench
bx, by = RN - 0.3, 3.55
_m = mark()
for sy in (-0.19, 0.19):
    box("bench_rail", (1.45, 0.05, 0.05), (bx, by + sy, 0.44), M["oak"], bev=0.006)
for sx in (-0.62, 0.62):
    box("bench_end", (0.05, 0.42, 0.05), (bx + sx, by, 0.44), M["oak"], bev=0.006)
    for sy in (-0.16, 0.16):
        for lean in (-1, 1):
            box("bench_leg", (0.05, 0.045, 0.5), (bx + sx + lean * 0.07, by + sy, 0.22), M["oak"], rot=(0, math.radians(lean * 17), 0), bev=0.006)
box("bench_cane", (1.36, 0.34, 0.01), (bx, by, 0.455), M["cane"], bev=0)
tag("bench", _m)


def sheesham_chair(x, y, rz):
    g = bpy.data.objects.new("sheesham_chair", None)
    link(g)
    parts = [box("sc_seat", (0.48, 0.46, 0.05), (0, 0, 0.45), M["sheesham"], bev=0.012),
             box("sc_pad", (0.42, 0.4, 0.035), (0, 0.01, 0.49), M["leather"], bev=0.012)]
    for lx in (-0.19, 0.19):
        for ly in (-0.18, 0.18):
            parts.append(cyl("sc_leg", 0.02, 0.45, (lx, ly, 0.225), M["sheesham"], verts=24))
    bpy.ops.mesh.primitive_torus_add(major_radius=0.22, minor_radius=0.02, major_segments=64, minor_segments=16, location=(0, 0.02, 0.8), rotation=(0, 0, math.radians(-12)))
    t = bpy.context.active_object
    t.data.materials.append(M["sheesham"])
    t.data.shade_smooth()
    # keep only the back half of the ring (the curved back rail)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in t.data.vertices:
        v.select = v.co.y > 0.04
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.delete(type="VERT")
    bpy.ops.object.mode_set(mode="OBJECT")
    parts.append(t)
    for lx in (-0.19, 0.19):
        parts.append(cyl("sc_post", 0.017, 0.34, (lx, -0.17, 0.64), M["sheesham"], verts=24))
    for p in parts:
        p.parent = g
    g.location = (x, y, 0)
    g.rotation_euler = (0, 0, math.radians(rz))
    return g


_m = mark(); sheesham_chair(RN - 1.4, 2.4, 25); tag("sheesham_chair_a", _m)
_m = mark(); sheesham_chair(RN + 0.8, 2.3, -30); tag("sheesham_chair_b", _m)
_m = mark()
# armchair: the scanned upholstered chair, re-covered in cream bouclé (its own weave texture drives the tone)
asset("modern_arm_chair_01", (RN + 1.9, 3.55, 0), -40, 1.0)
for mt in asset_mats("modern_arm_chair_01", "pillow"):
    tint_ramp(mt, "#cdbfae", "#f3ede3", 0.0, 0.2)
tag("armchair", _m)
_m = mark()
# console table + arched mirror + ceramics against the right wall
box("console", (0.42, 1.5, 0.5), (XR - 0.25, 1.4, 0.47), M["paper"], bev=0.01)
for ly in (-0.65, 0.65):
    for lx in (-0.14, 0.14):
        cyl("console_leg", 0.022, 0.22, (XR - 0.25 + lx, 1.4 + ly, 0.11), M["oak"], verts=24)
arch_ring("mirror_frame", 0.8, 1.6, 0.06, 0.05, (XR - 0.06, 2.75, 0.04), axis="x", mat=M["walnut"])
mir = arch("mirror_glass", 0.68, 1.48, 0.01, (XR - 0.07, 2.75, 0.1), axis="x", mat=flat("mirror", "#ffffff", 0.02, 1.0))
asset("brass_vase_01", (XR - 0.25, 1.0, 0.72), 0, 1.2)
asset("ceramic_vase_03", (XR - 0.25, 1.75, 0.72), 0, 1.0)
tag("console", _m)
_m = mark()
# interiors: display shelves in the arched niche + reading corner
asset("mid_century_lounge_chair", (RN + 0.5, 6.6, 0), 115, 1.0)
asset("side_table_01", (RN + 1.3, 7.2, 0), 0, 1.0)
tag("lounge_chair", _m)
asset("potted_plant_01", (AX + 0.9, 8.2, 0), 0, 1.4)
for k, (setname, tint) in enumerate([("red_sandstone_wall", "#ffffff"), ("marble_01", "#ffffff"), ("oak_veneer_01", "#ffffff"), ("wool_boucle", "#ffffff"), ("rough_linen", "#ffffff"), ("red_sandstone_pavement", "#ffffff")]):
    _m = mark()
    box(f"swatch_{k}", (0.22, 0.22, 0.02), (RN - 0.6 + (k % 3) * 0.26, 5.6 + (k // 3) * 0.26, 0.48), scanned(f"sw_{k}", setname, tint, 0.3), bev=0.003)
    tag(f"swatch_{setname}", _m)
_m = mark()
box("swatch_table", (0.9, 0.7, 0.04), (RN - 0.34, 5.73, 0.45), M["walnut"], bev=0.006)
for lx in (-0.4, 0.4):
    box("swatch_leg", (0.04, 0.6, 0.43), (RN - 0.34 + lx, 5.73, 0.215), M["steel"])
tag("swatch_table", _m)
# content: desk with monitors, against the right wall
_cd = mark()
box("content_desk", (0.8, 2.0, 0.04), (XR - 0.45, 9.6, 0.75), M["oak"], bev=0.008)
for ly in (-0.9, 0.9):
    box("cd_leg", (0.7, 0.04, 0.73), (XR - 0.45, 9.6 + ly, 0.365), M["steel"])
tag("content_desk", _cd)
for k, ly in enumerate((-0.38, 0.38)):
    _m = mark()
    box(f"monitor_{k}", (0.03, 0.68, 0.4), (XR - 0.2, 9.6 + ly, 1.18), M["steel"], bev=0.006)
    p, _ = plane_image(f"monitor_img_{k}", os.path.join(WORK, ["overdose-five-star", "loop-heuser"][k], "1.jpg"), 0.64, (XR - 0.218, 9.6 + ly, 1.18), (math.radians(90), 0, math.radians(-90)), 0.25, 0.8)
    box(f"monitor_stand_{k}", (0.12, 0.04, 0.3), (XR - 0.22, 9.6 + ly, 0.92), M["steel"])
    tag(f"monitor_{k}", _m)
_m = mark(); asset("dining_chair_02", (XR - 1.15, 9.6, 0), -90, 1.0); tag("content_desk", _m)
# neon HoS sign on the right wall above the desk (lights at night)
_m = mark()
arch_ring("neon_arch", 0.95, 1.5, 0.025, 0.025, (XR - 0.03, 9.6, 2.15), axis="x", mat=M["neon"])
box("neon_bar", (0.025, 1.9, 0.025), (XR - 0.03, 9.6, 2.85), M["neon"], bev=0)
tag("neon", _m)
_m = mark()
# filming: paper sweep against the back wall, camera on tripod, softbox
prof = [(0.0, 3.0), (0.0, 0.7)]
for i in range(1, 21):
    a_ = -i / 20 * math.pi / 2
    prof.append((-0.7 + 0.7 * math.cos(a_), 0.7 + 0.7 * math.sin(a_)))
prof += [(-1.9, 0.0), (-1.9, 0.012)]
for i in range(20, -1, -1):
    a_ = -i / 20 * math.pi / 2
    prof.append((-0.7 + 0.688 * math.cos(a_), 0.7 + 0.688 * math.sin(a_)))
prof.append((-0.012, 3.0))
sweep = prism("sweep", prof, 3.0, (RN, DEPTH - 0.15, 0), axis="x", mat=M["sweep"])
sweep.data.shade_smooth()
for lx in (-1.55, 1.55):
    box("sweep_stand", (0.03, 0.03, 3.1), (RN + lx, DEPTH - 0.15, 1.55), M["steel"])
cyl("sweep_roll", 0.08, 3.1, (RN, DEPTH - 0.15, 3.05), M["sweep"], rot=(0, math.radians(90), 0))
tag("sweep", _m)
_m = mark(); sheesham_chair(RN, DEPTH - 1.6, 180); tag("set_chair", _m)
_m = mark()
for a in range(3):
    ang = a / 3 * math.tau
    box(f"tripod_{a}", (0.025, 0.025, 1.45), (RN - 1.2 + math.cos(ang) * 0.18, 10.2 + math.sin(ang) * 0.18, 0.7), M["steel"], rot=(math.sin(ang) * 0.2, -math.cos(ang) * 0.2, 0))
asset("Camera_01", (RN - 1.2, 10.2, 1.42), 160, 1.0)
tag("camera", _m)


# ================================================================ REFINEMENT PASS
rand = __import__("random").Random(7)

# ---- right nave: large framed interiors photograph on the long wall
pw = 1.6
_m = mark()
p_, ph_ = plane_image("int_print", os.path.join(WORK, "overdose-sialkot", "2.jpg"), pw, (XR - 0.042, 4.35, 2.05), (math.radians(90), 0, math.radians(-90)), 0.5)
box("int_mat", (0.012, pw + 0.16, ph_ + 0.16), (XR - 0.028, 4.35, 2.05), M["paper"], bev=0.002)
box("int_frame", (0.035, pw + 0.24, ph_ + 0.24), (XR - 0.013, 4.35, 2.05), M["walnut"], bev=0.004)
tag("interiors_print", _m)
_m = mark()

# ---- material library: oak shelves in the arched niche, stocked with real samples
for k, z in enumerate((0.42, 1.02, 1.62, 2.22)):
    box(f"lib_shelf_{k}", (0.32, 2.3, 0.04), (XR + 0.17, 6.5, z), M["oak"], bev=0.005)
SAMPLE_MATS = [M["sandstone"], M["marble"], M["oak"], M["walnut"], M["sheesham"], M["sandstone_band"], M["paving"], M["card"]]
for k, z in enumerate((0.44, 1.04, 1.64, 2.24)):
    y = 5.45
    while y < 7.5:
        kind = rand.random()
        if kind < 0.45:  # stacked tiles / stone samples
            n = rand.randint(2, 5)
            for j in range(n):
                box("tile", (0.22, 0.2, 0.018), (XR + 0.16, y + 0.1, z + 0.02 + j * 0.02), rand.choice(SAMPLE_MATS), rot=(0, 0, rand.uniform(-0.06, 0.06)), bev=0.002)
            y += 0.28
        elif kind < 0.7:  # fabric rolls
            for j in range(rand.randint(2, 3)):
                cyl("roll", 0.045, 0.3, (XR + 0.17, y + 0.05 + j * 0.095, z + 0.065), rand.choice([M["linen"], M["boucle"], M["rug"]]), rot=(0, math.radians(90), 0), verts=32)
            y += 0.33
        elif kind < 0.85:  # timber blocks
            box("block", (0.12, 0.12, 0.2), (XR + 0.15, y + 0.06, z + 0.12), rand.choice([M["oak"], M["walnut"], M["sheesham"]]), bev=0.004)
            y += 0.2
        else:  # ceramics
            asset("ceramic_vase_03" if rand.random() < 0.5 else "ceramic_vase_02", (XR + 0.17, y + 0.1, z + 0.02), rand.uniform(0, 360), 0.7)
            y += 0.24
tag("library", _m)

# ---- brass dome pendants over the right nave
for y in (3.0, 9.4):
    cyl("rn_cord", 0.004, S + RISE - 2.9, (RN, y, (S + RISE + 2.9) / 2), M["steel"], verts=8)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.24, location=(RN, y, 2.9), segments=48, ring_count=24)
    d_ = bpy.context.active_object
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.select_all(action="DESELECT"); bpy.ops.object.mode_set(mode="OBJECT")
    for v in d_.data.vertices:
        v.select = v.co.z < -0.02
    bpy.ops.object.mode_set(mode="EDIT"); bpy.ops.mesh.delete(type="VERT"); bpy.ops.object.mode_set(mode="OBJECT")
    sol = d_.modifiers.new("solid", "SOLIDIFY"); sol.thickness = 0.006
    d_.data.materials.append(M["brass"]); d_.data.shade_smooth()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.045, location=(RN, y, 2.93), segments=24, ring_count=12)
    bpy.context.active_object.data.materials.append(M["bulb"])
    lamp("SPOT", (RN, y, 2.86), 55, "#ffc58a", target=(RN, y, 0.0), size=0.05, spot=math.radians(115), blend=0.6, name="dome_light")

# ---- floor lamp with a linen drum shade beside the armchair
fx, fy = RN + 2.6, 4.4
_m = mark()
cyl("fl_base", 0.16, 0.025, (fx, fy, 0.012), M["brass"], verts=48)
cyl("fl_pole", 0.012, 1.5, (fx, fy, 0.77), M["brass"], verts=16)
shade = cyl("fl_shade", 0.22, 0.3, (fx, fy, 1.6), M["shade"], verts=64)
sv = shade.modifiers.new("solid", "SOLIDIFY"); sv.thickness = 0.004
bm_ = bmesh.new(); bm_.from_mesh(shade.data)  # open drum: drop the caps so light spills up and down
bmesh.ops.delete(bm_, geom=[f for f in bm_.faces if abs(f.normal.z) > 0.9], context="FACES_ONLY")
bm_.to_mesh(shade.data); bm_.free()
lamp("POINT", (fx, fy, 1.58), 35, "#ffc283", size=0.04, name="floor_lamp")
tag("floor_lamp", _m)
asset("side_table_01", (RN + 2.55, 3.0, 0), 0, 1.0)
asset("brass_vase_01", (RN + 2.55, 3.0, 0.55), 0, 0.8)
asset("fern_02", (XR - 0.6, 11.0, 0), 0, 1.2, "a")

# ---- filming rig: softbox on a C-stand aimed at the set, reflector disc, apple boxes, cables
sbx, sby = RN + 2.1, 10.6
_m = mark()
for a in range(3):
    ang = a / 3 * math.tau
    box("cs_leg", (0.022, 0.022, 0.75), (sbx + math.cos(ang) * 0.3, sby + math.sin(ang) * 0.3, 0.3), M["steel"], rot=(math.sin(ang) * 0.6, -math.cos(ang) * 0.6, 0))
cyl("cs_pole", 0.018, 1.95, (sbx, sby, 1.0), M["steel"], verts=16)
sbg = link(bpy.data.objects.new("softbox", None))
bm = bmesh.new()
back_ = [bm.verts.new((sx * 0.08, 0.0, sz * 0.08)) for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
front_ = [bm.verts.new((sx * 0.39, 0.46, sz * 0.39)) for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
bm.faces.new(back_)
for i in range(4):
    j = (i + 1) % 4
    bm.faces.new([back_[i], back_[j], front_[j], front_[i]])
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
me = bpy.data.meshes.new("softbox_body"); bm.to_mesh(me); bm.free()
sbb = link(bpy.data.objects.new("softbox_body", me))
sbb.data.materials.append(M["softbox_fabric"])
sbb.modifiers.new("solid", "SOLIDIFY").thickness = 0.004
bm = bmesh.new()
dv = [bm.verts.new((sx * 0.375, 0.455, sz * 0.375)) for sx, sz in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
bm.faces.new(dv)
me = bpy.data.meshes.new("softbox_diffuser"); bm.to_mesh(me); bm.free()
sbd = link(bpy.data.objects.new("softbox_diffuser", me))
sbd.data.materials.append(M["softbox"])
ring_ = cyl("speed_ring", 0.09, 0.05, (0, -0.02, 0), M["steel"], rot=(math.radians(90), 0, 0), verts=32)
yoke = box("yoke", (0.24, 0.02, 0.02), (0, -0.06, -0.12), M["steel"], bev=0)
for p_ in (sbb, sbd, ring_):
    p_.parent = sbg
sbg.location = (sbx, sby, 2.02)
aim(sbg, (RN, DEPTH - 1.6, 0.9), "Y")
yoke.location = (sbx, sby, 1.96)
yoke.rotation_euler = (0, 0, sbg.rotation_euler.z)
sl_ = lamp("AREA", (0, 0, 0), 30, "#eef1ff", size=0.72, name="softbox_light")
if sl_:
    sl_.parent = sbg
    sl_.location = (0, 0.47, 0)
    sl_.rotation_euler = (math.radians(90), 0, 0)
tag("softbox", _m)
_m = mark()
cyl("reflector_disc", 0.5, 0.01, (RN - 1.6, 11.6, 1.0), flat("silver", "#e8e8e8", 0.35, 1.0), rot=(math.radians(80), 0, math.radians(-30)), verts=64)
cyl("refl_stand", 0.012, 1.0, (RN - 1.6, 11.7, 0.5), M["steel"], verts=12)
tag("reflector", _m)
for j, (bx_, by_) in enumerate(((RN + 0.9, 11.1), (RN + 0.9, 11.1))):
    box("apple_box", (0.5, 0.3, 0.2), (bx_, by_, 0.1 + j * 0.2), M["oakLight"] if "oakLight" in M else M["oak"], rot=(0, 0, math.radians(8 * j)), bev=0.006)
for k in range(3):  # cables
    cu = bpy.data.curves.new("cable", "CURVE"); cu.dimensions = "3D"; cu.bevel_depth = 0.006; cu.bevel_resolution = 3
    sp = cu.splines.new("BEZIER"); sp.bezier_points.add(3)
    pts = [(sbx, sby, 0.01), (sbx - 0.6 - k * 0.2, sby - 0.8, 0.008), (XR - 0.9, 10.2 - k * 0.3, 0.008), (XR - 0.05, 10.0 - k * 0.25, 0.25)]
    for bp_, co in zip(sp.bezier_points, pts):
        bp_.co = co; bp_.handle_left_type = bp_.handle_right_type = "AUTO"
    o_ = link(bpy.data.objects.new("cable", cu)); o_.data.materials.append(M["steel"])

# ---- content desk styling
_m = mark()
box("keyboard", (0.16, 0.44, 0.015), (XR - 0.62, 9.6, 0.778), M["steel"], bev=0.004)
box("notebook", (0.22, 0.3, 0.02), (XR - 0.6, 10.25, 0.78), M["leather"], rot=(0, 0, 0.2), bev=0.004)
cyl("mug", 0.04, 0.1, (XR - 0.55, 8.95, 0.82), M["card"], verts=32)
for ly in (-0.95, 0.95):
    box("speaker", (0.16, 0.12, 0.24), (XR - 0.3, 9.6 + ly * 0.78, 0.89), M["steel"], bev=0.01)
asset("potted_plant_01", (XR - 0.35, 10.45, 0.77), 0, 0.45)
tag("content_desk", _m)

# ---- LEFT nave: masterplan model on a trestle table + rolled drawings
mpx, mpy = -6.6, 9.4
_m = mark()
box("mp_top", (2.3, 1.25, 0.05), (mpx, mpy, 0.8), M["oak"], bev=0.008)
for dx in (-0.95, 0.95):
    for dy in (-0.5, 0.5):
        box("mp_leg", (0.05, 0.05, 0.78), (mpx + dx, mpy + dy, 0.39), M["steel"])
box("mp_base", (2.0, 1.05, 0.03), (mpx, mpy, 0.84), M["basswood"], bev=0.003)
for gx in range(9):
    for gy in range(5):
        if rand.random() < 0.15:
            bpy.ops.mesh.primitive_ico_sphere_add(radius=0.03, subdivisions=2, location=(mpx - 0.88 + gx * 0.22, mpy - 0.42 + gy * 0.21, 0.885))
            bpy.context.active_object.data.materials.append(M["basswood"])
            continue
        hgt = rand.choice([0.04, 0.06, 0.08, 0.12, 0.18, 0.26])
        box("mp_block", (0.16, 0.15, hgt), (mpx - 0.88 + gx * 0.22, mpy - 0.42 + gy * 0.21, 0.855 + hgt / 2), M["card"], bev=0.002)
tag("masterplan", _m)
_m = mark()
cyl("roll_basket", 0.2, 0.55, (-8.85, 5.4, 0.275), M["sheesham"], verts=48)
for k in range(9):
    a_ = k / 9 * math.tau
    cyl("roll", 0.03, 0.9, (-8.85 + math.cos(a_) * 0.09, 5.4 + math.sin(a_) * 0.09, 0.62), M["paper"], rot=(math.cos(a_) * 0.15, math.sin(a_) * 0.15, 0), verts=24)

tag("roll_basket", _m)
# ---- CENTRE table: the real HoS catalog, drawings, a sample board
_m = mark()
cover = os.path.join(ROOT, "_source/catalog/pages/p001.jpg")
if os.path.exists(cover):
    box("catalog_book", (0.3, 0.42, 0.022), (1.95, 6.45, 0.826), M["paper"], rot=(0, 0, 0.25), bev=0.003)
    plane_image("catalog_cover", cover, 0.3, (1.95, 6.45, 0.8375), (0, 0, 0.25), 0.4)
tag("catalog", _m)
for k, f in enumerate(PLANS[:2]):
    _m = mark()
    plane_image(f"table_plan_{k}", os.path.join(CAT, f), 0.7, (-1.9 + k * 0.1, 7.15 - k * 0.05, 0.816 + k * 0.002), (0, 0, 0.1 - k * 0.2), 0.85)
    tag(f"table_plan_{k}", _m)
_m = mark()
box("sample_board", (0.4, 0.3, 0.012), (2.3, 7.15, 0.822), M["walnut"], bev=0.002)
for k in range(6):
    box("sample", (0.1, 0.1, 0.012), (2.17 + (k % 3) * 0.13, 7.08 + (k // 3) * 0.13, 0.834), SAMPLE_MATS[k], bev=0.002)
tag("sample_board", _m)

# ---- COURTYARD: jacaranda in bloom + fallen blossoms
for o in _imported.get("jacaranda_tree", []):
    for slot in getattr(o, "material_slots", []):
        mt = slot.material
        if not mt or not any(k in mt.name.lower() for k in ("leaf", "leaves", "foliage", "flower")):
            continue
        nt = mt.node_tree
        b_ = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
        if not b_ or not b_.inputs["Base Color"].links:
            continue
        src = b_.inputs["Base Color"].links[0].from_socket
        bw = nt.nodes.new("ShaderNodeRGBToBW")
        nt.links.new(src, bw.inputs[0])
        mt["ramp"] = json.dumps(["#4b2f78", "#c9a6f2", 0.0, 1.0])
        ramp = nt.nodes.new("ShaderNodeValToRGB")
        ramp.color_ramp.elements[0].color = srgb("#4b2f78")
        ramp.color_ramp.elements[1].color = srgb("#c9a6f2")
        nt.links.new(bw.outputs[0], ramp.inputs[0])
        nt.links.new(ramp.outputs[0], b_.inputs["Base Color"])
bm = bmesh.new()
for k in range(900):
    cx_ = rand.gauss(-6.5, 2.4)
    cy_ = rand.gauss(CY0 + 9.0, 2.6)
    if abs(cx_) < 2.0 and CY0 + 2 < cy_ < CY0 + 12.4:
        continue  # not in the pool
    r_ = rand.uniform(0.008, 0.016)
    ang = rand.uniform(0, math.tau)
    vs = [bm.verts.new((cx_ + r_ * math.cos(ang + i * math.tau / 5), cy_ + r_ * math.sin(ang + i * math.tau / 5), 0.003)) for i in range(5)]
    bm.faces.new(vs)
me = bpy.data.meshes.new("petals"); bm.to_mesh(me); bm.free()
pet = link(bpy.data.objects.new("petals", me)); pet.data.materials.append(flat("petal", "#9d7fd6", 0.6))

# ================================================================ LIGHT: afternoon sun from the west
SUN_DIR = Vector((0.86, 0.26, -0.43)).normalized()   # light travels east, into the room, downward
sun = link(bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN")))
sun.data.energy = 6.0
sun.data.angle = math.radians(0.6)
sun.data.color = srgb("#ffe0b5")[:3]
sun.rotation_euler = SUN_DIR.to_track_quat("-Z", "Y").to_euler()

world = bpy.data.worlds.new("sky")
scene.world = world
world.use_nodes = True
wn = world.node_tree
bg = wn.nodes.get("Background")
sky = wn.nodes.new("ShaderNodeTexSky")
for t in ("MULTIPLE_SCATTERING", "NISHITA", "HOSEK_WILKIE"):
    try:
        sky.sky_type = t
        break
    except TypeError:
        pass
el = math.asin(-SUN_DIR.z)
az = math.atan2(-SUN_DIR.y, -SUN_DIR.x)
for attr, val in (("sun_elevation", el), ("sun_rotation", math.pi / 2 - az), ("sun_disc", False)):
    try:
        setattr(sky, attr, val)
    except Exception:
        pass
wn.links.new(sky.outputs["Color"], bg.inputs["Color"])
bg.inputs["Strength"].default_value = 0.9

# a soft haze in the hall so the jaali and skylight shafts read in the air
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, DEPTH / 2, (S + RISE) / 2))
haze = bpy.context.active_object
haze.name = "haze"
haze.scale = (W - 0.1, DEPTH - 0.1, S + RISE - 0.1)
hm = bpy.data.materials.new("haze")
hm.use_nodes = True
hm.node_tree.nodes.clear()
vo = hm.node_tree.nodes.new("ShaderNodeVolumePrincipled")
vo.inputs["Density"].default_value = 0.007
vo.inputs["Anisotropy"].default_value = 0.55
vo.inputs["Color"].default_value = srgb("#fff3e6")
ho = hm.node_tree.nodes.new("ShaderNodeOutputMaterial")
hm.node_tree.links.new(vo.outputs["Volume"], ho.inputs["Volume"])
haze.data.materials.append(hm)

# ================================================================ NIGHT: blue hour outside, the studio lit from within
# stone cornices under the capitals hide warm cove strips that wash the vaults (fixtures exist by day too)
for xa in (-AX, AX):
    for sgn in (-1, 1):
        xc = xa + sgn * (AT / 2 + 0.08)
        box("cornice", (0.16, DEPTH - 0.5, 0.07), (xc, DEPTH / 2, S - 0.32), M["sandstone"], bev=0.006)
        cv = lamp("AREA", (xc, DEPTH / 2, S - 0.28), 105, "#ffd3a8", size=0.08, size_y=DEPTH - 0.9, name="cove")
        cv.rotation_euler = (math.pi, 0, 0)   # emit upward onto the vault

# blue-hour sky gradient (wired to the background by set_mode)
tcw = wn.nodes.new("ShaderNodeTexCoord")
sz_ = wn.nodes.new("ShaderNodeSeparateXYZ")
wn.links.new(tcw.outputs["Generated"], sz_.inputs[0])
rmp = wn.nodes.new("ShaderNodeValToRGB")
cr = rmp.color_ramp
stops = [(0.0, "#24170f"), (0.035, "#a95a34"), (0.11, "#55476b"), (0.3, "#1c2649"), (0.8, "#080d22")]
cr.elements[0].position, cr.elements[0].color = stops[0][0], srgb(stops[0][1])
cr.elements[1].position, cr.elements[1].color = stops[-1][0], srgb(stops[-1][1])
for pos, c in stops[1:-1]:
    cr.elements.new(pos).color = srgb(c)
wn.links.new(sz_.outputs["Z"], rmp.inputs["Fac"])

DAY_SUN = (6.0, srgb("#ffe0b5")[:3], math.radians(0.6))
MOON = (0.1, srgb("#a8b8ff")[:3], math.radians(1.0))   # a faint cool moon against the warm lamps
GLOWS = []   # (material, day emission, night emission)


def night_glow(mt, strength, colour=None):
    b_ = principled(mt)
    if not b_:
        return
    if colour and not b_.inputs["Emission Color"].links:
        b_.inputs["Emission Color"].default_value = srgb(colour)
    GLOWS.append((mt, b_.inputs["Emission Strength"].default_value, strength))


night_glow(M["neon"], 26.0)
night_glow(M["bulb"], 30.0)
night_glow(M["softbox"], 4.0)
night_glow(M["shade"], 1.4, "#ffcf99")
for k in range(2):
    mt = bpy.data.materials.get(f"monitor_img_{k}_m")
    if mt:
        night_glow(mt, 2.4)
for mt in asset_mats("modern_ceiling_lamp_01", "lamp_01_glass"):
    night_glow(mt, 2.6, "#ffd6a6")
for mt in asset_mats("modern_ceiling_lamp_01", "globe"):
    night_glow(mt, 25.0)
for mt in asset_mats("desk_lamp_arm_01", "light"):
    night_glow(mt, 18.0)
for mt in asset_mats("brass_diya_lantern", "flame"):
    night_glow(mt, 30.0)

# centre: opal globes over the long table
for x in (-1.9, 0.0, 1.9):
    lamp("POINT", (x, 6.8, 3.11), 80, "#ffc48a", size=0.06, name="globe_light")
# left nave: drafting lamp, diya on the plan chest, garden lights behind the jaali windows
lamp("SPOT", (-5.94, 6.52, 1.66), 28, "#ffe0b4", target=(-7.0, 6.3, 0.99), size=0.02, spot=math.radians(80), name="desk_lamp")
lamp("POINT", (-8.1, DEPTH - 0.45, 0.9), 6, "#ff9446", size=0.02, name="diya")
for y in BAYS:
    lamp("POINT", (XL - 1.4, y, 2.5), 380, "#ffb26c", size=0.08, name="garden_light")
# right nave: orange spill from the neon onto the wall and desk
lamp("POINT", (XR - 0.3, 9.6, 2.85), 38, "#ff6420", size=0.35, name="neon_spill")
# courtyard: jacaranda uplit, jaali back-lit, the brass gateway grazed from the coping
lamp("SPOT", (-5.4, CY0 + 8.4, 0.15), 1000, "#eee9ff", target=(-6.4, CY0 + 9.6, 6.0), size=0.05, spot=math.radians(75), blend=0.5, name="tree_up")
lamp("SPOT", (-7.8, CY0 + 11.0, 0.15), 800, "#eee9ff", target=(-6.6, CY0 + 9.4, 6.0), size=0.05, spot=math.radians(75), blend=0.5, name="tree_up")
for x in (-7.5, -3.75, 0.0, 3.75, 7.5):
    lamp("POINT", (x, CY0 + 16.3, 1.9), 240, "#ffb470", size=0.1, name="jaali_back")
for sx in (-1.5, 1.5):
    lamp("SPOT", (sx, CY0 + 6.6, 0.25), 140, "#ffcf98", target=(0, CY0 + 8.4, 2.3), size=0.03, spot=math.radians(40), blend=0.4, name="gate_light")



def set_mode(night):
    """Flip the whole studio between afternoon and blue hour (sun/moon, sky, glows, lamps, haze)."""
    e, c, ang = MOON if night else DAY_SUN
    sun.data.energy, sun.data.color, sun.data.angle = e, c, ang
    for l_ in list(wn.links):
        if l_.to_node == bg:
            wn.links.remove(l_)
    wn.links.new(rmp.outputs["Color"] if night else sky.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0 if night else 0.9
    vo.inputs["Density"].default_value = 0.004 if night else 0.007
    for mt, d, n in GLOWS:
        principled(mt).inputs["Emission Strength"].default_value = n if night else d
    for o in LIGHTS:
        o.hide_render = not night


set_mode(NIGHT)

# ================================================================ RENDER
scene.render.engine = "CYCLES"
cp = bpy.context.preferences.addons["cycles"].preferences
try:
    cp.compute_device_type = "METAL"
except TypeError:
    pass
cp.get_devices()
for d in cp.devices:
    d.use = d.type != "CPU"
scene.cycles.device = "GPU"
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 8
scene.cycles.diffuse_bounces = 4
scene.cycles.glossy_bounces = 3
scene.cycles.transmission_bounces = 6
scene.cycles.transparent_max_bounces = 16
scene.cycles.volume_bounces = 1
scene.cycles.caustics_reflective = False
scene.cycles.caustics_refractive = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Punchy"
scene.view_settings.exposure = 1.4
scene.render.resolution_x, scene.render.resolution_y = RES

CAMS = {   # position, target, lens, exposure (day, night)
    "overview": ((0.0, 0.6, 2.05), (0.0, 13.0, 2.25), 16, 1.4, 0.92),
    "left": ((-4.6, 0.9, 1.72), (-8.2, 9.6, 1.45), 22, 1.4, 0.92),
    "centre": ((0.0, 2.2, 1.6), (0.0, 13.0, 2.2), 26, 1.4, 0.92),
    "right": ((4.6, 0.9, 1.72), (8.4, 9.4, 1.4), 22, 1.4, 0.92),
    "content": ((5.2, 6.3, 1.62), (9.75, 10.3, 1.7), 24, 1.4, 0.72),
    "court": ((0.0, DEPTH + 1.35, 1.55), (0.0, DEPTH + 12.5, 2.2), 28, 0.95, 1.0),
}
cam_data = bpy.data.cameras.new("cam")
cam = link(bpy.data.objects.new("cam", cam_data))
scene.camera = cam

if MODE == "save":
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "studio_v2_night.blend" if NIGHT else "studio_v2.blend"))
    sys.exit(0)

for v in (VIEWS if MODE == "render" else []):   # MODE "build": scene only, for tools/blender/bakeprep.py
    p, t, lens, ex_d, ex_n = CAMS[v]
    cam.location = p
    cam_data.lens = lens
    cam.rotation_euler = (Vector(t) - Vector(p)).to_track_quat("-Z", "Y").to_euler()
    scene.view_settings.exposure = ex_n if NIGHT else ex_d
    scene.render.filepath = os.path.join(OUT, f"{'n2' if NIGHT else 'v2'}_{v}.png")
    bpy.ops.render.render(write_still=True)
    print("RENDERED", v, flush=True)
