# The courtyard jacaranda for the web: thin the leaf cards (enlarging the survivors so the canopy
# still reads), simplify bark, export public/studio/tree_raw.glb. Run alone: it is 3.9M triangles.
#   blender -b --factory-startup -P tools/blender/tree_web.py
import bpy, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "_source/bake/studio_bake.blend"))
scene = bpy.context.scene
for o in list(scene.objects):
    if not o.name.startswith("jacaranda_tree"):
        bpy.data.objects.remove(o, do_unlink=True)
trees = [o for o in scene.objects if o.type == "MESH"]


def select_mat(o, word):
    for i, sl in enumerate(o.material_slots):
        if sl.material and word in sl.material.name.lower():
            o.active_material_index = i
            bpy.ops.object.material_slot_select()


for o in trees:
    bpy.ops.object.select_all(action="DESELECT")
    o.select_set(True)
    bpy.context.view_layer.objects.active = o
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="DESELECT")
    select_mat(o, "leaves")
    bpy.ops.mesh.select_random(ratio=0.996, seed=3, action="DESELECT")
    bpy.ops.mesh.select_linked(delimit=set())
    scene.tool_settings.transform_pivot_point = "INDIVIDUAL_ORIGINS"
    bpy.ops.transform.resize(value=(2.0, 2.0, 2.0))
    bpy.ops.mesh.hide(unselected=False)
    select_mat(o, "leaves")
    bpy.ops.mesh.delete(type="FACE")
    bpy.ops.mesh.reveal(select=False)
    bpy.ops.mesh.select_all(action="DESELECT")
    select_mat(o, "branches")
    select_mat(o, "trunk")
    bpy.ops.mesh.decimate(ratio=0.12)
    bpy.ops.object.mode_set(mode="OBJECT")
    print("TREE TRIS", sum(len(p.vertices) - 2 for p in o.data.polygons), flush=True)

bpy.ops.object.select_all(action="SELECT")
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, "_source/bake/tree_raw.glb"), export_format="GLB", use_selection=True,
                          export_texcoords=True, export_normals=True, export_materials="EXPORT", export_image_format="NONE",
                          export_extras=True, export_yup=True, export_apply=True)
print("TREE EXPORTED", flush=True)
