"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Builder, MAT, canvas, glowMat } from "./kit";

/* Over the long table, in place of the three globes: a long brass chandelier of nine pierced
   jaali lanterns. Each lantern glows through its lattice, softly by day and warmly at night. */

let jaaliAlpha: THREE.Texture | null = null;
/** An eight-point star lattice (white = metal, black = open) used as the lanterns' alpha. */
function jaali() {
  jaaliAlpha ??= canvas(256, 256, (ctx) => {
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 256, 256);
    ctx.fillStyle = "#000";
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++) {
        const cx = x * 64 + 32, cy = y * 64 + 32;
        ctx.beginPath();
        for (let k = 0; k < 16; k++) {
          const r = k % 2 ? 11 : 24, a = (k / 16) * Math.PI * 2;
          ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x * 64, y * 64, 6, 0, 7);
        ctx.fill();
      }
  }, false);
  jaaliAlpha.wrapS = jaaliAlpha.wrapT = THREE.RepeatWrapping;
  return jaaliAlpha;
}

const TOP = 5.5, FRAME_Y = 3.66;

function build() {
  const b = new Builder();
  const pierced = new THREE.MeshStandardMaterial({ color: "#c49a5c", metalness: 1, roughness: 0.32, alphaMap: jaali(), alphaTest: 0.5, side: THREE.DoubleSide });
  pierced.alphaMap!.repeat.set(3, 2);
  const glow = glowMat("#ffc685", 0.7, 7.0);
  // frame: two rods, cross ties and four drops to the vault
  for (const dz of [-0.11, 0.11]) {
    const rod = new THREE.CylinderGeometry(0.011, 0.011, 4.1, 10);
    rod.rotateZ(Math.PI / 2);
    rod.translate(0, FRAME_Y, -6.8 + dz);
    b.add(MAT.brass, rod);
  }
  for (const x of [-2.0, -1.0, 0, 1.0, 2.0]) b.box(MAT.brass, 0.02, 0.02, 0.24, x, FRAME_Y, -6.8);
  for (const x of [-1.5, 1.5]) for (const dz of [-0.11, 0.11]) b.cyl(MAT.brass, 0.004, TOP - FRAME_Y, x, (TOP + FRAME_Y) / 2, -6.8 + dz, 6);
  // nine lanterns
  for (let i = 0; i < 9; i++) {
    const x = -1.8 + i * 0.45;
    const bodyTop = FRAME_Y - 0.14, h = i % 2 ? 0.3 : 0.36, r = 0.11;
    b.cyl(MAT.brass, 0.003, 0.14, x, FRAME_Y - 0.07, -6.8, 6);                     // chain
    const cap = new THREE.ConeGeometry(r * 1.15, 0.08, 8);
    cap.translate(x, bodyTop + 0.04, -6.8);
    b.add(MAT.brass, cap);
    const body = new THREE.CylinderGeometry(r, r * 0.92, h, 8, 1, true);
    body.translate(x, bodyTop - h / 2, -6.8);
    b.add(pierced, body);
    b.cyl(MAT.brass, r * 0.95, 0.012, x, bodyTop - h, -6.8, 8);                    // base ring
    const fin = new THREE.ConeGeometry(0.03, 0.08, 8);
    fin.rotateX(Math.PI);
    fin.translate(x, bodyTop - h - 0.045, -6.8);
    b.add(MAT.brass, fin);
    b.cyl(glow, r * 0.55, h * 0.75, x, bodyTop - h / 2, -6.8, 12);                // the light inside
  }
  return b.build();
}

export default function Chandelier() {
  const obj = useMemo(build, []);
  return <primitive object={obj} />;
}
