"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Builder, MAT, glowMat } from "./kit";
import { glowing } from "./materials";

/* Content & filming as a digital hub: two big screens on arms showing HoS's own Instagram and a
   product launch post (their real posts from /public/media), a large TV on the free wall with the
   HoS mark, a phone rig playing a reel, and a ring light by the set. */

type Fonts = { d: string; s: string; l: string };
export const SCREENS_BOX = { center: [9.42, 1.27, -9.63] as const, size: [0.4, 0.7, 2.1] as const };
export const TV_BOX = { center: [8.95, 1.85, -12.9] as const, size: [1.5, 0.9, 0.2] as const };

const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((res) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => res(im);
    im.src = src;
  });

function cover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  if (!im.naturalWidth) return;
  const s = Math.max(w / im.naturalWidth, h / im.naturalHeight);
  const sw = w / s, sh = h / s;
  ctx.drawImage(im, (im.naturalWidth - sw) / 2, (im.naturalHeight - sh) / 2, sw, sh, x, y, w, h);
}

function hosMark(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, ink: string, font: string) {
  const w = h * 0.5;
  ctx.save();
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = h * 0.03;
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
  ctx.font = `500 ${h * 0.3}px ${font}`;
  ctx.textAlign = "center";
  ctx.fillText("H", x - w * 0.9, y + h * 0.58);
  ctx.fillText("S", x + w * 0.9, y + h * 0.58);
  ctx.restore();
}

/** A screen whose picture is painted once its images have loaded. */
function screen(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => Promise<void> | void) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  Promise.resolve(paint(ctx)).then(() => (tex.needsUpdate = true));
  return tex;
}

const instagram = (f: Fonts) =>
  screen(1600, 930, async (ctx) => {
    const posts = ["studio-site-arch", "oak-cane-bench", "loop-bukhari-exterior", "vase-blue-white", "studio-craftsman", "timber-cafe"];
    const ims = await Promise.all(posts.map((p) => loadImg(`/media/${p}.jpg`)));
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 1600, 930);
    // profile header
    ctx.fillStyle = "#efe6d8";
    ctx.beginPath();
    ctx.arc(150, 130, 82, 0, 7);
    ctx.fill();
    hosMark(ctx, 150, 70, 110, "#2a211c", f.l);
    ctx.fillStyle = "#fff";
    ctx.font = `500 40px ${f.s}`;
    ctx.fillText("houseofsultana.co", 290, 100);
    ctx.fillStyle = "#0095f6";
    ctx.beginPath();
    ctx.roundRect(700, 66, 150, 52, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `600 26px ${f.s}`;
    ctx.fillText("Follow", 738, 101);
    ctx.fillStyle = "#363636";
    ctx.beginPath();
    ctx.roundRect(866, 66, 170, 52, 12);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("Message", 895, 101);
    ctx.font = `600 30px ${f.s}`;
    ctx.fillText("House of Sultana", 290, 170);
    ctx.fillStyle = "#c8c8c8";
    ctx.font = `400 27px ${f.s}`;
    ctx.fillText("Architecture · Interiors · Furniture · Decor", 290, 212);
    // highlights
    ["Projects", "Furniture", "Decor", "Studio"].forEach((label, i) => {
      const x = 130 + i * 150;
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, 300, 44, 0, 7);
      ctx.stroke();
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, 300, 39, 0, 7);
      ctx.clip();
      cover(ctx, ims[i], x - 39, 261, 78, 78);
      ctx.restore();
      ctx.fillStyle = "#ddd";
      ctx.font = `400 21px ${f.s}`;
      ctx.textAlign = "center";
      ctx.fillText(label, x, 375);
      ctx.textAlign = "left";
    });
    // grid
    ims.forEach((im, i) => {
      const c = i % 3, r = Math.floor(i / 3);
      cover(ctx, im, 4 + c * 532, 410 + r * 262, 528, 258);
    });
  });

const launch = (f: Fonts) =>
  screen(1600, 930, async (ctx) => {
    const [a, b2, c] = await Promise.all(["vase-banded", "vase-cream", "vase-blue-white"].map((p) => loadImg(`/media/${p}.jpg`)));
    ctx.fillStyle = "#0c0a09";
    ctx.fillRect(0, 0, 1600, 930);
    cover(ctx, a, 0, 0, 900, 930);
    cover(ctx, b2, 904, 0, 696, 463);
    cover(ctx, c, 904, 467, 696, 463);
    const g = ctx.createLinearGradient(0, 520, 0, 930);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.85)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 520, 900, 410);
    ctx.fillStyle = "#ff6a2a";
    ctx.font = `600 26px ${f.s}`;
    ctx.letterSpacing = "6px";
    ctx.fillText("NEW IN THE EXCHANGE", 56, 760);
    ctx.letterSpacing = "0px";
    ctx.fillStyle = "#f4ece0";
    ctx.font = `400 66px ${f.d}`;
    ctx.fillText("Home Decor", 52, 840);
    ctx.fillText("Collection 2025", 52, 906);
  });

const tvPicture = (f: Fonts) =>
  screen(1920, 1080, (ctx) => {
    const g = ctx.createRadialGradient(960, 540, 60, 960, 540, 1100);
    g.addColorStop(0, "#2a1a12");
    g.addColorStop(1, "#070505");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 1080);
    hosMark(ctx, 960, 170, 520, "#f2e8da", f.l);
    ctx.fillStyle = "#f2e8da";
    ctx.textAlign = "center";
    ctx.font = `500 70px ${f.d}`;
    ctx.letterSpacing = "30px";
    ctx.fillText("HOUSE OF SULTANA", 960 + 15, 860);
    ctx.letterSpacing = "8px";
    ctx.fillStyle = "#ff6a2a";
    ctx.font = `500 30px ${f.s}`;
    ctx.fillText("ARCHITECTURE · INTERIORS · FURNITURE", 960, 935);
  });

const reel = (f: Fonts) =>
  screen(540, 960, async (ctx) => {
    const im = await loadImg("/media/studio-factory-tour.jpg");
    cover(ctx, im, 0, 0, 540, 960);
    ctx.fillStyle = "rgba(0,0,0,.35)";
    ctx.fillRect(0, 760, 540, 200);
    ctx.fillStyle = "#fff";
    ctx.font = `600 30px ${f.s}`;
    ctx.fillText("houseofsultana.co", 30, 830);
    ctx.font = `400 26px ${f.s}`;
    ctx.fillText("From the workshop floor", 30, 880);
  });

function screenMat(tex: THREE.Texture, day = 1.0, night = 1.25) {
  const m = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color("#ffffff"), roughness: 0.35 });
  m.userData.glow = [day, night];
  glowing.push(m);
  return m;
}

function monitor(b: Builder, tex: THREE.Texture, w: number, h: number) {
  const g = new THREE.Group();
  const bez = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, h + 0.03, 0.03), MAT.ink);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat(tex));
  pic.position.z = 0.016;
  g.add(bez, pic);
  return g;
}

export default function Hub({ fonts }: { fonts: Fonts }) {
  const parts = useMemo(() => {
    const root = new THREE.Group();
    const b = new Builder();
    // two big monitors on arms, toed in a little
    const mA = monitor(b, instagram(fonts), 0.96, 0.56);
    mA.position.set(9.42, 1.27, -9.15);
    mA.rotation.y = -Math.PI / 2 + 0.14;
    const mB = monitor(b, launch(fonts), 0.96, 0.56);
    mB.position.set(9.42, 1.27, -10.11);
    mB.rotation.y = -Math.PI / 2 - 0.14;
    root.add(mA, mB);
    for (const z of [-9.15, -10.11]) {
      b.cyl(MAT.ink, 0.012, 0.5, 9.58, 1.02, z, 10);
      b.box(MAT.ink, 0.16, 0.012, 0.12, 9.58, 0.776, z);
    }
    // the big TV on the free wall
    const tv = new THREE.Group();
    tv.add(new THREE.Mesh(new THREE.BoxGeometry(1.44, 0.83, 0.04), MAT.ink));
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.79), screenMat(tvPicture(fonts), 1.1, 1.4));
    pic.position.z = 0.021;
    tv.add(pic);
    // on the free stretch of back wall beside the filming backdrop
    tv.position.set(8.95, 1.85, -12.97);
    root.add(tv);
    // a phone rig playing a reel, and a ring light by the set
    for (let a = 0; a < 3; a++) {
      const ang = (a / 3) * Math.PI * 2;
      const leg = new THREE.CylinderGeometry(0.008, 0.008, 1.42, 6);
      leg.rotateZ(Math.cos(ang) * 0.18);
      leg.rotateX(Math.sin(ang) * 0.18);
      leg.translate(7.0 + Math.cos(ang) * 0.13, 0.68, -9.3 + Math.sin(ang) * 0.13);
      b.add(MAT.ink, leg);
    }
    const phone = new THREE.Group();
    phone.add(new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.17, 0.01), MAT.ink));
    const ps = new THREE.Mesh(new THREE.PlaneGeometry(0.078, 0.16), screenMat(reel(fonts), 1.0, 1.3));
    ps.position.z = 0.006;
    phone.add(ps);
    phone.position.set(7.0, 1.45, -9.3);
    phone.rotation.y = -0.54;
    root.add(phone);
    const ring = new THREE.TorusGeometry(0.22, 0.018, 10, 48);
    ring.rotateY(-0.7);
    ring.translate(6.0, 1.5, -10.7);
    b.add(glowMat("#f4efe8", 0.12, 0.3), ring);
    b.cyl(MAT.ink, 0.01, 1.28, 6.0, 0.64, -10.7, 6);
    root.add(b.build());
    root.traverse((o) => ((o as THREE.Mesh).raycast = () => {}));
    return { root };
  }, [fonts]);
  return <primitive object={parts.root} />;
}
