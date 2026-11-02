"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { Builder, MAT, contactShadow } from "./kit";
import { tex } from "./materials";

/* The architect's drafting table, built in the browser where the baked one stood: a black steel
   trestle base, a hinged board tipped 24° towards the visitor with the HoS plan sheets taped down,
   a parallel rule on cables, a set square, pencils and a scale rule, the scanned arm lamp clamped
   at the back and the scanned stool in front. */

const AT = new THREE.Vector3(-7.55, 0, -6.15);   // by the jaali, clear of the study model behind it
const YAW = 0.48;             // faces the architecture camera
const TILT = THREE.MathUtils.degToRad(24);
const HINGE_Y = 0.86, DEPTH = 1.1, WIDTH = 1.84;

export const BOARD_BOX = { center: [-7.55, 0.95, -6.15] as const, size: [2.0, 1.4, 1.6] as const };

/** Clicking the board looks straight down onto the sheets, square to the tipped surface. */
export const BOARD_VIEW = (() => {
  const frame = new THREE.Object3D();
  frame.position.copy(AT);
  frame.rotation.y = YAW;
  const tip = new THREE.Object3D();
  tip.position.set(0, HINGE_Y, 0.42);
  tip.rotation.x = TILT;
  frame.add(tip);
  frame.updateMatrixWorld(true);
  const target = tip.localToWorld(new THREE.Vector3(0.01, 0, -0.74));
  const normal = new THREE.Vector3(0, 1, 0).transformDirection(tip.matrixWorld);
  const pos = target.clone().addScaledVector(normal, 1.75);
  return { pos: pos.toArray() as [number, number, number], target: target.toArray() as [number, number, number], lens: 30 };
})();

const steel = new THREE.MeshStandardMaterial({ color: "#1c1b1a", metalness: 0.65, roughness: 0.42 });
const alu = new THREE.MeshStandardMaterial({ color: "#c9cdd0", metalness: 1, roughness: 0.32 });
const vinyl = new THREE.MeshStandardMaterial({ color: "#cdd6c6", roughness: 0.82 });   // drafting-vinyl green
const tape = new THREE.MeshStandardMaterial({ color: "#efe3c2", roughness: 0.9 });
const setsq = new THREE.MeshPhysicalMaterial({ color: "#ff7a3a", roughness: 0.15, transparent: true, opacity: 0.55, depthWrite: false });

const sheetLoader = new THREE.TextureLoader();
function sheet(src: string, w: number, h: number, x: number, z: number, rot: number) {
  const t = sheetLoader.load(src);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, color: "#fff7ea", roughness: 0.92 }));
  m.rotation.set(-Math.PI / 2, 0, rot);
  m.position.set(x, 0.0025, z);
  return m;
}

function build() {
  const base = new Builder();
  for (const sx of [-0.84, 0.84]) {
    base.box(steel, 0.04, 0.82, 0.04, sx, 0.41, 0.36);
    base.box(steel, 0.04, 1.19, 0.04, sx, 0.595, -0.4);   // back legs carry the tipped board
    base.box(steel, 0.05, 0.03, 0.96, sx, 0.015, -0.02);
    base.box(steel, 0.035, 0.035, 0.82, sx, 0.62, -0.02);
    base.box(steel, 0.06, 0.012, 0.08, sx, 0.006, 0.44);   // levelling feet
    base.box(steel, 0.06, 0.012, 0.08, sx, 0.006, -0.48);
  }
  base.box(steel, 1.64, 0.035, 0.035, 0, 0.26, -0.38);
  base.box(steel, 1.64, 0.03, 0.03, 0, 0.84, 0.36);         // hinge bar
  // the board: birch-ply edge, vinyl drawing surface
  const board = new Builder();
  const ply = new THREE.MeshStandardMaterial({ map: tex("/studio/tex/oak_veneer_01/diff.jpg", true, 3), color: "#e6d2b4", roughness: 0.6 });
  board.box(ply, WIDTH, 0.03, DEPTH + 0.02, 0, -0.015, -DEPTH / 2);
  board.box(vinyl, WIDTH - 0.04, 0.002, DEPTH - 0.04, 0, 0.001, -DEPTH / 2);
  // parallel rule on its cables, with end pulleys
  board.box(alu, WIDTH - 0.06, 0.012, 0.055, 0, 0.012, -0.36);
  board.box(new THREE.MeshPhysicalMaterial({ color: "#e8f2f2", roughness: 0.05, transparent: true, opacity: 0.4, depthWrite: false }), WIDTH - 0.1, 0.004, 0.03, 0, 0.012, -0.405);
  for (const s of [-1, 1]) {
    board.cyl(alu, 0.015, 0.012, s * 0.89, 0.008, -0.06, 16);
    board.cyl(alu, 0.015, 0.012, s * 0.89, 0.008, -DEPTH + 0.06, 16);
    board.box(steel, 0.002, 0.002, DEPTH - 0.12, s * 0.9, 0.006, -DEPTH / 2);
  }
  // pencils, a triangular scale rule, tape dots
  const pencilA = new THREE.MeshStandardMaterial({ color: "#e0b43a", roughness: 0.5 });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.CylinderGeometry(0.0045, 0.0045, 0.18, 6);
    p.rotateZ(Math.PI / 2);
    p.rotateY(0.3 + i * 0.12);
    p.translate(0.55 + i * 0.03, 0.006, -0.18 - i * 0.02);
    board.add(i === 1 ? MAT.ink : pencilA, p);
  }
  const scale = new THREE.CylinderGeometry(0.014, 0.014, 0.3, 3);
  scale.rotateZ(Math.PI / 2);
  scale.rotateY(-0.25);
  scale.translate(-0.62, 0.012, -0.2);
  board.add(new THREE.MeshStandardMaterial({ color: "#f2f2ee", roughness: 0.4 }), scale);
  for (const [x, z] of [[-0.66, -0.52], [-0.02, -0.52], [-0.66, -0.98], [-0.02, -0.98], [0.12, -0.58], [0.72, -0.58], [0.12, -1.0], [0.72, -1.0]] as const)
    board.box(tape, 0.03, 0.001, 0.03, x, 0.004, z);
  const tri = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.26, 0), new THREE.Vector2(0, 0.15)]);
  const holed = new THREE.Path([new THREE.Vector2(0.05, 0.03), new THREE.Vector2(0.14, 0.03), new THREE.Vector2(0.05, 0.085)]);
  tri.holes.push(holed);
  const sq = new THREE.ExtrudeGeometry(tri, { depth: 0.003, bevelEnabled: false });
  sq.rotateX(-Math.PI / 2);
  sq.translate(0.2, 0.004, -0.42);
  board.add(setsq, sq);
  const boardGroup = new THREE.Group();
  boardGroup.add(board.build());
  boardGroup.add(sheet("/studio/img/p012-1-1398x1126.jpg", 0.72, 0.58, -0.34, -0.76, 0.03));
  boardGroup.add(sheet("/studio/img/p012-3-1115x1268.jpg", 0.6, 0.68, 0.42, -0.8, -0.05));
  const trace = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.44), new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, transparent: true, opacity: 0.38, depthWrite: false }));
  trace.rotation.set(-Math.PI / 2, 0, -0.12);
  trace.position.set(-0.18, 0.0045, -0.62);
  boardGroup.add(trace);
  boardGroup.position.set(0, HINGE_Y, 0.42);
  boardGroup.rotation.x = TILT;
  const root = new THREE.Group();
  root.add(base.build(), boardGroup);
  root.traverse((o) => ((o as THREE.Mesh).raycast = () => {}));
  return { root, boardGroup };
}

function Scan({ id, at, ry = 0 }: { id: string; at: [number, number, number]; ry?: number }) {
  const { scene } = useGLTF(`/assets/ph/${id}/${id}_1k.gltf`);
  const obj = useMemo(() => {
    const o = scene.clone(true);
    o.traverse((m) => ((m as THREE.Mesh).raycast = () => {}));
    return o;
  }, [scene]);
  return <primitive object={obj} position={at} rotation-y={ry} />;
}

export default function DrawingBoard() {
  const { root } = useMemo(build, []);
  // the lamp clamps to the back-left corner of the tipped board
  const back = new THREE.Vector3(-0.8, HINGE_Y + Math.sin(TILT) * (DEPTH - 0.08), 0.42 - Math.cos(TILT) * (DEPTH - 0.08));
  return (
    <group position={AT} rotation-y={YAW}>
      <primitive object={root} />
      <Scan id="desk_lamp_arm_01" at={[back.x, back.y, back.z]} ry={-0.9} />
      <Scan id="wooden_stool_01" at={[0.25, 0, 1.0]} ry={0.4} />
      <primitive object={contactShadow(2.1, 1.3, 0.4)} position={[0, 0.004, 0]} />
      <primitive object={contactShadow(0.6, 0.6, 0.4)} position={[0.25, 0.005, 1.0]} />
    </group>
  );
}
