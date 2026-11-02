"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Builder, MAT, contactShadow, glowMat } from "./kit";

/* Architecture's hero piece, on the trestle table: a study model on a slow turntable — a twisting
   tower of 46 timber-finned floor plates over a terraced podium, with a gridded second tower,
   contour terrain, trees and scale figures. Floors glow at night. Built in the browser. */

export const HERO_AT = new THREE.Vector3(-6.6, 0.858, -9.4);
export const HERO_BOX = { center: [-6.6, 1.35, -9.4] as const, size: [1.45, 1.1, 1.4] as const };

function rounded(w: number, d: number, r: number) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -d / 2);
  s.lineTo(w / 2 - r, -d / 2);
  s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
  s.lineTo(w / 2, d / 2 - r);
  s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
  s.lineTo(-w / 2 + r, d / 2);
  s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
  s.lineTo(-w / 2, -d / 2 + r);
  s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
  return s;
}

function buildHero() {
  const b = new Builder();
  const glow = glowMat("#ffd7a1", 0.18, 2.4);
  const R = 0.56;
  // turntable: walnut disc with a brass rim
  b.cyl(MAT.walnut, R, 0.03, 0, 0.015, 0, 64);
  const rim = new THREE.TorusGeometry(R, 0.006, 8, 96);
  rim.rotateX(Math.PI / 2);
  rim.translate(0, 0.03, 0);
  b.add(MAT.brass, rim);
  b.cyl(MAT.cardWarm, R - 0.02, 0.004, 0, 0.032, 0, 64);
  // contour terrain round the back half of the disc
  for (let k = 0; k < 6; k++) {
    const pts: THREE.Vector2[] = [];
    const r0 = 0.5 - k * 0.045;
    for (let i = 0; i <= 40; i++) {
      const a = Math.PI * 0.15 + (i / 40) * Math.PI * 0.95;
      const rr = r0 * (1 + 0.06 * Math.sin(a * 5 + k));
      pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    for (let i = 40; i >= 0; i--) {
      const a = Math.PI * 0.15 + (i / 40) * Math.PI * 0.95;
      const rr = (r0 - 0.09) * (1 + 0.05 * Math.sin(a * 4 - k));
      pts.push(new THREE.Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
    }
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: 0.01, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    g.translate(0, 0.034 + k * 0.01, 0);
    b.add(MAT.basswood, g);
  }
  // the twisting tower: plates, fins, glazing, glowing floors
  const base = 0.036, N = 46, step = 0.0158, W = 0.25, D = 0.17;
  const plateGeo = new THREE.ExtrudeGeometry(rounded(W, D, 0.05), { depth: 0.004, bevelEnabled: false });
  plateGeo.rotateX(-Math.PI / 2);
  for (let i = 0; i <= N; i++) {
    const y = base + i * step, rot = i * 0.034, taper = 1 - (i / N) * 0.18;
    const p = plateGeo.clone();
    p.scale(taper, 1, taper);
    p.rotateY(rot);
    p.translate(0.06, y, 0.05);
    b.add(MAT.card, p);
    if (i === N) break;
    // glass band and a warm floor strip inside it
    const gl = new THREE.ExtrudeGeometry(rounded(W * taper - 0.02, D * taper - 0.02, 0.04), { depth: step - 0.004, bevelEnabled: false });
    gl.rotateX(-Math.PI / 2);
    gl.rotateY(rot);
    gl.translate(0.06, y + 0.004, 0.05);
    b.add(MAT.acrylic, gl);
    const fl = new THREE.BoxGeometry(W * taper * 0.62, 0.0025, D * taper * 0.55);
    fl.rotateY(rot);
    fl.translate(0.06, y + 0.006, 0.05);
    b.add(glow, fl);
    // timber fins around the perimeter, turning with the floor
    for (let f = 0; f < 26; f++) {
      const a = (f / 26) * Math.PI * 2;
      const fx = Math.cos(a) * (W * taper) / 2, fz = Math.sin(a) * (D * taper) / 2;
      const fin = new THREE.BoxGeometry(0.003, step, 0.014);
      fin.rotateY(-a);
      fin.translate(fx, 0, fz);
      fin.rotateY(rot);
      fin.translate(0.06, y + step / 2 + 0.002, 0.05);
      b.add(MAT.basswood, fin);
    }
  }
  b.cyl(MAT.basswood, 0.02, base + N * step + 0.04, 0.06, (base + N * step + 0.04) / 2, 0.05, 12);   // core + spire
  // second tower: a gridded slab
  const tx = -0.2, tz = -0.1, th = 0.42;
  for (let i = 0; i < 24; i++) b.box(MAT.card, 0.13, 0.003, 0.09, tx, base + i * (th / 24), tz);
  b.box(MAT.acrylic, 0.12, th, 0.08, tx, base + th / 2, tz);
  for (let i = 0; i < 9; i++) {
    b.box(MAT.card, 0.003, th, 0.003, tx - 0.06 + i * 0.015, base + th / 2, tz + 0.041);
    b.box(MAT.card, 0.003, th, 0.003, tx - 0.06 + i * 0.015, base + th / 2, tz - 0.041);
  }
  for (let i = 0; i < 24; i += 2) b.add(glow, new THREE.BoxGeometry(0.1, 0.002, 0.06).translate(tx, base + i * (th / 24) + 0.006, tz));
  // terraced podium with green roofs
  const steps: [number, number, number, number, number][] = [
    [0.05, 0.05, 0.42, 0.3, 0.05], [0.02, 0.18, 0.3, 0.2, 0.09], [0.28, -0.14, 0.18, 0.16, 0.07], [-0.3, 0.16, 0.2, 0.14, 0.05], [0.26, 0.2, 0.14, 0.12, 0.11],
  ];
  for (const [x, z, w, d, h] of steps) {
    b.box(MAT.card, w, h, d, x, base + h / 2, z);
    b.box(MAT.sage, w - 0.02, 0.006, d - 0.02, x, base + h + 0.003, z);
  }
  // trees and people
  const rng = (i: number) => ((Math.sin(i * 91.7) * 43758.5453) % 1 + 1) % 1;
  for (let i = 0; i < 34; i++) {
    const a = rng(i) * Math.PI * 2, r = 0.18 + rng(i + 50) * 0.32;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (Math.abs(x - 0.06) < 0.16 && Math.abs(z - 0.05) < 0.12) continue;
    b.cyl(MAT.walnut, 0.002, 0.03, x, base + 0.015, z, 5);
    b.sphere(i % 7 === 0 ? MAT.leaf : MAT.sage, 0.016 + rng(i + 9) * 0.01, x, base + 0.04, z, 0.85);
  }
  for (let i = 0; i < 18; i++) {
    const a = rng(i + 200) * Math.PI * 2, r = 0.12 + rng(i + 300) * 0.3;
    b.cyl(MAT.cardWarm, 0.0025, 0.02, Math.cos(a) * r, base + 0.01, Math.sin(a) * r, 5);
  }
  return b.build();
}

export default function HeroModel() {
  const model = useMemo(buildHero, []);
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.06;   // a slow turntable
  });
  return (
    <>
      {/* the model's base board, where the old masterplan sat (covers its baked footprint) */}
      <mesh position={[-6.6, 0.842, -9.4]} material={MAT.cardWarm} raycast={() => null}>
        <boxGeometry args={[2.04, 0.032, 1.09]} />
      </mesh>
      <group position={HERO_AT} scale={1.22}>
      <group ref={spin}>
        <primitive object={model} />
      </group>
        <primitive object={contactShadow(1.3, 1.3, 0.35)} position={[0, 0.002, 0]} />
      </group>
    </>
  );
}
