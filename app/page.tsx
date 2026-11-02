import Image from "next/image";
import Studio from "@/components/studio/Studio";
import ProjectCard from "@/components/portfolio/ProjectCard";
import TLink from "@/components/navigation/TLink";
import { cities, projectBySlug, projects } from "@/content/projects";
import { products } from "@/content/products";

const FEATURED = ["overdose-technopark", "loop-bukhari", "loop-dolmen", "overdose-mm-alam", "od-loop-tipu", "overdose-sialkot"];

export default function Home() {
  const featured = FEATURED.map((s) => projectBySlug(s)!);
  const built = projects.flatMap((p) => p.images.filter((i) => i.built).map((i) => ({ ...i, p })));
  return (
    <>
      <Studio />

      <section className="wrap section stats-band">
        <div className="stats">
          <div className="reveal">
            <span className="display stats__n">{projects.length}</span>
            <span className="muted">spaces in the 2026 catalogue</span>
          </div>
          <div className="reveal">
            <span className="display stats__n">{cities.length}</span>
            <span className="muted">cities, Karachi to Sialkot</span>
          </div>
          <div className="reveal">
            <span className="display stats__n">4</span>
            <span className="muted">brands: Loop, Overdose, OD × Loop, Overdose Express</span>
          </div>
        </div>
      </section>

      <section className="wrap work-home">
        <div className="sec-head">
          <h2 className="display h2 reveal">Selected work</h2>
          <TLink href="/work" className="link reveal">
            All {projects.length} projects
          </TLink>
        </div>
        <div className="work-grid">
          <ProjectCard p={featured[0]} size="l" />
          <ProjectCard p={featured[1]} size="s" />
          <ProjectCard p={featured[2]} size="m" />
          <ProjectCard p={featured[3]} size="m" />
          <ProjectCard p={featured[4]} size="m" />
          <ProjectCard p={featured[5]} size="l" />
        </div>
      </section>

      <section className="section built">
        <div className="wrap sec-head">
          <h2 className="display h2 reveal">Drawn, then built.</h2>
          <p className="muted reveal" style={{ maxWidth: "32ch" }}>
            Photographs from site, Karachi and Islamabad.
          </p>
        </div>
        <div className="marquee" aria-label="Photographs of built projects">
          <div className="marquee__track">
            {[...built, ...built].map((b, i) => (
              <figure key={i} className="marquee__item">
                <Image src={b.src} alt={`${b.p.client} ${b.p.branch}, built`} width={b.width} height={b.height} sizes="320px" />
                <figcaption>
                  {b.p.client} {b.p.branch}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="wrap section">
        <div className="sec-head">
          <h2 className="display h2 reveal">The Exchange</h2>
          <TLink href="/exchange" className="link reveal">
            All objects
          </TLink>
        </div>
        <div className="ex-row">
          {products.slice(0, 4).map((p) => (
            <TLink key={p.slug} href={`/exchange/${p.slug}`} className="ex-card reveal">
              <div className="ex-card__img">
                <Image src={p.image.src} alt={p.title} width={p.image.width} height={p.image.height} sizes="25vw" />
              </div>
              <span className="ex-card__t">{p.title}</span>
              <span className="muted ex-card__p">Price on inquiry</span>
            </TLink>
          ))}
        </div>
      </section>

      <style>{`
        .stats-band{padding-bottom:clamp(40px,5vw,80px)}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .stats > div{display:flex;flex-direction:column;gap:8px}
        .stats__n{font-size:clamp(72px,8vw,140px);line-height:.85}
        .sec-head{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin-bottom:clamp(30px,4vw,60px)}
        .sec-head .h2{margin:0}
        .work-home{padding-bottom:clamp(40px,5vw,80px)}
        .work-grid{display:grid;grid-template-columns:repeat(12,1fr);gap:clamp(18px,2vw,32px) clamp(14px,1.6vw,24px)}
        .work-grid > :nth-child(1){grid-column:1 / span 8}
        .work-grid > :nth-child(2){grid-column:9 / span 4}
        .work-grid > :nth-child(3){grid-column:1 / span 4}
        .work-grid > :nth-child(4){grid-column:5 / span 4}
        .work-grid > :nth-child(5){grid-column:9 / span 4}
        .work-grid > :nth-child(6){grid-column:3 / span 10}
        .built .sec-head{margin-bottom:40px}
        .marquee{overflow:hidden}
        .marquee__track{display:flex;gap:14px;width:max-content;animation:marq 80s linear infinite}
        .marquee:hover .marquee__track{animation-play-state:paused}
        .marquee__item{margin:0;width:300px}
        .marquee__item img{width:300px;height:390px;object-fit:cover;border-radius:3px}
        .marquee__item figcaption{margin-top:10px;font-size:13px;color:var(--muted)}
        @keyframes marq{to{transform:translateX(-50%)}}
        .ex-row{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(14px,1.6vw,24px)}
        .ex-card{display:flex;flex-direction:column;gap:4px}
        .ex-card__img{aspect-ratio:4/5;background:#f3efe9;border-radius:4px;overflow:hidden;margin-bottom:12px}
        .ex-card__img img{width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
        .ex-card:hover .ex-card__img img{transform:scale(1.04)}
        .ex-card__t{font-family:var(--font-display);font-size:22px;letter-spacing:-.02em}
        .ex-card__p{font-size:14px}
      `}</style>
    </>
  );
}
