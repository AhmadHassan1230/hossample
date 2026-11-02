import * as THREE from "three";

/* Procedural textures, drawn once on canvases and cached. No downloaded assets. */

const cache = new Map<string, THREE.Texture>();
const once = <T extends THREE.Texture>(key: string, make: () => T): T => {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key) as T;
};

function mkCanvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function tex(c: HTMLCanvasElement, color = true, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (repeat) t.repeat.set(...repeat);
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Limewash plaster: soft cloudy mottling plus fine grain. */
export function plasterMap(base = "#e6cdbf", seed = 7) {
  return once(`plaster-${base}-${seed}`, () => {
    const [c, g] = mkCanvas(1024);
    const r = rng(seed);
    g.fillStyle = base;
    g.fillRect(0, 0, 1024, 1024);
    for (let i = 0; i < 420; i++) {
      const x = r() * 1024, y = r() * 1024, rad = 40 + r() * 220;
      const light = r() > 0.5;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      const a = 0.025 + r() * 0.05;
      grd.addColorStop(0, light ? `rgba(255,246,238,${a})` : `rgba(120,80,64,${a * 0.8})`);
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      for (const ox of [-1024, 0, 1024]) for (const oy of [-1024, 0, 1024]) {
        g.save();
        g.translate(ox, oy);
        g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
        g.restore();
      }
    }
    const img = g.getImageData(0, 0, 1024, 1024);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (r() - 0.5) * 9;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    g.putImageData(img, 0, 0);
    return tex(c);
  });
}

/** Grey noise used as a bump map (plaster, bouclé, concrete). */
export function noiseMap(scale = 1, seed = 3) {
  return once(`noise-${scale}-${seed}`, () => {
    const s = 512;
    const [c, g] = mkCanvas(s);
    const r = rng(seed);
    const img = g.createImageData(s, s);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 128 + (r() - 0.5) * 120 * scale;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    g.globalAlpha = 0.35;
    g.filter = "blur(1.2px)";
    g.drawImage(c, 0, 0);
    return tex(c, false);
  });
}

/** Herringbone oak floor. Planks L×W with L = 6W tile with period 2L. */
export function herringboneMap() {
  return once("herringbone", () => {
    const W = 64, L = W * 6, P = L * 2;
    const [c, g] = mkCanvas(P);
    const r = rng(11);
    const tones = ["#c99a6b", "#c39163", "#cfa274", "#bd8b5c", "#d3a97c", "#c49567"];
    const plank = (x: number, y: number, w: number, h: number, vertical: boolean) => {
      for (const ox of [-P, 0, P]) for (const oy of [-P, 0, P]) {
        const X = x + ox, Y = y + oy;
        if (X > P || Y > P || X + w < 0 || Y + h < 0) continue;
        g.fillStyle = tones[Math.floor(r() * tones.length)];
        g.fillRect(X, Y, w, h);
        // grain
        g.save();
        g.beginPath();
        g.rect(X, Y, w, h);
        g.clip();
        const lines = 7 + Math.floor(r() * 6);
        for (let k = 0; k < lines; k++) {
          g.strokeStyle = r() > 0.5 ? "rgba(110,66,34,0.16)" : "rgba(255,236,210,0.12)";
          g.lineWidth = 0.6 + r() * 1.4;
          g.beginPath();
          const off = r();
          const amp = 1 + r() * 3;
          const freq = 0.01 + r() * 0.02;
          if (vertical) {
            for (let t = 0; t <= h; t += 6) g.lineTo(X + off * w + Math.sin(t * freq + k) * amp, Y + t);
          } else {
            for (let t = 0; t <= w; t += 6) g.lineTo(X + t, Y + off * h + Math.sin(t * freq + k) * amp);
          }
          g.stroke();
        }
        g.restore();
        g.strokeStyle = "rgba(60,36,20,0.55)";
        g.lineWidth = 1.5;
        g.strokeRect(X + 0.75, Y + 0.75, w - 1.5, h - 1.5);
      }
    };
    // Lattice: a=(W,W), b=(L+W, W-L)
    for (let n = -3; n <= 3; n++) {
      for (let i = -26; i <= 26; i++) {
        const bx = n * (L + W) + i * W;
        const by = n * (W - L) + i * W;
        plank(bx, by, L, W, false);
        plank(bx + L, by + W - L, W, L, true);
      }
    }
    const t = tex(c);
    t.center.set(0.5, 0.5);
    t.rotation = Math.PI / 4;
    return t;
  });
}

/** Long oak grain for furniture. */
export function oakGrainMap(tone = "#c4925f", seed = 5) {
  return once(`oak-${tone}-${seed}`, () => {
    const [c, g] = mkCanvas(512);
    const r = rng(seed);
    g.fillStyle = tone;
    g.fillRect(0, 0, 512, 512);
    for (let k = 0; k < 90; k++) {
      g.strokeStyle = r() > 0.55 ? "rgba(90,52,26,0.13)" : "rgba(255,232,200,0.10)";
      g.lineWidth = 0.6 + r() * 2.2;
      g.beginPath();
      const y0 = r() * 512, amp = 2 + r() * 8, f = 0.004 + r() * 0.01, ph = r() * 6;
      for (let x = -10; x <= 522; x += 8) g.lineTo(x, y0 + Math.sin(x * f + ph) * amp);
      g.stroke();
    }
    return tex(c);
  });
}

/** Cane weave alpha (octagonal open weave, simplified). */
export function caneMap() {
  return once("cane", () => {
    const s = 256;
    const [c, g] = mkCanvas(s);
    g.fillStyle = "#000";
    g.fillRect(0, 0, s, s);
    g.strokeStyle = "#fff";
    g.lineCap = "round";
    const step = 32;
    g.lineWidth = 4.5;
    for (let i = -s; i <= s * 2; i += step) {
      for (const d of [0, 6]) {
        g.beginPath(); g.moveTo(i + d, 0); g.lineTo(i + d, s); g.stroke();
        g.beginPath(); g.moveTo(0, i + d); g.lineTo(s, i + d); g.stroke();
      }
      g.lineWidth = 3.5;
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i + s, s); g.stroke();
      g.beginPath(); g.moveTo(i + s, 0); g.lineTo(i, s); g.stroke();
      g.lineWidth = 4.5;
    }
    return tex(c, false);
  });
}

/** An architectural drawing on cartridge paper. */
export function drawingMap(seed = 2) {
  return once(`drawing-${seed}`, () => {
    const [c, g] = mkCanvas(768, 540);
    const r = rng(seed);
    g.fillStyle = "#f4efe6";
    g.fillRect(0, 0, 768, 540);
    g.strokeStyle = "rgba(48,64,84,0.75)";
    // outer walls
    g.lineWidth = 7;
    g.strokeRect(70, 60, 620, 400);
    g.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const x = 70 + r() * 620, y = 60 + r() * 400;
      g.beginPath();
      if (r() > 0.5) { g.moveTo(x, 60); g.lineTo(x, 60 + 120 + r() * 220); }
      else { g.moveTo(70, y); g.lineTo(70 + 160 + r() * 300, y); }
      g.stroke();
    }
    // doors
    g.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      const x = 100 + r() * 560, y = 90 + r() * 330;
      g.beginPath(); g.arc(x, y, 34, 0, Math.PI / 2); g.stroke();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 34, y); g.stroke();
    }
    // furniture blocks + hatch
    g.lineWidth = 1;
    for (let i = 0; i < 10; i++) g.strokeRect(100 + r() * 520, 90 + r() * 300, 30 + r() * 70, 20 + r() * 50);
    g.strokeStyle = "rgba(48,64,84,0.25)";
    for (let x = 70; x < 690; x += 9) { g.beginPath(); g.moveTo(x, 470); g.lineTo(x + 18, 488); g.stroke(); }
    // dimension lines
    g.strokeStyle = "rgba(160,70,50,0.6)";
    g.beginPath(); g.moveTo(70, 30); g.lineTo(690, 30); g.stroke();
    g.fillStyle = "rgba(48,64,84,0.8)";
    g.font = "16px monospace";
    g.fillText("GROUND FLOOR PLAN", 72, 515);
    return tex(c);
  });
}

/** Golden-hour sky seen through the windows. */
export function skyMap() {
  return once("sky", () => {
    const [c, g] = mkCanvas(64, 512);
    const grd = g.createLinearGradient(0, 512, 0, 0);
    grd.addColorStop(0, "#ffe2b8");
    grd.addColorStop(0.35, "#ffd6a6");
    grd.addColorStop(0.7, "#f3ddc6");
    grd.addColorStop(1, "#c9d3d8");
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 512);
    const t = tex(c);
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  });
}

/** Leaf canopy silhouette: used as an invisible shadow caster (dappled light). */
export function leavesMap() {
  return once("leaves", () => {
    const s = 1024;
    const [c, g] = mkCanvas(s);
    const r = rng(19);
    g.fillStyle = "#000";
    g.fillRect(0, 0, s, s);
    g.fillStyle = "#fff";
    g.strokeStyle = "#fff";
    // branches (alphaMap reads the green channel: white = solid)
    for (let b = 0; b < 9; b++) {
      let x = r() * s, y = s + 20, a = -Math.PI / 2 + (r() - 0.5) * 0.9;
      g.lineWidth = 5 + r() * 6;
      g.beginPath();
      g.moveTo(x, y);
      for (let k = 0; k < 14; k++) {
        a += (r() - 0.5) * 0.5;
        x += Math.cos(a) * 60;
        y += Math.sin(a) * 60;
        g.lineTo(x, y);
        g.lineWidth *= 0.92;
      }
      g.stroke();
    }
    // leaves (clustered toward the top)
    for (let i = 0; i < 2600; i++) {
      const cx = r() * s, cy = Math.pow(r(), 1.6) * s * 0.95;
      g.save();
      g.translate(cx, cy);
      g.rotate(r() * Math.PI * 2);
      g.beginPath();
      g.ellipse(0, 0, 9 + r() * 12, 3.5 + r() * 4, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  });
}

/** Painted lettering for the identity wall (uses the site's display font). */
export function letterMap(char: string) {
  return once(`letter-${char}`, () => {
    const [c, g] = mkCanvas(512);
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-logo").trim() || "serif";
    g.clearRect(0, 0, 512, 512);
    g.fillStyle = "#fff";
    g.textAlign = "center";
    g.textBaseline = "alphabetic";
    g.font = `500 ${char === "o" ? 150 : 440}px ${family}`;
    g.fillText(char, 256, char === "o" ? 300 : 440);
    const t = new THREE.CanvasTexture(c);
    t.needsUpdate = true;
    return t;
  });
}

/** Blue-and-white porcelain pattern for a lathe vase. */
export function porcelainMap() {
  return once("porcelain", () => {
    const [c, g] = mkCanvas(512, 256);
    const r = rng(23);
    g.fillStyle = "#f2efe8";
    g.fillRect(0, 0, 512, 256);
    g.strokeStyle = "#2f4f8a";
    g.fillStyle = "#2f4f8a";
    for (let i = 0; i < 40; i++) {
      const x = r() * 512, y = 40 + r() * 170, rad = 6 + r() * 16;
      g.lineWidth = 2;
      g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.stroke();
      for (let p = 0; p < 6; p++) {
        const a = (p / 6) * Math.PI * 2;
        g.beginPath(); g.ellipse(x + Math.cos(a) * rad, y + Math.sin(a) * rad, rad * 0.5, rad * 0.25, a, 0, Math.PI * 2); g.fill();
      }
    }
    g.fillRect(0, 0, 512, 14);
    g.fillRect(0, 238, 512, 18);
    return tex(c);
  });
}
