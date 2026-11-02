"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useFrame } from "@react-three/fiber";
import { Builder, MAT, canvas, contactShadow } from "./kit";
import { glowing } from "./materials";

/* The long table, top-down: half of it a detailed 3D plan of a courtyard house (a haveli, about
   1:20), the other half the HoS mark and one line. Everything is built in the browser. */

const TABLE_Y = 0.817;
// the two halves meet (the paper slides under the model board) so no old baked shadow shows between
const MODEL_AT = new THREE.Vector3(-1.33, TABLE_Y, -6.8);
const MODEL_SCALE = 0.92;
const PAPER_AT = new THREE.Vector3(1.25, TABLE_Y - 0.0004, -6.8);
const WALL_H = 0.11, WALL_T = 0.018;

type Fonts = { d: string; s: string; l: string };

/* ---------------------------------------------------------------- floor finishes (canvas) */
function floorTex(kind: "wood" | "terrazzo" | "tile" | "brick" | "stone", repeat: number) {
  const t = canvas(512, 512, (ctx) => {
    if (kind === "wood") {
      for (let i = 0; i < 16; i++) {
        ctx.fillStyle = `hsl(32, ${28 + Math.random() * 8}%, ${58 + Math.random() * 8}%)`;
        ctx.fillRect(0, i * 32, 512, 31);
        ctx.fillStyle = "rgba(60,35,15,.25)";
        ctx.fillRect(((i * 137) % 512), i * 32, 2, 32);
      }
    } else if (kind === "terrazzo") {
      ctx.fillStyle = "#e8e2d8";
      ctx.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = ["#b9845f", "#7f8c88", "#d8b49a", "#5e5550", "#c9c2b6"][i % 5];
        ctx.beginPath();
        ctx.arc(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 4, 0, 7);
        ctx.fill();
      }
    } else if (kind === "tile") {
      for (let y = 0; y < 8; y++)
        for (let x = 0; x < 8; x++) {
          ctx.fillStyle = (x + y) % 2 ? "#e9e5dc" : "#2e3f4f";
          ctx.fillRect(x * 64, y * 64, 64, 64);
        }
    } else if (kind === "brick") {
      ctx.fillStyle = "#d6b8a2";
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 16; y++)
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = `hsl(18, 40%, ${52 + Math.random() * 10}%)`;
          if ((x + y) % 2) ctx.fillRect(x * 32 + 1, y * 32 + 1, 62, 30);
          else ctx.fillRect(x * 32 + 1, y * 32 + 1, 30, 62);
        }
    } else {
      ctx.fillStyle = "#ddd5c8";
      ctx.fillRect(0, 0, 512, 512);
      ctx.strokeStyle = "rgba(90,80,70,.35)";
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath();
        ctx.moveTo(i * 64, 0);
        ctx.lineTo(i * 64, 512);
        ctx.moveTo(0, i * 64);
        ctx.lineTo(512, i * 64);
        ctx.stroke();
      }
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  return t;
}

/* ---------------------------------------------------------------- the plan */
type Rect = [number, number, number, number]; // u0, v0, u1, v1 (model metres; u along x, v along z)
const OUT: Rect = [-1.25, -0.62, 1.25, 0.62];
const RING: Rect = [-0.5, -0.34, 0.5, 0.34];     // inner edge of the rooms
const COURT: Rect = [-0.36, -0.2, 0.36, 0.2];    // open courtyard
const ROOMS: { r: Rect; floor: Parameters<typeof floorTex>[0]; kind: string }[] = [
  { r: [-1.25, 0.34, -0.5, 0.62], floor: "wood", kind: "bed" },
  { r: [-0.5, 0.34, 0.5, 0.62], floor: "wood", kind: "baithak" },
  { r: [0.5, 0.34, 1.25, 0.62], floor: "wood", kind: "bed" },
  { r: [-1.25, -0.62, -0.5, -0.34], floor: "tile", kind: "kitchen" },
  { r: [-0.5, -0.62, 0.5, -0.34], floor: "terrazzo", kind: "entrance" },
  { r: [0.5, -0.62, 1.25, -0.34], floor: "terrazzo", kind: "dining" },
  { r: [-1.25, -0.34, -0.5, 0.34], floor: "wood", kind: "study" },
  { r: [0.5, -0.34, 1.25, 0], floor: "tile", kind: "bath" },
  { r: [0.5, 0, 1.25, 0.34], floor: "stone", kind: "stair" },
];

/** A wall from (u0,v0) to (u1,v1) (axis-aligned) with gaps [centre, width] along it. */
function wall(b: Builder, u0: number, v0: number, u1: number, v1: number, gaps: [number, number][] = [], glass: [number, number][] = []) {
  const horiz = v0 === v1;
  const a = horiz ? u0 : v0, z = horiz ? u1 : v1;
  const cuts = [...gaps, ...glass].map(([c, w]) => [c - w / 2, c + w / 2]).sort((p, q) => p[0] - q[0]);
  let s = a;
  const seg = (from: number, to: number, h = WALL_H, y0 = 0) => {
    if (to - from < 0.002) return;
    const m = (from + to) / 2, len = to - from;
    if (horiz) b.box(MAT.card, len, h, WALL_T, m, y0 + h / 2, v0);
    else b.box(MAT.card, WALL_T, h, len, u0, y0 + h / 2, m);
  };
  for (const [c0, c1] of cuts) {
    seg(s, c0);
    s = c1;
  }
  seg(s, z);
  for (const [c, w] of glass) {
    // sill, lintel and a pane of acrylic
    seg(c - w / 2, c + w / 2, 0.025);
    seg(c - w / 2, c + w / 2, 0.018, WALL_H - 0.018);
    if (horiz) b.box(MAT.acrylic, w, WALL_H - 0.043, 0.004, c, 0.025 + (WALL_H - 0.043) / 2, v0);
    else b.box(MAT.acrylic, 0.004, WALL_H - 0.043, w, u0, 0.025 + (WALL_H - 0.043) / 2, c);
  }
  for (const [c, w] of gaps) {
    // lintel over doors
    seg(c - w / 2, c + w / 2, 0.02, WALL_H - 0.02);
  }
}

function furnish(b: Builder, kind: string, r: Rect) {
  const [u0, v0, u1, v1] = r;
  const cu = (u0 + u1) / 2, cv = (v0 + v1) / 2;
  const L = MAT.basswood, W = MAT.cardWarm, D = MAT.ink;
  const north = cv > 0;
  const back = north ? v1 - 0.06 : v0 + 0.06;      // against the outer wall
  if (kind === "bed") {
    b.box(L, 0.16, 0.022, 0.2, cu, 0.011, back - (north ? 0.1 : -0.1));
    b.box(W, 0.15, 0.012, 0.15, cu, 0.028, back - (north ? 0.11 : -0.11));
    for (const s of [-0.04, 0.04]) b.box(W, 0.05, 0.012, 0.03, cu + s, 0.03, back - (north ? 0.025 : -0.025));
    for (const s of [-0.12, 0.12]) b.box(L, 0.04, 0.03, 0.035, cu + s, 0.015, back - (north ? 0.02 : -0.02));
    b.box(D, 0.24, 0.07, 0.04, u0 + 0.16, 0.035, north ? v0 + 0.04 : v1 - 0.04);   // wardrobe
    b.box(MAT.sage, 0.14, 0.003, 0.1, cu, 0.002, cv);                                // rug
  } else if (kind === "baithak") {
    // floor seating along three walls (the baithak), a low table, cushions
    b.box(W, 0.6, 0.02, 0.05, cu, 0.01, back - 0.0);
    b.box(W, 0.05, 0.02, 0.18, u0 + 0.08, 0.01, cv + 0.02);
    b.box(W, 0.05, 0.02, 0.18, u1 - 0.08, 0.01, cv + 0.02);
    for (let i = 0; i < 7; i++) b.box(MAT.leaf, 0.04, 0.025, 0.012, cu - 0.24 + i * 0.08, 0.03, back - 0.018);
    b.box(L, 0.16, 0.018, 0.09, cu, 0.009, cv - 0.01);
    b.box(MAT.brass, 0.03, 0.02, 0.03, cu, 0.028, cv - 0.01);
    b.box(new THREE.MeshStandardMaterial({ color: "#8e2f25", roughness: 0.9 }), 0.36, 0.003, 0.18, cu, 0.002, cv);
  } else if (kind === "kitchen") {
    b.box(W, 0.6, 0.045, 0.04, cu, 0.0225, v0 + 0.035);
    b.box(W, 0.04, 0.045, 0.22, u0 + 0.035, 0.0225, cv - 0.02);
    b.box(L, 0.2, 0.045, 0.08, cu + 0.05, 0.0225, cv + 0.02);
    b.box(D, 0.05, 0.1, 0.045, u1 - 0.06, 0.05, v0 + 0.035);
  } else if (kind === "entrance") {
    b.box(L, 0.18, 0.04, 0.03, cu, 0.02, cv + 0.06);
    for (const s of [-0.2, 0.2]) b.sphere(MAT.sage, 0.03, cu + s, 0.03, cv);
  } else if (kind === "dining") {
    b.box(L, 0.3, 0.035, 0.11, cu, 0.0175, cv);
    for (let i = 0; i < 4; i++)
      for (const s of [-1, 1]) b.box(W, 0.035, 0.022, 0.035, cu - 0.11 + i * 0.073, 0.011, cv + s * 0.085);
    b.sphere(MAT.leaf, 0.015, cu, 0.045, cv);
  } else if (kind === "study") {
    b.box(D, 0.035, 0.09, 0.5, u0 + 0.03, 0.045, cv);           // book wall
    b.box(L, 0.08, 0.035, 0.2, cu + 0.05, 0.0175, cv + 0.12);   // desk
    b.box(W, 0.035, 0.022, 0.035, cu - 0.01, 0.011, cv + 0.12);
    b.box(W, 0.07, 0.03, 0.07, cu + 0.08, 0.015, cv - 0.18);    // reading chair
  } else if (kind === "bath") {
    b.box(W, 0.16, 0.03, 0.07, cu + 0.18, 0.015, v0 + 0.06);
    b.box(W, 0.1, 0.04, 0.035, cu - 0.2, 0.02, v1 - 0.04);
    b.box(W, 0.03, 0.03, 0.04, cu - 0.05, 0.015, v0 + 0.04);
  } else if (kind === "stair") {
    for (let i = 0; i < 10; i++) b.box(MAT.cardWarm, 0.18, 0.01 * (i + 1), 0.026, cu + 0.12, 0.005 * (i + 1), v0 + 0.03 + i * 0.026);
  }
}

function buildPlan() {
  const walls = new Builder(), stuff = new Builder();
  const [ou0, ov0, ou1, ov1] = OUT;
  // exterior walls: windows on every room, the main door at the south centre
  wall(walls, ou0, ov1, ou1, ov1, [], [[-0.88, 0.18], [-0.2, 0.16], [0.2, 0.16], [0.88, 0.18]]);
  wall(walls, ou0, ov0, ou1, ov0, [[0, 0.1]], [[-0.88, 0.18], [0.88, 0.18]]);
  wall(walls, ou0, ov0, ou0, ov1, [], [[-0.48, 0.14], [0, 0.22], [0.48, 0.14]]);
  wall(walls, ou1, ov0, ou1, ov1, [], [[-0.48, 0.14], [0.48, 0.14]]);
  // the ring of rooms facing the veranda, each with a door to it
  const [ru0, rv0, ru1, rv1] = RING;
  wall(walls, ru0, rv1, ru1, rv1, [[0, 0.28]]);
  wall(walls, ru0, rv0, ru1, rv0, [[0, 0.12]]);
  wall(walls, ru0, rv0, ru0, rv1, [[0, 0.1]]);
  wall(walls, ru1, rv0, ru1, rv1, [[-0.17, 0.06], [0.17, 0.08]]);
  // partitions between rooms
  for (const u of [-0.5, 0.5]) {
    wall(walls, u, rv1, u, ov1, [[(rv1 + ov1) / 2, 0.06]]);
    wall(walls, u, ov0, u, rv0, [[(rv0 + ov0) / 2, 0.06]]);
  }
  for (const v of [-0.34, 0.34]) {
    wall(walls, ou0, v, ru0, v);
    wall(walls, ru1, v, ou1, v);
  }
  wall(walls, ru1, 0, ou1, 0, [[0.85, 0.06]]);
  // the veranda arcade around the courtyard: columns and a light beam
  const [cu0, cv0, cu1, cv1] = COURT;
  const cols: [number, number][] = [];
  for (let u = cu0; u <= cu1 + 1e-6; u += (cu1 - cu0) / 6) cols.push([u, cv0], [u, cv1]);
  for (let v = cv0 + (cv1 - cv0) / 4; v < cv1 - 1e-6; v += (cv1 - cv0) / 4) cols.push([cu0, v], [cu1, v]);
  for (const [u, v] of cols) walls.cyl(MAT.card, 0.008, WALL_H - 0.012, u, (WALL_H - 0.012) / 2, v, 10);
  walls.box(MAT.card, cu1 - cu0 + 0.02, 0.012, 0.012, 0, WALL_H - 0.006, cv0);
  walls.box(MAT.card, cu1 - cu0 + 0.02, 0.012, 0.012, 0, WALL_H - 0.006, cv1);
  walls.box(MAT.card, 0.012, 0.012, cv1 - cv0, cu0, WALL_H - 0.006, 0);
  walls.box(MAT.card, 0.012, 0.012, cv1 - cv0, cu1, WALL_H - 0.006, 0);

  // floors per room, veranda, courtyard
  const floors = new THREE.Group();
  const floorPlane = (r: Rect, kind: Parameters<typeof floorTex>[0], y = 0.0015) => {
    const w = r[2] - r[0], d = r[3] - r[1];
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: floorTex(kind, Math.max(w, d) * 3), roughness: 0.75 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set((r[0] + r[2]) / 2, y, (r[1] + r[3]) / 2);
    m.raycast = () => {};
    floors.add(m);
  };
  for (const r of ROOMS) {
    floorPlane(r.r, r.floor);
    furnish(stuff, r.kind, r.r);
  }
  floorPlane(RING, "stone", 0.001);
  floorPlane(COURT, "brick", 0.0025);
  // courtyard: an octagonal fountain on the axis, four jacarandas, planters
  const oct = new THREE.CylinderGeometry(0.06, 0.06, 0.014, 8);
  oct.translate(0, 0.009, 0);
  stuff.add(MAT.card, oct);
  stuff.cyl(MAT.water, 0.048, 0.016, 0, 0.01, 0, 8);
  stuff.cyl(MAT.card, 0.006, 0.03, 0, 0.02, 0, 8);
  for (const [u, v] of [[-0.24, -0.12], [0.24, -0.12], [-0.24, 0.12], [0.24, 0.12]] as const) {
    stuff.cyl(MAT.walnut, 0.004, 0.07, u, 0.035, v, 6);
    stuff.sphere(MAT.leaf, 0.05, u, 0.085, v, 0.75);
    stuff.sphere(MAT.leaf, 0.032, u + 0.025, 0.1, v - 0.015, 0.75);
  }
  for (const [u, v] of [[-0.36, 0], [0.36, 0]] as const) stuff.box(MAT.sage, 0.03, 0.02, 0.1, u * 0.9, 0.01, v);
  // scale figures and site trees outside
  for (const [u, v] of [[0.05, -0.75], [-0.12, -0.08], [0.15, 0.05], [0.7, -0.5], [-0.8, 0.45], [0.3, 0.5]] as const) {
    stuff.cyl(MAT.cardWarm, 0.005, 0.07, u, 0.035, v, 6);
    stuff.sphere(MAT.cardWarm, 0.0065, u, 0.076, v);
  }
  for (const [u, v] of [[-1.31, -0.52], [-1.31, 0.18], [1.31, -0.35], [1.31, 0.5], [0.62, -0.66], [-0.62, -0.66]] as const) {
    stuff.cyl(MAT.walnut, 0.004, 0.06, u, 0.03, v, 6);
    stuff.sphere(MAT.sage, 0.045, u, 0.08, v, 0.8);
  }
  // entrance path
  stuff.box(MAT.cardWarm, 0.12, 0.002, 0.1, 0, 0.001, -0.71);
  return { walls: walls.build(), stuff: stuff.build(), floors };
}

/* ---------------------------------------------------------------- the paper half */
function mark(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, ink: string, logoFont: string) {
  const w = h * 0.5;
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = h * 0.026;
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h);
  ctx.lineTo(x - w / 2, y + w / 2);
  ctx.arc(x, y + w / 2, w / 2, Math.PI, 0);
  ctx.lineTo(x + w / 2, y + h);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - w * 1.3, y + h * 0.62);
  ctx.lineTo(x + w * 1.3, y + h * 0.62);
  ctx.stroke();
  ctx.font = `500 ${h * 0.3}px ${logoFont}`;
  ctx.textAlign = "center";
  ctx.fillText("H", x - w * 0.9, y + h * 0.58);
  ctx.fillText("S", x + w * 0.9, y + h * 0.58);
}

function paperTexture(f: Fonts) {
  return canvas(2048, 1103, (ctx) => {
    ctx.fillStyle = "#efe6d8";
    ctx.fillRect(0, 0, 2048, 1103);
    const img = ctx.getImageData(0, 0, 2048, 1103);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 8;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
    const ink = "#2a211c";
    mark(ctx, 1024, 150, 470, ink, f.l);
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.font = `500 74px ${f.d}`;
    ctx.letterSpacing = "26px";
    ctx.fillText("HOUSE OF SULTANA", 1024 + 13, 790);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#5a4a3f";
    ctx.font = `400 50px ${f.s}`;
    ctx.fillText("An international team of architects and designers.", 1024, 900);
  });
}

export default function PlanModel({ fonts, active }: { fonts: Fonts; active: boolean }) {
  const plan = useMemo(buildPlan, []);
  const paper = useMemo(() => {
    const tex = paperTexture(fonts);
    const m = new THREE.MeshStandardMaterial({ map: tex, color: "#fff4e4", roughness: 0.92, emissiveMap: tex, emissive: new THREE.Color("#fff1de") });
    m.userData.glow = [0.55, 0.22];
    glowing.push(m);
    return m;
  }, [fonts]);
  const rise = useRef({ k: 0 });
  const built = useRef(false);

  // the walls rise when you arrive at the table (the first time, then they stay)
  useEffect(() => {
    if (!active || built.current) return;
    built.current = true;
    const t = gsap.to(rise.current, { k: 1, duration: 2.6, delay: 1.6, ease: "power2.inOut" });
    return () => {
      t.kill();
    };
  }, [active]);
  useFrame(() => {
    const k = built.current ? rise.current.k : 1;
    plan.walls.scale.y = Math.max(0.02, k);
    plan.stuff.scale.y = Math.max(0.02, Math.min(1, k * 1.2));
  });

  return (
    <group>
      {/* the plan model on a walnut board */}
      <group position={MODEL_AT} scale={MODEL_SCALE}>
        <mesh position={[0, 0.012, 0]} material={MAT.walnut} raycast={() => null}>
          <boxGeometry args={[2.78, 0.024, 1.84]} />
        </mesh>
        <mesh position={[0, 0.026, 0]} material={MAT.cardWarm} raycast={() => null}>
          <boxGeometry args={[2.7, 0.004, 1.76]} />
        </mesh>
        <group position={[0, 0.028, 0]}>
          <primitive object={plan.floors} />
          <primitive object={plan.walls} />
          <primitive object={plan.stuff} />
        </group>
      </group>
      {/* the mark and one line, read from the courtyard end like the rest of the story */}
      <mesh position={[PAPER_AT.x, PAPER_AT.y, PAPER_AT.z]} rotation={[-Math.PI / 2, 0, Math.PI]} material={paper} raycast={() => null}>
        <planeGeometry args={[2.6, 1.4]} />
      </mesh>

    </group>
  );
}
