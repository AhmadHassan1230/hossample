"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, PerformanceMonitor, useEnvironment } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import Merge from "./Merge";
import { ToneMappingMode } from "postprocessing";
import Room from "./Room";
import { MaterialKit } from "./kit";
import { Architecture, Construction, Contact, Content, Exchange, Filming, Furniture, Gallery, Interiors, Marketing, Plants } from "./Zones";
import { useAtelier } from "./store";
import { journey, STOPS } from "./stops";

const flags = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
export const FLAGS = {
  fx: flags.get("fx") !== "0",
  ao: flags.get("ao") !== "0",
  refl: flags.get("refl") !== "0",
  dpr: Number(flags.get("dpr") ?? 0) || 0,
  msaa: Number(flags.get("msaa") ?? 0),
  merge: flags.get("merge") !== "0",
};

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Camera follows the scroll along a spline through every stop, pausing briefly at each.
    Frames are only drawn while something moves (scroll, pointer, settling). */
function JourneyCamera() {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const kick = () => invalidate();
    window.addEventListener("scroll", kick, { passive: true });
    window.addEventListener("pointermove", kick, { passive: true });
    window.addEventListener("resize", kick);
    const lenis = (window as unknown as { __lenis?: { on: (e: string, f: () => void) => void; off: (e: string, f: () => void) => void } }).__lenis;
    lenis?.on("scroll", kick);
    const id = setInterval(kick, 500); // safety net for any missed event
    return () => {
      window.removeEventListener("scroll", kick);
      window.removeEventListener("pointermove", kick);
      window.removeEventListener("resize", kick);
      lenis?.off("scroll", kick);
      clearInterval(id);
    };
  }, [invalidate]);
  const curves = useMemo(
    () => ({
      pos: new THREE.CatmullRomCurve3(STOPS.map((s) => new THREE.Vector3(...s.pos)), false, "centripetal"),
      tgt: new THREE.CatmullRomCurve3(STOPS.map((s) => new THREE.Vector3(...s.target)), false, "centripetal"),
    }),
    [],
  );
  const p = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Vector3(), []);
  const pointer = useRef({ x: 0, y: 0, sx: 0, sy: 0 });

  useEffect(() => {
    const on = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on, { passive: true });
    return () => window.removeEventListener("pointermove", on);
  }, []);

  useFrame((state, dt) => {
    const d = Math.min(dt, 1 / 30);
    const before = journey.smooth;
    journey.smooth += (journey.progress - journey.smooth) * (1 - Math.exp(-d * 4));
    const ptrMoving = Math.abs(pointer.current.x - pointer.current.sx) > 0.0005 || Math.abs(pointer.current.y - pointer.current.sy) > 0.0005;
    if (Math.abs(journey.progress - journey.smooth) > 0.00002 || Math.abs(before - journey.smooth) > 0.00001 || ptrMoving) state.invalidate();
    const N = STOPS.length - 1;
    const x = Math.min(Math.max(journey.smooth, 0), 1) * N;
    const i = Math.min(Math.floor(x), N - 1);
    const t = (i + smoothstep(0.1, 0.9, x - i)) / N;
    curves.pos.getPoint(t, p);
    curves.tgt.getPoint(t, q);
    const ptr = pointer.current;
    ptr.sx += (ptr.x - ptr.sx) * (1 - Math.exp(-d * 2.5));
    ptr.sy += (ptr.y - ptr.sy) * (1 - Math.exp(-d * 2.5));
    p.x += ptr.sx * 0.16;
    p.y -= ptr.sy * 0.07;
    q.x += ptr.sx * 0.05;
    camera.position.copy(p);
    camera.lookAt(q);
  });
  return null;
}

/** Compile every shader, upload every texture and bake shadows before the reveal. */
function Warmup() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const setReady = useAtelier((s) => s.setReady);
  useEffect(() => {
    let cancelled = false;
    const frame = () => new Promise((r) => requestAnimationFrame(r));
    (async () => {
      const keys = ["map", "normalMap", "roughnessMap", "metalnessMap", "aoMap", "emissiveMap", "alphaMap", "bumpMap"] as const;
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((mat) => {
          keys.forEach((k) => {
            const t = (mat as unknown as Record<string, THREE.Texture | null>)[k];
            if (t) gl.initTexture(t);
          });
        });
      });
      await gl.compileAsync(scene, camera);
      gl.shadowMap.autoUpdate = true;
      for (let i = 0; i < 8; i++) {
        invalidate();
        await frame();
      }
      gl.shadowMap.autoUpdate = false; // nothing in the room moves
      if (!cancelled) setReady();
    })();
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, setReady, invalidate]);
  return null;
}

/** The dusk sky is only seen through the windows; it must not light the interior. */
function Sky() {
  const tex = useEnvironment({ files: "/assets/ph/belfast_sunset_puresky_1k.hdr" });
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    scene.background = tex;
    scene.backgroundIntensity = 0.5;
    scene.backgroundRotation.set(0, 2.2, 0);
  }, [scene, tex]);
  return null;
}

/** Reflections come from the room's own light sources: neon, pendant, softbox, dusk windows. */
function InteriorReflections() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.35}>
      <color attach="background" args={["#040303"]} />
      <Lightformer form="rect" intensity={0.7} color="#ff6a2a" position={[0.4, 2.1, -4.4]} scale={[2.4, 2.2, 1]} />
      <Lightformer form="circle" intensity={4} color="#ffbe80" position={[-3.2, 2.8, -1.5]} scale={0.35} />
      <Lightformer form="circle" intensity={3} color="#ffbe80" position={[-1, 2.6, 0.9]} scale={0.3} />
      <Lightformer form="rect" intensity={3} color="#fff0de" position={[4.9, 1.9, -1.4]} rotation-y={-2.4} scale={0.6} />
      <Lightformer form="rect" intensity={1.2} color="#6f84ad" position={[-6.4, 2.3, 0]} rotation-y={Math.PI / 2} scale={[8.5, 2.8, 1]} />
    </Environment>
  );
}

const MaybeMerge = ({ children }: { children: React.ReactNode }) => (FLAGS.merge ? <Merge>{children}</Merge> : <>{children}</>);

/** Dev only: window.__exportStudio() sends the studio to Blender for the lightmap bake. */
function ExportHook() {
  const scene = useThree((s) => s.scene);
  useEffect(() => {
    (window as unknown as { __exportStudio?: () => Promise<string> }).__exportStudio = async () => {
      const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
      const exporter = new GLTFExporter();
      const glb = (await exporter.parseAsync(scene, { binary: true, onlyVisible: true, maxTextureSize: 128 })) as ArrayBuffer;
      const res = await fetch("/api/dev/save?name=studio_export.glb", { method: "POST", body: glb });
      return `${res.status} ${(glb.byteLength / 1e6).toFixed(1)} MB`;
    };
  }, [scene]);
  return null;
}

function Studio() {
  return (
    <MaterialKit>
      <MaybeMerge>
      <Room />
      <Architecture />
      <Construction />
      <Interiors />
      <Furniture />
      <Filming />
      <Content />
      <Marketing />
      <Gallery />
      <Contact />
      <Exchange />
      <Plants />
      </MaybeMerge>
      {process.env.NODE_ENV !== "production" && <ExportHook />}
      <Warmup />
    </MaterialKit>
  );
}

export default function AtelierScene({ active = true }: { active?: boolean }) {
  const [dpr, setDpr] = useState(FLAGS.dpr || 1.25);
  return (
    <Canvas
      frameloop={active ? "demand" : "never"}
      shadows="percentage"
      dpr={dpr}
      gl={{ antialias: false, powerPreference: "high-performance", stencil: false }}
      camera={{ fov: 38, near: 0.08, far: 120, position: STOPS[0].pos }}
      style={{ position: "absolute", inset: 0 }}
    >
      <color attach="background" args={["#0b0909"]} />
      {!FLAGS.dpr && <PerformanceMonitor flipflops={3} onDecline={() => setDpr(1)} onIncline={() => setDpr(1.25)} onFallback={() => setDpr(1)} />}
      <hemisphereLight args={["#34405a", "#1a120e", 0.2]} />
      <InteriorReflections />
      <Suspense fallback={null}>
        <Sky />
        <Studio />
      </Suspense>
      <JourneyCamera />
      {FLAGS.fx && (
        <EffectComposer multisampling={FLAGS.msaa}>
          {FLAGS.ao ? <N8AO halfRes quality="performance" aoSamples={8} denoiseSamples={4} aoRadius={0.55} intensity={3} distanceFalloff={0.5} color={new THREE.Color("#080504")} /> : <></>}
          <Bloom mipmapBlur intensity={0.95} luminanceThreshold={0.95} luminanceSmoothing={0.2} radius={0.72} />
          <ToneMapping mode={ToneMappingMode.AGX} />
          <Vignette offset={0.22} darkness={0.62} />
          {FLAGS.msaa ? <></> : <SMAA />}
        </EffectComposer>
      )}
    </Canvas>
  );
}
