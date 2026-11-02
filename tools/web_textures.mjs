// Web copies of the tiling scan textures used by the studio (1K JPEG; the 2K originals stay for Blender).
//   node tools/web_textures.mjs
import sharp from "sharp";
import { readFile, mkdir, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mats = JSON.parse(await readFile(path.join(root, "public/studio/materials.json"), "utf8"));
const sets = new Set(["white_plaster_02", ...Object.values(mats).filter((m) => m.k === "scan").map((m) => m.set)]);
for (const set of sets) {
  const out = path.join(root, "public/studio/tex", set);
  await mkdir(out, { recursive: true });
  for (const kind of ["diff", "nor", "arm"]) {
    let src = null;
    for (const res of ["2k", "1k"]) {
      const p = path.join(root, "public/assets/ph", set, `${kind}_${res}.jpg`);
      try { await access(p); src = p; break; } catch {}
    }
    if (!src) continue;
    const info = await sharp(src).resize(1024, 1024, { fit: "inside" }).jpeg({ quality: kind === "nor" ? 90 : 84, mozjpeg: true }).toFile(path.join(out, `${kind}.jpg`));
    console.log(set, kind, Math.round(info.size / 1024), "KB");
  }
}
