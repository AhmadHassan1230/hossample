"use client";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Water } from "three/examples/jsm/objects/Water.js";
import { canvas, glowMat } from "./kit";
import { glowing, NIGHT } from "./materials";

/* The courtyard: the long Shalimar-style channel as real reflective water (planar reflection of the
   sky, the brass gateway and the jaali walls, slow wind ripples, sun glints by day), marble edging,
   and turned bronze lamp posts with hexagonal brass-and-glass lanterns that glow at night. */

const CHANNEL = { x: 0, z: -20.65, w: 3.2, d: 9.8, y: 0.188 };
const POSTS: [number, number][] = [];
for (const s of [-1, 1]) for (const z of [-16.9, -19.3, -24.4, -26.8]) POSTS.push([s * 2.35, z]);

/** Tileable ripple normals from periodic fractal noise (no downloaded texture). */
function waterNormals() {
  const N = 512;
  const h = new Float32Array(N * N);
  let amp = 1;
  for (let o = 0; o < 5; o++) {
    const c = 4 << o, g = new Float32Array(c * c).map(() => Math.random());
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const gx = (x / N) * c, gy = (y / N) * c, x0 = Math.floor(gx), y0 = Math.floor(gy);
        const tx = gx - x0, ty = gy - y0, sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        const a = g[(y0 % c) * c + (x0 % c)], b = g[(y0 % c) * c + ((x0 + 1) % c)], d = g[((y0 + 1) % c) * c + (x0 % c)], e = g[((y0 + 1) % c) * c + ((x0 + 1) % c)];
        h[y * N + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (d + (e - d) * sx) * sy);
      }
    amp *= 0.5;
  }
  const t = canvas(N, N, (ctx) => {
    const img = ctx.createImageData(N, N);
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)];
        const dy = h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x];
        const n = new THREE.Vector3(-dx * 3, -dy * 3, 1).normalize();
        const i = (y * N + x) * 4;
        img.data[i] = (n.x * 0.5 + 0.5) * 255;
        img.data[i + 1] = (n.y * 0.5 + 0.5) * 255;
        img.data[i + 2] = (n.z * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    ctx.putImageData(img, 0, 0);
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A little surface noise so metal and stone don't read as plastic. */
function grain(base: number, spread: number) {
  const t = canvas(256, 256, (ctx) => {
    const img = ctx.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (base + (Math.random() - 0.5) * spread) * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function lampPost(bronze: THREE.Material, brass: THREE.Material, stone: THREE.Material, glass: THREE.Material, glow: THREE.Material) {
  const g = new THREE.Group();
  // red sandstone plinth, like the arcades
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.23, 0.22, 8), stone);
  plinth.position.y = 0.11;
  g.add(plinth);
  // turned bronze shaft
  const prof = [
    [0.14, 0], [0.14, 0.05], [0.115, 0.07], [0.115, 0.12], [0.085, 0.15], [0.07, 0.22], [0.058, 0.3], [0.05, 0.6], [0.044, 1.2], [0.042, 1.45],
    [0.062, 1.48], [0.062, 1.52], [0.045, 1.55], [0.045, 1.6], [0.08, 1.63], [0.095, 1.66], [0.0, 1.66],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const shaft = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), bronze);
  shaft.position.y = 0.22;
  g.add(shaft);
  // the lantern: brass frame, glass panes, glowing heart, domed cap and finial
  const L = new THREE.Group();
  L.position.y = 0.22 + 1.66;
  const R = 0.13, H = 0.36;
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.014, H, 0.014), brass);
    bar.position.set(Math.cos(a) * R, H / 2, Math.sin(a) * R);
    L.add(bar);
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(R * 0.98, H * 0.92), glass);
    const am = a + Math.PI / 6;
    pane.position.set(Math.cos(am) * R * 0.866, H / 2, Math.sin(am) * R * 0.866);
    pane.rotation.y = -am + Math.PI / 2;
    L.add(pane);
  }
  for (const y of [0, H]) {
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.012, R + 0.012, 0.025, 6, 1, false), brass);
    ring.rotation.y = Math.PI / 6;
    ring.position.y = y;
    L.add(ring);
  }
  const dome = new THREE.Mesh(new THREE.LatheGeometry([0.15, 0.13, 0.1, 0.06, 0.02, 0].map((r, i) => new THREE.Vector2(r, i * 0.035)), 6), brass);
  dome.rotation.y = Math.PI / 6;
  dome.position.y = H + 0.01;
  L.add(dome);
  const fin = new THREE.Mesh(new THREE.SphereGeometry(0.022, 16, 12), brass);
  fin.position.y = H + 0.22;
  L.add(fin);
  const heart = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 12), glow);
  heart.position.y = H * 0.5;
  L.add(heart);
  g.add(L);
  return g;
}

function build() {
  const root = new THREE.Group();
  const bronze = new THREE.MeshStandardMaterial({ color: "#2e2822", metalness: 0.85, roughness: 0.42, roughnessMap: grain(0.85, 0.25) });
  const brass = new THREE.MeshStandardMaterial({ color: "#b9904f", metalness: 1, roughness: 0.3, roughnessMap: grain(0.8, 0.3) });
  const marble = new THREE.MeshStandardMaterial({ color: "#d9d2c6", roughness: 0.38, roughnessMap: grain(0.7, 0.35) });
  const stone = new THREE.MeshStandardMaterial({ color: "#a8755c", roughness: 0.8, roughnessMap: grain(0.85, 0.3) });
  const glass = new THREE.MeshStandardMaterial({ color: "#fff3df", roughness: 0.08, metalness: 0, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false, emissive: new THREE.Color("#ffc988"), emissiveIntensity: 0 });
  glass.userData.glow = [0.0, 0.9];
  const glow = glowMat("#ffc27a", 0.25, 9);
  glowing.push(glass);
  for (const [x, z] of POSTS) {
    const p = lampPost(bronze, brass, stone, glass, glow);
    p.position.set(x, 0, z);
    root.add(p);
  }
  // marble edging round the water
  for (const s of [-1, 1]) {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.07, CHANNEL.d + 0.32), marble);
    lip.position.set(s * (CHANNEL.w / 2 + 0.08), 0.205, CHANNEL.z);
    root.add(lip);
    const end = new THREE.Mesh(new THREE.BoxGeometry(CHANNEL.w + 0.32, 0.07, 0.16), marble);
    end.position.set(0, 0.205, CHANNEL.z + s * (CHANNEL.d / 2 + 0.08));
    root.add(end);
  }
  root.traverse((o) => ((o as THREE.Mesh).raycast = () => {}));
  // the water: planar reflection + rippled normals + sun glints
  const water = new Water(new THREE.PlaneGeometry(CHANNEL.w, CHANNEL.d), {
    textureWidth: 512,
    textureHeight: 512,
    waterNormals: waterNormals(),
    sunDirection: new THREE.Vector3(-0.86, 0.43, 0.26).normalize(),
    sunColor: 0xfff1d6,
    waterColor: 0x07191b,
    distortionScale: 3.2,
    fog: false,
  });
  water.rotation.x = -Math.PI / 2;
  water.position.set(CHANNEL.x, CHANNEL.y, CHANNEL.z);
  water.material.uniforms.size.value = 1.3;
  water.raycast = () => {};
  return { root, water };
}

export default function Garden({ show }: { show: boolean }) {
  const g = useMemo(build, []);
  const warm = useRef<THREE.PointLight>(null);
  const warm2 = useRef<THREE.PointLight>(null);
  const day = useMemo(() => new THREE.Color(0xfff1d6), []);
  const moon = useMemo(() => new THREE.Color(0x3b4660), []);
  useFrame((_, dt) => {
    const u = g.water.material.uniforms;
    u.time.value += dt * 0.35;
    u.sunColor.value.copy(day).lerp(moon, NIGHT.value);
    g.water.visible = show;   // the reflection pass only runs when the courtyard is in view
    if (warm.current) warm.current.intensity = 5 * NIGHT.value;
    if (warm2.current) warm2.current.intensity = 5 * NIGHT.value;
  });
  return (
    <group>
      <primitive object={g.root} />
      <primitive object={g.water} />
      <pointLight ref={warm} position={[0, 2.4, -18.0]} color="#ffbd7a" intensity={0} distance={8} decay={1.6} />
      <pointLight ref={warm2} position={[0, 2.6, -24.5]} color="#ffc488" intensity={0} distance={9} decay={1.6} />
    </group>
  );
}
