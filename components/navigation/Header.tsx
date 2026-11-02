"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import TLink from "./TLink";
import { Mark } from "@/components/ui/Logo";
import { whatsappHref } from "@/lib/inquiry";
import { useStudioMode } from "@/components/studio/mode";

const NAV = [
  { href: "/work", label: "Work" },
  { href: "/services", label: "Services" },
  { href: "/exchange", label: "The Exchange" },
  { href: "/about", label: "Studio" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();
  const wa = whatsappHref({ kind: "general" });
  const night = useStudioMode((m) => m.night);
  const setNight = useStudioMode((m) => m.setNight);
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const on = () => {
      const jr = document.querySelector(".jr, .studio") as HTMLElement | null;
      const end = jr ? jr.offsetTop + jr.offsetHeight - 80 : window.innerHeight - 80;
      setSolid(pathname !== "/" || window.scrollY > end);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [pathname]);
  return (
    <header className={`hdr wrap ${solid ? "is-solid" : ""}`}>
      <TLink href="/" className="hdr__brand" aria-label="House of Sultana, home">
        <Mark size={44} />
        <span className="hdr__name">House of Sultana</span>
      </TLink>
      <nav className="hdr__nav" aria-label="Main">
        {NAV.map((n) => (
          <TLink key={n.href} href={n.href} className="hdr__link" aria-current={pathname.startsWith(n.href) ? "page" : undefined}>
            {n.label}
          </TLink>
        ))}
      </nav>
      {pathname === "/" && (
        <button className={`hdr__mode ${night ? "is-night" : ""}`} onClick={() => setNight(!night)} aria-label={night ? "Switch the studio to day" : "Switch the studio to night"} title={night ? "Day" : "Night"}>
          <svg viewBox="0 0 16 16" aria-hidden>
            <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 1.8a6.2 6.2 0 0 1 0 12.4z" fill="currentColor" />
          </svg>
        </button>
      )}
      {wa && (
        <a className="btn hdr__cta" href={wa} target="_blank" rel="noopener noreferrer">
          WhatsApp us
        </a>
      )}
      <style>{`
        .hdr{position:fixed;top:0;left:0;right:0;z-index:50;height:var(--header);display:flex;align-items:center;gap:28px;transition:background .5s var(--ease)}
        .hdr.is-solid{background:rgba(11,9,9,.72);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
        .hdr__brand{display:flex;align-items:center;gap:14px;margin-right:auto}
        .hdr__name{font-family:var(--font-display);font-size:12.5px;letter-spacing:.3em;text-transform:uppercase;font-weight:500;padding-top:1px}
        .hdr__nav{display:flex;gap:28px}
        .hdr__link{font-size:14.5px;font-weight:500;position:relative;padding:4px 0}
        .hdr__link::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:currentColor;transform:scaleX(0);transform-origin:right;transition:transform .5s var(--ease)}
        .hdr__link:hover::after,.hdr__link[aria-current=page]::after{transform:scaleX(1);transform-origin:left}
        .hdr__cta{height:40px;padding:0 16px;font-size:14px}
        .hdr__mode{width:30px;height:30px;display:grid;place-items:center;border:0;border-radius:50%;background:rgba(239,230,221,.08);color:rgba(239,230,221,.75);cursor:pointer;margin-right:-12px;transition:background .3s,color .3s}
        .hdr__mode:hover{background:rgba(239,230,221,.16);color:var(--fg)}
        .hdr__mode svg{width:14px;height:14px;transition:transform .9s var(--ease)}
        .hdr__mode.is-night svg{transform:rotate(180deg)}
      `}</style>
    </header>
  );
}
