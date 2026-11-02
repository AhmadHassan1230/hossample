"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import gsap from "gsap";
import { useTransitionStore } from "./transition";
import { Mark } from "@/components/ui/Logo";

/* Page transition: a rose-plaster arch rises over the page, the route changes
   behind it, then it lifts away. */
export default function Curtain() {
  const router = useRouter();
  const pathname = usePathname();
  const phase = useTransitionStore((s) => s.phase);
  const href = useTransitionStore((s) => s.href);
  const setPhase = useTransitionStore((s) => s.set);
  const path = useRef<SVGPathElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);
  const lastPath = useRef(pathname);

  const draw = (y: number) => {
    // Arch spanning the full width; Y is where the arch springs, its crown sits 38 units higher.
    path.current?.setAttribute("d", `M0 100 L0 ${y} A50 38 0 0 1 100 ${y} L100 100 Z`);
  };

  useEffect(() => {
    if (phase !== "covering" || !href) return;
    const s = { y: 140 };
    gsap.set(root.current, { autoAlpha: 1, yPercent: 0 });
    gsap.set(mark.current, { xPercent: -50, yPercent: -50, x: 0, autoAlpha: 0, y: 14 });
    const tl = gsap.timeline({
      onComplete: () => {
        setPhase("covered");
        router.push(href);
      },
    });
    tl.to(s, { y: 0, duration: 0.75, ease: "power3.inOut", onUpdate: () => draw(s.y) });
    tl.to(mark.current, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.25");
    return () => {
      tl.kill();
    };
  }, [phase, href, router, setPhase]);

  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (useTransitionStore.getState().phase === "idle") return;
    window.scrollTo(0, 0);
    setPhase("revealing");
    const tl = gsap.timeline({ onComplete: () => setPhase("idle") });
    tl.to(mark.current, { autoAlpha: 0, y: -10, duration: 0.3, ease: "power2.in" }, 0.15);
    tl.to(root.current, { yPercent: -100, duration: 0.9, ease: "power3.inOut" }, 0.25);
    tl.set(root.current, { autoAlpha: 0, yPercent: 0 });
    tl.call(() => draw(140));
  }, [pathname, setPhase]);

  return (
    <div ref={root} className="curtain" style={{ visibility: "hidden" }} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <path ref={path} d="M0 100 L0 140 A50 38 0 0 1 100 140 L100 100 Z" fill="var(--blush-2)" />
      </svg>
      <div style={{ position: "absolute", left: "50%", top: "50%", color: "var(--ink)" }}>
        <div ref={mark} style={{ transform: "translate(-50%,-50%)", opacity: 0 }}>
          <Mark size={120} />
        </div>
      </div>
    </div>
  );
}
