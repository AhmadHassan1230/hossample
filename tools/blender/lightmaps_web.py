# Baked lightmaps (float EXR) → web: gamma-encoded WebP + per-atlas scale, and probes → small EXR.
#   blender -b --factory-startup -P tools/blender/lightmaps_web.py -- [day|night|both]
# Decode in the shader: light = pow(texel, 2.2) * scale.
import bpy, json, os, sys
import numpy as np

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
MODES = ["day", "night"] if not argv or argv[0] == "both" else [argv[0]]
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "_source/bake/lightmaps")
OUT = os.path.join(ROOT, "public/studio/lm")
os.makedirs(OUT, exist_ok=True)
START = os.stat(os.path.join(ROOT, "_source/bake/bake_day.log")).st_birthtime   # ignore earlier test bakes
ATLASES = ["floor", "shell", "left", "centre", "right", "court"]
MAX = 2048
PROBES = ["env", "env_left", "env_right"]
man_path = os.path.join(OUT, "manifest.json")
manifest = json.load(open(man_path)) if os.path.exists(man_path) else {}


def load(path):
    im = bpy.data.images.load(path)
    w, h = im.size
    px = np.empty(w * h * 4, np.float32)
    im.pixels.foreach_get(px)
    bpy.data.images.remove(im)
    return px.reshape(h, w, 4)[:, :, :3], w, h


for mode in MODES:
    for atlas in ATLASES:
        src = os.path.join(SRC, f"{mode}_{atlas}.exr")
        if not os.path.exists(src) or os.path.getmtime(src) < START:
            continue
        rgb, w, h = load(src)
        if w > MAX:   # web cap: box-filter down to MAX px
            f = w // MAX
            rgb = rgb.reshape(h // f, f, w // f, f, 3).mean(axis=(1, 3))
            w, h = w // f, h // f
        lit = rgb.max(axis=2)
        scale = float(np.percentile(lit[lit > 1e-5], 99.8)) if (lit > 1e-5).any() else 1.0
        scale = min(scale, 12.0)   # surfaces right inside lamps may clip; the room keeps its 8-bit precision
        enc = np.power(np.clip(rgb / scale, 0, 1), 1 / 2.2)
        im = bpy.data.images.new(f"{mode}_{atlas}", w, h, alpha=False)
        im.colorspace_settings.name = "Non-Color"
        px = np.ones((h, w, 4), np.float32)
        px[:, :, :3] = enc
        im.pixels.foreach_set(px.ravel())
        dst = os.path.join(OUT, f"{mode}_{atlas}.webp")
        im.filepath_raw = dst
        im.file_format = "WEBP"
        im.save(quality=92)
        bpy.data.images.remove(im)
        manifest.setdefault(mode, {})[atlas] = {"url": f"/studio/lm/{mode}_{atlas}.webp", "scale": scale, "v": int(os.path.getmtime(src))}
        print("LM", mode, atlas, w, "px scale", round(scale, 3), os.path.getsize(dst) // 1024, "KB", flush=True)
    for probe in PROBES:
        src = os.path.join(SRC, f"{probe}_{mode}.exr")
        if not os.path.exists(src) or os.path.getmtime(src) < START:
            continue
        im = bpy.data.images.load(src)
        im.scale(1024, 512)
        dst = os.path.join(OUT, f"{probe}_{mode}.exr")
        scene = bpy.context.scene
        s = scene.render.image_settings
        s.file_format, s.color_depth, s.exr_codec = "OPEN_EXR", "16", "ZIP"
        im.save_render(dst, scene=scene)
        bpy.data.images.remove(im)
        manifest.setdefault(mode, {})[probe] = {"url": f"/studio/lm/{probe}_{mode}.exr", "v": int(os.path.getmtime(src))}
        print("PROBE", mode, probe, os.path.getsize(dst) // 1024, "KB", flush=True)
json.dump(manifest, open(man_path, "w"), indent=1)
print("MANIFEST", json.dumps({m: sorted(v) for m, v in manifest.items()}), flush=True)
