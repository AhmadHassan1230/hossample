"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { Builder, MAT, canvas, contactShadow, glowMat } from "./kit";
import { glowing } from "./materials";

/* The furniture side, browser-built: a showroom platform of real-scan pieces along the arcade,
   a living-room vignette on a hand-painted Pakistani rug, the material wall lit like backlit onyx
   with fabric swatches, and the arched brass portal into the marketplace. Furniture models are
   CC0 Poly Haven scans (placeholders for HoS pieces). */

const ph = (id: string) => `/assets/ph/${id}/${id}_1k.gltf`;
const PIECES = ["chinese_armchair", "GreenChair_01", "Ottoman_01", "gallinera_chair", "coffee_table_round_01", "ArmChair_01", "sofa_02", "modern_coffee_table_02", "side_table_tall_01", "brass_vase_01"];

export const SHOWROOM_BOX = { center: [4.25, 0.6, -4.55] as const, size: [1.0, 1.4, 6.8] as const };
export const LIVING_BOX = { center: [7.0, 0.5, -6.65] as const, size: [3.2, 1.1, 2.6] as const };
// the portal stands at the head of the living room, beside the showroom, facing the visitor
export const PORTAL_AT = new THREE.Vector3(5.2, 0, -4.85);
export const PORTAL_BOX = { center: [5.2, 1.0, -4.85] as const, size: [1.0, 2.0, 0.5] as const };

type Place = { id: string; at: [number, number, number]; ry: number; s?: number };
const PLACES: Place[] = [
  // the showroom platform along the arcade, every piece turned to the room
  { id: "chinese_armchair", at: [4.25, 0.1, -1.8], ry: Math.PI / 2 },
  { id: "GreenChair_01", at: [4.25, 0.1, -2.95], ry: Math.PI / 2 },
  { id: "Ottoman_01", at: [4.25, 0.1, -4.05], ry: Math.PI / 2 },
  { id: "gallinera_chair", at: [4.25, 0.1, -5.15], ry: Math.PI / 2 },
  { id: "coffee_table_round_01", at: [4.25, 0.1, -6.25], ry: 0, s: 0.62 },
  { id: "ArmChair_01", at: [4.25, 0.1, -7.4], ry: Math.PI / 2 },
  // the living room: sofa, coffee table, a pair of armchairs, a tall side table with a vase
  { id: "sofa_02", at: [5.85, 0, -6.65], ry: Math.PI / 2 },
  { id: "modern_coffee_table_02", at: [7.0, 0, -6.65], ry: 0, s: 0.95 },
  { id: "ArmChair_01", at: [8.2, 0, -5.95], ry: -Math.PI / 2 - 0.3 },
  { id: "ArmChair_01", at: [8.2, 0, -7.35], ry: -Math.PI / 2 + 0.3 },
  { id: "side_table_tall_01", at: [5.7, 0, -5.35], ry: 0 },
  { id: "brass_vase_01", at: [5.7, 0.76, -5.35], ry: 0, s: 0.7 },
];

/** A Pakistani rug: madder-red field, indigo borders, cream guls in rows and a central medallion. */
function rugTexture() {
  return canvas(2048, 1650, (ctx) => {
    const W = 2048, H = 1650;
    ctx.fillStyle = "#1d2742";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e9dcc4";
    ctx.fillRect(60, 60, W - 120, H - 120);
    ctx.fillStyle = "#7b1f1b";
    ctx.fillRect(110, 110, W - 220, H - 220);
    // border zigzag
    ctx.fillStyle = "#c7913f";
    for (let x = 70; x < W - 70; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 70);
      ctx.lineTo(x + 20, 100);
      ctx.lineTo(x + 40, 70);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x, H - 70);
      ctx.lineTo(x + 20, H - 100);
      ctx.lineTo(x + 40, H - 70);
      ctx.fill();
    }
    // guls: octagons with a cross, in staggered rows
    const gul = (cx: number, cy: number, r: number, fill: string, inner: string) => {
      ctx.fillStyle = fill;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
        ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.78);
      }
      ctx.fill();
      ctx.fillStyle = inner;
      ctx.fillRect(cx - r * 0.55, cy - r * 0.08, r * 1.1, r * 0.16);
      ctx.fillRect(cx - r * 0.08, cy - r * 0.45, r * 0.16, r * 0.9);
    };
    for (let row = 0; row < 5; row++)
      for (let col = 0; col < 7; col++) {
        const cx = 260 + col * 255 + (row % 2) * 127, cy = 270 + row * 280;
        if (Math.abs(cx - W / 2) < 330 && Math.abs(cy - H / 2) < 250) continue;
        if (cx > W - 200) continue;
        gul(cx, cy, 78, "#e9dcc4", "#1d2742");
        gul(cx, cy, 40, "#b9572e", "#e9dcc4");
      }
    gul(W / 2, H / 2, 260, "#1d2742", "#c7913f");
    gul(W / 2, H / 2, 170, "#e9dcc4", "#7b1f1b");
    gul(W / 2, H / 2, 80, "#b9572e", "#e9dcc4");
    // wool: a little noise
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 16;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  });
}

/** Backlit onyx for the material wall: warm amber with drifting veins. */
function onyxTexture() {
  return canvas(1024, 1200, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, 1200);
    g.addColorStop(0, "#f2c98f");
    g.addColorStop(0.5, "#e8b06c");
    g.addColorStop(1, "#d9944f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 1200);
    for (let i = 0; i < 70; i++) {
      ctx.strokeStyle = `rgba(${120 + Math.random() * 60},${70 + Math.random() * 40},30,${0.08 + Math.random() * 0.18})`;
      ctx.lineWidth = 2 + Math.random() * 14;
      ctx.beginPath();
      let x = Math.random() * 1024, y = 0;
      ctx.moveTo(x, y);
      while (y < 1200) {
        x += (Math.random() - 0.45) * 60;
        y += 30 + Math.random() * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  });
}

function portalPanel() {
  return canvas(1024, 1600, (ctx) => {
    ctx.fillStyle = "#14100e";
    ctx.fillRect(0, 0, 1024, 1600);
    ctx.fillStyle = "#ff6a2a";
    ctx.font = "600 44px sans-serif";
    ctx.textAlign = "center";
    ctx.letterSpacing = "10px";
    ctx.fillText("THE EXCHANGE", 512, 560);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#f4ece0";
    ctx.font = "400 112px sans-serif";
    ctx.fillText("Enter the", 512, 740);
    ctx.fillText("marketplace", 512, 870);
    ctx.font = "300 130px sans-serif";
    ctx.fillText("→", 512, 1060);
  });
}

function buildFixed() {
  const b = new Builder();
  const oak = new THREE.MeshStandardMaterial({ color: "#8a6440", roughness: 0.55 });
  // the showroom platform
  b.box(oak, 0.9, 0.1, 6.7, 4.25, 0.05, -4.55);
  b.box(MAT.brass, 0.012, 0.012, 6.7, 4.71, 0.094, -4.55);
  // the material wall: onyx behind the shelves, light under every shelf, a rail of fabrics
  const onyx = onyxTexture();
  const onyxMat = new THREE.MeshStandardMaterial({ map: onyx, emissiveMap: onyx, emissive: new THREE.Color("#ffffff"), roughness: 0.4 });
  onyxMat.userData.glow = [0.55, 1.6];
  glowing.push(onyxMat);
  const onyxPanel = new THREE.PlaneGeometry(2.35, 2.75);
  onyxPanel.rotateY(-Math.PI / 2);
  onyxPanel.translate(10.21, 1.45, -6.5);
  b.add(onyxMat, onyxPanel);
  const led = glowMat("#ffd8a6", 1.2, 4.5);
  for (const y of [0.42, 1.02, 1.62, 2.22]) b.box(led, 0.012, 0.008, 2.2, 9.77, y - 0.026, -6.5);
  const rail = new THREE.CylinderGeometry(0.008, 0.008, 2.2, 8);
  rail.rotateX(Math.PI / 2);
  rail.translate(9.68, 2.86, -6.5);
  b.add(MAT.brass, rail);
  const fabrics = ["#b65a35", "#d6a23f", "#2f3d63", "#9aa287", "#efe6d6", "#8a3b2a", "#6d6a3a", "#d9a9a0", "#3f5b52"];
  fabrics.forEach((c, i) => {
    const sw = new THREE.PlaneGeometry(0.2, 0.46);
    sw.rotateY(-Math.PI / 2);
    sw.translate(9.66, 2.6, -5.55 - i * 0.24);
    b.add(new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, side: THREE.DoubleSide }), sw);
  });
  // the marketplace portal: the HoS arch in brass, a lit panel inside
  const g = new THREE.Group();
  const p = new Builder();
  const H = 2.05, R = 0.45;
  for (const s of [-1, 1]) p.box(MAT.brass, 0.05, H - R, 0.05, s * R, (H - R) / 2, 0);
  const arc = new THREE.TorusGeometry(R, 0.025, 10, 48, Math.PI);
  arc.translate(0, H - R, 0);
  p.add(MAT.brass, arc);
  p.box(MAT.walnut, 1.1, 0.06, 0.32, 0, 0.03, 0);
  const panelTex = portalPanel();
  const panelMat = new THREE.MeshStandardMaterial({ map: panelTex, emissiveMap: panelTex, emissive: new THREE.Color("#ffffff"), roughness: 0.3 });
  panelMat.userData.glow = [0.9, 1.4];
  glowing.push(panelMat);
  const shape = new THREE.Shape();
  shape.moveTo(-R + 0.02, 0.07);
  shape.lineTo(R - 0.02, 0.07);
  shape.lineTo(R - 0.02, H - R);
  shape.absarc(0, H - R, R - 0.02, 0, Math.PI, false);
  shape.lineTo(-R + 0.02, 0.07);
  const panel = new THREE.ShapeGeometry(shape, 24);
  // map the shape's UVs onto the full panel texture
  const pos = panel.attributes.position, uv = panel.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + R) / (2 * R), pos.getY(i) / H);
  p.add(panelMat, panel);
  g.add(p.build());
  g.position.copy(PORTAL_AT);
  g.rotation.y = -0.24;
  return { fixed: b.build(), portal: g };
}

function Piece({ place }: { place: Place }) {
  const { scene } = useGLTF(ph(place.id));
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => {
      if ((m as THREE.Mesh).isMesh) (m as THREE.Mesh).raycast = () => {};
    });
    return o;
  }, [scene]);
  return <primitive object={obj} position={place.at} rotation-y={place.ry} scale={place.s ?? 1} />;
}

export default function Showroom() {
  const { fixed, portal } = useMemo(buildFixed, []);
  const rug = useMemo(() => {
    const t = rugTexture();
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  }, []);
  return (
    <group>
      <primitive object={fixed} />
      <primitive object={portal} />
      <mesh position={[7.05, 0.006, -6.65]} rotation-x={-Math.PI / 2} material={rug} raycast={() => null}>
        <planeGeometry args={[3.1, 2.5]} />
      </mesh>
      {PLACES.map((p, i) => (
        <group key={i}>
          <Piece place={p} />
          {p.at[1] === 0 && p.id !== "brass_vase_01" && <primitive object={contactShadow(1.0 * (p.s ?? 1), 0.9 * (p.s ?? 1), 0.35)} position={[p.at[0], 0.009, p.at[2]]} />}
        </group>
      ))}
      <primitive object={contactShadow(1.2, 6.9, 0.3)} position={[4.25, 0.003, -4.55]} />
    </group>
  );
}

if (typeof window !== "undefined") PIECES.forEach((id) => useGLTF.preload(ph(id)));
