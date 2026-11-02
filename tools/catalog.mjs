// Catalog (HOUSE OF SULTANA catalog.pdf, supplied by the owner) -> web images.
// Inputs come from tools/pdftool (embedded originals) in _source/catalog/images.
//   public/work/<slug>/<n>.jpg   max 1800px
//   public/work/<slug>/tex.jpg   640px hero, used inside the 3D Atelier
//   content/catalog.generated.json  { slug: [{ src, width, height, built }] }
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "_source/catalog/images");

// First image = hero. "*" marks a built (photographed) image rather than a render.
const MAP = {
  "loop-bukhari": ["p008-1-1172x842", "*p016-1-1448x1086-raw", "p009-2-2132x1422", "*p017-6-960x1280-raw", "p010-1-2136x1424", "*p016-2-1600x900-raw", "p009-3-1508x848", "*p017-5-1023x1537-raw", "p011-3-2132x1192"],
  "loop-badar": ["p004-1-1536x1024", "p005-1-1536x1024", "*p007-4-768x1024-raw", "p005-2-1536x1024", "p005-3-1536x1024", "*p007-5-768x1024-raw"],
  "loop-johar": ["p019-2-1600x900", "p020-3-1600x900", "*p023-2-969x1624-raw", "p019-1-1600x900", "p021-2-1600x900", "*p023-1-1200x1600-raw", "p020-4-1600x900"],
  "loop-north-nazimabad": ["p024-1-1600x900", "p025-1-1600x900", "*p028-1-736x1600-raw", "p026-3-1600x900", "p025-2-1600x900", "*p028-2-736x1600-raw"],
  "loop-dolmen": ["p030-2-1347x946", "p030-1-1448x1086", "p030-3-1470x1070", "p029-2-1058x770-raw"],
  "loop-heuser": ["p032-2-1274x718-raw", "p033-2-1672x941", "p033-1-1672x941", "p033-3-1672x941"],
  "loop-bahria": ["p036-3-1672x941", "p036-1-1672x941", "p038-1-1672x941", "p037-1-1672x941", "p036-2-1402x1122", "p038-3-1672x941"],
  "loop-gulgasht": ["p040-3-902x664-raw", "p042-2-1320x930", "p041-1-1320x930", "p043-1-1320x930", "p041-2-1342x1012", "p042-1-1320x930"],
  "loop-iqra": ["p047-3-1324x1188", "p046-3-1672x940", "p047-2-1309x1202", "p046-2-1381x1139"],
  "od-loop-jinnah-icon": ["p050-1-1600x900", "p052-2-1600x900", "*p056-3-1514x1039", "p053-2-1536x864", "p054-1-1383x922", "*p056-1-1280x960", "p051-1-1440x810", "*p057-4-960x1280"],
  "od-loop-tipu": ["p058-2-1415x793-raw", "p059-1-1600x900", "p060-2-1600x900", "p059-3-1600x900", "p061-1-1600x900", "p060-1-1600x900"],
  "overdose-sialkot": ["p063-2-1122x1402-raw", "p064-3-1536x1024", "p065-1-1536x1024", "p064-4-1536x1024", "p065-3-1536x1024", "p064-2-1536x1024"],
  "overdose-civic-avenue": ["p067-1-1338x753", "p068-3-1338x753", "p069-1-1338x753", "p069-3-1338x753", "p068-1-1338x753", "p069-2-1338x753"],
  "overdose-new-blue-area": ["p071-2-1280x759-raw", "*p075-1-1041x1511-raw", "p072-1-1536x1024", "*p075-3-1114x1411-raw", "p073-1-1536x1024", "*p075-6-1127x1396-raw", "p073-2-1536x1024"],
  "overdose-technopark": ["p077-1-1920x1080", "p076-1-1672x941", "p078-3-1920x1080", "p078-4-1920x1080", "p079-2-1920x1080", "p077-3-1672x941"],
  "overdose-mm-alam": ["p082-1-2036x1143", "p081-1-2542x1430", "p082-2-2245x1259", "p082-3-2036x1141"],
  "overdose-five-star": ["p083-1-1280x853", "p085-2-1536x1024", "p084-2-1383x922", "p084-3-1383x922", "p085-1-1264x842", "p084-1-1383x922"],
  "overdose-gujrat": ["p087-1-1447x1087", "p089-3-1447x1087", "p088-3-1443x1090", "p089-1-1443x1090", "p088-4-1342x1012", "p089-2-1447x1087"],
  "overdose-bahria-lahore": ["p091-1-1537x1023", "p092-1-1342x920", "p092-2-1342x920", "p092-3-1342x920"],
  "overdose-express-lucky-one": ["p094-2-973x733-raw", "p095-2-1342x1012", "p095-1-1342x1012", "p095-3-1342x1012"],
  "overdose-express-ittehad": ["p097-2-1295x732-raw", "p098-3-1344x756", "*p100-1-1600x900-raw", "p098-1-1344x756", "p098-2-1344x756"],
  "overdose-factory": ["p101-1-1320x930", "p102-2-1320x930", "p103-1-1320x930", "p102-1-1320x930", "p103-3-1320x930", "p102-3-1320x930"],
  // Furniture studio shots
  "furniture": ["p105-1-1068x663", "p106-1-1070x663", "p107-1-1070x882", "p108-1-1080x995"],
};

const out = {};
for (const [slug, files] of Object.entries(MAP)) {
  const dir = path.join(root, "public/work", slug);
  await mkdir(dir, { recursive: true });
  out[slug] = [];
  let i = 0;
  for (const entry of files) {
    const built = entry.startsWith("*");
    const file = path.join(src, `${entry.replace(/^\*/, "")}.jpg`);
    i += 1;
    const info = await sharp(file)
      .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(path.join(dir, `${i}.jpg`));
    out[slug].push({ src: `/work/${slug}/${i}.jpg`, width: info.width, height: info.height, built });
    if (i === 1) {
      await sharp(file).resize({ width: 640, height: 640, fit: "inside" }).jpeg({ quality: 80 }).toFile(path.join(dir, "tex.jpg"));
    }
  }
  console.log(slug.padEnd(28), files.length);
}
await writeFile(path.join(root, "content/catalog.generated.json"), JSON.stringify(out, null, 1) + "\n");
