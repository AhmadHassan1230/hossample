import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ProjectCard from "@/components/portfolio/ProjectCard";
import TLink from "@/components/navigation/TLink";
import { projects } from "@/content/projects";
import { serviceById, services } from "@/content/services";
import { whatsappHref } from "@/lib/inquiry";

export function generateStaticParams() {
  return services.map((s) => ({ slug: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = serviceById((await params).slug);
  return { title: s?.title ?? "Services" };
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = serviceById((await params).slug);
  if (!s) notFound();
  const related = projects.filter((p) => p.services.includes(s.id)).slice(0, 6);
  const built = s.id === "construction" ? projects.flatMap((p) => p.images.filter((i) => i.built).map((i) => ({ ...i, p }))).slice(0, 9) : [];
  const wa = whatsappHref({ kind: "service", title: s.title });
  const idx = services.indexOf(s);
  const next = services[(idx + 1) % services.length];
  return (
    <article>
      <header className="wrap page page__head">
        <div>
          <p className="mono muted">{String(idx + 1).padStart(2, "0")} — Service</p>
          <h1 className="display h1">{s.title}</h1>
        </div>
        <div>
          <p className="lede">{s.line}</p>
          <ul className="svc-scope">
            {s.scope.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {wa && (
            <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
              Discuss {s.title.toLowerCase()} on WhatsApp <span className="arrow">→</span>
            </a>
          )}
        </div>
      </header>

      {built.length > 0 && (
        <section className="wrap svc-built">
          {built.map((b) => (
            <figure key={b.src} className="reveal">
              <Image src={b.src} alt={`${b.p.client} ${b.p.branch} on site`} width={b.width} height={b.height} sizes="33vw" />
              <figcaption className="mono muted">{b.p.client} {b.p.branch}</figcaption>
            </figure>
          ))}
        </section>
      )}

      {related.length > 0 ? (
        <section className="wrap section">
          <h2 className="display h2" style={{ margin: "0 0 40px" }}>Projects</h2>
          <div className="svc-grid">
            {related.map((p) => (
              <ProjectCard key={p.slug} p={p} size="m" />
            ))}
          </div>
        </section>
      ) : (
        <section className="wrap section">
          <h2 className="display h2" style={{ margin: "0 0 16px" }}>From our own channel</h2>
          <p className="muted" style={{ margin: "0 0 32px", maxWidth: "40ch" }}>Client work for {s.title.toLowerCase()} will appear here as projects are approved for publication.</p>
          <div className="svc-studio">
            {s.studio.map((m) => (
              <figure key={m.src}>
                <Image src={m.src} alt={m.caption} width={m.width} height={m.height} sizes="33vw" />
                <figcaption className="mono muted">{m.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="wrap svc-next">
        <TLink href={`/services/${next.id}`} className="svc-next__link">
          <span className="mono muted">Next service</span>
          <span className="display h2">{next.title} →</span>
        </TLink>
      </section>
      <style>{`
        .svc-scope{list-style:none;margin:22px 0 30px;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px;color:var(--fg-2)}
        .svc-scope li::before{content:"— ";color:var(--rose)}
        .svc-built{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .svc-built figure,.svc-studio figure{margin:0}
        .svc-built img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:4px}
        .svc-built figcaption,.svc-studio figcaption{margin-top:8px}
        .svc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px 20px}
        .svc-studio{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
        .svc-studio img{width:100%;aspect-ratio:3/4;object-fit:cover;border-radius:4px}
        .svc-next{padding-bottom:clamp(80px,9vw,140px)}
        .svc-next__link{display:flex;flex-direction:column;gap:10px;padding-top:30px;border-top:1px solid var(--line)}
        .svc-next__link .h2{transition:color .4s}
        .svc-next__link:hover .h2{color:var(--rose)}
      `}</style>
    </article>
  );
}
