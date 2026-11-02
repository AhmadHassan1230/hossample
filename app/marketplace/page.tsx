import type { Metadata } from "next";
import Market from "@/components/marketplace/Market";
import { listings } from "@/content/marketplace";
import { products } from "@/content/products";

export const metadata: Metadata = { title: "Marketplace (sample)" };

/* Sample marketplace, reached from the studio's furniture floor. Demo only: no backend, no
   product pages, no checkout. HoS pieces are real Exchange products; community listings are
   placeholders and are labelled as not verified. */
export default function MarketplacePage() {
  const lead = products[0];
  const verified = listings.filter((l) => l.verified).length;
  return (
    <section className="mk wrap page">
      <header className="mk-hero">
        <p className="mk-note">Sample marketplace · for demonstration</p>
        <h1 className="display mk-title">
          The <span>Exchange</span>
        </h1>
        <div className="mk-intro">
          <p className="lede">Objects for the home, from the HoS workshop and from sellers we list. Every piece says who stands behind it.</p>
          <dl className="mk-keys">
            <div>
              <dt>HoS verified</dt>
              <dd>Made by the studio, or checked by it in person. {verified} pieces.</dd>
            </div>
            <div>
              <dt>Not verified</dt>
              <dd>Listed by a seller. HoS has not inspected it yet.</dd>
            </div>
          </dl>
        </div>
      </header>

      <figure className="mk-feature">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={lead.gallery[0]?.src ?? lead.image.src} alt={lead.title} />
        <figcaption>
          <span>HoS verified</span>
          <strong>{lead.title}</strong>
          <em>{lead.tagline}</em>
        </figcaption>
      </figure>

      <Market listings={listings} />

      <style>{`
        .mk{padding-bottom:clamp(90px,10vw,160px)}
        .mk-hero{padding:clamp(40px,6vw,90px) 0 clamp(40px,5vw,70px)}
        .mk-note{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:rgba(239,230,221,.5);margin:0 0 18px}
        .mk-title{font-size:clamp(72px,13vw,220px);line-height:.86;margin:0;font-weight:500;letter-spacing:-.02em}
        .mk-title span{color:var(--rose)}
        .mk-intro{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(30px,6vw,110px);margin-top:clamp(30px,4vw,56px);align-items:end}
        .mk-keys{margin:0;display:grid;gap:18px}
        .mk-keys dt{font-family:var(--font-display);font-size:19px;margin-bottom:4px}
        .mk-keys div:first-child dt::before{content:"";display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--rose);margin-right:10px;vertical-align:middle}
        .mk-keys div:last-child dt::before{content:"";display:inline-block;width:9px;height:9px;border-radius:50%;background:#9c958d;margin-right:10px;vertical-align:middle}
        .mk-keys dd{margin:0;color:var(--fg-2);font-size:15px}
        .mk-feature{position:relative;margin:0 0 clamp(50px,6vw,90px);height:clamp(380px,62vh,720px);overflow:hidden}
        .mk-feature img{width:100%;height:100%;object-fit:cover;display:block}
        .mk-feature::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(11,9,9,.72),rgba(11,9,9,0) 55%);pointer-events:none}
        .mk-feature figcaption{z-index:1}
        .mk-feature figcaption{position:absolute;left:clamp(20px,3vw,44px);bottom:clamp(20px,3vw,40px);display:grid;gap:6px;color:#fff;text-shadow:0 2px 22px rgba(0,0,0,.45)}
        .mk-feature figcaption span{font-size:12px;letter-spacing:.1em;text-transform:uppercase}
        .mk-feature figcaption strong{font-family:var(--font-display);font-weight:500;font-size:clamp(34px,4vw,64px);line-height:1}
        .mk-feature figcaption em{font-style:normal;opacity:.85}
        @media (max-width:900px){.mk-intro{grid-template-columns:1fr}}
      `}</style>
    </section>
  );
}
