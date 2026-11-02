// Path-traced journey frames (Blender, _source/bake/frames/f_####.png) → web.
//   public/journey/f_####.webp + public/journey/manifest.json
// Safe to run while Blender is still rendering: converts whatever exists, skips done frames.
import sharp from "sharp";
import { readdir, mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// usage: node tools/frames.mjs [srcDir] [outDir] [total] [perSegment] [--sharpen]
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const SHARPEN = process.argv.includes("--sharpen");
const src = path.join(root, args[0] ?? "_source/bake/frames");
const out = path.join(root, args[1] ?? "public/journey");
const TOTAL = Number(args[2] ?? 177);
const PER_SEG = Number(args[3] ?? 16);

await mkdir(out, { recursive: true });
const files = (await readdir(src)).filter((f) => /^f_\d{4}\.png$/.test(f)).sort();
let done = 0, bytes = 0, width = 0, height = 0;
for (const f of files) {
  const dst = path.join(out, f.replace(".png", ".webp"));
  try {
    const s = await stat(dst);
    bytes += s.size;
    done++;
    continue;
  } catch {}
  let img = sharp(path.join(src, f));
  if (SHARPEN) img = img.sharpen({ sigma: 0.9, m1: 0.6, m2: 1.6 });
  const info = await img.webp({ quality: SHARPEN ? 88 : 82, effort: 5, smartSubsample: true }).toFile(dst);
  width = info.width;
  height = info.height;
  bytes += info.size;
  done++;
}
if (!width && files.length) {
  const m = await sharp(path.join(src, files[0])).metadata();
  width = m.width;
  height = m.height;
}
await writeFile(path.join(out, "manifest.json"), JSON.stringify({ total: TOTAL, perSegment: PER_SEG, available: done, width, height, version: Date.now() }, null, 1));
console.log(`${done}/${TOTAL} frames → public/journey (${(bytes / 1e6).toFixed(1)} MB)`);
