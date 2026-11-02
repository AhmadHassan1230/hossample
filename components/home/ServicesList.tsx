"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import TLink from "@/components/navigation/TLink";
import { services } from "@/content/services";

/* Seven services as a typographic list; the cover image follows the cursor. */
export default function ServicesList() {
  const [hover, setHover] = useState<number | null>(null);
  const float = useRef<HTMLDivElement>(null);
  const qx = useRef<gsap.QuickToFunc | null>(null);
  const qy = useRef<gsap.QuickToFunc | null>(null);

  useEffect(() => {
    if (!float.current) return;
    qx.current = gsap.quickTo(float.current, "x", { duration: 0.6, ease: "power3.out" });
    qy.current = gsap.quickTo(float.current, "y", { duration: 0.6, ease: "power3.out" });
  }, []);

  useEffect(() => {
    gsap.to(float.current, { autoAlpha: hover === null ? 0 : 1, scale: hover === null ? 0.92 : 1, duration: 0.5, ease: "power3.out" });
  }, [hover]);

  return (
    <div
      className="svl"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        qx.current?.(e.clientX - r.left);
        qy.current?.(e.clientY - r.top);
      }}
      onPointerLeave={() => setHover(null)}
    >
      <ol>
        {services.map((s, i) => (
          <li key={s.id} onPointerEnter={() => setHover(i)}>
            <TLink href={`/services/${s.id}`} className={`svl__row ${hover !== null && hover !== i ? "is-dim" : ""}`}>
              <span className="mono muted svl__n">{String(i + 1).padStart(2, "0")}</span>
              <span className="display svl__t">{s.title}</span>
              <span className="svl__l muted">{s.line}</span>
              <span className="svl__a" aria-hidden>→</span>
            </TLink>
          </li>
        ))}
      </ol>
      <div ref={float} className="svl__float" aria-hidden>
        {services.map((s, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={s.id} src={s.cover} alt="" style={{ opacity: hover === i ? 1 : 0 }} />
        ))}
      </div>
      <style>{`
        .svl{position:relative}
        .svl ol{list-style:none;margin:0;padding:0}
        .svl__row{display:grid;grid-template-columns:70px minmax(0,1fr) minmax(0,1fr) 40px;align-items:baseline;gap:20px;padding:22px 0 20px;transition:opacity .5s var(--ease),padding .6s var(--ease)}
        .svl li + li .svl__row{box-shadow:inset 0 1px 0 var(--line)}
        .svl__row.is-dim{opacity:.32}
        .svl__row:hover{padding-left:14px}
        .svl__t{font-size:clamp(34px,4.2vw,68px)}
        .svl__l{font-size:16px;max-width:30ch}
        .svl__a{font-size:24px;transition:transform .5s var(--ease)}
        .svl__row:hover .svl__a{transform:translateX(6px)}
        .svl__float{position:absolute;left:0;top:0;width:300px;height:380px;margin:-190px 0 0 -150px;pointer-events:none;opacity:0;z-index:2;border-radius:4px;overflow:hidden;box-shadow:0 30px 70px rgba(40,20,10,.25)}
        .svl__float img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:opacity .4s}
      `}</style>
    </div>
  );
}
