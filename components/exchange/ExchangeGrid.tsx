"use client";
import { useState } from "react";
import Image from "next/image";
import TLink from "@/components/navigation/TLink";
import type { Product } from "@/content/products";

const CATS = ["All", "Furniture", "Decor"] as const;

export default function ExchangeGrid({ products }: { products: Product[] }) {
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const list = cat === "All" ? products : products.filter((p) => p.category === cat);
  return (
    <>
      <div className="wf" role="group" aria-label="Filter objects">
        {CATS.map((c) => (
          <button key={c} className={`wf__b ${cat === c ? "is-on" : ""}`} aria-pressed={cat === c} onClick={() => setCat(c)}>
            {c} <sup>{c === "All" ? products.length : products.filter((p) => p.category === c).length}</sup>
          </button>
        ))}
      </div>
      <div className="xg">
        {list.map((p) => (
          <TLink key={p.slug} href={`/exchange/${p.slug}`} className="xg__card">
            <div className="xg__img">
              <Image src={p.image.src} alt={p.title} width={p.image.width} height={p.image.height} sizes="(max-width: 1200px) 33vw, 25vw" />
            </div>
            <div className="xg__meta">
              <span className="xg__t">{p.title}</span>
              <span className="mono muted">{p.id}</span>
            </div>
            <span className="muted xg__p">Price on inquiry · Made by HoS</span>
          </TLink>
        ))}
      </div>
      <style>{`
        .wf{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:clamp(30px,4vw,56px)}
        .wf__b{height:40px;padding:0 16px;border-radius:3px;background:rgba(239,230,221,.06);font-size:14px;font-weight:500;color:var(--fg-2);transition:background .3s,color .3s}
        .wf__b sup{font-size:10px;color:var(--muted);margin-left:2px}
        .wf__b:hover{background:rgba(239,230,221,.12);color:var(--fg)}
        .wf__b.is-on{background:var(--fg);color:var(--bg)}
        .wf__b.is-on sup{color:var(--bg)}
        .xg{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(28px,3vw,44px) clamp(14px,1.6vw,22px)}
        .xg__card{display:flex;flex-direction:column;gap:4px}
        .xg__img{aspect-ratio:4/5;background:#f3efe9;border-radius:4px;overflow:hidden;margin-bottom:12px}
        .xg__img img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
        .xg__card:hover .xg__img img{transform:scale(1.04)}
        .xg__meta{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
        .xg__t{font-family:var(--font-display);font-size:21px;letter-spacing:-.02em}
        .xg__p{font-size:14px}
      `}</style>
    </>
  );
}
