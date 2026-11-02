import TLink from "./TLink";
import { Mark } from "@/components/ui/Logo";
import { site } from "@/content/site";
import { displayNumber, whatsappHref } from "@/lib/inquiry";

export default function Footer() {
  const wa = whatsappHref({ kind: "general" });
  return (
    <footer className="ftr band-ink">
      <div className="wrap ftr__top">
        <div className="ftr__mark">
          <Mark size={150} />
        </div>
        <div className="ftr__cta">
          <p className="display h2">We design beyond boundaries.</p>
          {wa && (
            <a className="btn btn--cream" href={wa} target="_blank" rel="noopener noreferrer">
              Start a project on WhatsApp <span className="arrow">→</span>
            </a>
          )}
        </div>
      </div>
      <div className="wrap ftr__grid">
        <div>
          <p className="mono muted">Studio</p>
          <p>{site.studioAddress}</p>
        </div>
        <div>
          <p className="mono muted">Talk</p>
          {wa && (
            <a className="link" href={wa} target="_blank" rel="noopener noreferrer">
              WhatsApp {displayNumber}
            </a>
          )}
        </div>
        <div>
          <p className="mono muted">Follow</p>
          <a className="link" href={site.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
          {site.linkedinUrl && (
            <>
              {"  ·  "}
              <a className="link" href={site.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </>
          )}
        </div>
        <nav aria-label="Footer">
          <p className="mono muted">Pages</p>
          <div className="ftr__links">
            <TLink href="/work">Work</TLink>
            <TLink href="/services">Services</TLink>
            <TLink href="/exchange">The Exchange</TLink>
            <TLink href="/about">Studio</TLink>
            <TLink href="/contact">Contact</TLink>
          </div>
        </nav>
      </div>
      <div className="wrap ftr__base mono muted">
        <span>Architecture · Interiors · Furniture — Pakistan, est. 2025</span>
        <span>Demo build. The Atelier is an artistic interpretation, not a reconstruction of the HoS office.</span>
      </div>
      <style>{`
        .ftr{padding-top:clamp(70px,8vw,130px)}
        .ftr__top{display:grid;grid-template-columns:auto 1fr;gap:clamp(40px,6vw,110px);align-items:end;padding-bottom:clamp(60px,7vw,110px)}
        .ftr__mark{color:var(--rose)}
        .ftr__cta .h2{margin:0 0 32px;max-width:14ch}
        .ftr__grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;padding-top:28px;padding-bottom:56px;border-top:1px solid var(--line)}
        .ftr__grid p{margin:0 0 10px}
        .ftr__links{display:flex;flex-direction:column;gap:6px}
        .ftr__base{display:flex;justify-content:space-between;gap:20px;padding-top:20px;padding-bottom:28px;font-size:10.5px}
      `}</style>
    </footer>
  );
}
