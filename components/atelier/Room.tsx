"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { MeshReflectorMaterial } from "@react-three/drei";
import { B, C, mats, pbr, SETS_LOADED } from "./kit";

/* The studio shell. Units are metres; Y up; the camera side (z = +4.5) is open.
   Room: x −6…6, z −4.5…4.5, ceiling 4.4. */

export const ROOM = { x0: -6, x1: 6, z0: -4.5, z1: 4.5, h: 4.4, t: 0.35 };
export const WINDOWS = [-2.7, 0, 2.7].map((z) => ({ z, w: 1.5, sill: 0.55, spring: 2.95 }));
export const DOOR = { x: 0.4, w: 1.5, spring: 2.3 };

function leftWallGeometry() {
  const { z0, z1, h, t } = ROOM;
  const s = new THREE.Shape();
  s.moveTo(z0 - t, 0);
  s.lineTo(z1, 0);
  s.lineTo(z1, h);
  s.lineTo(z0 - t, h);
  s.lineTo(z0 - t, 0);
  for (const win of WINDOWS) {
    const r = win.w / 2;
    const hole = new THREE.Path();
    hole.moveTo(win.z - r, win.sill);
    hole.lineTo(win.z + r, win.sill);
    hole.lineTo(win.z + r, win.spring);
    hole.absarc(win.z, win.spring, r, 0, Math.PI, false);
    hole.lineTo(win.z - r, win.sill);
    s.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 40 });
}

function backWallGeometry() {
  const { x0, x1, h, t } = ROOM;
  const r = DOOR.w / 2;
  const s = new THREE.Shape();
  s.moveTo(x0 - t, 0);
  s.lineTo(DOOR.x - r, 0);
  s.lineTo(DOOR.x - r, DOOR.spring);
  s.absarc(DOOR.x, DOOR.spring, r, Math.PI, 0, true);
  s.lineTo(DOOR.x + r, 0);
  s.lineTo(x1 + t, 0);
  s.lineTo(x1 + t, h);
  s.lineTo(x0 - t, h);
  s.lineTo(x0 - t, 0);
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 48 });
}

function rightWallGeometry() {
  const { z0, z1, h, t } = ROOM;
  const s = new THREE.Shape();
  s.moveTo(-z1, 0);
  s.lineTo(-z0 + t, 0);
  s.lineTo(-z0 + t, h);
  s.lineTo(-z1, h);
  s.lineTo(-z1, 0);
  return new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
}

function archOutline(w: number, h: number, inset = 0) {
  const r = w / 2 - inset;
  const spring = h - w / 2;
  const s = new THREE.Shape();
  s.moveTo(-r, inset);
  s.lineTo(r, inset);
  s.lineTo(r, spring);
  s.absarc(0, spring, r, 0, Math.PI, false);
  s.lineTo(-r, inset);
  return s;
}

/** Steel window joinery + glass + sill inside one arched opening. */
function WindowFrame({ z, w, sill, spring }: (typeof WINDOWS)[number]) {
  const m = mats();
  const r = w / 2;
  const x = ROOM.x0 - ROOM.t + 0.08;
  const H = spring - sill + r;
  const { frame, glass } = useMemo(() => {
    const outer = archOutline(w, H);
    const inner = archOutline(w, H, 0.045);
    outer.holes.push(new THREE.Path(inner.getPoints(48)));
    return {
      frame: new THREE.ExtrudeGeometry(outer, { depth: 0.05, bevelEnabled: false, curveSegments: 48 }),
      glass: new THREE.ShapeGeometry(archOutline(w, H), 48),
    };
  }, [w, H]);
  return (
    <group position={[x, sill, z]} rotation={[0, Math.PI / 2, 0]}>
      <mesh geometry={frame} material={m.steelBlack} castShadow />
      <B size={[0.035, H - 0.02, 0.05]} m={m.steelBlack} position={[0, H / 2, 0.025]} />
      <B size={[w - 0.05, 0.035, 0.05]} m={m.steelBlack} position={[0, (spring - sill) * 0.45, 0.025]} />
      <B size={[w - 0.05, 0.035, 0.05]} m={m.steelBlack} position={[0, spring - sill, 0.025]} />
      <mesh geometry={glass} material={m.glass} position={[0, 0, 0.02]} />
      <B size={[w + 0.12, 0.05, ROOM.t + 0.1]} m={m.terrazzo} position={[0, -0.025, 0.145]} />
    </group>
  );
}

const REFL = typeof window === "undefined" || new URLSearchParams(window.location.search).get("refl") !== "0";

function ReflectiveFloor({ width, depth, z }: { width: number; depth: number; z: number }) {
  const set = SETS_LOADED!.herringbone_parquet;
  const t = useMemo(() => pbr(set, width / 2.2, depth / 2.2), [set, width, depth]);
  if (!REFL)
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial name="floor" {...t} color="#3a2a20" roughness={0.75} metalness={0} />
      </mesh>
    );
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, z]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <MeshReflectorMaterial
        resolution={256}
        blur={[300, 100]}
        mixBlur={1.4}
        mixStrength={1.6}
        mixContrast={1.2}
        mirror={0.55}
        depthScale={0.8}
        minDepthThreshold={0.2}
        maxDepthThreshold={1.6}
        map={t.map}
        normalMap={t.normalMap}
        normalScale={new THREE.Vector2(0.5, 0.5)}
        roughnessMap={t.roughnessMap}
        aoMap={t.aoMap}
        color="#3a2a20"
        roughness={1}
        metalness={0}
      />
    </mesh>
  );
}

export default function Room() {
  const m = mats();
  const geo = useMemo(() => ({ left: leftWallGeometry(), back: backWallGeometry(), right: rightWallGeometry() }), []);
  const { x0, x1, z0, z1, h, t } = ROOM;
  const W = x1 - x0 + 2 * t, D = z1 - z0 + t;
  return (
    <group>
      <ReflectiveFloor width={W} depth={D} z={(z0 - t + z1) / 2} />
      <mesh geometry={geo.left} material={m.wall} rotation={[0, -Math.PI / 2, 0]} position={[x0, 0, 0]} castShadow receiveShadow />
      <mesh geometry={geo.back} material={m.wall} position={[0, 0, z0 - t]} castShadow receiveShadow />
      <mesh geometry={geo.right} material={m.wall} rotation={[0, Math.PI / 2, 0]} position={[x1, 0, 0]} castShadow receiveShadow />
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, (z0 + z1) / 2]} material={m.ceiling} receiveShadow>
        <planeGeometry args={[W, D + t]} />
      </mesh>
      {[-4.4, -2.2, 0, 2.2, 4.4].map((x) => (
        <B key={x} size={[0.2, 0.32, D + t]} m={m.beam} position={[x, h - 0.16, (z0 + z1) / 2]} />
      ))}
      {/* skirting in dark steel */}
      <B size={[0.02, 0.1, z1 - z0]} m={m.steelBlack} position={[x0 + 0.01, 0.05, 0]} />
      <B size={[x1 - x0, 0.1, 0.02]} m={m.steelBlack} position={[0, 0.05, z0 + 0.01]} />
      <B size={[0.02, 0.1, z1 - z0]} m={m.steelBlack} position={[x1 - 0.01, 0.05, 0]} />
      {WINDOWS.map((w) => (
        <WindowFrame key={w.z} {...w} />
      ))}
      <GlassDoor />
      <Corridor />
      <NeonSign />
    </group>
  );
}

/** Arched glass door with a slim brass frame, set in the opening. */
function GlassDoor() {
  const m = mats();
  const H = DOOR.spring + DOOR.w / 2;
  const { frame, glass } = useMemo(() => {
    const outer = archOutline(DOOR.w, H);
    const inner = archOutline(DOOR.w, H, 0.04);
    outer.holes.push(new THREE.Path(inner.getPoints(56)));
    return {
      frame: new THREE.ExtrudeGeometry(outer, { depth: 0.04, bevelEnabled: false, curveSegments: 56 }),
      glass: new THREE.ShapeGeometry(archOutline(DOOR.w, H, 0.04), 56),
    };
  }, [H]);
  return (
    <group position={[DOOR.x, 0, ROOM.z0 - ROOM.t * 0.55]}>
      <mesh geometry={frame} material={m.brass} castShadow />
      <mesh geometry={glass} material={m.glass} position={[0, 0, 0.02]} />
      <B size={[0.02, 0.5, 0.03]} m={m.brass} position={[DOOR.w / 2 - 0.16, 1.05, 0.06]} />
    </group>
  );
}

/** Dim corridor behind the door, with one warm light at its end. */
function Corridor() {
  const m = mats();
  const { z0, t } = ROOM;
  const zc = z0 - t - 1.6;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[DOOR.x, 0.001, zc]} material={m.stucco} receiveShadow>
        <planeGeometry args={[3.2, 3.3]} />
      </mesh>
      <B size={[3.2, 0.1, 3.4]} m={m.ceiling} position={[DOOR.x, 3.45, zc]} />
      <B size={[0.1, 3.4, 3.4]} m={m.wallBox} position={[DOOR.x - 1.6, 1.7, zc]} />
      <B size={[0.1, 3.4, 3.4]} m={m.wallBox} position={[DOOR.x + 1.6, 1.7, zc]} />
      <B size={[3.2, 3.4, 0.1]} m={m.wallBox} position={[DOOR.x, 1.7, zc - 1.65]} />
      <B size={[1.4, 0.06, 0.4]} m={m.oak} position={[DOOR.x, 0.44, zc - 1.35]} />
      <B size={[0.05, 0.42, 0.36]} m={m.steelBlack} position={[DOOR.x - 0.6, 0.21, zc - 1.35]} />
      <B size={[0.05, 0.42, 0.36]} m={m.steelBlack} position={[DOOR.x + 0.6, 0.21, zc - 1.35]} />
      {/* end wall washed by a hidden light: emissive, no extra light cost */}
      <mesh position={[DOOR.x, 1.7, zc - 1.59]}>
        <planeGeometry args={[3.1, 3.3]} />
        <meshStandardMaterial name="corridorGlow" color="#2a1d16" emissive="#ff9a55" emissiveIntensity={0.32} roughness={1} />
      </mesh>
    </group>
  );
}

/* ---------- Neon HoS sign: the logo at architectural scale ---------- */

function tube(points: THREE.Vector3[], closed = false, r = 0.013) {
  const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal", 0.0);
  return new THREE.TubeGeometry(curve, Math.max(24, points.length * 6), r, 10, closed);
}

function NeonSign() {
  const m = mats();
  const z = ROOM.z0 + 0.07;
  const rr = DOOR.w / 2;
  const geos = useMemo(() => {
    const out: THREE.TubeGeometry[] = [];
    // arch outline around the door opening (offset from the plaster edge)
    const o = 0.1;
    const arch: THREE.Vector3[] = [];
    arch.push(new THREE.Vector3(DOOR.x - rr - o, 0.16, z));
    arch.push(new THREE.Vector3(DOOR.x - rr - o, DOOR.spring, z));
    for (let i = 1; i < 32; i++) {
      const a = Math.PI - (i / 32) * Math.PI;
      arch.push(new THREE.Vector3(DOOR.x + Math.cos(a) * (rr + o), DOOR.spring + Math.sin(a) * (rr + o), z));
    }
    arch.push(new THREE.Vector3(DOOR.x + rr + o, DOOR.spring, z));
    arch.push(new THREE.Vector3(DOOR.x + rr + o, 0.16, z));
    out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arch, false, "catmullrom", 0.05), 240, 0.014, 10, false));
    // H
    const hx = DOOR.x - rr - 0.66, base = 1.64, cap = 0.6;
    out.push(tube([new THREE.Vector3(hx - 0.2, base, z), new THREE.Vector3(hx - 0.2, base + cap, z)]));
    out.push(tube([new THREE.Vector3(hx + 0.2, base, z), new THREE.Vector3(hx + 0.2, base + cap, z)]));
    out.push(tube([new THREE.Vector3(hx - 0.2, base + cap * 0.5, z), new THREE.Vector3(hx + 0.2, base + cap * 0.5, z)]));
    // S
    const sx = DOOR.x + rr + 0.66;
    const S: [number, number][] = [
      [0.19, 0.5], [0.12, 0.58], [0.0, 0.6], [-0.13, 0.57], [-0.19, 0.47], [-0.14, 0.36], [0.0, 0.3],
      [0.14, 0.24], [0.2, 0.13], [0.14, 0.03], [0.0, 0.0], [-0.13, 0.02], [-0.2, 0.1],
    ];
    out.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(S.map(([x, y]) => new THREE.Vector3(sx + x, base + y, z)), false, "centripetal"), 120, 0.013, 10, false));
    // threshold bar either side of the door
    out.push(tube([new THREE.Vector3(DOOR.x - rr - 1.15, 1.56, z), new THREE.Vector3(DOOR.x - rr - 0.22, 1.56, z)]));
    out.push(tube([new THREE.Vector3(DOOR.x + rr + 0.22, 1.56, z), new THREE.Vector3(DOOR.x + rr + 1.15, 1.56, z)]));
    return out;
  }, [z, rr]);
  // the "o" knob, on the glass door
  const knob = useMemo(() => new THREE.TorusGeometry(0.045, 0.011, 10, 40), []);
  const standoffs = useMemo(() => {
    const pts: [number, number][] = [
      [DOOR.x - rr - 0.1, 0.5], [DOOR.x - rr - 0.1, 1.6], [DOOR.x + rr + 0.1, 0.5], [DOOR.x + rr + 0.1, 1.6], [DOOR.x, DOOR.spring + rr + 0.1],
      [DOOR.x - rr - 0.86, 1.94], [DOOR.x - rr - 0.46, 1.94], [DOOR.x + rr + 0.66, 2.2], [DOOR.x + rr + 0.66, 1.66],
    ];
    return pts;
  }, [rr]);
  return (
    <group>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g} material={m.neon} />
      ))}
      <mesh geometry={knob} material={m.neon} position={[DOOR.x + rr - 0.2, 1.72, ROOM.z0 - ROOM.t * 0.55 + 0.05]} />
      {standoffs.map(([x, y], i) => (
        <C key={i} args={[0.008, 0.008, 0.06, 8]} m={m.brass} position={[x, y, ROOM.z0 + 0.035]} rotation={[Math.PI / 2, 0, 0]} />
      ))}
      {/* the sign lights its wall and the floor */}
      <pointLight position={[DOOR.x, 2.2, ROOM.z0 + 0.6]} intensity={6} distance={6} decay={2} color="#ff6a2a" />
    </group>
  );
}
