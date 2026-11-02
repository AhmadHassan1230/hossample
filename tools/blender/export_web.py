# Bake-ready studio → web: public/studio/studio.glb (meshes, UVMap + lightmap UVs, item extras)
# and public/studio/materials.json (how the browser rebuilds every surface).
#   blender -b --factory-startup -P tools/blender/export_web.py
import bpy, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
PUB = os.path.join(ROOT, "public")
OUT = os.path.join(PUB, "studio")
os.makedirs(os.path.join(OUT, "img"), exist_ok=True)


def url_for(path):
    """Public URL for an image; files outside public/ are copied into public/studio/img."""
    path = os.path.abspath(bpy.path.abspath(path))
    if path.startswith(PUB + os.sep):
        return path[len(PUB):]
    dst = os.path.join(OUT, "img", os.path.basename(path))
    if not os.path.exists(dst):
        shutil.copy(path, dst)
    return "/studio/img/" + os.path.basename(path)


def from_scan_nodes(mt):
    """Describe an imported Poly Haven material from its node tree."""
    nt = mt.node_tree
    b = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    d = {"k": "ph"}
    if not b:
        return d

    def upstream_image(sock, depth=4):
        if not sock.links or depth == 0:
            return None
        n = sock.links[0].from_node
        if n.type == "TEX_IMAGE" and n.image:
            return n
        for inp in n.inputs:
            hit = upstream_image(inp, depth - 1)
            if hit:
                return hit
        return None

    base = upstream_image(b.inputs["Base Color"], 5)
    if base:
        d["map"] = url_for(base.image.filepath)
    arm = upstream_image(b.inputs["Roughness"], 3)
    if arm:
        d["arm"] = url_for(arm.image.filepath)
    nrm = upstream_image(b.inputs["Normal"], 3)
    if nrm:
        d["normal"] = url_for(nrm.image.filepath)
    if b.inputs["Alpha"].links:
        d["alphaTest"] = True
    if not base:
        c = b.inputs["Base Color"].default_value
        d["color"] = "#%02x%02x%02x" % tuple(int(max(0, min(1, v)) ** (1 / 2.2) * 255) for v in c[:3])
    d["rough"] = b.inputs["Roughness"].default_value if not arm else 1.0
    d["metal"] = b.inputs["Metallic"].default_value if not b.inputs["Metallic"].links else (0.5 if "brass" in mt.name or "Camera" in mt.name else 0.0)
    if "brass" in mt.name.lower():
        d["metal"] = 1.0
    e = b.inputs["Emission Strength"].default_value
    if e > 0:
        ec = b.inputs["Emission Color"].default_value
        d["emit"] = "#%02x%02x%02x" % tuple(int(max(0, min(1, v)) ** (1 / 2.2) * 255) for v in ec[:3])
        d["strength"] = e
    return d


# ---- 1. material descriptors from a fresh build of studio.py (same names as the bake file).
#         Skipped when the table exists (pass --mats to rebuild): the build holds the full tree in memory.
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MAT_PATH = os.path.join(OUT, "materials.json")
if "--mats" in args or not os.path.exists(MAT_PATH):
    sys.argv = [sys.argv[0], "--", "/tmp/hos_build", "build", "16", "", "", "day"]
    g = {"__file__": os.path.join(HERE, "studio.py"), "__name__": "studio"}
    exec(compile(open(g["__file__"]).read(), g["__file__"], "exec"), g)
    glows = {mt.name: (d, n) for mt, d, n in g["GLOWS"]}
    mats = {}
    for mt in bpy.data.materials:
        if not mt.node_tree:
            continue
        d = json.loads(mt["web"]) if "web" in mt.keys() else from_scan_nodes(mt)
        if d.get("k") == "image":
            d["src"] = url_for(d.pop("file"))
        if "ramp" in mt.keys():
            d["ramp"] = json.loads(mt["ramp"])
        if mt.name in glows:
            d["glow"] = list(glows[mt.name])
        mats[mt.name] = d
    print("MATERIALS", len(mats), flush=True)
    json.dump(mats, open(MAT_PATH, "w"), indent=1)
mats = json.load(open(MAT_PATH))
WITH_TREE = "--tree" in args

# ---- 2. the bake file's meshes → GLB
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "_source/bake/studio_bake.blend"))
scene = bpy.context.scene
objs = [o for o in scene.objects if o.type == "MESH" and o.get("export", 1)]
tris = sorted(((sum(len(p.vertices) - 2 for p in o.data.polygons), o.name) for o in objs), reverse=True)
for t, n in tris[:12]:
    print(f"TRIS {t:8d} {n}", flush=True)
print("TOTAL TRIS", sum(t for t, _ in tris), flush=True)
missing = sorted({sl.material.name for o in objs for sl in o.material_slots if sl.material and sl.material.name not in mats})
print("UNMAPPED", missing, flush=True)



# ---- 2b. web-weight vegetation via Decimate modifiers (applied at export, light on memory).
#          The jacaranda (3.9M triangles) gets its own pass: tools/blender/tree_web.py
def decimate(o, ratio):
    m = o.modifiers.new("web", "DECIMATE")
    m.ratio = ratio


for o in list(objs):
    base = o.name.split(".")[0]
    if base.startswith("jacaranda_tree") and not WITH_TREE:
        objs.remove(o)
    elif base == "potted_plant_01_leaves" or base.startswith("pachira_aquatica_01_leaves"):
        decimate(o, 0.2)
    elif base == "potted_plant_01_pebbles":
        decimate(o, 0.04)
    elif base.startswith(("fern_02", "anthurium")):
        decimate(o, 0.35)

bpy.ops.object.select_all(action="DESELECT")
for o in objs:
    o.select_set(True)
bpy.context.view_layer.objects.active = objs[0]
bpy.ops.export_scene.gltf(
    filepath=os.path.join(OUT, "studio.glb"), export_format="GLB", use_selection=True,
    export_texcoords=True, export_normals=True, export_materials="EXPORT", export_image_format="NONE",
    export_extras=True, export_cameras=False, export_lights=False, export_yup=True, export_apply=True,
)
print("EXPORTED", os.path.getsize(os.path.join(OUT, "studio.glb")) // 1024, "KB", flush=True)
