"use client";
import { useCallback, useEffect, useRef } from "react";
import gsap from "gsap";
import TLink from "@/components/navigation/TLink";
import { ARCH } from "@/components/ui/Logo";
import { useAtelier } from "./store";
import { journey, STOPS } from "./stops";
import FrameScrubber from "./FrameScrubber";
const VH_PER_STOP = 105;

type LenisLike = { stop: () => void; start: () => void; scrollTo: (t: number, o?: object) => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

export default function Journey() {
  const section = useRef<HTMLElement>(null);
  const onProgress = useCallback((p: number) => useAtelier.getState().setLoadProgress(p), []);
  const onReady = useCallback(() => useAtelier.getState().setReady(), []);

  // scroll → progress (read by the camera every frame)
  useEffect(() => {
    let raf = 0;
    const read = () => {
      const el = section.current;
      if (el) {
        const r = el.getBoundingClientRect();
        const span = r.height - window.innerHeight;
        journey.progress = Math.min(1, Math.max(0, -r.top / span));
      }
      raf = requestAnimationFrame(read);
    };
    raf = requestAnimationFrame(read);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={section} className="jr" style={{ height: `${STOPS.length * VH_PER_STOP}vh` }} aria-label="Walk through the studio">
      <div className="jr__stage">
        <FrameScrubber onProgress={onProgress} onReady={onReady} />
        <div className="jr__shade" aria-hidden />
        <Overlays />
        <Rail sectionRef={section} />
        <Preloader />
      </div>
      <style>{css}</style>
    </section>
  );
}

/** One text block per stop; opacity follows the camera's smoothed progress. */
function Overlays() {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const N = STOPS.length - 1;
    const loop = () => {
      const x = journey.smooth * N;
      refs.current.forEach((el, i) => {
        if (!el) return;
        const d = x - i;
        const a = Math.max(0, 1 - Math.max(0, Math.abs(d) - 0.12) / 0.3);
        el.style.opacity = a.toFixed(3);
        el.style.transform = `translate3d(0, ${(-d * 46).toFixed(1)}px, 0)`;
        el.style.pointerEvents = a > 0.6 ? "auto" : "none";
        el.style.visibility = a < 0.01 ? "hidden" : "visible";
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="jr__text">
      {STOPS.map((s, i) => (
        <div key={s.id} ref={(el) => { refs.current[i] = el; }} className={`jr__stop ${i === 0 || i === STOPS.length - 1 ? "is-hero" : ""}`}>
          <p className="jr__kicker">{s.kicker}</p>
          {i === 0 ? <h1 className="display jr__title">{s.title}</h1> : <h2 className="display jr__title">{s.title}</h2>}
          <p className="jr__line">{s.line}</p>
          {s.href && (
            <TLink href={s.href} className="jr__cta">
              {s.cta} <span aria-hidden>→</span>
            </TLink>
          )}
        </div>
      ))}
    </div>
  );
}

/** Index of stops; click to travel. */
function Rail({ sectionRef }: { sectionRef: React.RefObject<HTMLElement | null> }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    let raf = 0;
    const N = STOPS.length - 1;
    const loop = () => {
      const cur = Math.round(journey.smooth * N);
      refs.current.forEach((el, i) => el?.classList.toggle("is-on", i === cur));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const go = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.offsetTop + (i / (STOPS.length - 1)) * (el.offsetHeight - window.innerHeight);
    const l = lenis();
    if (l) l.scrollTo(top, { duration: 1.6 });
    else window.scrollTo({ top, behavior: "smooth" });
  };
  return (
    <nav className="jr__rail" aria-label="Studio stops">
      {STOPS.slice(1, -1).map((s, k) => (
        <button key={s.id} ref={(el) => { refs.current[k + 1] = el; }} onClick={() => go(k + 1)} className="jr__railbtn">
          <span className="jr__railtick" />
          <span className="jr__raillabel">{s.title === "The house" ? "Studio" : s.title}</span>
        </button>
      ))}
    </nav>
  );
}

/** Holds everything until assets, shaders and shadows are ready, then lights the neon and reveals. */
function Preloader() {
  const ready = useAtelier((s) => s.ready);
  const progress = useAtelier((s) => s.loadProgress) * 100;
  const root = useRef<HTMLDivElement>(null);
  const sign = useRef<SVGGElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    lenis()?.stop();
    window.scrollTo(0, 0);
    const flicker = gsap.timeline({ repeat: -1, repeatDelay: 0.6 });
    flicker.to(sign.current, { opacity: 0.35, duration: 0.06 }).to(sign.current, { opacity: 0.85, duration: 0.08 }).to(sign.current, { opacity: 0.5, duration: 0.05 }).to(sign.current, { opacity: 0.9, duration: 0.3 });
    return () => {
      flicker.kill();
      document.documentElement.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    // progress counts frame downloads; the last 5% is decoding the opening frame
    const target = ready ? 100 : Math.min(95, progress * 0.95);
    gsap.to(shown, {
      current: target,
      duration: 0.6,
      ease: "power2.out",
      onUpdate: () => {
        if (bar.current) bar.current.style.transform = `scaleX(${shown.current / 100})`;
      },
    });
  }, [progress, ready]);

  useEffect(() => {
    if (!ready) return;
    const tl = gsap.timeline({
      delay: 0.5,
      onComplete: () => {
        document.documentElement.style.overflow = "";
        lenis()?.start();
        useAtelier.getState().setIntroDone();
        if (root.current) root.current.style.display = "none";
      },
    });
    gsap.killTweensOf(sign.current);
    tl.to(sign.current, { opacity: 1, duration: 0.25 })
      .to(sign.current, { opacity: 0.4, duration: 0.05 })
      .to(sign.current, { opacity: 1, duration: 0.12 })
      .to(root.current, { opacity: 0, duration: 1.2, ease: "power2.inOut" }, "+=0.35");
    return () => {
      tl.kill();
    };
  }, [ready]);

  return (
    <div ref={root} className="pl" aria-live="polite">
      <svg viewBox="0 0 560 560" className="pl__sign" aria-label="House of Sultana">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g ref={sign} filter="url(#glow)" fill="none" stroke="#ff6a26" strokeWidth={6} strokeLinecap="round" opacity={0.5}>
          <path d={ARCH.door} />
          <line x1={ARCH.bar.x} y1={ARCH.bar.y + 6} x2={ARCH.bar.x + ARCH.bar.w} y2={ARCH.bar.y + 6} />
          <g stroke="none" fill="#ff6a26" style={{ fontFamily: "var(--font-logo)" }}>
            <text x={ARCH.h.x} y={ARCH.h.y} textAnchor="middle" fontSize={150}>H</text>
            <text x={ARCH.s.x} y={ARCH.s.y} textAnchor="middle" fontSize={150}>S</text>
            <text x={ARCH.knob.x} y={ARCH.knob.y} textAnchor="middle" fontSize={44}>o</text>
          </g>
        </g>
      </svg>
      <div className="pl__meta">
        <span className="pl__bar"><span ref={bar} /></span>
        <span className="pl__label">{ready ? "Opening the studio" : "Preparing the studio"}</span>
      </div>
    </div>
  );
}

const css = `
.jr{position:relative;background:#0b0909}
.jr__stage{position:sticky;top:0;height:100vh;overflow:hidden}
.jr__shade{position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(8,6,6,.62) 0%,rgba(8,6,6,.18) 38%,rgba(8,6,6,0) 60%),linear-gradient(180deg,rgba(8,6,6,.55) 0%,rgba(8,6,6,0) 18%)}
.jr__text{position:absolute;left:var(--gutter);bottom:clamp(40px,9vh,110px);width:min(760px,62vw);height:60vh;pointer-events:none}
.jr__stop{position:absolute;left:0;bottom:0;visibility:hidden;will-change:opacity,transform}
.jr__kicker{margin:0 0 14px;font-family:var(--font-display);font-weight:500;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#ff7a3d}
.jr__title{margin:0 0 18px;color:var(--fg);font-size:clamp(64px,8.6vw,150px)}
.jr__stop.is-hero .jr__title{font-size:clamp(58px,7.2vw,124px);max-width:9.5ch}
.jr__line{margin:0 0 22px;color:var(--fg-2);font-size:clamp(17px,1.25vw,20px);max-width:30ch;line-height:1.4}
.jr__cta{display:inline-flex;gap:10px;align-items:center;height:44px;padding:0 18px;border-radius:3px;background:rgba(239,230,221,.1);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);color:var(--fg);font-size:14px;font-weight:500;transition:background .4s}
.jr__cta:hover{background:rgba(239,230,221,.2)}
.jr__rail{position:absolute;right:var(--gutter);top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:2px}
.jr__railbtn{display:flex;align-items:center;justify-content:flex-end;gap:10px;padding:5px 0;color:rgba(239,230,221,.42);font-size:12.5px;font-weight:500;flex-direction:row-reverse}
.jr__railtick{width:14px;height:1px;background:currentColor;transition:width .5s var(--ease)}
.jr__raillabel{opacity:0;transform:translateX(6px);transition:opacity .4s,transform .5s var(--ease)}
.jr__rail:hover .jr__raillabel,.jr__railbtn.is-on .jr__raillabel{opacity:1;transform:none}
.jr__railbtn.is-on{color:var(--fg)}
.jr__railbtn.is-on .jr__railtick{width:30px;background:#ff5a1f}
.pl{position:fixed;inset:0;z-index:300;background:#0b0909;display:grid;place-items:center;align-content:center;gap:34px}
.pl__sign{width:min(300px,40vw);height:auto;overflow:visible}
.pl__meta{display:flex;flex-direction:column;align-items:center;gap:12px}
.pl__bar{width:180px;height:1px;background:rgba(239,230,221,.14);overflow:hidden;display:block}
.pl__bar span{display:block;height:100%;background:#ff5a1f;transform:scaleX(0);transform-origin:left}
.pl__label{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:rgba(239,230,221,.55);font-family:var(--font-display);font-weight:500}
`;
