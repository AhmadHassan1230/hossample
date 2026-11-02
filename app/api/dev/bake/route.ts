import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/* Dev-only: live status of the overnight lightmap bake (tools/blender/bake_overnight.sh).
   GET            → JSON progress for /checkpoints/bake.html
   GET ?img=name  → a downscaled JPEG preview of a finished piece */
export const dynamic = "force-dynamic";

const DIR = path.join(process.cwd(), "_source/bake");
const LM = path.join(DIR, "lightmaps");
const ATLASES: [string, string, number][] = [
  ["floor", "Floor — marble with sandstone inlay", 25],
  ["shell", "Walls, arcades and vaults", 16],
  ["left", "Left nave — architecture", 10],
  ["centre", "Centre — long table and site model", 15],
  ["right", "Right nave — furniture, content, filming", 14],
  ["court", "Courtyard and garden", 6],
];
const PROBES: [string, string, number][] = [
  ["env", "360° reflection probe — centre", 4],
  ["env_left", "360° reflection probe — left nave", 4],
  ["env_right", "360° reflection probe — right nave", 4],
];
const cache = new Map<string, { mtime: number; buf: Buffer }>();

async function mtime(p: string) {
  try {
    return (await stat(p)).mtimeMs;
  } catch {
    return 0;
  }
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response("disabled", { status: 404 });
  const img = new URL(req.url).searchParams.get("img");
  if (img) {
    if (!/^[\w]+\.png$/.test(img)) return new Response("bad name", { status: 400 });
    const p = path.join(LM, img);
    const m = await mtime(p);
    if (!m) return new Response("not found", { status: 404 });
    let hit = cache.get(img);
    if (!hit || hit.mtime !== m) {
      const buf = await sharp(await readFile(p)).resize({ width: 1600, height: 1600, fit: "inside" }).jpeg({ quality: 84 }).toBuffer();
      hit = { mtime: m, buf };
      cache.set(img, hit);
    }
    return new Response(new Uint8Array(hit.buf), { headers: { "content-type": "image/jpeg", "cache-control": "no-store" } });
  }

  let start = 0;
  try {
    start = (await stat(path.join(DIR, "bake_day.log"))).birthtimeMs;
  } catch {}
  const log = await readFile(path.join(LM, "bake.log"), "utf8").catch(() => "");
  const lines = log.trim().split("\n");
  const nightStarted = (await mtime(path.join(DIR, "bake_night.log"))) > start;
  const finished = /DONE \['night'\]/.test(lines.slice(-3).join("\n")) && nightStarted;

  const pieces = [];
  for (const mode of ["day", "night"] as const) {
    for (const [key, label, w] of [...ATLASES, ...PROBES]) {
      const file = key.startsWith("env") ? `${key}_${mode}.png` : `${mode}_${key}.png`;
      const m = await mtime(path.join(LM, file));
      const done = m > start;
      const re = key.startsWith("env") ? new RegExp(`probe ${key} ${mode} in (\\d+)s`) : new RegExp(`baked ${mode} ${key} .* in (\\d+)s \\(\\+denoise (\\d+)s\\)`);
      const hit = [...lines].reverse().map((l) => l.match(re)).find(Boolean);
      const seconds = done && hit ? Number(hit[1]) + Number(hit[2] ?? 0) : null;
      pieces.push({ mode, key, label, file, done, seconds, weight: mode === "night" ? (key.startsWith("env") ? w * 1.3 : w * 2) : w, at: done ? m : null });
    }
  }
  const now = Date.now();
  const total = pieces.reduce((a, p) => a + p.weight, 0);
  const doneW = pieces.filter((p) => p.done).reduce((a, p) => a + p.weight, 0);
  const elapsed = start ? (now - start) / 1000 : 0;
  // pace = real seconds per expected minute, from what has finished so far
  const pace = doneW ? elapsed / doneW : 60;
  const remaining = finished ? 0 : Math.max((total - doneW) * pace, 0);
  const current = finished ? undefined : pieces.find((p) => !p.done);
  return Response.json({
    start,
    now,
    elapsed,
    finished,
    percent: finished ? 100 : Math.min(99, (doneW / total) * 100),
    eta: finished ? now : now + remaining * 1000,
    current: current ? { mode: current.mode, label: current.label } : null,
    pieces,
  });
}
