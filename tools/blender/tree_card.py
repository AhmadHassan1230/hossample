# The courtyard jacaranda as a cutout card for the web: the full 3.9M-triangle tree rendered in
# Cycles (day sun / blue-hour uplights) from the hall side, on a transparent background.
#   blender -b --factory-startup -P tools/blender/tree_card.py
# Writes public/studio/tree_day.webp, tree_night.webp and tree.json (where the card stands).
import bpy, json, math, os
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "public/studio")
bpy.ops.wm.open_mainfile(filepath=os.path.join(ROOT, "_source/bake/studio_bake.blend"))
scene = bpy.context.scene
keep = lambda o: o.name.startswith("jacaranda_tree") or o.type == "LIGHT"
for o in list(scene.objects):
    if not keep(o):
        bpy.data.objects.remove(o, do_unlink=True)
tree = [o for o in scene.objects if o.type == "MESH"]

co = np.empty(sum(len(o.data.vertices) for o in tree) * 3, np.float32)
i = 0
for o in tree:
    n = len(o.data.vertices) * 3
    o.data.vertices.foreach_get("co", co[i:i + n])
    i += n
co = co.reshape(-1, 3)
lo, hi = co.min(axis=0), co.max(axis=0)
lo[2] = max(lo[2], 0.0)
w, h = float(hi[0] - lo[0]), float(hi[2] - lo[2])
cx, cz, cy = float(lo[0] + hi[0]) / 2, float(lo[2] + hi[2]) / 2, float(lo[1] + hi[1]) / 2
print("TREE BOUNDS", lo, hi, flush=True)

cam = bpy.data.objects.new("card_cam", bpy.data.cameras.new("card_cam"))
scene.collection.objects.link(cam)
cam.data.type = "ORTHO"
cam.data.ortho_scale = max(w, h)
cam.location = (cx, float(lo[1]) - 20.0, cz)
cam.rotation_euler = (math.radians(90), 0, 0)    # looking +Y, from the hall towards the courtyard
cam.data.clip_end = 200
scene.camera = cam
RW = 2048
scene.render.resolution_x, scene.render.resolution_y = (RW, int(RW * h / w)) if w >= h else (int(RW * w / h), RW)
scene.render.film_transparent = True
scene.render.engine = "CYCLES"
cp = bpy.context.preferences.addons["cycles"].preferences
cp.compute_device_type = "METAL"
cp.get_devices()
for d in cp.devices:
    d.use = d.type != "CPU"
scene.cycles.device = "GPU"
scene.cycles.use_denoising = True
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"


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
    for o in scene.objects:
        if o.get("night_lamp"):
            o.hide_render = not night


meta = {"center": [cx, cy, cz], "size": [w, h], "base": float(lo[2])}
for mode, samples, ev in (("day", 96, -1.0), ("night", 192, 1.0)):
    set_mode(mode == "night")
    scene.cycles.samples = samples
    scene.view_settings.exposure = ev        # keep sunlit leaves under 1.0 in an 8-bit file
    png = f"/tmp/tree_{mode}.png"
    scene.render.filepath = png
    bpy.ops.render.render(write_still=True)
    im = bpy.data.images.load(png)
    im.filepath_raw = os.path.join(OUT, f"tree_{mode}.webp")
    im.file_format = "WEBP"
    im.save(quality=88)
    meta[mode] = {"url": f"/studio/tree_{mode}.webp", "gain": 2 ** -ev}
    print("CARD", mode, os.path.getsize(os.path.join(OUT, f"tree_{mode}.webp")) // 1024, "KB", flush=True)
json.dump(meta, open(os.path.join(OUT, "tree.json"), "w"), indent=1)
print("TREE CARD DONE", json.dumps(meta), flush=True)
