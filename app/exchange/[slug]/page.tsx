import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import TLink from "@/components/navigation/TLink";
import { productBySlug, products } from "@/content/products";
import { inquiryMessage, whatsappHref } from "@/lib/inquiry";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = productBySlug((await params).slug);
  return { title: p?.title ?? "The Exchange" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = productBySlug((await params).slug);
  if (!p) notFound();
  const inquiry = { kind: "product" as const, title: p.title, id: p.id };
  const wa = whatsappHref(inquiry);
  const others = products.filter((x) => x.slug !== p.slug).slice(0, 4);
  return (
    <article className="wrap page">
      <div className="pd">
        <div className="pd__media">
          <div className="pd__main">
            <Image src={p.image.src} alt={p.title} width={p.image.width} height={p.image.height} sizes="55vw" priority />
          </div>
          {p.gallery.map((g) => (
            <div key={g.src} className="pd__more">
              <Image src={g.src} alt={`${p.title}, detail`} width={g.width} height={g.height} sizes="27vw" />
            </div>
          ))}
        </div>
        <div className="pd__info">
          <p className="mono muted">
            The Exchange · {p.category} · {p.id}
          </p>
          <h1 className="display h1">{p.title}</h1>
          <p className="lede">{p.tagline}</p>
          <p className="pd__desc">{p.description}</p>
          <dl className="pd__facts">
            <div><dt className="mono muted">Price</dt><dd>On inquiry</dd></div>
            <div><dt className="mono muted">Availability</dt><dd>Ask HoS</dd></div>
            {p.materials && (
              <div><dt className="mono muted">Materials</dt><dd>{p.materials.join(", ")}</dd></div>
            )}
            <div><dt className="mono muted">Maker</dt><dd>House of Sultana workshop</dd></div>
          </dl>
          <div className="pd__msg">
            <span className="mono muted">Your message</span>
            <p>{inquiryMessage(inquiry)}</p>
          </div>
          {wa && (
            <a className="btn" href={wa} target="_blank" rel="noopener noreferrer">
              Ask about this piece on WhatsApp <span className="arrow">→</span>
            </a>
          )}
          <p className="muted pd__note">Opens WhatsApp with the message above. Nothing is sent until you press send.</p>
        </div>
      </div>
      <section className="section">
        <h2 className="display h2" style={{ margin: "0 0 36px" }}>More objects</h2>
        <div className="pd__others">
          {others.map((o) => (
            <TLink key={o.slug} href={`/exchange/${o.slug}`} className="pd__other">
              <div className="pd__otherimg">
                <Image src={o.image.src} alt={o.title} width={o.image.width} height={o.image.height} sizes="25vw" />
              </div>
              <span>{o.title}</span>
            </TLink>
          ))}
        </div>
      </section>
      <style>{`
        .pd{display:grid;grid-template-columns:1.15fr 1fr;gap:clamp(30px,5vw,90px);align-items:start}
        .pd__media{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .pd__main{grid-column:1 / -1;background:#f3efe9;border-radius:4px;overflow:hidden}
        .pd__main img,.pd__more img{width:100%;height:auto;display:block}
        .pd__more{border-radius:4px;overflow:hidden;background:#f3efe9}
        .pd__info{position:sticky;top:calc(var(--header) + 30px)}
        .pd__info .h1{margin:10px 0 14px;font-size:clamp(46px,5vw,88px)}
        .pd__info .lede{margin:0 0 18px}
        .pd__desc{color:var(--fg-2);max-width:44ch;margin:0 0 28px}
        .pd__facts{display:grid;grid-template-columns:1fr 1fr;gap:16px 24px;margin:0 0 28px}
        .pd__facts dd{margin:4px 0 0}
        .pd__msg{background:rgba(239,230,221,.06);border-radius:4px;padding:14px 16px;margin-bottom:16px}
        .pd__msg p{margin:6px 0 0;font-size:15px;color:var(--fg-2)}
        .pd__note{font-size:13px;margin-top:12px}
        .pd__others{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        .pd__other{display:flex;flex-direction:column;gap:10px;font-family:var(--font-display);font-size:19px;letter-spacing:-.02em}
        .pd__otherimg{aspect-ratio:4/5;background:#f3efe9;border-radius:4px;overflow:hidden}
        .pd__otherimg img{width:100%;height:100%;object-fit:cover}
      `}</style>
    </article>
  );
}
