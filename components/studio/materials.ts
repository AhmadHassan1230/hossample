import * as THREE from "three";

/* Rebuilds every Blender surface for the browser from public/studio/materials.json
   (written by tools/blender/export_web.py) and wires in the baked day / night lightmaps. */

export type Desc = {
  k: "flat" | "scan" | "lime" | "ashlar" | "image" | "glass" | "ph";
  color?: string; rough?: number; metal?: number; strength?: number; trans?: number; coat?: number;
  emit?: string | number | null;   // flat / ph: emissive colour; image: emissive strength
  set?: string; tint?: string; tile?: number;
  var?: string; scale?: number; bump?: number;
  c1?: string; c2?: string; mortar?: string; bw?: number; rh?: number;
  src?: string; map?: string; arm?: string; normal?: string; alphaTest?: boolean;
  lattice?: [number, number, number];
  ramp?: [string, string, number, number];
  glow?: [number, number];
};

export type Lightmap = { day: THREE.Texture; night: THREE.Texture; sDay: number; sNight: number };

/** One uniform drives the whole room from afternoon (0) to blue hour (1). */
export const NIGHT = { value: 0 };
export const glowing: THREE.MeshStandardMaterial[] = [];

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();

const copies = new Map<string, THREE.Texture[]>();   // per image: every repeat variant, refreshed on load

export function tex(url: string, srgb: boolean, repeat = 1) {
  const key = `${url}|${srgb}|${repeat}`;
  let t = cache.get(key);
  if (!t) {
    const id = `${url}|${srgb}`;
    if (!copies.has(id)) {
      copies.set(id, []);
      loader.load(url, (loaded) => {
        for (const c of copies.get(id)!) {
          c.image = loaded.image;
          c.needsUpdate = true;
        }
      });
    }
    t = new THREE.Texture();
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.flipY = false;   // glTF UV convention
    t.repeat.set(repeat, repeat);
    copies.get(id)!.push(t);
    cache.set(key, t);
  }
  return t;
}

const scanUrl = (set: string, kind: "diff" | "nor" | "arm") => `/studio/tex/${set}/${kind}.jpg`;   // tools/web_textures.mjs

/* ---------------------------------------------------------------- procedural surfaces → canvas tiles */
function rng(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

/** Periodic fractal value noise in [0,1] (tiles seamlessly). */
function noise(size: number, cells: number, octaves: number, seed: number) {
  const out = new Float32Array(size * size);
  let amp = 1, norm = 0;
  for (let o = 0; o < octaves; o++) {
    const c = cells << o;
    const r = rng(seed + o * 101);
    const grid = new Float32Array(c * c).map(() => r());
    for (let y = 0; y < size; y++) {
      const gy = (y / size) * c, y0 = Math.floor(gy), ty = gy - y0, sy = ty * ty * (3 - 2 * ty);
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * c, x0 = Math.floor(gx), tx = gx - x0, sx = tx * tx * (3 - 2 * tx);
        const a = grid[(y0 % c) * c + (x0 % c)], b = grid[(y0 % c) * c + ((x0 + 1) % c)];
        const d = grid[((y0 + 1) % c) * c + (x0 % c)], e = grid[((y0 + 1) % c) * c + ((x0 + 1) % c)];
        out[y * size + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (d + (e - d) * sx) * sy);
      }
    }
    norm += amp;
    amp *= 0.55;
  }
  for (let i = 0; i < out.length; i++) out[i] /= norm;
  return out;
}

/** Canvas pixels are sRGB: read colours back out of three's linear working space. */
const srgbOf = (c: THREE.Color) => c.getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);

function canvasTexture(w: number, h: number, paint: (img: ImageData) => void, srgb = true) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  const img = ctx.createImageData(w, h);
  paint(img);
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  t.flipY = false;
  return t;
}

/** Lime plaster: soft cloudy variation between two tones, tiled every 4 m. */
function limeTexture(d: Desc) {
  const N = 512;
  const n = noise(N, 5, 4, 7);
  const a = srgbOf(new THREE.Color(d.var)), b = srgbOf(new THREE.Color(d.color));
  const t = canvasTexture(N, N, (img) => {
    for (let i = 0; i < N * N; i++) {
      const f = Math.min(1, Math.max(0, (n[i] - 0.35) / 0.3));
      img.data[i * 4] = ((a.r + (b.r - a.r) * f) * 255) | 0;
      img.data[i * 4 + 1] = ((a.g + (b.g - a.g) * f) * 255) | 0;
      img.data[i * 4 + 2] = ((a.b + (b.b - a.b) * f) * 255) | 0;
      img.data[i * 4 + 3] = 255;
    }
  });
  t.repeat.set(1 / 4, 1 / 4);
  return t;
}

/** Dressed ashlar: 2 blocks × 4 courses per tile, per-block tone, lime joints, grain + bedding. */
function ashlarTextures(d: Desc) {
  const bw = d.bw ?? 0.9, rh = d.rh ?? 0.42;
  const TW = bw * 2, TH = rh * 4, PX = 600;   // px per metre
  const W = Math.round(TW * PX), H = Math.round(TH * PX);
  const r = rng(11);
  const c1 = new THREE.Color(d.c1), c2 = new THREE.Color(d.c2), cm = new THREE.Color(d.mortar);
  const tones = [0, 1, 2, 3].map(() => [0, 1, 2].map(() => srgbOf(c1.clone().lerp(c2, r()).multiplyScalar(0.94 + r() * 0.1))));
  const mortar = srgbOf(cm);
  const grain = noise(512, 8, 4, 3);
  const joint = 0.0035 * PX;
  const heights = new Float32Array(W * H);
  const color = canvasTexture(W, H, (img) => {
    for (let y = 0; y < H; y++) {
      const row = Math.floor(y / (rh * PX)), yin = y - row * rh * PX;
      const off = row % 2 ? bw * PX * 0.5 : 0;
      const bedding = 0.97 + 0.03 * Math.sin((y / PX) * 21 + Math.sin((y / PX) * 3.1) * 2);
      for (let x = 0; x < W; x++) {
        const xs = (x + off) % W, col = Math.floor(xs / (bw * PX)), xin = xs - col * bw * PX;
        const m = yin < joint || xin < joint;
        const g = 0.86 + 0.24 * grain[(y % 512) * 512 + (x % 512)];
        const c = m ? mortar : tones[row][col % 2];
        const k = m ? 1 : g * bedding;
        const i = (y * W + x) * 4;
        img.data[i] = Math.min(255, c.r * k * 255);
        img.data[i + 1] = Math.min(255, c.g * k * 255);
        img.data[i + 2] = Math.min(255, c.b * k * 255);
        img.data[i + 3] = 255;
        heights[y * W + x] = m ? 0 : 0.8 + 0.2 * g;
      }
    }
  });
  const bump = canvasTexture(W, H, (img) => {
    for (let i = 0; i < W * H; i++) {
      const v = heights[i] * 255;
      img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
      img.data[i * 4 + 3] = 255;
    }
  }, false);
  for (const t of [color, bump]) t.repeat.set(1 / TW, 1 / TH);
  return { color, bump };
}

/* ---------------------------------------------------------------- shader patches */
type Patch = { lm?: Lightmap; lattice?: [number, number, number]; ramp?: Desc["ramp"] };

function patch(m: THREE.MeshStandardMaterial, p: Patch) {
  const key: string[] = [];
  if (p.lm) key.push("lm");
  if (p.lattice) key.push("lat" + p.lattice.join(","));
  if (p.ramp) key.push("ramp");
  if (!key.length) return;
  if (p.lattice) {
    m.alphaTest = 0.5;
    m.side = THREE.DoubleSide;
  }
  m.customProgramCacheKey = () => key.join("|");
  m.onBeforeCompile = (s) => {
    s.uniforms.uNight = NIGHT;
    if (p.lattice) {
      s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vUv0;").replace("#include <uv_vertex>", "#include <uv_vertex>\nvUv0 = uv;");
      const [freq, width, fam] = p.lattice;
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vUv0;")
        .replace(
          "#include <alphatest_fragment>",
          `{ float solid = 0.0;
             for (int k = 0; k < ${fam}; k++) {
               float a = float(k) * PI / ${fam.toFixed(1)};
               float t = dot(vUv0, vec2(cos(a), sin(a))) * ${freq.toFixed(3)};
               float pp = 0.5 - abs(fract(t) - 0.5);
               solid = max(solid, step(pp, ${width.toFixed(4)}));
             }
             diffuseColor.a = solid; }
           #include <alphatest_fragment>`,
        );
    }
    if (p.ramp) {
      const [lo, hi, p0, p1] = p.ramp;
      const L = new THREE.Color(lo), H = new THREE.Color(hi);
      s.fragmentShader = s.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
         { float lum = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
           diffuseColor.rgb = mix(vec3(${L.r.toFixed(4)}, ${L.g.toFixed(4)}, ${L.b.toFixed(4)}), vec3(${H.r.toFixed(4)}, ${H.g.toFixed(4)}, ${H.b.toFixed(4)}), smoothstep(${p0.toFixed(3)}, ${p1.toFixed(3)}, lum)); }`,
      );
    }
    if (p.lm) {
      s.uniforms.lmNight = { value: p.lm.night };
      s.uniforms.lmScale = { value: new THREE.Vector2(p.lm.sDay, p.lm.sNight) };
      s.fragmentShader = s.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D lmNight;\nuniform vec2 lmScale;\nuniform float uNight;")
        .replace(
          "#include <lights_fragment_maps>",
          THREE.ShaderChunk.lights_fragment_maps
            .replace(
              /vec4 lightMapTexel[\s\S]*?irradiance \+= lightMapIrradiance;/,
              `vec3 lmDay = pow(texture2D(lightMap, vLightMapUv).rgb, vec3(2.2)) * lmScale.x * vec3(1.03, 1.0, 0.95);   // Lahore daylight, a touch warm
               vec3 lmNgt = pow(texture2D(lmNight, vLightMapUv).rgb, vec3(2.2)) * lmScale.y;
               lmNgt = mix(vec3(dot(lmNgt, vec3(0.2126, 0.7152, 0.0722))), lmNgt, 0.6);   // dusk, not salmon
               vec3 lmLight = mix(lmDay, lmNgt, uNight);
               irradiance += lmLight * PI;`,
            )
            .replace("iblIrradiance += getIBLIrradiance( geometryNormal );", "")
            // reflections fade where the bake says it is dark (cheap specular occlusion)
            .replace("radiance += iblRadiance;", "radiance += iblRadiance * mix(0.1, 0.85, smoothstep(0.0, 0.6, dot(lmLight, vec3(0.3333))));"),
        );
    }
  };
}

/* ---------------------------------------------------------------- descriptor → material */
export function makeMaterial(name: string, desc: Desc, lm?: Lightmap): THREE.Material {
  let d = desc;
  let m: THREE.MeshStandardMaterial;
  const physical = (d.coat ?? 0) > 0 || d.k === "glass";
  m = physical ? new THREE.MeshPhysicalMaterial() : new THREE.MeshStandardMaterial();
  m.name = name;
  switch (d.k) {
    case "flat": {
      m.color.set(d.color ?? "#ffffff");
      m.roughness = d.rough ?? 0.6;
      m.metalness = d.metal ?? 0;
      if (/brass/.test(name)) {
        // the room probe is pale stone: keep brass gold rather than mirror-white
        m.color.set("#b7863e");
        m.roughness = 0.3;
        m.envMapIntensity = 0.75;
      }
      if (typeof d.emit === "string") {
        m.emissive.set(d.emit);
        m.emissiveIntensity = d.strength ?? 0;
      }
      if ((d.trans ?? 0) > 0) m.roughness = Math.min(m.roughness, 0.05);
      break;
    }
    case "scan": {
      const rep = 1 / (d.tile ?? 1);
      m.map = tex(scanUrl(d.set!, "diff"), true, rep);
      m.normalMap = tex(scanUrl(d.set!, "nor"), false, rep);
      m.normalScale.set(0.6, 0.6);
      m.roughnessMap = tex(scanUrl(d.set!, "arm"), false, rep);
      m.roughness = d.rough ?? 1;
      m.metalness = 0;
      m.color.set(d.tint ?? "#ffffff");
      break;
    }
    case "lime": {
      m.map = limeTexture(d);
      m.normalMap = tex(scanUrl("white_plaster_02", "nor"), false, 1 / 1.5);
      m.normalScale.set(0.25, 0.25);
      m.roughness = 0.88;
      break;
    }
    case "ashlar": {
      const { color, bump } = ashlarTextures(d);
      m.map = color;
      m.bumpMap = bump;
      m.bumpScale = 1.2;
      m.roughness = 0.72;
      break;
    }
    case "image": {
      // prints and screens: matte, evenly lit as if under the gallery spots (no baked blotches)
      m.map = tex(d.src!, true);
      m.roughness = 1;
      m.envMapIntensity = 0.45;
      m.emissiveMap = m.map;
      m.emissive.set("#ffffff");
      const screen = typeof d.emit === "number" && d.emit > 0;
      d = { ...d, glow: screen ? d.glow ?? [d.emit as number, 2.4] : [0.5, 0.32] };
      break;
    }
    case "glass": {
      const g = m as THREE.MeshPhysicalMaterial;
      g.color.set(d.tint ?? "#ffffff");
      g.roughness = 0;
      g.metalness = 0;
      g.transparent = true;
      g.opacity = 0.04;   // architectural glazing: you see the glints, not a veil
      g.envMapIntensity = 0.35;
      g.depthWrite = false;
      break;
    }
    case "ph": {
      if (d.map) m.map = tex(d.map, true);
      else m.color.set(d.color ?? "#ffffff");
      if (d.arm) {
        m.roughnessMap = tex(d.arm, false);
        m.metalnessMap = m.roughnessMap;
      }
      if (d.normal) m.normalMap = tex(d.normal, false);
      m.roughness = d.rough ?? 1;
      m.metalness = d.metal ?? 0;
      if (d.alphaTest) {
        m.alphaTest = 0.5;
        m.side = THREE.DoubleSide;
      }
      if (typeof d.emit === "string") {
        m.emissive.set(d.emit);
        m.emissiveIntensity = d.strength ?? 1;
      }
      break;
    }
  }
  if (physical && (d.coat ?? 0) > 0) {
    // a probe from the room centre over-reflects on big floors: keep the polish, lose the haze
    const p = m as THREE.MeshPhysicalMaterial;
    p.clearcoat = Math.min(d.coat!, 0.2);
    p.clearcoatRoughness = 0.08;
  }
  if (d.lattice && m.metalness > 0.5) m.envMapIntensity = 0.35;   // the perforated vault reflectors
  if (name === "marble_floor") m.envMapIntensity = 0.5;   // honed marble: the sky reflection read blue and blew out by the arcades
  if (lm) {
    m.lightMap = lm.day;
    m.lightMap.channel = 1;
  }
  if (d.glow) {
    m.userData.glow = d.glow;
    glowing.push(m);
  }
  patch(m, { lm, lattice: d.lattice, ramp: d.ramp });
  return m;
}

/** Called every frame: emissive surfaces follow the day/night uniform. */
export function updateGlow() {
  for (const m of glowing) {
    const [d, n] = m.userData.glow as [number, number];
    m.emissiveIntensity = d + (n - d) * NIGHT.value;
  }
}
