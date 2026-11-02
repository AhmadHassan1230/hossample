// Turns the raw Instagram downloads in _source/ig into web images.
//   public/media/<name>.jpg      max 1600px, used by pages (next/image resizes further)
//   public/media/tex/<name>.jpg  max 640px, used as textures inside the 3D Atelier
//   content/media.generated.json  pixel sizes, so content records never guess dimensions
// Usage: node tools/media.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "_source/ig");
const out = path.join(root, "public/media");
const tex = path.join(out, "tex");

// name -> [instagram shortcode, also export a 3D texture?]
const MAP = {
  // Projects
  "loop-bukhari-exterior": ["DXWmbJYDFwk", true],
  "loop-bukhari-counter": ["DXxFcwzMa72", false],
  "loop-north-exterior": ["DZ5RQUvDPQF", true],
  "zouqee-storefront": ["DQNLb2FjPQ0", true],
  "zouqee-honeycomb-shelves": ["DNgl7hlRAt_", false],
  "zouqee-branch": ["DUaZoQijHWk", true],
  "od-express-hoarding": ["DZXtQsRMAuB", false],
  "workspace-render": ["DbYFdDFjFtt", true],
  "cafe-counter": ["Dc-7lnVDKcd", true],
  "timber-cafe": ["Dcn4U79jEcB", true],
  // Products (HoS workshop)
  "arch-mirror": ["DQHR4x7DOJP", true],
  "console-table": ["DKon6GisaIh", true],
  "console-table-workshop": ["DKpVmxdMZul", false],
  "oak-cane-bench": ["DK-HkkTMjsA", true],
  "oak-cane-bench-workshop": ["DLS-eqWMNOt", false],
  "sheesham-chair": ["DLxTh3Ktbt_", true],
  "study-table": ["DLcabNKsWup", true],
  "study-table-workshop": ["DLr0iMZtGkx", false],
  "boucle-sofa": ["DPuUEnmjM85", true],
  "boucle-detail": ["DQoXgJjjOUu", false],
  "lounge-chair": ["DPwpggOjBRh", true],
  "vase-blue-white": ["DQKgrkkDGyB", true],
  "vase-banded": ["DQKjriDjPfa", false],
  "vase-cream": ["DQKlcykjP9q", false],
  // HoS's own channel (behind the scenes)
  "studio-craftsman": ["DLDEnEDMmto", false],
  "studio-factory-tour": ["DLUMpnaM9DV", false],
  "studio-site-arch": ["DSsWbZJjDhp", false],
  "studio-site-visit": ["DP2B5ACDEzV", false],
  "studio-out-of-site": ["DbOBbQrsonw", false],
  "studio-expo": ["DTkRI2Ck-iJ", true],
  "studio-grocery-site": ["DQWmj2CjMXf", false],
};

await mkdir(tex, { recursive: true });
const sizes = {};
for (const [name, [code, asTexture]] of Object.entries(MAP)) {
  const input = path.join(src, `${code}.jpg`);
  const img = sharp(input).rotate();
  const { data, info } = await img
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  await writeFile(path.join(out, `${name}.jpg`), data);
  sizes[name] = { width: info.width, height: info.height, source: `https://www.instagram.com/p/${code}/` };
  if (asTexture) {
    await img
      .clone()
      .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(path.join(tex, `${name}.jpg`));
  }
  console.log(name.padEnd(28), `${info.width}x${info.height}`, asTexture ? "+tex" : "");
}
await writeFile(path.join(root, "content/media.generated.json"), JSON.stringify(sizes, null, 2) + "\n");
console.log(`\n${Object.keys(sizes).length} images written.`);
