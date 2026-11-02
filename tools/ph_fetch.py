# Download CC0 Poly Haven assets into public/assets/ph (uses curl; system Python SSL is broken here).
#   python3 tools/ph_fetch.py tex 2k red_sandstone_wall marble_01 ...
#   python3 tools/ph_fetch.py model 1k mid_century_lounge_chair ...
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DST = os.path.join(ROOT, "public/assets/ph")
kind, res, names = sys.argv[1], sys.argv[2], sys.argv[3:]


def curl_json(url):
    return json.loads(subprocess.run(["curl", "-sfL", "-A", "hos-site", url], capture_output=True, check=True).stdout)


def get(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return
    os.makedirs(os.path.dirname(path), exist_ok=True)
    subprocess.run(["curl", "-sfL", "-A", "hos-site", "-o", path, url], check=True)


for name in names:
    files = curl_json(f"https://api.polyhaven.com/files/{name}")
    if kind == "tex":
        for key, short in (("Diffuse", "diff"), ("nor_gl", "nor"), ("arm", "arm")):
            if key in files and res in files[key]:
                get(files[key][res]["jpg"]["url"], os.path.join(DST, name, f"{short}_{res}.jpg"))
    else:
        if "gltf" not in files or res not in files["gltf"]:
            print("skip (no gltf)", name, flush=True)
            continue
        g = files["gltf"][res]["gltf"]
        get(g["url"], os.path.join(DST, name, os.path.basename(g["url"])))
        for rel, v in g.get("include", {}).items():
            get(v["url"], os.path.join(DST, name, rel))
    print("ok", name, flush=True)
