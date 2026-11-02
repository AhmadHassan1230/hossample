import type { Metadata } from "next";
import ContactComposer from "@/components/inquiry/ContactComposer";
import { site } from "@/content/site";
import { displayNumber } from "@/lib/inquiry";

export const metadata: Metadata = { title: "Contact" };

export default function ContactPage() {
  return (
    <section className="wrap page" style={{ paddingBottom: "clamp(80px,9vw,150px)" }}>
      <header className="page__head">
        <h1 className="display h1">Let’s talk.</h1>
        <p className="lede muted">One number for every project, piece and question. Choose a topic, check the message, then send it from WhatsApp.</p>
      </header>
      <div className="ct">
        <ContactComposer />
        <aside className="ct__side">
          <div>
            <p className="mono muted">WhatsApp</p>
            <p className="ct__big">{displayNumber}</p>
          </div>
          <div>
            <p className="mono muted">Studio</p>
            <p>{site.studioAddress}</p>
          </div>
          <div>
            <p className="mono muted">Follow</p>
            <p>
              <a className="link" href={site.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>
              {site.linkedinUrl && (
                <>
                  {"  ·  "}
                  <a className="link" href={site.linkedinUrl} target="_blank" rel="noopener noreferrer">LinkedIn</a>
                </>
              )}
            </p>
          </div>
        </aside>
      </div>
      <style>{`
        .ct{display:grid;grid-template-columns:1.3fr 1fr;gap:clamp(30px,5vw,90px);align-items:start}
        .ct__side{display:flex;flex-direction:column;gap:28px}
        .ct__side p{margin:0 0 6px}
        .ct__big{font-family:var(--font-display);font-size:clamp(28px,2.6vw,44px);letter-spacing:-.03em}
      `}</style>
    </section>
  );
}
