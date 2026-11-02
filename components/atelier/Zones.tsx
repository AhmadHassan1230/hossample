"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF, useTexture } from "@react-three/drei";
import { B, C, Lathe, mats } from "./kit";
import { DOOR, ROOM } from "./Room";
import { drawingMap } from "./textures";

/* Every discipline as a lit vignette in the dark studio. Positions in room metres. */

const deg = THREE.MathUtils.degToRad;
const PH = "/assets/ph";
export const MODEL_URLS = [
  `${PH}/pachira_aquatica_01/pachira_aquatica_01_1k.gltf`,
  `${PH}/potted_plant_02/potted_plant_02_1k.gltf`,
  `${PH}/calathea_orbifolia_01/calathea_orbifolia_01_1k.gltf`,
  `${PH}/ceramic_vase_01/ceramic_vase_01_1k.gltf`,
];

/** Spot light aimed at a world point (targets must live in the scene graph). */
function Spot({ from, to, ...p }: { from: [number, number, number]; to: [number, number, number] } & Omit<React.ComponentProps<"spotLight">, "position" | "target">) {
  const target = useMemo(() => new THREE.Object3D(), []);
  return (
    <>
      <primitive object={target} position={to} />
      <spotLight position={from} target={target} {...p} />
    </>
  );
}

function Model({ url, ...p }: { url: string } & React.ComponentProps<"group">) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return c;
  }, [scene]);
  return <primitive object={obj} {...p} />;
}

/* ---------- Furniture after HoS's own products ---------- */

export function OakCaneBench(props: React.ComponentProps<"group">) {
  const m = mats();
  const L = 1.45, D = 0.42, H = 0.44;
  return (
    <group {...props}>
      <B size={[L, 0.05, 0.05]} m={m.oak} position={[0, H, D / 2 - 0.025]} />
      <B size={[L, 0.05, 0.05]} m={m.oak} position={[0, H, -D / 2 + 0.025]} />
      <B size={[0.05, 0.05, D]} m={m.oak} position={[L / 2 - 0.1, H, 0]} />
      <B size={[0.05, 0.05, D]} m={m.oak} position={[-L / 2 + 0.1, H, 0]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, H + 0.012, 0]} material={m.cane} castShadow receiveShadow>
        <planeGeometry args={[L - 0.08, D - 0.08]} />
      </mesh>
      {[-1, 1].map((side) => (
        <group key={side} position={[side * (L / 2 - 0.16), 0, 0]}>
          {[-1, 1].map((z) => (
            <group key={z} position={[0, 0, z * (D / 2 - 0.05)]}>
              <B size={[0.05, 0.5, 0.045]} m={m.oak} position={[side * 0.07, 0.22, 0]} rotation={[0, 0, side * deg(-17)]} />
              <B size={[0.05, 0.5, 0.045]} m={m.oak} position={[-side * 0.07, 0.22, 0]} rotation={[0, 0, side * deg(17)]} />
            </group>
          ))}
          <B size={[0.04, 0.04, D - 0.06]} m={m.oak} position={[0, 0.16, 0]} />
        </group>
      ))}
    </group>
  );
}

export function SheeshamChair(props: React.ComponentProps<"group">) {
  const m = mats();
  const back = useMemo(() => new THREE.TorusGeometry(0.22, 0.022, 14, 64, Math.PI * 1.15), []);
  return (
    <group {...props}>
      <B size={[0.48, 0.05, 0.46]} m={m.sheesham} position={[0, 0.45, 0]} />
      <B size={[0.42, 0.035, 0.4]} m={m.leather} position={[0, 0.49, 0.01]} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
        <C key={`${x}${z}`} args={[0.022, 0.016, 0.45, 16]} m={m.sheesham} position={[x * 0.19, 0.225, z * 0.18]} rotation={[deg(z * -3), 0, deg(x * 3)]} />
      ))}
      <mesh geometry={back} material={m.sheesham} position={[0, 0.8, 0.02]} rotation={[deg(90), 0, deg(-12)]} castShadow receiveShadow />
      {[-1, 1].map((x) => (
        <C key={x} args={[0.016, 0.018, 0.34, 12]} m={m.sheesham} position={[x * 0.19, 0.64, -0.17]} rotation={[deg(-8), 0, 0]} />
      ))}
    </group>
  );
}

export function BoucleArmchair(props: React.ComponentProps<"group">) {
  const m = mats();
  const cap = useMemo(() => new THREE.CapsuleGeometry(0.11, 0.36, 10, 24), []);
  const arm = useMemo(() => new THREE.CapsuleGeometry(0.1, 0.42, 10, 24), []);
  return (
    <group {...props}>
      <B size={[0.74, 0.2, 0.66]} m={m.boucle} position={[0, 0.42, 0.03]} />
      {[-0.255, -0.085, 0.085, 0.255].map((x) => (
        <mesh key={x} geometry={cap} material={m.boucle} position={[x, 0.76, -0.25]} rotation={[deg(-12), 0, 0]} castShadow receiveShadow />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={arm} material={m.boucle} position={[s * 0.38, 0.58, 0.02]} rotation={[deg(90), 0, 0]} castShadow receiveShadow />
      ))}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, z]) => (
        <B key={`${x}${z}`} size={[0.045, 0.36, 0.045]} m={m.oak} position={[x * 0.3, 0.17, z * 0.24]} rotation={[deg(z * 10), 0, deg(x * -10)]} />
      ))}
    </group>
  );
}

export function ConsoleTable(props: React.ComponentProps<"group">) {
  const m = mats();
  const W = 1.5, H = 0.5, D = 0.42;
  return (
    <group {...props}>
      <B size={[W, H, D]} m={m.card} position={[0, 0.22 + H / 2, 0]} />
      <B size={[0.6, 0.004, 0.01]} m={m.ink} position={[-0.36, 0.22 + H / 2, D / 2 + 0.002]} />
      {[0.35, 0.58].map((y) => (
        <B key={y} size={[0.22, 0.016, 0.02]} m={m.ink} position={[-0.36, y, D / 2 + 0.012]} />
      ))}
      <B size={[0.016, 0.16, 0.02]} m={m.ink} position={[0.5, 0.48, D / 2 + 0.012]} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => (
        <C key={`${x}${z}`} args={[0.022, 0.014, 0.24, 12]} m={m.oak} position={[x * (W / 2 - 0.08), 0.11, z * (D / 2 - 0.07)]} rotation={[deg(z * 6), 0, deg(-x * 6)]} />
      ))}
    </group>
  );
}

function Vase({ kind, ...props }: { kind: "blue" | "banded" | "cream" | "tall"; position: [number, number, number]; scale?: number }) {
  const m = mats();
  if (kind === "blue")
    return <Lathe {...props} m={m.porcelain} profile={[[0.001, 0], [0.07, 0], [0.1, 0.05], [0.13, 0.14], [0.125, 0.22], [0.09, 0.3], [0.055, 0.35], [0.05, 0.4], [0.06, 0.43], [0.05, 0.43], [0.04, 0.4]]} />;
  if (kind === "banded")
    return (
      <group position={props.position} scale={props.scale ?? 1}>
        <Lathe m={m.ceramicCream} profile={[[0.001, 0], [0.08, 0], [0.13, 0.05], [0.15, 0.13], [0.14, 0.2], [0.1, 0.25], [0.06, 0.27], [0.055, 0.3], [0.045, 0.29]]} />
        <C args={[0.152, 0.151, 0.07, 64]} m={m.ceramicBand} position={[0, 0.14, 0]} />
      </group>
    );
  if (kind === "tall")
    return <Lathe {...props} m={m.clay} profile={[[0.001, 0], [0.06, 0], [0.09, 0.1], [0.1, 0.3], [0.07, 0.48], [0.045, 0.56], [0.05, 0.6], [0.04, 0.59]]} />;
  return <Lathe {...props} m={m.ceramicCream} profile={[[0.001, 0], [0.085, 0], [0.1, 0.06], [0.1, 0.2], [0.08, 0.25], [0.035, 0.29], [0.03, 0.34], [0.036, 0.35], [0.028, 0.34]]} />;
}

/* ---------- Zones ---------- */

export function Architecture() {
  const m = mats();
  const drawing = drawingMap(2);
  const drawing2 = drawingMap(5);
  const blocks: [number, number, number, number, number][] = [
    [0.18, 0.32, 0.16, -0.32, -0.18], [0.14, 0.18, 0.22, -0.12, -0.2], [0.3, 0.1, 0.18, 0.12, -0.18],
    [0.12, 0.44, 0.12, 0.3, -0.05], [0.22, 0.14, 0.14, -0.3, 0.12], [0.16, 0.24, 0.16, -0.05, 0.1], [0.2, 0.08, 0.26, 0.22, 0.18],
  ];
  return (
    <group position={[-3.0, 0, -1.5]} rotation={[0, deg(8), 0]}>
      <B size={[2.6, 0.06, 1.15]} m={m.oak} position={[0, 0.9, 0]} />
      {[-1.15, 1.15].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <B size={[0.045, 0.87, 0.045]} m={m.steelBlack} position={[0, 0.435, 0.42]} />
          <B size={[0.045, 0.87, 0.045]} m={m.steelBlack} position={[0, 0.435, -0.42]} />
          <B size={[0.04, 0.04, 0.88]} m={m.steelBlack} position={[0, 0.12, 0]} />
        </group>
      ))}
      <B size={[2.3, 0.04, 0.04]} m={m.steelBlack} position={[0, 0.12, 0]} />
      <group position={[-0.55, 0.93, 0]}>
        <B size={[1.0, 0.03, 0.7]} m={m.card} position={[0, 0.015, 0]} />
        {blocks.map(([w, h, d, x, z], i) => (
          <B key={i} size={[w, h, d]} m={m.card} position={[x, 0.03 + h / 2, z]} />
        ))}
        {[[0.36, 0.25], [0.42, 0.12], [-0.42, -0.02], [0.02, 0.27]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.08, z]} material={m.leaf} castShadow>
            <sphereGeometry args={[0.035, 16, 12]} />
          </mesh>
        ))}
      </group>
      <mesh rotation={[-Math.PI / 2, 0, deg(-6)]} position={[0.62, 0.932, 0.05]} receiveShadow>
        <planeGeometry args={[0.84, 0.59]} />
        <meshStandardMaterial name="drawing:2" map={drawing} roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, deg(9)]} position={[0.75, 0.931, -0.22]} receiveShadow>
        <planeGeometry args={[0.84, 0.59]} />
        <meshStandardMaterial name="drawing:5" map={drawing2} roughness={0.9} />
      </mesh>
      {[0, 0.08, 0.15].map((z, i) => (
        <C key={i} args={[0.032, 0.032, 0.72, 24]} m={m.paper} position={[0.2 + i * 0.03, 0.965, 0.42 - z]} rotation={[0, 0, deg(90)]} />
      ))}
      <B size={[0.3, 0.01, 0.03]} m={m.steel} position={[0.35, 0.94, 0.3]} rotation={[0, deg(20), 0]} />
      {/* task lamp (glow only) */}
      <group position={[1.05, 0.93, -0.38]}>
        <C args={[0.08, 0.09, 0.03, 32]} m={m.steelBlack} position={[0, 0.015, 0]} />
        <B size={[0.02, 0.5, 0.02]} m={m.steelBlack} position={[0, 0.27, 0]} rotation={[0, 0, deg(-15)]} />
        <B size={[0.02, 0.42, 0.02]} m={m.steelBlack} position={[-0.17, 0.62, 0]} rotation={[0, 0, deg(60)]} />
        <mesh position={[-0.36, 0.66, 0]} rotation={[0, 0, deg(-30)]} material={m.steelBlack} castShadow>
          <coneGeometry args={[0.08, 0.14, 32, 1, true]} />
        </mesh>
        <mesh position={[-0.39, 0.62, 0]} material={m.bulb}>
          <sphereGeometry args={[0.025, 16, 16]} />
        </mesh>
      </group>
      {/* stool */}
      <group position={[0.4, 0, 0.75]}>
        <C args={[0.19, 0.19, 0.045, 48]} m={m.oak} position={[0, 0.66, 0]} />
        {[0, 1, 2].map((i) => (
          <C key={i} args={[0.016, 0.014, 0.66, 10]} m={m.steelBlack} position={[Math.cos((i / 3) * Math.PI * 2) * 0.12, 0.33, Math.sin((i / 3) * Math.PI * 2) * 0.12]} />
        ))}
      </group>
      {/* brass pendant: the zone's key light, with soft shadows */}
      <group position={[-0.2, 0, 0]}>
        <B size={[0.006, 1.5, 0.006]} m={m.ink} position={[0, ROOM.h - 0.75, 0]} />
        <mesh position={[0, ROOM.h - 1.55, 0]} material={m.brass} castShadow>
          <sphereGeometry args={[0.22, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, ROOM.h - 1.6, 0]} material={m.bulb}>
          <sphereGeometry args={[0.045, 16, 16]} />
        </mesh>
      </group>
      <Spot
        from={[-0.2, ROOM.h - 1.66, 0]}
        to={[-0.2, 0, 0]}
        angle={0.72}
        penumbra={0.85}
        intensity={42}
        distance={7}
        decay={2}
        color="#ffbf80"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
    </group>
  );
}

export function Construction() {
  const m = mats();
  const bricks = useMemo(() => {
    const out: [number, number, number][] = [];
    for (let layer = 0; layer < 6; layer++)
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 2; j++) out.push(layer % 2 ? [j * 0.12 - 0.06, layer * 0.078 + 0.04, i * 0.24 - 0.24] : [i * 0.24 - 0.24, layer * 0.078 + 0.04, j * 0.12 - 0.06]);
    return out;
  }, []);
  const ibeam = useMemo(() => {
    const s = new THREE.Shape();
    const w = 0.14, h = 0.2, t = 0.012, f = 0.016;
    s.moveTo(-w / 2, -h / 2); s.lineTo(w / 2, -h / 2); s.lineTo(w / 2, -h / 2 + f); s.lineTo(t / 2, -h / 2 + f);
    s.lineTo(t / 2, h / 2 - f); s.lineTo(w / 2, h / 2 - f); s.lineTo(w / 2, h / 2); s.lineTo(-w / 2, h / 2);
    s.lineTo(-w / 2, h / 2 - f); s.lineTo(-t / 2, h / 2 - f); s.lineTo(-t / 2, -h / 2 + f); s.lineTo(-w / 2, -h / 2 + f); s.lineTo(-w / 2, -h / 2);
    return new THREE.ExtrudeGeometry(s, { depth: 2.6, bevelEnabled: false });
  }, []);
  return (
    <group>
      <group position={[-5.7, 0, -3.93]}>
        {[-0.5, 0.5].map((z) => [-0.2, 0.2].map((x) => <B key={`${z}${x}`} size={[0.035, 1.9, 0.035]} m={m.steelBlack} position={[x, 0.95, z]} />))}
        {[0.12, 0.72, 1.32, 1.86].map((y) => (
          <B key={y} size={[0.45, 0.03, 1.08]} m={m.steelBlack} position={[0, y, 0]} />
        ))}
        {[-0.3, 0.1, 0.42].map((z, i) => (
          <B key={`cb${i}`} size={[0.19, 0.19, 0.39]} m={m.concrete} position={[0, 0.235, z]} />
        ))}
        {[-0.45, -0.3, -0.15].map((z, i) => (
          <B key={`tile${i}`} size={[0.3, 0.3, 0.012]} m={i === 1 ? m.terrazzo : i === 0 ? m.rose : m.concrete} position={[0.02, 0.89, z]} rotation={[deg(-8), 0, 0]} />
        ))}
        <C args={[0.09, 0.09, 0.18, 32]} m={m.steel} position={[0, 0.83, 0.25]} />
        <C args={[0.09, 0.09, 0.18, 32]} m={m.rose} position={[0, 0.83, 0.42]} />
        {bricks.slice(0, 12).map((p, i) => (
          <B key={`sb${i}`} size={p[0] === 0 ? [0.11, 0.075, 0.23] : [0.23, 0.075, 0.11]} m={m.brick} position={[p[0] * 0.8, 1.38 + (i % 2) * 0.078, p[2] * 0.8 + 0.1]} />
        ))}
        <mesh position={[0, 1.97, -0.2]} material={m.card} castShadow>
          <sphereGeometry args={[0.13, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <C args={[0.17, 0.17, 0.012, 48]} m={m.card} position={[0, 1.875, -0.2]} />
      </group>
      <group position={[-4.75, 0, -3.95]}>
        <B size={[0.82, 0.1, 0.62]} m={m.oakLight} position={[0, 0.05, 0]} />
        {bricks.map(([x, y, z], i) => (
          <B key={i} size={i % 12 < 6 ? [0.23, 0.075, 0.11] : [0.11, 0.075, 0.23]} m={m.brick} position={[x, 0.1 + y, z + 0.06]} />
        ))}
      </group>
      <mesh geometry={ibeam} material={m.steelBlack} position={[-4.15, 0.05, -4.0]} rotation={[deg(-100), 0, 0]} castShadow receiveShadow />
      {[0, 1, 2, 3].map((i) => (
        <B key={i} size={[0.22, 0.045, 2.2]} m={m.oakLight} position={[-5.55 + i * 0.012, 0.025 + i * 0.045, -2.3 + i * 0.02]} rotation={[0, deg(i * 1.5), 0]} />
      ))}
      {/* work light clamped to the shelving */}
      <mesh position={[-5.45, 2.05, -3.45]} rotation={[deg(-120), deg(30), 0]} material={m.steelBlack}>
        <coneGeometry args={[0.07, 0.12, 24, 1, true]} />
      </mesh>
      <mesh position={[-5.42, 2.02, -3.42]} material={m.bulb}>
        <sphereGeometry args={[0.022, 12, 12]} />
      </mesh>
    </group>
  );
}

export function Interiors() {
  const m = mats();
  return (
    <group position={[-4.55, 0, 1.0]} rotation={[0, deg(70), 0]}>
      <B size={[2.6, 0.012, 1.9]} m={m.rug} position={[0.1, 0.006, 0.1]} />
      <BoucleArmchair position={[0, 0, 0]} rotation={[0, deg(-8), 0]} />
      <group position={[0.75, 0, 0.1]}>
        <C args={[0.26, 0.26, 0.04, 64]} m={m.terrazzo} position={[0, 0.52, 0]} />
        <C args={[0.1, 0.13, 0.5, 48]} m={m.terrazzo} position={[0, 0.25, 0]} />
        <Model url={MODEL_URLS[3]} position={[0.02, 0.54, 0]} scale={1.1} />
      </group>
      <group position={[-0.62, 0, -0.3]}>
        <C args={[0.14, 0.15, 0.025, 48]} m={m.brass} position={[0, 0.012, 0]} />
        <C args={[0.012, 0.012, 1.45, 12]} m={m.brass} position={[0, 0.73, 0]} />
        <mesh position={[0, 1.52, 0]} material={m.lampShade}>
          <cylinderGeometry args={[0.17, 0.22, 0.28, 48, 1, true]} />
        </mesh>
        <pointLight position={[0, 1.42, 0]} intensity={5} distance={5} decay={2} color="#ffb877" />
      </group>
      <Model url={MODEL_URLS[2]} position={[0.55, 0, -0.75]} scale={1.1} />
      <group position={[0.15, 0, -0.95]} rotation={[deg(-10), deg(10), 0]}>
        <B size={[0.62, 0.84, 0.025]} m={m.card} position={[0, 1.02, 0]} />
        {[m.terrazzo, m.oak, m.rose, m.concrete, m.boucle, m.sheesham, m.brass, m.linen, m.clay].map((mat, i) => (
          <B key={i} size={[0.15, 0.15, 0.02]} m={mat} position={[-0.19 + (i % 3) * 0.19, 1.22 - Math.floor(i / 3) * 0.2, 0.02]} />
        ))}
        <B size={[0.03, 1.4, 0.03]} m={m.oak} position={[-0.25, 0.68, 0.05]} rotation={[0, 0, deg(6)]} />
        <B size={[0.03, 1.4, 0.03]} m={m.oak} position={[0.25, 0.68, 0.05]} rotation={[0, 0, deg(-6)]} />
        <B size={[0.03, 1.3, 0.03]} m={m.oak} position={[0, 0.62, -0.3]} rotation={[deg(-22), 0, 0]} />
        <B size={[0.66, 0.03, 0.06]} m={m.oak} position={[0, 0.58, 0.04]} />
      </group>
    </group>
  );
}

export function Furniture() {
  const m = mats();
  return (
    <group position={[0.1, 0, 0.55]}>
      <B size={[3.1, 0.012, 2.1]} m={m.linen} position={[0, 0.006, 0]} />
      <OakCaneBench position={[0, 0, 0.55]} />
      <SheeshamChair position={[-0.95, 0, -0.45]} rotation={[0, deg(35), 0]} />
      <SheeshamChair position={[0.95, 0, -0.5]} rotation={[0, deg(-30), 0]} />
      <B size={[0.9, 0.36, 0.5]} m={m.terrazzo} position={[0, 0.18, -0.4]} />
      <Vase kind="blue" position={[0.22, 0.36, -0.4]} scale={0.9} />
      <Vase kind="cream" position={[-0.18, 0.36, -0.35]} />
      <B size={[0.005, 1.7, 0.005]} m={m.ink} position={[-1.05, ROOM.h - 0.85, 0.35]} />
      <mesh position={[-1.05, ROOM.h - 1.72, 0.35]} material={m.brass} castShadow>
        <cylinderGeometry args={[0.05, 0.16, 0.2, 48, 1, true]} />
      </mesh>
      <mesh position={[-1.05, ROOM.h - 1.8, 0.35]} material={m.bulb}>
        <sphereGeometry args={[0.035, 16, 16]} />
      </mesh>
      <pointLight position={[-0.6, ROOM.h - 1.85, 0.4]} intensity={7} distance={7} decay={2} color="#ffbd80" />
    </group>
  );
}

export function Filming() {
  const m = mats();
  const sweep = useMemo(() => {
    const w = 2.8;
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 2.9)];
    for (let i = 0; i <= 20; i++) {
      const a = (i / 20) * (Math.PI / 2);
      pts.push(new THREE.Vector2(0.6 - Math.cos(a) * 0.6, 0.6 - Math.sin(a) * 0.6));
    }
    pts.push(new THREE.Vector2(1.7, 0));
    const geo = new THREE.BufferGeometry();
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    let acc = 0;
    pts.forEach((p, i) => {
      if (i) acc += p.distanceTo(pts[i - 1]);
      pos.push(-w / 2, p.y + 0.005, p.x, w / 2, p.y + 0.005, p.x);
      uv.push(0, acc / 2, 1, acc / 2);
    });
    for (let i = 0; i < pts.length - 1; i++) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    return geo;
  }, []);
  return (
    <group>
      <group position={[3.9, 0, ROOM.z0 + 0.12]}>
        <mesh geometry={sweep} material={m.sweep} receiveShadow castShadow />
        <C args={[0.08, 0.08, 3.0, 32]} m={m.sweep} position={[0, 2.98, 0.05]} rotation={[0, 0, deg(90)]} />
        {[-1.55, 1.55].map((x) => (
          <B key={x} size={[0.03, 3.05, 0.03]} m={m.steelBlack} position={[x, 1.52, 0.05]} />
        ))}
        <SheeshamChair position={[0, 0, 1.0]} rotation={[0, deg(-20), 0]} />
      </group>
      <group position={[2.55, 0, -1.25]} rotation={[0, deg(30), 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return <B key={i} size={[0.025, 1.45, 0.025]} m={m.steelBlack} position={[Math.cos(a) * 0.16, 0.7, Math.sin(a) * 0.16]} rotation={[Math.sin(a) * deg(-12), 0, Math.cos(a) * deg(12)]} />;
        })}
        <C args={[0.04, 0.05, 0.12, 24]} m={m.steelBlack} position={[0, 1.44, 0]} />
        <group position={[0, 1.58, 0]} rotation={[deg(-4), 0, 0]}>
          <B size={[0.16, 0.13, 0.2]} m={m.steelBlack} position={[0, 0, 0]} />
          <C args={[0.045, 0.05, 0.16, 32]} m={m.ink} position={[0, 0, -0.18]} rotation={[deg(90), 0, 0]} />
          <B size={[0.17, 0.13, 0.02]} m={m.steelBlack} position={[0, 0, -0.29]} />
          <B size={[0.08, 0.06, 0.02]} m={m.screen} position={[0.11, 0.04, 0.06]} rotation={[0, deg(70), 0]} />
          <B size={[0.03, 0.03, 0.18]} m={m.steelBlack} position={[0, 0.09, 0.02]} />
          <mesh position={[0.06, 0.07, 0.101]} material={m.neon} scale={0.4}>
            <sphereGeometry args={[0.012, 8, 8]} />
          </mesh>
        </group>
      </group>
      <group position={[5.1, 0, -1.6]} rotation={[0, deg(-150), 0]}>
        {[0, 1, 2].map((i) => {
          const a = (i / 3) * Math.PI * 2;
          return <B key={i} size={[0.022, 0.7, 0.022]} m={m.steelBlack} position={[Math.cos(a) * 0.22, 0.3, Math.sin(a) * 0.22]} rotation={[Math.sin(a) * deg(-30), 0, Math.cos(a) * deg(30)]} />;
        })}
        <B size={[0.03, 1.9, 0.03]} m={m.steelBlack} position={[0, 0.95, 0]} />
        <group position={[0, 1.85, 0.08]} rotation={[deg(12), 0, 0]}>
          <mesh rotation={[deg(-90), deg(45), 0]} position={[0, 0, 0.16]} material={m.steelBlack} castShadow>
            <cylinderGeometry args={[0.46, 0.08, 0.34, 4, 1, true]} />
          </mesh>
          <mesh position={[0, 0, 0.335]} material={m.softbox}>
            <planeGeometry args={[0.62, 0.62]} />
          </mesh>
        </group>
      </group>
      <Spot
        from={[4.95, 1.95, -1.3]}
        to={[3.9, 0.5, -3.5]}
        angle={0.62}
        penumbra={1}
        intensity={30}
        distance={8}
        decay={2}
        color="#fff1e2"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-radius={8}
      />
    </group>
  );
}

function Print({ url, w, position, rotation, frame = "none" }: { url: string; w: number; position: [number, number, number]; rotation?: [number, number, number]; frame?: "walnut" | "black" | "none" }) {
  const m = mats();
  const t = useTexture(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const img = t.image as { width: number; height: number };
  const h = (w * img.height) / img.width;
  const border = frame === "none" ? 0 : 0.035;
  return (
    <group position={position} rotation={rotation}>
      {frame !== "none" && <B size={[w + border * 2 + 0.08, h + border * 2 + 0.08, 0.035]} m={frame === "walnut" ? m.walnut : m.steelBlack} position={[0, 0, 0.0175]} />}
      {frame !== "none" && <B size={[w + 0.08, h + 0.08, 0.01]} m={m.paper} position={[0, 0, 0.037]} />}
      <mesh position={[0, 0, frame === "none" ? 0.004 : 0.044]} castShadow={frame === "none"} receiveShadow>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial name={`print:${url}`} map={t} roughness={0.6} />
      </mesh>
    </group>
  );
}

export function Gallery() {
  const m = mats();
  const z = ROOM.z0 + 0.005;
  return (
    <group>
      <Print url="/work/overdose-technopark/tex.jpg" w={1.05} position={[-3.9, 2.05, z]} frame="walnut" />
      <Print url="/work/loop-bukhari/tex.jpg" w={0.78} position={[-2.65, 2.35, z]} frame="black" />
      <Print url="/work/overdose-sialkot/tex.jpg" w={0.46} position={[-2.65, 1.32, z]} frame="walnut" />
      <Print url="/work/loop-dolmen/tex.jpg" w={0.7} position={[-1.75, 1.75, z]} frame="black" />
      <Print url="/work/overdose-mm-alam/tex.jpg" w={0.62} position={[-3.95, 1.05, z]} frame="black" />
      <Print url="/work/od-loop-tipu/tex.jpg" w={0.56} position={[-1.75, 2.72, z]} frame="walnut" />
      <B size={[3.6, 0.03, 0.12]} m={m.oak} position={[-2.85, 0.62, ROOM.z0 + 0.06]} />
      <Print url="/work/overdose-civic-avenue/tex.jpg" w={0.42} position={[-3.6, 0.82, ROOM.z0 + 0.09]} rotation={[deg(-6), 0, 0]} frame="walnut" />
      <Print url="/work/loop-heuser/tex.jpg" w={0.36} position={[-2.2, 0.8, ROOM.z0 + 0.09]} rotation={[deg(-6), 0, 0]} frame="black" />
      {/* track rail + two gallery spots */}
      <B size={[3.4, 0.03, 0.03]} m={m.steelBlack} position={[-2.85, ROOM.h - 0.36, -3.1]} />
      {[-3.6, -2.1].map((x) => (
        <C key={x} args={[0.035, 0.03, 0.14, 24]} m={m.steelBlack} position={[x, ROOM.h - 0.45, -3.1]} rotation={[deg(-40), 0, 0]} />
      ))}
      <Spot from={[-2.85, ROOM.h - 0.5, -2.6]} to={[-2.85, 1.7, ROOM.z0]} angle={0.62} penumbra={0.85} intensity={40} distance={7} decay={2} color="#ffd7a6" />
    </group>
  );
}

export function Contact() {
  return (
    <group position={[DOOR.x - DOOR.w / 2 - 0.85, 0, ROOM.z0 + 0.25]}>
      <ConsoleTable position={[0, 0, 0]} />
      <Telephone position={[0.32, 0.725, 0.02]} />
      <Model url={MODEL_URLS[3]} position={[-0.42, 0.725, 0]} scale={1.35} />
    </group>
  );
}

function Telephone({ position }: { position: [number, number, number] }) {
  const m = mats();
  const handset = useMemo(() => new THREE.CapsuleGeometry(0.022, 0.16, 8, 16), []);
  return (
    <group position={position} rotation={[0, deg(-20), 0]}>
      <B size={[0.2, 0.08, 0.17]} m={m.rose} position={[0, 0.04, 0]} />
      <mesh geometry={handset} material={m.rose} position={[0, 0.1, 0]} rotation={[0, 0, deg(90)]} castShadow />
      <C args={[0.045, 0.045, 0.012, 32]} m={m.card} position={[0, 0.082, 0.05]} rotation={[deg(-60), 0, 0]} />
    </group>
  );
}

export function Exchange() {
  const m = mats();
  const archRing = useMemo(() => {
    const w = 0.7, h = 1.45, k = 0.06;
    const shape = (inset: number) => {
      const r = w / 2 - inset, spring = h - w / 2;
      const s = new THREE.Shape();
      s.moveTo(-r, inset); s.lineTo(r, inset); s.lineTo(r, spring); s.absarc(0, spring, r, 0, Math.PI, false); s.lineTo(-r, inset);
      return s;
    };
    const outer = shape(0);
    outer.holes.push(new THREE.Path(shape(k).getPoints(56)));
    return { ring: new THREE.ExtrudeGeometry(outer, { depth: 0.045, bevelEnabled: false, curveSegments: 56 }), glass: new THREE.ShapeGeometry(shape(k), 56) };
  }, []);
  return (
    <group position={[2.75, 0, 1.75]} rotation={[0, deg(-28), 0]}>
      <B size={[0.48, 0.92, 0.48]} m={m.travertine} position={[-0.55, 0.46, 0]} />
      <B size={[0.42, 0.62, 0.42]} m={m.concrete} position={[0.05, 0.31, 0.25]} />
      <B size={[0.55, 0.32, 0.55]} m={m.travertine} position={[0.62, 0.16, -0.05]} />
      <Vase kind="blue" position={[-0.55, 0.92, 0]} />
      <Vase kind="banded" position={[0.05, 0.62, 0.25]} />
      <Model url={MODEL_URLS[3]} position={[0.55, 0.32, -0.1]} scale={1.6} />
      <Vase kind="tall" position={[0.75, 0.32, 0.05]} scale={0.8} />
      <group position={[0.15, 0, -0.55]} rotation={[deg(-8), 0, 0]}>
        <mesh geometry={archRing.ring} material={m.walnut} castShadow receiveShadow />
        <mesh geometry={archRing.glass} material={m.mirror} position={[0, 0, 0.02]} />
      </group>
      <Spot from={[0.1, ROOM.h - 0.4, 0.6]} to={[0.0, 0.6, 0.0]} angle={0.55} penumbra={1} intensity={26} distance={6} decay={2} color="#ffd2a0" />
    </group>
  );
}

export function Content() {
  const m = mats();
  const screen = useTexture("/work/overdose-five-star/tex.jpg");
  screen.colorSpace = THREE.SRGBColorSpace;
  return (
    <group position={[5.25, 0, -0.45]} rotation={[0, deg(-90), 0]}>
      <B size={[1.7, 0.035, 0.72]} m={m.card} position={[0, 0.745, 0]} />
      {[-0.8, 0.8].map((x) => (
        <group key={x}>
          <B size={[0.035, 0.73, 0.035]} m={m.steelBlack} position={[x, 0.365, 0.32]} />
          <B size={[0.035, 0.73, 0.035]} m={m.steelBlack} position={[x, 0.365, -0.32]} />
          <B size={[0.035, 0.035, 0.66]} m={m.steelBlack} position={[x, 0.08, 0]} />
        </group>
      ))}
      <group position={[0, 0.76, -0.12]}>
        <B size={[0.2, 0.012, 0.14]} m={m.steelBlack} position={[0, 0.006, 0]} />
        <B size={[0.03, 0.26, 0.03]} m={m.steelBlack} position={[0, 0.14, -0.03]} />
        <B size={[0.72, 0.43, 0.025]} m={m.steelBlack} position={[0, 0.45, 0]} />
        <mesh position={[0, 0.45, 0.0135]}>
          <planeGeometry args={[0.69, 0.4]} />
          <meshStandardMaterial name="screen:/work/overdose-five-star/tex.jpg" map={screen} emissiveMap={screen} emissive="#ffffff" emissiveIntensity={1.4} roughness={0.25} />
        </mesh>
      </group>
      <B size={[0.42, 0.012, 0.14]} m={m.card} position={[0, 0.77, 0.15]} />
      <C args={[0.04, 0.035, 0.1, 32]} m={m.ceramicCream} position={[0.52, 0.81, 0.12]} />
      <B size={[0.22, 0.02, 0.3]} m={m.rose} position={[-0.55, 0.775, 0.05]} rotation={[0, deg(12), 0]} />
      <SheeshamChair position={[0.05, 0, 0.55]} rotation={[0, Math.PI, 0]} />
      <Model url={MODEL_URLS[1]} position={[1.25, 0, 0.15]} scale={1.15} />
    </group>
  );
}

export function Marketing() {
  const m = mats();
  const x = ROOM.x1 - 0.02;
  return (
    <group position={[x, 1.98, -0.45]} rotation={[0, -Math.PI / 2, 0]}>
      <B size={[1.9, 1.05, 0.03]} m={m.cork} position={[0, 0, 0]} />
      <Print url="/media/tex/console-table.jpg" w={0.28} position={[-0.72, 0.22, 0.02]} rotation={[0, 0, deg(-2)]} />
      <Print url="/media/tex/sheesham-chair.jpg" w={0.28} position={[-0.38, 0.18, 0.02]} rotation={[0, 0, deg(2)]} />
      <Print url="/media/tex/oak-cane-bench.jpg" w={0.28} position={[-0.04, 0.24, 0.02]} rotation={[0, 0, deg(-1)]} />
      <Print url="/media/tex/studio-expo.jpg" w={0.32} position={[0.34, 0.2, 0.02]} rotation={[0, 0, deg(3)]} />
      <Print url="/media/tex/boucle-sofa.jpg" w={0.24} position={[0.72, 0.22, 0.02]} rotation={[0, 0, deg(-3)]} />
      <Print url="/media/tex/study-table.jpg" w={0.24} position={[-0.55, -0.24, 0.02]} rotation={[0, 0, deg(2)]} />
      <Print url="/media/tex/vase-blue-white.jpg" w={0.22} position={[-0.2, -0.26, 0.02]} rotation={[0, 0, deg(-3)]} />
      <Print url="/media/tex/arch-mirror.jpg" w={0.22} position={[0.12, -0.25, 0.02]} rotation={[0, 0, deg(1)]} />
      <Print url="/media/tex/lounge-chair.jpg" w={0.24} position={[0.5, -0.24, 0.02]} rotation={[0, 0, deg(-2)]} />
    </group>
  );
}

export function Plants() {
  return (
    <>
      <Model url={MODEL_URLS[0]} position={[-5.25, 0, -1.3]} scale={1.25} rotation={[0, 1.2, 0]} />
    </>
  );
}

MODEL_URLS.forEach((u) => useGLTF.preload(u));
