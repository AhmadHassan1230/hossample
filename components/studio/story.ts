import * as THREE from "three";
import { cities, cityOf, projects } from "@/content/projects";

/* The HoS story, painted in the browser with the site's own fonts (no extra Blender work):
   a printed runner on the long table and two floating panels in the courtyard.
   Copy is HoS's own (About page, sourced from hosultana.com / Instagram); numbers come from the catalogue. */

const BRANDS = ["Loop", "Overdose", "OD × Loop", "Overdose Express"];

/** Approximate outline of Pakistan (lon, lat), simplified from small-scale public-domain maps. */
export const PAKISTAN: [number, number][] = [
  [61.61, 25.19], [61.86, 26.24], [63.17, 26.63], [63.23, 27.22], [62.76, 27.38], [62.73, 28.26], [61.77, 28.7], [61.37, 29.3], [60.87, 29.83],
  [62.55, 29.32], [63.55, 29.47], [64.15, 29.34], [64.35, 29.56], [65.05, 29.47], [66.35, 29.89], [66.38, 30.74], [66.94, 31.3], [67.68, 31.3], [67.79, 31.58],
  [68.56, 31.71], [68.93, 31.62], [69.32, 31.9], [69.26, 32.5], [69.69, 33.11], [70.32, 33.36], [69.93, 34.02], [70.88, 33.99], [71.16, 34.35], [71.12, 34.73],
  [71.61, 35.15], [71.5, 35.65], [71.26, 36.07], [72.92, 36.72], [74.07, 36.84], [75.16, 37.13], [75.9, 36.67], [76.19, 35.9], [77.84, 35.49],
  [76.87, 34.65], [75.76, 34.5], [74.24, 34.75], [73.75, 34.32], [74.1, 33.44], [74.45, 32.76], [75.26, 32.27], [74.41, 31.69], [74.42, 30.98],
  [73.45, 29.98], [72.82, 28.96], [71.78, 27.91], [70.62, 27.99], [69.51, 26.94], [70.17, 26.49], [70.28, 25.72], [70.84, 25.22], [71.04, 24.36],
  [69.51, 24.26], [68.84, 24.36], [68.18, 23.69], [67.44, 23.94], [67.15, 24.66], [66.37, 25.43], [64.53, 25.24], [62.91, 25.22], [61.61, 25.19],
];
export const CITY_AT: Record<string, [number, number]> = {
  Karachi: [67.01, 24.86],
  Islamabad: [73.05, 33.68],
  Lahore: [74.35, 31.55],
  Sialkot: [74.53, 32.49],
  Gujrat: [74.08, 32.57],
  Multan: [71.47, 30.2],
};

const font = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "sans-serif";
export async function storyFonts() {
  const d = font("--font-display"), s = font("--font-sans"), l = font("--font-logo");
  await Promise.all([`500 100px ${d}`, `400 100px ${d}`, `400 60px ${s}`, `500 60px ${s}`, `500 100px ${l}`].map((f) => document.fonts.load(f).catch(() => null)));
  return { d, s, l };
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  let line = "";
  for (const w of text.split(" ")) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > max && line) {
      ctx.fillText(line, x, y);
      y += lh;
      line = w;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

/** The HoS arch mark: an arched door with H and S on its threshold. */
function mark(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, ink: string, logoFont: string) {
  const w = h * 0.5;
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = h * 0.028;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h);
  ctx.lineTo(x - w / 2, y + w / 2);
  ctx.arc(x, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w * 1.25, y + h * 0.62);
  ctx.lineTo(x + w * 1.25, y + h * 0.62);
  ctx.stroke();
  ctx.font = `500 ${h * 0.3}px ${logoFont}`;
  ctx.textAlign = "center";
  ctx.fillText("H", x - w * 0.88, y + h * 0.58);
  ctx.fillText("S", x + w * 0.88, y + h * 0.58);
  ctx.restore();
}

/** A soft frosted card behind floating text, so it reads over sky, stone or jaali. */
function card(ctx: CanvasRenderingContext2D, w: number, h: number, night: boolean) {
  ctx.fillStyle = night ? "rgba(16,13,12,.48)" : "rgba(247,241,232,.55)";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, h, 48);
  ctx.fill();
}

const catalogue = () => ({ spaces: projects.length, cities: cities.length });

/** The long-table runner: 5 m × 1.25 m of printed paper, read from the front, top-down. */
export function runnerTexture(f: { d: string; s: string; l: string }) {
  const W = 4096, H = 1285;   // 5.1 m × 1.6 m
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#efe6d8";
  ctx.fillRect(0, 0, W, H);
  // paper tooth
  const img = ctx.getImageData(0, 0, W, H);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 9;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
  const ink = "#2a211c", accent = "#b8481b";
  const { spaces, cities: nCities } = catalogue();
  ctx.translate(0, 130);   // centre the composition on the 1.6 m-deep sheet

  // left: the mark and the name
  const LX = 640;   // clear of the carved plate that stands on this end of the runner
  mark(ctx, LX, 210, 330, ink, f.l);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = `500 46px ${f.d}`;
  ctx.letterSpacing = "14px";
  ctx.fillText("HOUSE OF SULTANA", LX, 690);
  ctx.letterSpacing = "6px";
  ctx.fillStyle = accent;
  ctx.font = `500 34px ${f.s}`;
  ctx.fillText("FOUNDED 2025 · KARACHI", LX, 760);

  // centre: the creed and what the studio does
  ctx.textAlign = "left";
  ctx.letterSpacing = "0px";
  ctx.fillStyle = ink;
  ctx.font = `400 128px ${f.d}`;
  ctx.fillText("Clarity over excess.", 1180, 330);
  ctx.fillText("Precision over trend.", 1180, 470);
  ctx.font = `400 46px ${f.s}`;
  ctx.fillStyle = "#4a3d34";
  wrap(ctx, "An international team of architects and designers. Turnkey architecture and interiors, from concept to execution, alongside custom furniture and bespoke house decor.", 1184, 600, 1650, 66);

  // right: who it has built for
  ctx.fillStyle = accent;
  ctx.font = `500 32px ${f.s}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("DESIGNED FOR", 3120, 250);
  ctx.letterSpacing = "0px";
  ctx.fillStyle = ink;
  ctx.font = `400 72px ${f.d}`;
  BRANDS.forEach((b, i) => ctx.fillText(b, 3120, 350 + i * 92));
  ctx.fillStyle = "#4a3d34";
  ctx.font = `400 40px ${f.s}`;
  ctx.fillText(`${spaces} spaces · ${nCities} cities`, 3124, 790);

  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 16;
  return t;
}

/** Floating courtyard panel: the map of where HoS has built. Repainted for day (ink) or night (cream). */
export function mapCanvas(f: { d: string; s: string }, night: boolean) {
  const W = 1600, H = 1500;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const ink = night ? "#f3ece2" : "#231c18", soft = night ? "rgba(243,236,226,.55)" : "rgba(35,28,24,.55)", accent = "#ff5a1f";
  card(ctx, W, H, night);
  const counts = new Map<string, number>();
  for (const p of projects) counts.set(cityOf(p), (counts.get(cityOf(p)) ?? 0) + 1);
  // project lon/lat into the panel
  const k = 76, cosl = Math.cos((30 * Math.PI) / 180);
  const px = (lon: number) => 230 + (lon - 60.5) * k * cosl * 1.12;
  const py = (lat: number) => 330 + (37.6 - lat) * k * 0.98;
  ctx.fillStyle = ink;
  ctx.font = `400 92px ${f.d}`;
  ctx.fillText("Built across Pakistan", 90, 170);
  ctx.fillStyle = soft;
  ctx.font = `400 40px ${f.s}`;
  const { spaces, cities: nCities } = catalogue();
  ctx.fillText(`${spaces} spaces in ${nCities} cities, from the HoS catalogue`, 94, 240);
  ctx.beginPath();
  PAKISTAN.forEach(([lo, la], i) => (i ? ctx.lineTo(px(lo), py(la)) : ctx.moveTo(px(lo), py(la))));
  ctx.closePath();
  ctx.fillStyle = night ? "rgba(243,236,226,.07)" : "rgba(35,28,24,.06)";
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = soft;
  ctx.stroke();
  for (const [name, n] of [...counts.entries()].sort((a, b) => a[1] - b[1])) {
    const at = CITY_AT[name];
    if (!at) continue;
    const x = px(at[0]), y = py(at[1]);
    const r = 9 + Math.sqrt(n) * 7;
    ctx.fillStyle = "rgba(255,90,31,.22)";
    ctx.beginPath();
    ctx.arc(x, y, r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.font = `500 40px ${f.s}`;
    const label = `${name}  ${n}`;
    // keep the four northern cities from colliding: alternate sides
    const left = name === "Lahore" || name === "Gujrat";
    ctx.textAlign = left ? "right" : "left";
    ctx.fillText(label, x + (left ? -r * 2.2 : r * 2.2), y + 14 + (name === "Gujrat" ? -26 : name === "Sialkot" ? 22 : 0));
    ctx.textAlign = "left";
  }
  return cv;
}

/** Floating courtyard panel: a few lines of the HoS story. */
export function storyCanvas(f: { d: string; s: string; l: string }, night: boolean) {
  const W = 1600, H = 1000;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d")!;
  const ink = night ? "#f3ece2" : "#231c18", soft = night ? "rgba(243,236,226,.7)" : "rgba(35,28,24,.68)";
  card(ctx, W, H, night);
  ctx.translate(40, 20);
  mark(ctx, 130, 50, 160, ink, f.l);
  ctx.fillStyle = ink;
  ctx.font = `400 132px ${f.d}`;
  ctx.fillText("Global thinking,", 60, 400);
  ctx.fillText("local insight.", 60, 540);
  ctx.fillStyle = soft;
  ctx.font = `400 44px ${f.s}`;
  wrap(ctx, "Design consultants to established brands across Pakistan. Every project is a dialogue between space, material and the people who use it.", 64, 660, 1380, 64);
  ctx.fillStyle = "#ff5a1f";
  ctx.font = `500 34px ${f.s}`;
  ctx.letterSpacing = "6px";
  ctx.fillText("HOUSE OF SULTANA · SINCE 2025", 64, 900);
  return cv;
}
