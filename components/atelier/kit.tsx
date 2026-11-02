"use client";
import * as THREE from "three";
import type { ThreeElements } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { caneMap, porcelainMap } from "./textures";

/* Materials for the dark studio. Surfaces use CC0 scans from Poly Haven
   (public/assets/ph, see docs). Built once inside <MaterialKit>, read anywhere via mats(). */

const PH = "/assets/ph";
const SETS = ["herringbone_parquet", "plastered_wall_04", "white_stucco", "oak_veneer_01", "wool_boucle", "rough_linen", "terrazzo_tiles"] as const;
type SetName = (typeof SETS)[number];
export const TEXTURE_URLS = SETS.flatMap((s) => [`${PH}/${s}/diff.jpg`, `${PH}/${s}/nor.jpg`, `${PH}/${s}/arm.jpg`]);

type PBR = { map: THREE.Texture; normalMap: THREE.Texture; arm: THREE.Texture };

function clone(t: THREE.Texture, rx: number, ry = rx, rot = 0) {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(rx, ry);
  if (rot) {
    c.center.set(0.5, 0.5);
    c.rotation = rot;
  }
  c.anisotropy = 8;
  c.needsUpdate = true;
  return c;
}

/** A PBR set at a given tiling, as MeshStandard/Physical params. */
export function pbr(set: PBR, rx: number, ry = rx, rot = 0, normal = 1) {
  const arm = clone(set.arm, rx, ry, rot);
  return {
    map: clone(set.map, rx, ry, rot),
    normalMap: clone(set.normalMap, rx, ry, rot),
    normalScale: new THREE.Vector2(normal, normal),
    aoMap: arm,
    roughnessMap: arm,
    metalnessMap: arm,
  };
}

let M: ReturnType<typeof build> | null = null;
export let SETS_LOADED: Record<SetName, PBR> | null = null;

function build(s: Record<SetName, PBR>) {
  const std = (p: THREE.MeshStandardMaterialParameters) => new THREE.MeshStandardMaterial(p);
  const phys = (p: THREE.MeshPhysicalMaterialParameters) => new THREE.MeshPhysicalMaterial(p);
  return {
    // charcoal limewash: scanned plaster, multiplied dark
    wall: std({ ...pbr(s.plastered_wall_04, 0.45), color: "#5b514c", roughness: 1, metalness: 0, aoMapIntensity: 0.6 }),
    wallBox: std({ ...pbr(s.plastered_wall_04, 1.2), color: "#5b514c", roughness: 1, metalness: 0 }),
    ceiling: std({ ...pbr(s.white_stucco, 0.4), color: "#3d3633", roughness: 1, metalness: 0 }),
    oak: std({ ...pbr(s.oak_veneer_01, 1, 1), color: "#a77d55", roughness: 0.9, metalness: 0 }),
    oakLight: std({ ...pbr(s.oak_veneer_01, 1, 1, Math.PI / 2), color: "#c79c72", roughness: 1, metalness: 0 }),
    sheesham: std({ ...pbr(s.oak_veneer_01, 1, 1), color: "#6e3a22", roughness: 0.75, metalness: 0 }),
    walnut: std({ ...pbr(s.oak_veneer_01, 1, 1), color: "#4a2e1f", roughness: 0.8, metalness: 0 }),
    beam: std({ ...pbr(s.oak_veneer_01, 1, 6, Math.PI / 2), color: "#5a3f2c", roughness: 1, metalness: 0 }),
    boucle: std({ ...pbr(s.wool_boucle, 2.5), color: "#efe6da", roughness: 1, metalness: 0, normalScale: new THREE.Vector2(1.6, 1.6) }),
    linen: std({ ...pbr(s.rough_linen, 4), color: "#6d5f53", roughness: 1, metalness: 0 }),
    rug: std({ ...pbr(s.rough_linen, 5), color: "#8a786a", roughness: 1, metalness: 0 }),
    terrazzo: std({ ...pbr(s.terrazzo_tiles, 0.8), color: "#d8cfc4", roughness: 0.7, metalness: 0 }),
    travertine: std({ ...pbr(s.terrazzo_tiles, 0.6), color: "#8f8274", roughness: 0.8, metalness: 0 }),
    concrete: std({ ...pbr(s.white_stucco, 1), color: "#5e5852", roughness: 1, metalness: 0 }),
    stucco: std({ ...pbr(s.white_stucco, 0.8), color: "#b9aea4", roughness: 1, metalness: 0 }),
    steelBlack: std({ color: "#141211", roughness: 0.42, metalness: 0.8 }),
    steel: std({ color: "#a9a49d", roughness: 0.28, metalness: 1 }),
    brass: std({ color: "#c49a58", roughness: 0.26, metalness: 1 }),
    card: std({ color: "#ece6dc", roughness: 0.85 }),
    paper: std({ color: "#efe9df", roughness: 0.9 }),
    brick: std({ ...pbr(s.white_stucco, 0.3), color: "#8e4a31", roughness: 1, metalness: 0 }),
    rose: std({ color: "#b07766", roughness: 0.85 }),
    clay: std({ color: "#a45f43", roughness: 0.85 }),
    cork: std({ ...pbr(s.rough_linen, 2), color: "#9a7452", roughness: 1, metalness: 0 }),
    leaf: std({ color: "#4d6338", roughness: 0.7, side: THREE.DoubleSide }),
    leafDark: std({ color: "#3a4b2a", roughness: 0.75, side: THREE.DoubleSide }),
    ink: std({ color: "#191513", roughness: 0.55 }),
    leather: std({ color: "#1b1512", roughness: 0.5 }),
    cane: std({ color: "#c9a26c", alphaMap: (() => { const t = caneMap().clone(); t.repeat.set(6, 2); t.needsUpdate = true; return t; })(), alphaTest: 0.5, roughness: 0.75, side: THREE.DoubleSide }),
    porcelain: phys({ map: porcelainMap(), roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.08 }),
    ceramicCream: phys({ color: "#e6ddd0", roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.2 }),
    ceramicBand: phys({ color: "#5c3c29", roughness: 0.75 }),
    glass: phys({ color: "#b8c3c6", roughness: 0.04, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.5 }),
    mirror: std({ color: "#cfcac3", roughness: 0.03, metalness: 1 }),
    screen: std({ color: "#0b0a09", roughness: 0.2, metalness: 0.3 }),
    softbox: std({ color: "#fff6ea", emissive: "#fff0dc", emissiveIntensity: 3.5, roughness: 1 }),
    lampShade: std({ color: "#f3e3cf", emissive: "#ffb46e", emissiveIntensity: 1.6, roughness: 1, side: THREE.DoubleSide }),
    bulb: std({ color: "#fff", emissive: "#ffc98a", emissiveIntensity: 9 }),
    sweep: std({ ...pbr(s.white_stucco, 1.2), color: "#bdb2a8", roughness: 1, metalness: 0, side: THREE.DoubleSide }),
    neon: std({ color: "#ffd8b8", emissive: "#ff5414", emissiveIntensity: 7.5, roughness: 0.3 }),
    neonOff: std({ color: "#3a2a2e", roughness: 0.3, transparent: true, opacity: 0.6 }),
  };
}

export function mats() {
  if (!M) throw new Error("mats() called before <MaterialKit> loaded");
  return M;
}
export type Mats = ReturnType<typeof build>;

/** Loads every scanned texture (suspends), builds the materials, then renders children. */
export function MaterialKit({ children }: { children: React.ReactNode }) {
  const tex = useTexture(TEXTURE_URLS);
  if (!M) {
    const sets = {} as Record<SetName, PBR>;
    SETS.forEach((name, i) => {
      const [map, normalMap, arm] = tex.slice(i * 3, i * 3 + 3);
      map.colorSpace = THREE.SRGBColorSpace;
      sets[name] = { map, normalMap, arm };
    });
    SETS_LOADED = sets;
    M = build(sets);
    // material names survive the glTF round trip through Blender (lightmap bake)
    for (const [key, mat] of Object.entries(M)) (mat as THREE.Material).name = key;
  }
  return <>{children}</>;
}

type MeshProps = Omit<ThreeElements["mesh"], "args">;

const boxCache = new Map<string, THREE.BufferGeometry>();
/** Bevelled box geometry (real objects catch light on their edges), cached by size. */
export function boxGeo(w: number, h: number, d: number) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = boxCache.get(key);
  if (!g) {
    const r = Math.min(0.008, Math.min(w, h, d) * 0.22);
    g = new RoundedBoxGeometry(w, h, d, 2, r);
    boxCache.set(key, g);
  }
  return g;
}

/** Box with shadows. size = [w, h, d]; position is the box centre. */
export function B({ size, m, ...p }: { size: [number, number, number]; m: THREE.Material } & MeshProps) {
  return <mesh castShadow receiveShadow material={m} geometry={boxGeo(...size)} {...p} />;
}

/** Cylinder: [radiusTop, radiusBottom, height, segments]. */
export function C({ args, m, ...p }: { args: [number, number, number, number?]; m: THREE.Material } & MeshProps) {
  return (
    <mesh castShadow receiveShadow material={m} {...p}>
      <cylinderGeometry args={[args[0], args[1], args[2], args[3] ?? 32]} />
    </mesh>
  );
}

/** Lathe from a profile of [radius, height] points. */
export function Lathe({ profile, m, segments = 64, ...p }: { profile: [number, number][]; m: THREE.Material; segments?: number } & MeshProps) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  return (
    <mesh castShadow receiveShadow material={m} {...p}>
      <latheGeometry args={[pts, segments]} />
    </mesh>
  );
}
