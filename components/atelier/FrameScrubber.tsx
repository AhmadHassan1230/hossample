"use client";
import { useEffect, useRef } from "react";
import { journey, STOPS } from "./stops";

/* The studio, path-traced in Blender Cycles, played back by scroll.
   Every frame is held compressed in memory; only a small window around the
   playhead is decoded, and neighbouring frames are crossfaded so motion is
   continuous. Same stop easing as the live camera (pause at each stop). */

export type Manifest = { total: number; perSegment: number; available: number; width: number; height: number; version?: number };

const WINDOW = 7; // frames decoded either side of the playhead
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
let VERSION = "";
const url = (i: number) => `/journey/f_${String(i + 1).padStart(4, "0")}.webp${VERSION}`;

export default function FrameScrubber({ onProgress, onReady }: { onProgress?: (p: number) => void; onReady?: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    const blobs: (Blob | undefined)[] = [];
    const bitmaps = new Map<number, ImageBitmap>();
    const decoding = new Set<number>();
    let manifest: Manifest | null = null;
    const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
    const onMove = (e: PointerEvent) => {
      ptr.x = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const decode = (i: number) => {
      const b = blobs[i];
      if (!b || bitmaps.has(i) || decoding.has(i)) return;
      decoding.add(i);
      createImageBitmap(b)
        .then((bm) => {
          decoding.delete(i);
          if (cancelled) return bm.close();
          bitmaps.set(i, bm);
        })
        .catch(() => decoding.delete(i));
    };

    const nearestDecoded = (i: number) => {
      for (let d = 0; d < 40; d++) {
        if (bitmaps.has(i - d)) return i - d;
        if (bitmaps.has(i + d)) return i + d;
      }
      return -1;
    };

    let lastKey = "";
    let prevT = performance.now();
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const dt = Math.min((now - prevT) / 1000, 1 / 20);
      prevT = now;
      const c = canvas.current;
      if (!c || !manifest) return;
      // follow the scroll with the same easing as the 3D camera
      journey.smooth += (journey.progress - journey.smooth) * (1 - Math.exp(-dt * 5));
      const N = STOPS.length - 1;
      const x = Math.min(Math.max(journey.smooth, 0), 1) * N;
      const seg = Math.min(Math.floor(x), N - 1);
      const t = (seg + smoothstep(0.1, 0.9, x - seg)) / N;
      const maxFrame = Math.max(0, manifest.available - 1);
      const f = Math.min(t * (manifest.total - 1), maxFrame);
      const i0 = Math.floor(f);
      const i1 = Math.min(i0 + 1, maxFrame);
      const k = f - i0;

      // keep the decode window around the playhead, release the rest
      for (let d = -WINDOW; d <= WINDOW; d++) decode(Math.min(Math.max(i0 + d, 0), maxFrame));
      for (const [i, bm] of bitmaps) {
        if (Math.abs(i - i0) > WINDOW + 3) {
          bm.close();
          bitmaps.delete(i);
        }
      }

      // gentle pointer parallax (the frame is rendered slightly oversized)
      ptr.sx += (ptr.x - ptr.sx) * (1 - Math.exp(-dt * 3));
      ptr.sy += (ptr.y - ptr.sy) * (1 - Math.exp(-dt * 3));
      c.style.transform = `translate3d(${(-ptr.sx * 0.9).toFixed(3)}%, ${(-ptr.sy * 0.6).toFixed(3)}%, 0) scale(1.035)`;

      const a = nearestDecoded(i0);
      if (a < 0) return;
      const key = `${a}|${i1}|${k.toFixed(3)}|${c.width}|${bitmaps.has(i1)}`;
      if (key === lastKey) return;
      lastKey = key;
      const ctx = c.getContext("2d")!;
      const bmA = bitmaps.get(a)!;
      const cover = (bm: ImageBitmap, alpha: number) => {
        const s = Math.max(c.width / bm.width, c.height / bm.height);
        const w = bm.width * s, h = bm.height * s;
        ctx.globalAlpha = alpha;
        ctx.drawImage(bm, (c.width - w) / 2, (c.height - h) / 2, w, h);
      };
      cover(bmA, 1);
      const bmB = a === i0 ? bitmaps.get(i1) : undefined;
      if (bmB && k > 0.001) cover(bmB, k);
      ctx.globalAlpha = 1;
    };

    const resize = () => {
      const c = canvas.current;
      if (!c) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      c.width = Math.round(c.clientWidth * dpr);
      c.height = Math.round(c.clientHeight * dpr);
      lastKey = "";
    };
    window.addEventListener("resize", resize);

    (async () => {
      manifest = (await fetch("/journey/manifest.json", { cache: "no-store" }).then((r) => r.json())) as Manifest;
      VERSION = manifest.version ? `?v=${manifest.version}` : "";
      resize();
      const n = manifest.available;
      let loaded = 0;
      // fetch in order, a few at a time; the first frames decode immediately
      const queue = Array.from({ length: n }, (_, i) => i);
      const worker = async () => {
        while (queue.length && !cancelled) {
          const i = queue.shift()!;
          const res = await fetch(url(i));
          blobs[i] = await res.blob();
          loaded++;
          onProgress?.(loaded / n);
          if (i < WINDOW * 2) decode(i);
        }
      };
      await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
      if (cancelled) return;
      // make sure the opening frame is decoded before revealing
      decode(0);
      for (let tries = 0; tries < 100 && !bitmaps.has(0); tries++) await new Promise((r) => setTimeout(r, 20));
      onReady?.();
    })();
    raf = requestAnimationFrame(draw);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("resize", resize);
      bitmaps.forEach((b) => b.close());
    };
  }, [onProgress, onReady]);

  return <canvas ref={canvas} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block", willChange: "transform" }} />;
}
