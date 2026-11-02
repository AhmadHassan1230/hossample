# studio.py scene → bake-ready .blend for the real-time site (Basement-style lightmaps).
#   blender -b --factory-startup -P tools/blender/bakeprep.py
# Builds the studio, makes every instanced scan real and unique, applies modifiers and transforms,
# gives each surface a world-scale "UVMap" (tiling textures) and a packed "lightmap" UV per atlas,
# merges each clickable item into one named mesh, and saves _source/bake/studio_bake.blend.
import bpy, bmesh, math, os, sys
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
STUDIO = os.path.join(HERE, "studio.py")
OUT = os.path.join(ROOT, "_source/bake")
os.makedirs(OUT, exist_ok=True)

# ---- build the studio (MODE "build" = scene only), night lamps included but hidden
sys.argv = [sys.argv[0], "--", "/tmp/hos_build", "build", "16", "", "", "day"]
g = {"__file__": STUDIO, "__name__": "studio"}
exec(compile(open(STUDIO).read(), STUDIO, "exec"), g)
scene = bpy.context.scene
vl = bpy.context.view_layer
DEPTH, XL, XR, AX = g["DEPTH"], g["XL"], g["XR"], g["AX"]

# remember what set_mode needs, on the data itself (the bake script reads it back)
for mt, d, n in g["GLOWS"]:
    mt["glow_day"], mt["glow_night"] = float(d), float(n)
for o in g["LIGHTS"]:
    o["night_lamp"] = 1
sun = bpy.data.objects["sun"]
sun["day"] = [g["DAY_SUN"][0], *g["DAY_SUN"][1], g["DAY_SUN"][2]]
sun["night"] = [g["MOON"][0], *g["MOON"][1], g["MOON"][2]]
bpy.data.objects.remove(bpy.data.objects["haze"], do_unlink=True)   # lightmaps hold surface light only


def select(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    vl.objects.active = active or (objs[0] if objs else None)


VEG = {"jacaranda_tree", "pachira_aquatica_01", "potted_plant_01", "fern_02", "anthurium_botany_01"}

# ---- 1. realize instanced scans (each copy gets its own mesh so it can own lightmap space)
for e in [o for o in scene.objects if o.instance_type == "COLLECTION" and o.instance_collection]:
    item, src = e.get("item"), e.name.split(".")[0]
    before = set(scene.objects)
    select([e])
    bpy.ops.object.duplicates_make_real(use_base_parent=False, use_hierarchy=True)
    for o in scene.objects:
        if o not in before:
            o["src_asset"] = src
            if item:
                o["item"] = item
            if src in VEG:
                o["veg"] = 1
    bpy.data.objects.remove(e, do_unlink=True)
if "petals" in bpy.data.objects:
    bpy.data.objects["petals"]["veg"] = 1

# ---- 2. curves/text → mesh, unparent, single-user, apply modifiers + transforms
select([o for o in scene.objects if o.type in ("CURVE", "FONT")])
if bpy.context.selected_objects:
    bpy.ops.object.convert(target="MESH")
meshes = [o for o in scene.objects if o.type == "MESH"]
select(meshes)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.make_single_user(object=True, obdata=True, material=False)
bpy.ops.object.convert(target="MESH")            # applies bevel / solidify
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
for o in [o for o in scene.objects if o.type == "EMPTY"]:
    bpy.data.objects.remove(o, do_unlink=True)
meshes = [o for o in scene.objects if o.type == "MESH" and len(o.data.polygons)]
for o in [o for o in scene.objects if o.type == "MESH" and not len(o.data.polygons)]:
    bpy.data.objects.remove(o, do_unlink=True)

# ---- 2b. drop faces no camera ever sees (undersides, wall tops, exterior skins, buried ends)
S_, CY0 = g["S"], g["CY0"]


def prune(o, kill):
    bm = bmesh.new()
    bm.from_mesh(o.data)
    dead = [f for f in bm.faces if kill(f.normal, f.calc_center_median())]
    bmesh.ops.delete(bm, geom=dead, context="FACES")
    bm.to_mesh(o.data)
    bm.free()


up = lambda n: n.z > 0.9
buried_y = lambda n, c: abs(n.y) > 0.9 and (c.y < 0.01 or c.y > DEPTH - 0.01)
RULES = {
    "floor": lambda n, c: not up(n),
    "band_": lambda n, c: not up(n),
    "court_ground": lambda n, c: not up(n),
    "garden_ground": lambda n, c: not up(n),
    "garden_wall": lambda n, c: n.x < 0.9,
    "wall_left": lambda n, c: n.x < -0.9 or (up(n) and c.z > S_ - 0.05) or buried_y(n, c),
    "wall_right": lambda n, c: n.x > 0.9 or (up(n) and c.z > S_ - 0.05) or buried_y(n, c),
    "wall_front": lambda n, c: n.y < -0.9 or up(n) or abs(n.x) > 0.9 and abs(c.x) > XR,
    "wall_back": lambda n, c: up(n) or abs(n.x) > 0.9 and abs(c.x) > XR,
    "arcade_": lambda n, c: (up(n) and c.z > S_ - 0.05) or buried_y(n, c),
    "capital_": lambda n, c: up(n) or buried_y(n, c),
    "cornice": lambda n, c: up(n) or buried_y(n, c),
    "vault_": lambda n, c: n.z > 0.1 or abs(n.y) > 0.9,
    "court_wall_side": lambda n, c: n.x * c.x > 0 and abs(n.x) > 0.9 or up(n),
    "court_wall_back": lambda n, c: n.y > 0.9 or up(n),
}
for o in meshes:
    base = o.name.split(".")[0]
    if base.endswith(("_reflector", "_sky")):
        continue
    for pre, kill in RULES.items():
        if base.startswith(pre):
            prune(o, kill)
            break

# ---- 3. classify into lightmap atlases
FLOOR = ("floor", "band_", "rug")
SHELL = ("wall_", "vault_", "arcade_", "capital_", "cornice", "win_frame_", "jaali_", "sill_", "lib_frame",
         "court_frame", "court_glass", "mullion", "transom", "lib_shelf")
HIDDEN = ("roof",)   # above the vaults: occludes during the bake, never exported
# metal, glass, water and pure emitters take their look from reflections / emission, not lightmaps
NOLM = {"brass", "brass_dark", "black_steel", "reflector", "glass", "glass_thin", "water", "neon", "softbox", "bulb", "mirror", "silver"}
no_lm = lambda o: all(sl.material and sl.material.name.split(".")[0] in NOLM for sl in o.material_slots)


def centre(objs):
    lo = Vector((1e9,) * 3); hi = Vector((-1e9,) * 3)
    for o in objs:
        for v in o.data.vertices:
            lo = Vector(map(min, lo, v.co)); hi = Vector(map(max, hi, v.co))
    return (lo + hi) / 2


def zone(c):
    if c.y > DEPTH + 0.3 or c.x < XL - 0.3:
        return "court"
    return "left" if c.x < -AX else "right" if c.x > AX else "centre"


items = {}
for o in meshes:
    if o.get("veg"):
        continue
    base = o.name.split(".")[0]
    if base.startswith(HIDDEN):
        o["export"] = 0
        continue
    if o.get("item"):
        items.setdefault(o["item"], []).append(o)
    elif no_lm(o):
        o["atlas"] = "none"
    elif base.startswith(FLOOR):
        o["atlas"] = "floor"
    elif base.startswith(SHELL):
        o["atlas"] = "shell"
    else:
        o["atlas"] = zone(centre([o]))
for name, objs in items.items():
    z = "none" if all(no_lm(o) for o in objs) else zone(centre(objs))
    for o in objs:
        o["atlas"] = z

# ---- 4. UVMap: world-scale cube projection for procedural / box-mapped surfaces
#         (scanned models and photo planes keep the UVs they came with)
keep = lambda o: o.get("src_asset") or any(s.material and s.material.name.endswith("_m") for s in o.material_slots)
cube = [o for o in meshes if not o.get("veg") and not keep(o)]
for o in cube:
    if not o.data.uv_layers:
        o.data.uv_layers.new(name="UVMap")
    o.data.uv_layers[0].name = "UVMap"
    o.data.uv_layers.active = o.data.uv_layers[0]
select(cube)
bpy.ops.object.mode_set(mode="EDIT")
bpy.ops.mesh.select_all(action="SELECT")
bpy.ops.uv.cube_project(cube_size=1.0, correct_aspect=False, clip_to_bounds=False, scale_to_bounds=False)
bpy.ops.object.mode_set(mode="OBJECT")

# ---- 5. lightmap UVs: smart-project per object, then pack each atlas at one texel density
ATLAS_RES = {"floor": 4096, "shell": 4096, "left": 2048, "centre": 2048, "right": 2048, "court": 2048}
stats = {}
for atlas, res in ATLAS_RES.items():
    objs = [o for o in meshes if o.get("atlas") == atlas]
    if not objs:
        continue
    for o in objs:
        if not o.data.uv_layers:
            o.data.uv_layers.new(name="UVMap")
        lm = o.data.uv_layers.get("lightmap") or o.data.uv_layers.new(name="lightmap")
        o.data.uv_layers.active = lm
    select(objs)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.smart_project(angle_limit=math.radians(60), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
    bpy.ops.uv.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(rotate=True, scale=True, margin_method="FRACTION", margin=6.0 / res, shape_method="CONCAVE" if atlas in ("floor", "shell", "court") else "CONVEX")
    bpy.ops.object.mode_set(mode="OBJECT")
    area = sum(p.area for o in objs for p in o.data.polygons)
    uv_area = 0.0
    for o in objs:
        uv = o.data.uv_layers["lightmap"].data
        for p in o.data.polygons:
            pts = [uv[i].uv for i in p.loop_indices]
            uv_area += abs(sum(pts[i].x * pts[i - 1].y - pts[i - 1].x * pts[i].y for i in range(len(pts)))) / 2
    texel = math.sqrt(area / max(uv_area * res * res, 1)) * 100
    stats[atlas] = (len(objs), sum(len(o.data.polygons) for o in objs), area, uv_area, texel)
    print(f"ATLAS {atlas:7s} {res}px  objects {len(objs):4d}  faces {stats[atlas][1]:7d}  area {area:7.1f} m2  uv fill {uv_area:.2f}  texel {texel:.2f} cm", flush=True)

# ---- 6. one mesh per clickable item; static parts merged per atlas
for name, objs in items.items():
    objs = [o for o in objs if o.name in scene.objects]
    select(objs)
    bpy.ops.object.join()
    vl.objects.active.name = "item_" + name
for atlas in list(ATLAS_RES) + ["none"]:
    objs = [o for o in scene.objects if o.type == "MESH" and o.get("atlas") == atlas and not o.get("item")]
    if objs:
        select(objs)
        bpy.ops.object.join()
        vl.objects.active.name = "static_" + atlas
for o in scene.objects:
    if o.type == "MESH" and o.data.uv_layers.get("UVMap"):
        o.data.uv_layers["UVMap"].active_render = True

# ---- 7. save
bpy.ops.object.select_all(action="DESELECT")
path = os.path.join(OUT, "studio_bake.blend")
bpy.ops.wm.save_as_mainfile(filepath=path)
print("SAVED", path, "objects", len([o for o in scene.objects if o.type == "MESH"]), flush=True)
