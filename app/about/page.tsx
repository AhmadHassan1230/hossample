import type { Metadata } from "next";
import Image from "next/image";
import TLink from "@/components/navigation/TLink";
import { cities, projectBySlug, projects } from "@/content/projects";
import { services } from "@/content/services";
import { site } from "@/content/site";

export const metadata: Metadata = { title: "Studio" };

export default function AboutPage() {
  const hero = projectBySlug("overdose-technopark")!.images[0];
  return (
    <article>
      <header className="wrap page page__head">
        <h1 className="display h1">The studio</h1>
        <p className="lede muted">House of Sultana is a multidisciplinary design studio founded in 2025, led by an international team of architects and designers.</p>
      </header>
      <div className="ab-hero">
        <Image src={hero.src} alt="Overdose Technopark, Islamabad" width={hero.width} height={hero.height} sizes="100vw" priority />
      </div>
      <section className="wrap section ab-cols">
        <p className="display ab-big reveal">Turnkey architecture and interiors, from concept to execution, alongside custom furniture and bespoke house decor.</p>
        <div className="ab-text reveal">
          <p>As design consultants to established brands across Pakistan, the studio works where global thinking meets local insight.</p>
          <p>Clarity over excess, precision over trend: every project is a dialogue between space, material and the people who use it.</p>
        </div>
      </section>
      <section className="wrap ab-stats">
        <div><span className="display ab-n">{projects.length}</span><span className="muted">spaces in the 2026 catalogue</span></div>
        <div><span className="display ab-n">{cities.length}</span><span className="muted">cities</span></div>
        <div><span className="display ab-n">{services.length}</span><span className="muted">disciplines</span></div>
      </section>
      <section className="wrap section">
        <h2 className="display h2" style={{ margin: "0 0 30px" }}>Find us</h2>
        <p className="lede">{site.studioAddress}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 26 }}>
          <TLink href="/contact" className="btn">Contact <span className="arrow">→</span></TLink>
          <TLink href="/work" className="btn btn--soft">See the work</TLink>
        </div>
        <p className="muted ab-note">The 3D studio on the home page is an artistic interpretation made for this website, not a reconstruction of the HoS office.</p>
      </section>
      <style>{`
        .ab-hero{padding:0 var(--gutter)}
        .ab-hero img{width:100%;height:78vh;object-fit:cover;border-radius:4px}
        .ab-cols{display:grid;grid-template-columns:1.4fr 1fr;gap:clamp(30px,5vw,90px);align-items:end}
        .ab-big{font-size:clamp(32px,3.6vw,62px);line-height:1.02;margin:0}
        .ab-text p{color:var(--fg-2);margin:0 0 16px;max-width:42ch}
        .ab-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .ab-stats > div{display:flex;flex-direction:column;gap:8px}
        .ab-n{font-size:clamp(72px,8vw,140px);line-height:.85}
        .ab-note{font-size:13px;margin-top:40px;max-width:60ch}
      `}</style>
    </article>
  );
}
