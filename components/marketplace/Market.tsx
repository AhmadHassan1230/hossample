"use client";
import { useMemo, useState } from "react";
import { whatsappHref } from "@/lib/inquiry";
import type { Listing } from "@/content/marketplace";

/* The sample marketplace grid: typographic filters, products lit on porcelain, and a clear
   verification line on every piece. No product pages and no checkout (demo). */

type Filter = "all" | "verified" | "community";

export default function Market({ listings }: { listings: Listing[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [kind, setKind] = useState<"All" | "Furniture" | "Decor">("All");
  const shown = useMemo(
    () => listings.filter((l) => (filter === "all" || (filter === "verified") === l.verified) && (kind === "All" || l.category === kind)),
    [listings, filter, kind],
  );
  const count = (f: Filter) => listings.filter((l) => f === "all" || (f === "verified") === l.verified).length;

  return (
    <>
      <nav className="mk-filters" aria-label="Filter the marketplace">
        <div>
          {(["all", "verified", "community"] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? "is-on" : ""} onClick={() => setFilter(f)}>
              {f === "all" ? "Everything" : f === "verified" ? "HoS verified" : "Not verified"}
              <sup>{count(f)}</sup>
            </button>
          ))}
        </div>
        <div>
          {(["All", "Furniture", "Decor"] as const).map((k) => (
            <button key={k} className={kind === k ? "is-on" : ""} onClick={() => setKind(k)}>
              {k}
            </button>
          ))}
        </div>
      </nav>

      <ul className="mk-grid">
        {shown.map((l, i) => {
          const wa = l.verified && l.ref ? whatsappHref({ kind: "product", title: l.title, id: l.ref }) : null;
          return (
            <li key={l.id} className={`mk-item ${i % 7 === 0 ? "is-wide" : ""}`}>
              <div className="mk-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.image} alt={l.title} loading="lazy" />
                <span className={`mk-badge ${l.verified ? "is-ok" : ""}`}>{l.verified ? "HoS verified" : "Not verified"}</span>
              </div>
              <div className="mk-meta">
                <h3>{l.title}</h3>
                <p>{l.detail}</p>
                <p className="mk-row">
                  <span>{l.seller}</span>
                  <span>Price on inquiry</span>
                </p>
                {wa ? (
                  <a className="mk-ask" href={wa} target="_blank" rel="noopener noreferrer">
                    Ask about this piece
                  </a>
                ) : (
                  <span className="mk-ask is-off">Listed by a seller · HoS has not inspected it</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <style>{`
        .mk-filters{display:flex;justify-content:space-between;flex-wrap:wrap;gap:18px;margin:0 0 40px;position:sticky;top:var(--header);z-index:5;background:rgba(11,9,9,.86);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);padding:16px 0}
        .mk-filters div{display:flex;gap:26px;flex-wrap:wrap}
        .mk-filters button{background:none;border:0;color:var(--fg-2);font:inherit;font-size:15px;cursor:pointer;padding:4px 0;position:relative}
        .mk-filters button sup{font-size:10px;margin-left:3px;color:var(--rose)}
        .mk-filters button::after{content:"";position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--fg);transform:scaleX(0);transform-origin:left;transition:transform .5s var(--ease)}
        .mk-filters button.is-on{color:var(--fg)}
        .mk-filters button.is-on::after,.mk-filters button:hover::after{transform:scaleX(1)}
        .mk-grid{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(3,1fr);gap:56px 28px}
        .mk-item.is-wide{grid-column:span 2}
        .mk-img{position:relative;background:#ece6dd;aspect-ratio:1;overflow:hidden}
        .mk-item.is-wide .mk-img{aspect-ratio:2/1}
        .mk-img img{width:100%;height:100%;object-fit:contain;transition:transform 1.2s var(--ease)}
        .mk-item:hover .mk-img img{transform:scale(1.05)}
        .mk-badge{position:absolute;left:16px;top:16px;font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:#4b433c;display:flex;align-items:center;gap:8px}
        .mk-badge::before{content:"";width:8px;height:8px;border-radius:50%;background:#9c958d}
        .mk-badge.is-ok{color:#2a211c}
        .mk-badge.is-ok::before{background:var(--rose)}
        .mk-meta{padding-top:18px}
        .mk-meta h3{font-family:var(--font-display);font-weight:500;font-size:clamp(20px,1.6vw,26px);margin:0 0 6px}
        .mk-meta p{margin:0;color:var(--fg-2);font-size:14.5px}
        .mk-row{display:flex;justify-content:space-between;margin-top:12px!important;font-size:13px!important;color:rgba(239,230,221,.55)!important}
        .mk-ask{display:inline-block;margin-top:14px;font-size:14px;color:var(--fg);text-decoration:underline;text-underline-offset:5px}
        .mk-ask.is-off{text-decoration:none;color:rgba(239,230,221,.45);font-size:13px}
        @media (max-width:900px){.mk-grid{grid-template-columns:1fr 1fr}.mk-item.is-wide{grid-column:span 2}}
      `}</style>
    </>
  );
}
