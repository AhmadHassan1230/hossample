"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, useProgress } from "@react-three/drei";
import { Bloom, EffectComposer, N8AO, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import TLink from "@/components/navigation/TLink";
import { whatsappHref } from "@/lib/inquiry";
import Room, { Tree, type ItemBox, type Manifest, type RoomInfo } from "./Room";
import { glowing, NIGHT, updateGlow, type Desc } from "./materials";
import { storyFonts } from "./story";
import CourtCards from "./CourtCards";
import PlanModel from "./PlanModel";
import HeroModel from "./HeroModel";
import Chandelier from "./Chandelier";
import Showroom from "./Showroom";
import Hub from "./Hub";
import Garden from "./Garden";
import DrawingBoard, { BOARD_VIEW } from "./DrawingBoard";
import { buildClickables } from "./extras";
import { useTransitionStore } from "@/components/navigation/transition";
import { VIEWS, zoneFor, type ViewId } from "./views";
import { infoFor, zoneOfItem } from "./items";
import { useStudioMode } from "./mode";

/* The homepage room: the Blender studio with its baked day / night light, full bleed.
   Two levels, Basement-style: click a space to fly into it, then click any object in that
   space to frame it and open its card. Esc or the back control steps out one level. */

type V3 = [number, number, number];
type Pose = { pos: V3; target: V3; lens: number; ev: [number, number]; path?: V3[]; sway?: number; dur?: number };

/** Vertical fov for a 36 mm-wide sensor, fitted to the longer side like Blender's "Auto". */
const vfov = (lens: number, aspect: number) => THREE.MathUtils.radToDeg(2 * Math.atan(18 / lens / Math.max(aspect, 1)));
const PANEL = 380;

// where each space shows from the overview (through its arch), in three.js coordinates
const ZONE_TAGS: { id: ViewId; at: V3 }[] = [
  { id: "left", at: [-4.3, 2.1, -8.5] },
  { id: "centre", at: [0, 1.35, -6.2] },
  { id: "right", at: [4.3, 1.9, -6.0] },
  { id: "content", at: [4.5, 2.5, -10.5] },
  { id: "court", at: [0, 3.6, -16] },
];

const viewPose = (id: ViewId): Pose => {
  const v = VIEWS[id];
  return { pos: v.pos, target: v.target, lens: v.lens, ev: v.ev, path: v.path, sway: v.sway, dur: v.dur };
};

/** Frame one object: square-on for things on the walls, from above for things lying on tables,
    a raised three-quarter view for furniture, from the first angle with nothing in the way. */
function itemPose(b: ItemBox, zone: ViewId, room: RoomInfo, obstacles: ItemBox[]): Pose {
  const v = VIEWS[zone];
  const c = b.center, s = b.size;
  const lens = 35;
  const half = THREE.MathUtils.degToRad(vfov(lens, 16 / 9)) / 2;
  const r = Math.max(s.x, s.y, s.z) * 0.6;
  const wall = c.x < -9.2 ? new THREE.Vector3(1, 0, 0) : c.x > 9.2 ? new THREE.Vector3(-1, 0, 0) : c.z < -12.3 ? new THREE.Vector3(0, 0, 1) : null;
  const flat = s.y < Math.max(s.x, s.z) * 0.2;
  const floor = !wall && !flat && c.y < 0.8;
  const d = THREE.MathUtils.clamp((r / Math.tan(half)) * (floor ? 1.1 : 1.35), floor ? 1.4 : 0.75, 7);
  const lift = flat ? d * 0.78 : floor ? d * 0.55 : wall ? 0 : Math.min(d * 0.25, 0.5);
  const toZone = new THREE.Vector3(v.pos[0] - c.x, 0, v.pos[2] - c.z).normalize();
  const ray = new THREE.Ray();
  const hit = new THREE.Vector3();
  const caster = new THREE.Raycaster();
  const clear = (p: THREE.Vector3) => {
    const dir = c.clone().sub(p);
    const len = dir.length();
    ray.set(p, dir.normalize());
    for (const o of obstacles) if (o.id !== b.id && !b.box.containsBox(o.box) && ray.intersectBox(o.box, hit) && hit.distanceTo(p) < len - r) return false;
    caster.set(p, ray.direction);
    caster.far = len - r;
    return caster.intersectObjects(room.occluders, false).length === 0;
  };
  const angles = wall ? [0] : [0, 30, -30, 60, -60, 90, -90, 135, -135, 180];
  let best: THREE.Vector3 | null = null;
  for (const deg of angles) {
    const n = (wall ?? toZone).clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(deg));
    const p = c.clone().addScaledVector(n, flat ? d * 0.62 : d);
    p.y = THREE.MathUtils.clamp(c.y + lift, 0.9, 3.8);
    if (wall) p.y = THREE.MathUtils.clamp(c.y, 1.0, 3.2);
    best ??= p;
    if (clear(p)) {
      best = p;
      break;
    }
  }
  return { pos: [best!.x, best!.y, best!.z], target: [c.x, c.y, c.z], lens, ev: v.ev };
}

function Rig({ pose, offset, night }: { pose: Pose; offset: number; night: boolean }) {
  const { camera, size, gl, scene } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const v0 = VIEWS.overview;
  const s = useRef({ px: v0.pos[0], py: v0.pos[1], pz: v0.pos[2], tx: v0.target[0], ty: v0.target[1], tz: v0.target[2], lens: v0.lens, evd: v0.ev[0], evn: v0.ev[1], ox: 0, sway: 0.9 });
  const pointer = useRef({ x: 0, y: 0 });
  const look = useRef(new THREE.Vector3(...v0.target));

  useEffect(() => {
    const tl = gsap.timeline();
    const c = s.current;
    const sway = pose.sway ?? (pose.lens > 30 ? 0.12 : 0.9);
    if (pose.path) {
      // fly a smooth curve through the waypoints (the story's lap around the table)
      const dur = pose.dur ?? 5;
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(c.px, c.py, c.pz), ...pose.path.map((p) => new THREE.Vector3(...p)), new THREE.Vector3(...pose.pos)], false, "centripetal");
      const o = { t: 0 };
      const p = new THREE.Vector3();
      tl.to(o, { t: 1, duration: dur, ease: "power2.inOut", onUpdate: () => (curve.getPoint(o.t, p), (c.px = p.x), (c.py = p.y), (c.pz = p.z)) }, 0);
      tl.to(c, { tx: pose.target[0], ty: pose.target[1], tz: pose.target[2], duration: dur * 0.3, ease: "power2.out" }, 0);
      tl.to(c, { lens: pose.lens, evd: pose.ev[0], evn: pose.ev[1], sway, duration: dur, ease: "power2.inOut" }, 0);
    } else {
      tl.to(c, { px: pose.pos[0], py: pose.pos[1], pz: pose.pos[2], tx: pose.target[0], ty: pose.target[1], tz: pose.target[2], lens: pose.lens, evd: pose.ev[0], evn: pose.ev[1], sway, duration: 1.9, ease: "power3.inOut" });
    }
    return () => {
      tl.kill();
    };
  }, [pose]);

  // day ↔ blue hour: a slow crossfade of the baked light, exposure, glows and sky
  useEffect(() => {
    const t = gsap.to(NIGHT, { value: night ? 1 : 0, duration: 2.6, ease: "sine.inOut" });
    return () => {
      t.kill();
    };
  }, [night]);

  useEffect(() => {
    const t = gsap.to(s.current, { ox: offset, duration: 1.2, ease: "power3.inOut" });
    return () => {
      t.kill();
    };
  }, [offset]);

  useEffect(() => {
    const on = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", on);
    return () => window.removeEventListener("pointermove", on);
  }, []);

  useFrame((_, dt) => {
    const c = s.current;
    cam.position.set(c.px, c.py, c.pz);
    // a slow look-around that follows the pointer (gentler when framing one object)
    const sway = c.sway;
    const k = 1 - Math.exp(-dt * 2.5);
    look.current.x += (c.tx + pointer.current.x * sway - look.current.x) * k;
    look.current.y += (c.ty - pointer.current.y * sway * 0.45 - look.current.y) * k;
    look.current.z += (c.tz - look.current.z) * k;
    cam.lookAt(look.current);
    const fov = vfov(c.lens, size.width / size.height);
    if (Math.abs(cam.fov - fov) > 0.01) cam.fov = fov;
    // the open card sits on the right: slide the picture left by half its width
    if (c.ox > 0.5) cam.setViewOffset(size.width, size.height, c.ox, 0, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    // exposure and sky follow the day/night blend, like the Cycles renders
    gl.toneMappingExposure = 2 ** (c.evd + (c.evn - c.evd) * NIGHT.value);
    updateGlow();
  });
  return null;
}

type Fonts = Awaited<ReturnType<typeof storyFonts>>;

/** The sky: a blue gradient dome by day, blue hour with a warm band at night. */
function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: { uNight: NIGHT },
        vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform float uNight; varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y, 0.0, 1.0);
            // linear radiance (tone-mapped with everything else): pale at the horizon, deep blue up high
            vec3 dayC = mix(vec3(0.46, 0.6, 0.78), vec3(0.06, 0.2, 0.62), pow(h, 0.55)) * 0.75;
            vec3 nightC = mix(vec3(0.07, 0.035, 0.05), vec3(0.002, 0.005, 0.022), pow(h, 0.35));
            gl_FragColor = vec4(mix(dayC, nightC, uNight), 1.0);
          }`,
      }),
    [],
  );
  return (
    <mesh material={mat} renderOrder={-10} raycast={() => null} frustumCulled={false}>
      <sphereGeometry args={[95, 32, 16]} />
    </mesh>
  );
}

/** Hover + click: rays against item bounds, stopped by walls and floor (no triangle soup). */
function Picker({ room, onHover, onPick }: { room: RoomInfo; onHover: (id: string | null) => void; onPick: (id: string | null, point: THREE.Vector3 | null) => void }) {
  const { camera, gl } = useThree();
  const ray = useRef(new THREE.Raycaster());
  const ndc = useRef(new THREE.Vector2(9, 9));
  const dirty = useRef(false);
  const hover = useRef<string | null>(null);

  const pick = useCallback(() => {
    ray.current.setFromCamera(ndc.current, camera);
    const wall = ray.current.intersectObjects(room.occluders, false)[0];
    const limit = wall ? wall.distance + 0.05 : Infinity;
    let best: string | null = null, bestD = limit;
    const hit = new THREE.Vector3();
    for (const it of room.items) {
      if (ray.current.ray.intersectBox(it.box, hit)) {
        const d = hit.distanceTo(ray.current.ray.origin);
        if (d < bestD) {
          bestD = d;
          best = it.id;
        }
      }
    }
    return { id: best, point: wall ? wall.point : null };
  }, [camera, room]);

  useEffect(() => {
    const el = gl.domElement;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      ndc.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      dirty.current = true;
    };
    const click = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      ndc.current.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      const p = pick();
      onPick(p.id, p.point);
    };
    const leave = () => {
      ndc.current.set(9, 9);
      dirty.current = true;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("click", click);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("click", click);
      el.removeEventListener("pointerleave", leave);
    };
  }, [gl, pick, onPick]);

  useFrame(() => {
    if (!dirty.current) return;
    dirty.current = false;
    const id = Math.abs(ndc.current.x) > 1 ? null : pick().id;
    if (id !== hover.current) {
      hover.current = id;
      onHover(id);
    }
  });
  return null;
}

function Loader({ onDone }: { onDone: () => void }) {
  const { active, progress } = useProgress();
  const bar = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const done = useRef(false);
  useEffect(() => {
    if (bar.current) bar.current.style.transform = `scaleX(${progress / 100})`;
    if (!active && progress === 100 && !done.current) {
      done.current = true;
      gsap.to(root.current, { opacity: 0, duration: 1.2, delay: 0.6, ease: "power2.out", onComplete: onDone });
    }
  }, [active, progress, onDone]);
  return (
    <div ref={root} className="studio__loader" aria-hidden>
      <span className="studio__loader-name">House of Sultana</span>
      <span className="studio__loader-bar">
        <span ref={bar} />
      </span>
    </div>
  );
}

function Card({ id, onClose }: { id: string | null; onClose: () => void }) {
  const info = id ? infoFor(id) : null;
  const wa = info?.inquiry ? whatsappHref(info.inquiry) : null;
  return (
    <aside className={`studio__card ${info ? "is-open" : ""}`} aria-hidden={!info}>
      {info && (
        <>
          <button className="studio__close" onClick={onClose} aria-label="Close">
            ×
          </button>
          {info.meta && <p className="studio__meta">{info.meta}</p>}
          <h3 className="studio__title">{info.title}</h3>
          {info.line && <p className="studio__line">{info.line}</p>}
          {info.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="studio__img" src={info.image} alt="" />
          )}
          {info.gallery && (
            <div className="studio__gallery">
              {info.gallery.map((g) => (
                <TLink key={g.href} href={g.href} title={g.title}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.src} alt={g.title} />
                </TLink>
              ))}
            </div>
          )}
          <div className="studio__actions">
            {info.href &&
              (info.external ? (
                <a className="btn" href={info.href} target="_blank" rel="noopener noreferrer">
                  {info.hrefLabel ?? "Open"}
                </a>
              ) : (
                <TLink className="btn" href={info.href}>
                  {info.hrefLabel ?? "Open"}
                </TLink>
              ))}
            {wa && (
              <a className="studio__wa" href={wa} target="_blank" rel="noopener noreferrer">
                Ask on WhatsApp
              </a>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

export default function Studio() {
  const [data, setData] = useState<{ mats: Record<string, Desc>; manifest: Manifest; tree: boolean } | null>(null);
  const [room, setRoom] = useState<RoomInfo | null>(null);
  const [view, setView] = useState<ViewId>("overview");
  const [focus, setFocus] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const night = useStudioMode((m) => m.night);
  const [fonts, setFonts] = useState<Fonts | null>(null);
  useEffect(() => {
    storyFonts().then(setFonts);
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/studio/materials.json").then((r) => r.json()),
      fetch("/studio/lm/manifest.json", { cache: "no-store" }).then((r) => r.json()),
      fetch("/studio/tree.glb", { method: "HEAD" }).then((r) => r.ok, () => false),
    ]).then(([mats, manifest, tree]) => setData({ mats, manifest, tree }));
  }, []);

  const goView = useCallback((v: ViewId) => {
    setFocus(null);
    setView(v);
    // the right side (furniture, interiors, content, filming) turns the studio to night and it stays;
    // the architecture side brings the day back; the centre and courtyard keep whatever it is
    if (v === "right" || v === "content") useStudioMode.getState().setNight(true);
    if (v === "left") useStudioMode.getState().setNight(false);
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (focus) setFocus(null);
      else setView("overview");
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [focus]);

  const clickables = useMemo<RoomInfo | null>(() => (room ? { items: buildClickables(room.items), occluders: room.occluders } : null), [room]);
  const byId = useMemo(() => new Map((clickables?.items ?? []).map((i) => [i.id, i])), [clickables]);
  const zoneOf = useCallback((id: string) => (byId.get(id)?.zone as ViewId | undefined) ?? zoneOfItem(id, byId.get(id)?.atlas), [byId]);
  const go = useTransitionStore((t) => t.go);

  // first click enters the space, a click inside a space frames the object
  const onPick = useCallback(
    (id: string | null, point: THREE.Vector3 | null) => {
      const info = id ? infoFor(id) : null;
      if (id && info) {
        const z = zoneOf(id);
        if (view !== z) goView(z);
        else if (info.navigate) go(info.navigate);
        else setFocus(id);
        return;
      }
      if (focus) return setFocus(null);
      if (point) {
        const z = zoneFor(undefined, undefined, point.x, point.z);
        if (z !== view) goView(z);
      }
    },
    [view, focus, zoneOf, goView, go],
  );

  // the lap around the table plays when you arrive in a space, not when you step back from an object
  const lastView = useRef<ViewId>("overview");
  const pose = useMemo(() => {
    const it = focus ? byId.get(focus) : null;
    if (focus === "drawing_board") return { ...BOARD_VIEW, ev: VIEWS[view].ev, sway: 0.04 };
    if (it && clickables && room) return itemPose(it, view, clickables, [...room.items, ...clickables.items]);
    const p = viewPose(view);
    return lastView.current === view ? { ...p, path: undefined } : p;
  }, [focus, view, byId, clickables, room]);
  useEffect(() => {
    lastView.current = view;
  }, [view]);

  const hasNight = !!data?.manifest.night && Object.keys(data.manifest.night).length >= 6;
  const isNight = night && hasNight;
  const env = data ? ((isNight ? data.manifest.night?.env?.url : null) ?? data.manifest.day.env?.url ?? null) : null;
  const markers = clickables && view !== "overview" && !focus ? clickables.items.filter((i) => zoneOf(i.id) === view && infoFor(i.id) && i.id !== "long_table") : [];

  return (
    <section className="studio" aria-label="The House of Sultana studio" data-hover={hover ? "item" : view === "overview" ? "zone" : ""}>
      {data && (
        <Canvas
          className="studio__canvas"
          dpr={[1, 1.5]}
          camera={{ position: VIEWS.overview.pos, fov: 60, near: 0.05, far: 120 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          onCreated={({ gl, scene, camera }) => {
            gl.toneMapping = THREE.AgXToneMapping;
            gl.toneMappingExposure = 2 ** 1.4;   // the Cycles renders used +1.4 stops
            if (process.env.NODE_ENV !== "production") {
              // dev: grab a frame even when the tab is not on screen (used to compare with the Cycles renders)
              (window as unknown as { __studio: object }).__studio = {
                setView: goView,
                setFocus,
                gl,
                scene,
                camera,
                shot: async (name: string, id: ViewId = "overview", night = 0, w = 1600, h = 900) => {
                  const cam = camera as THREE.PerspectiveCamera;
                  const v = VIEWS[id];
                  gl.setPixelRatio(1);
                  gl.setSize(w, h, false);
                  cam.clearViewOffset();
                  cam.position.set(...v.pos);
                  cam.lookAt(...v.target);
                  cam.aspect = w / h;
                  cam.fov = vfov(v.lens, w / h);
                  cam.updateProjectionMatrix();
                  NIGHT.value = night;
                  gl.toneMappingExposure = 2 ** v.ev[night ? 1 : 0];
                  updateGlow();
                  gl.render(scene, cam);
                  const blob = await new Promise<Blob>((r) => gl.domElement.toBlob((b) => r(b!), "image/png"));
                  return fetch(`/api/dev/save?name=${name}`, { method: "POST", body: blob }).then((r) => r.json());
                },
              };
            }
          }}
        >
          <Suspense fallback={null}>
            <Room mats={data.mats} manifest={data.manifest} onReady={setRoom} />
            {env && <Environment files={env} />}
          </Suspense>
          {data.tree && (
            <Suspense fallback={null}>
              <Tree mats={data.mats} />
            </Suspense>
          )}
          {clickables && <Picker room={clickables} onHover={setHover} onPick={onPick} />}
          <Rig pose={pose} offset={focus ? PANEL / 2 : 0} night={isNight} />
          <EffectComposer multisampling={0}>
            <N8AO halfRes aoRadius={0.55} intensity={1.7} distanceFalloff={0.7} quality="medium" />
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={4.5} luminanceSmoothing={0.35} />
            <ToneMapping mode={ToneMappingMode.AGX} />
            <SMAA />
          </EffectComposer>
          <Sky />
          {fonts && <PlanModel fonts={fonts} active={view === "centre"} />}
          {fonts && <Hub fonts={fonts} />}
          <HeroModel />
          <Chandelier />
          <Garden show={view === "court" || view === "overview"} />
          <Suspense fallback={null}>
            <Showroom />
          </Suspense>
          <Suspense fallback={null}>
            <DrawingBoard />
          </Suspense>

          {/* level 1: the spaces, named where they are */}
          {loaded &&
            view === "overview" &&
            ZONE_TAGS.map((z) => (
              <Html key={z.id} position={z.at} center zIndexRange={[10, 0]}>
                <button className="studio__tag" onPointerDown={(e) => e.preventDefault()} onClick={() => goView(z.id)}>
                  {VIEWS[z.id].label}
                </button>
              </Html>
            ))}

          {/* level 2: every clickable object in this space */}
          {markers.map((it) => (
            <Html key={it.id} position={[it.center.x, it.box.max.y + 0.06, it.center.z]} center zIndexRange={[10, 0]}>
              <button className={`studio__dot ${hover === it.id ? "is-hover" : ""}`} onPointerDown={(e) => e.preventDefault()} onClick={() => (infoFor(it.id)?.navigate ? go(infoFor(it.id)!.navigate!) : setFocus(it.id))} onPointerEnter={() => setHover(it.id)} onPointerLeave={() => setHover(null)}>
                <i />
                <span>{infoFor(it.id)!.title}</span>
              </button>
            </Html>
          ))}
        </Canvas>
      )}
      {!loaded && <Loader onDone={() => setLoaded(true)} />}
      {loaded && (
        <div className="studio__ui">
          {focus || view !== "overview" ? (
            <button className="studio__back" onClick={() => (focus ? setFocus(null) : goView("overview"))}>
              ← {focus ? VIEWS[view].label : "Studio"}
            </button>
          ) : (
            <span className="studio__hint">Click a space to enter it</span>
          )}
          {!focus && <span className="studio__label">{view === "overview" ? "" : "Click an object to look closer"}</span>}
        </div>
      )}
      <Card id={focus} onClose={() => setFocus(null)} />
      <CourtCards show={loaded && view === "court" && !focus} />
      <style>{`
        .studio{position:relative;height:100svh;min-height:560px;background:#0b0909;overflow:clip}
        .studio__canvas{position:absolute!important;inset:0}
        .studio::before{content:"";position:absolute;left:0;right:0;top:0;height:150px;z-index:11;pointer-events:none;background:linear-gradient(rgba(11,9,9,.42),rgba(11,9,9,0))}
        .studio[data-hover=item] .studio__canvas,.studio[data-hover=zone] .studio__canvas{cursor:pointer}
        .studio__loader{position:absolute;inset:0;display:grid;place-content:center;justify-items:center;gap:18px;background:#0b0909;z-index:30}
        .studio__loader-name{font-family:var(--font-display);font-size:12.5px;letter-spacing:.32em;text-transform:uppercase}
        .studio__loader-bar{width:180px;height:1px;background:rgba(239,230,221,.18);overflow:hidden}
        .studio__loader-bar span{display:block;height:100%;background:var(--rose);transform-origin:left;transform:scaleX(0);transition:transform .4s}
        .studio__ui{position:absolute;left:0;right:0;bottom:0;z-index:12;display:flex;justify-content:space-between;align-items:center;padding:22px clamp(20px,4vw,48px);pointer-events:none;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase}
        .studio__ui>*{pointer-events:auto}
        .studio__back,.studio__tag{background:rgba(11,9,9,.62);color:var(--fg);border:0;border-radius:999px;padding:10px 16px;font:inherit;font-size:12.5px;letter-spacing:.1em;text-transform:uppercase;cursor:pointer;backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);white-space:nowrap;transition:background .3s,color .3s}
        .studio__tag:hover{background:var(--rose);color:#0b0909}
        .studio__hint,.studio__label{color:rgba(255,255,255,.9);text-shadow:0 1px 12px rgba(0,0,0,.5)}
        .studio__dot{display:flex;align-items:center;gap:8px;background:none;border:0;padding:6px;cursor:pointer;font:inherit;color:var(--fg)}
        .studio__dot i{width:11px;height:11px;border-radius:50%;background:var(--rose);box-shadow:0 0 0 4px rgba(255,90,31,.25);flex:none;transition:transform .3s}
        .studio__dot span{background:rgba(11,9,9,.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-radius:999px;padding:6px 11px;font-size:12px;letter-spacing:.06em;white-space:nowrap;opacity:0;transform:translateX(-4px);transition:opacity .25s,transform .25s;pointer-events:none}
        .studio__dot:hover span,.studio__dot.is-hover span{opacity:1;transform:none}
        .studio__dot:hover i,.studio__dot.is-hover i{transform:scale(1.25)}
        .studio__card:not(.is-open){visibility:hidden;transition:transform .8s var(--ease),visibility 0s .8s}
        .studio__card{position:absolute;top:calc(var(--header) + 14px);right:16px;bottom:16px;width:${PANEL - 32}px;z-index:14;background:rgba(14,12,11,.86);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border-radius:14px;padding:28px 26px;overflow:auto;transform:translateX(calc(100% + 24px));transition:transform .8s var(--ease)}
        .studio__card.is-open{transform:none}
        .studio__close{position:absolute;top:12px;right:14px;background:none;border:0;color:var(--fg-2);font-size:26px;line-height:1;cursor:pointer}
        .studio__meta{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--rose);margin:0 0 10px}
        .studio__title{font-family:var(--font-display);font-size:28px;line-height:1.1;margin:0 0 12px;font-weight:500}
        .studio__line{color:var(--fg-2);margin:0 0 18px;line-height:1.55}
        .studio__img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:8px;margin:0 0 18px;display:block}
        .studio__actions{display:flex;flex-wrap:wrap;gap:12px;align-items:center}
        .studio__gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0 0 18px}
        .studio__gallery img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:6px;display:block;transition:opacity .3s}
        .studio__gallery a:hover img{opacity:.75}
        .studio__wa{font-size:14px;color:var(--fg);text-decoration:underline;text-underline-offset:4px}
      `}</style>
    </section>
  );
}
