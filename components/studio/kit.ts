import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { glowing } from "./materials";

/* Shared bits for the pieces made in the browser: model-making materials, canvas textures,
   soft contact shadows, and a tiny geometry builder that merges boxes per material. */

export const MAT = {
  card: new THREE.MeshStandardMaterial({ color: "#f3efe7", roughness: 0.9 }),
  cardWarm: new THREE.MeshStandardMaterial({ color: "#e9e2d6", roughness: 0.9 }),
  basswood: new THREE.MeshStandardMaterial({ color: "#d6bc93", roughness: 0.8 }),
  walnut: new THREE.MeshStandardMaterial({ color: "#5b3a26", roughness: 0.55 }),
  ink: new THREE.MeshStandardMaterial({ color: "#2b2420", roughness: 0.7 }),
  brass: new THREE.MeshStandardMaterial({ color: "#c9a063", roughness: 0.28, metalness: 1 }),
  acrylic: new THREE.MeshPhysicalMaterial({ color: "#eef6f6", roughness: 0.05, transparent: true, opacity: 0.28, depthWrite: false }),
  water: new THREE.MeshStandardMaterial({ color: "#3d6f86", roughness: 0.1, metalness: 0.1 }),
  leaf: new THREE.MeshStandardMaterial({ color: "#6f8f4a", roughness: 0.85 }),
  sage: new THREE.MeshStandardMaterial({ color: "#a9b48f", roughness: 0.85 }),
};

/** An emissive material that follows the day/night blend (day, night intensity). */
export function glowMat(color: string, day: number, night: number, extra: THREE.MeshStandardMaterialParameters = {}) {
  const m = new THREE.MeshStandardMaterial({ color: "#111", emissive: new THREE.Color(color), emissiveIntensity: day, roughness: 0.6, ...extra });
  m.userData.glow = [day, night];
  glowing.push(m);
  return m;
}

export function canvas(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void, srgb = true) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  paint(cv.getContext("2d")!);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}

let shadowTex: THREE.Texture | null = null;
/** A soft round contact shadow (multiply-ish dark blob) to sit new pieces on the baked floor. */
export function contactShadow(w: number, d: number, opacity = 0.45) {
  shadowTex ??= canvas(128, 128, (ctx) => {
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, "rgba(0,0,0,1)");
    g.addColorStop(0.55, "rgba(0,0,0,.55)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity, depthWrite: false, color: "#000" }));
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

/** Collect boxes / custom geometries per material, then merge into one mesh per material. */
export class Builder {
  parts = new Map<THREE.Material, THREE.BufferGeometry[]>();
  add(mat: THREE.Material, geo: THREE.BufferGeometry) {
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat)!.push(geo);
    return geo;
  }
  box(mat: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number, ry = 0) {
    const g = new THREE.BoxGeometry(sx, sy, sz);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    return this.add(mat, g);
  }
  cyl(mat: THREE.Material, r: number, h: number, x: number, y: number, z: number, seg = 16) {
    const g = new THREE.CylinderGeometry(r, r, h, seg);
    g.translate(x, y, z);
    return this.add(mat, g);
  }
  sphere(mat: THREE.Material, r: number, x: number, y: number, z: number, sy = 1) {
    const g = new THREE.IcosahedronGeometry(r, 2);
    g.scale(1, sy, 1);
    g.translate(x, y, z);
    return this.add(mat, g);
  }
  build() {
    const group = new THREE.Group();
    for (const [mat, geos] of this.parts) {
      const merged = mergeGeometries(geos.map((g) => (g.index ? g.toNonIndexed() : g)), false);
      if (!merged) continue;
      merged.computeVertexNormals();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.raycast = () => {};
      group.add(mesh);
    }
    return group;
  }
}
