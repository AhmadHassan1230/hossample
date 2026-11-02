import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import TLink from "@/components/navigation/TLink";
import { projectBySlug, projects } from "@/content/projects";
import { serviceById } from "@/content/services";
import { whatsappHref } from "@/lib/inquiry";

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = projectBySlug((await params).slug);
  return { title: p ? `${p.client} ${p.branch}` : "Work" };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = projectBySlug((await params).slug);
  if (!p) notFound();
  const i = projects.indexOf(p);
  const next = projects[(i + 1) % projects.length];
  const [hero, ...rest] = p.images;
  const wa = whatsappHref({ kind: "project", title: `${p.client} ${p.branch}` });
  return (
    <article>
      <header className="wrap page proj-head">
        <p className="mono muted">{p.client}</p>
        <h1 className="display h1">{p.branch}</h1>
        <p className="lede">{p.line}</p>
        <dl className="proj-meta">
          <div><dt className="mono muted">Location</dt><dd>{p.location}</dd></div>
          <div><dt className="mono muted">Typology</dt><dd>{p.typology}</dd></div>
          <div><dt className="mono muted">Year</dt><dd>{p.year}</dd></div>
          <div><dt className="mono muted">Disciplines</dt><dd>{p.services.map((s) => serviceById(s)?.title).join(", ")}</dd></div>
        </dl>
      </header>
      <div className="proj-hero">
        <Image src={hero.src} alt={`${p.client} ${p.branch}`} width={hero.width} height={hero.height} sizes="100vw" priority />
      </div>
      <div className="wrap proj-gallery">
        {rest.map((img, k) => (
          <figure key={img.src} className={`proj-fig reveal ${img.height > img.width ? "is-tall" : ""} ${k % 3 === 2 ? "is-wide" : ""}`}>
            <Image src={img.src} alt={`${p.client} ${p.branch}, ${img.built ? "built" : "visualisation"} ${k + 2}`} width={img.width} height={img.height} sizes="(max-width: 1200px) 50vw, 640px" />
            <figcaption className="mono muted">{img.built ? "Built" : "Visualisation"}</figcaption>
          </figure>
        ))}
      </div>
      <section className="wrap section proj-cta">
        <h2 className="display h2">Want something like this?</h2>
        <div className="proj-cta__row">
          {wa && (
            <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
              Talk to HoS on WhatsApp <span className="arrow">→</span>
            </a>
          )}
          <TLink href={`/work/${next.slug}`} className="btn btn--soft">
            Next: {next.client} {next.branch}
          </TLink>
        </div>
      </section>
      <style>{`
        .proj-head{padding-bottom:clamp(30px,4vw,60px)}
        .proj-head .h1{margin:6px 0 18px}
        .proj-head .lede{margin:0 0 34px}
        .proj-meta{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;margin:0;max-width:980px}
        .proj-meta dt{margin-bottom:6px}
        .proj-meta dd{margin:0}
        .proj-hero{padding:0 var(--gutter)}
        .proj-hero img{width:100%;height:auto;max-height:88vh;object-fit:cover;border-radius:4px}
        .proj-gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(14px,1.6vw,24px);padding-top:clamp(14px,1.6vw,24px)}
        .proj-fig{margin:0}
        .proj-fig.is-wide{grid-column:1 / -1}
        .proj-fig img{width:100%;height:auto;border-radius:4px}
        .proj-fig figcaption{margin-top:8px}
        .proj-cta .h2{margin:0 0 28px;max-width:16ch}
        .proj-cta__row{display:flex;gap:10px;flex-wrap:wrap}
      `}</style>
    </article>
  );
}
