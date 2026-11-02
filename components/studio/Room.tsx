"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { makeMaterial, NIGHT, type Desc, type Lightmap } from "./materials";
import { applyEdits, HIDE_ITEMS } from "./edits";

export type Manifest = Record<"day" | "night", Record<string, { url: string; scale?: number; v?: number }>>;

const lmLoader = new THREE.TextureLoader();
function lmTexture(url: string) {
  const t = lmLoader.load(url);
  t.colorSpace = THREE.NoColorSpace;
  t.flipY = false;
  t.channel = 1;
  t.anisotropy = 4;
  return t;
}

function tagsOf(o: THREE.Object3D | null) {
  let item: string | undefined, atlas: string | undefined;
  for (let p = o; p; p = p.parent) {
    item ??= p.userData.item;
    atlas ??= p.userData.atlas;
  }
  return { item, atlas };
}

/** A sprig of jacaranda: a few five-petal blossoms on a transparent card. */
function blossomTexture() {
  const S = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  // fern-like compound leaves: a stem with paired leaflets
  const tones = ["#5d7d3a", "#6e8f45", "#4d6c2f", "#86a052", "#3f5f2a"];
  for (let f = 0; f < 6; f++) {
    const x0 = 30 + Math.random() * 196, y0 = 30 + Math.random() * 196, ang = Math.random() * Math.PI * 2, len = 70 + Math.random() * 40;
    ctx.strokeStyle = "#3d5226";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len);
    ctx.stroke();
    for (let k = 1; k < 9; k++) {
      const t = k / 9, px = x0 + Math.cos(ang) * len * t, py = y0 + Math.sin(ang) * len * t;
      ctx.fillStyle = tones[(f + k) % tones.length];
      for (const side of [-1, 1]) {
        const a = ang + side * 1.1;
        ctx.beginPath();
        ctx.ellipse(px + Math.cos(a) * 9, py + Math.sin(a) * 9, 10, 4, a, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The courtyard jacaranda: real bark and branches from the scan, its bloom grown in the browser
    (thousands of small blossom sprigs along the upper branches) instead of heavy leaf geometry. */
export function Tree({ mats }: { mats: Record<string, Desc> }) {
  const { scene } = useGLTF("/studio/tree.glb");
  const bloom = useMemo(() => {
    scene.updateMatrixWorld(true);
    const pts: THREE.Vector3[] = [];
    const v = new THREE.Vector3();
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const name = (mesh.material as THREE.Material).name;
      if (/leaves|leaf/i.test(name)) {
        mesh.visible = false;   // the thinned scan leaves read as confetti
        return;
      }
      if (mats[name]) mesh.material = makeMaterial(name, mats[name]);
      mesh.raycast = () => {};
      if (!/branch/i.test(name)) return;
      const pos = mesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i += 2) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mesh.matrixWorld);
        if (v.y > 3.0) pts.push(v.clone());
      }
    });
    if (!pts.length) return null;
    const N = 16000;
    const geo = new THREE.PlaneGeometry(1, 1);
    const mat = new THREE.MeshStandardMaterial({ map: blossomTexture(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.85 });
    const inst = new THREE.InstancedMesh(geo, mat, N);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const p = pts[(Math.random() * pts.length) | 0].clone();
      p.x += (Math.random() - 0.5) * 0.7;
      p.y += (Math.random() - 0.5) * 0.5;
      p.z += (Math.random() - 0.5) * 0.7;
      q.setFromEuler(e.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI));
      const s = 0.3 + Math.random() * 0.3;
      inst.setMatrixAt(i, m.compose(p, q, sc.set(s, s, s)));
      inst.setColorAt(i, c.setHSL(0.24 + Math.random() * 0.06, 0.3 + Math.random() * 0.2, 0.5 + Math.random() * 0.18));
    }
    inst.raycast = () => {};
    return inst;
  }, [scene, mats]);
  return (
    <>
      <primitive object={scene} />
      {bloom && <primitive object={bloom} />}
    </>
  );
}

/** A clickable object: its world bounds and which space it belongs to. */
export type ItemBox = { id: string; atlas?: string; zone?: string; box: THREE.Box3; center: THREE.Vector3; size: THREE.Vector3 };
export type RoomInfo = { items: ItemBox[]; occluders: THREE.Object3D[] };

export default function Room({ mats, manifest, onReady }: { mats: Record<string, Desc>; manifest: Manifest; onReady: (r: RoomInfo) => void }) {
  const { scene } = useGLTF("/studio/studio.glb");

  const info = useMemo<RoomInfo>(() => {
    const lms = new Map<string, Lightmap>();
    const lmFor = (atlas: string) => {
      if (!lms.has(atlas)) {
        const d = manifest.day?.[atlas], n = manifest.night?.[atlas] ?? d;
        if (!d) return undefined;
        lms.set(atlas, { day: lmTexture(`${d.url}?v=${d.v}`), night: lmTexture(`${n.url}?v=${n.v}`), sDay: d.scale!, sNight: n.scale! });
      }
      return lms.get(atlas);
    };
    const made = new Map<string, THREE.Material>();
    const occluders: THREE.Object3D[] = [];
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const { atlas, item } = tagsOf(mesh);
      const name = (mesh.material as THREE.Material).name;
      const d = mats[name];
      // photographs and drawings read best evenly lit (the bake leaves soft blotches on them)
      const lm = atlas && mesh.geometry.attributes.uv1 && d?.k !== "image" ? lmFor(atlas) : undefined;
      const key = `${name}|${lm ? atlas : "-"}`;
      if (d && !made.has(key)) made.set(key, makeMaterial(name, d, lm));
      if (d) mesh.material = made.get(key)!;
      if (name === "petal") (mesh.material as THREE.MeshStandardMaterial).color.set("#7d7445");   // fallen leaves, not blossom
      // walls, floor and courtyard stop the pointer; everything else is picked by its bounds
      if (!item && (atlas === "shell" || atlas === "floor" || atlas === "court")) occluders.push(mesh);
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
    });
    applyEdits(scene);
    const items: ItemBox[] = [];
    scene.traverse((o) => {
      if (!o.userData.item || o.parent?.userData.item) return;
      if (HIDE_ITEMS.has(o.userData.item)) {
        o.visible = false;
        return;
      }
      const box = new THREE.Box3().setFromObject(o);
      items.push({ id: o.userData.item, atlas: o.userData.atlas, box, center: box.getCenter(new THREE.Vector3()), size: box.getSize(new THREE.Vector3()) });
    });
    NIGHT.value = 0;
    return { items, occluders };
  }, [scene, mats, manifest]);

  useEffect(() => onReady(info), [info, onReady]);
  return <primitive object={scene} />;
}
