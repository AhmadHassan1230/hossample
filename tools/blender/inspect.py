import bpy, sys, collections
argv = sys.argv[sys.argv.index("--") + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=argv[0])
objs = bpy.data.objects
kinds = collections.Counter(o.type for o in objs)
print("OBJECTS", dict(kinds))
mats = collections.Counter()
tris = 0
for o in objs:
    if o.type == "MESH":
        me = o.data
        tris += sum(len(p.vertices) - 2 for p in me.polygons)
        for m in me.materials:
            mats[m.name if m else "None"] += 1
print("TRIS", tris)
print("MATERIALS", len(mats))
for k, v in sorted(mats.items(), key=lambda x: -x[1])[:80]:
    print("  ", v, k)
for o in objs:
    if o.type == "LIGHT":
        print("LIGHT", o.name, o.data.type, round(o.data.energy, 2), tuple(round(c, 2) for c in o.location))
