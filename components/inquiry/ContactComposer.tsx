"use client";
import { useMemo, useState } from "react";
import { services } from "@/content/services";
import { inquiryMessage, whatsappHref, type Inquiry } from "@/lib/inquiry";

export default function ContactComposer() {
  const [topic, setTopic] = useState<string>("general");
  const [note, setNote] = useState("");
  const inquiry: Inquiry = useMemo(() => {
    const s = services.find((x) => x.id === topic);
    return s ? { kind: "service", title: s.title } : { kind: "general" };
  }, [topic]);
  const base = inquiryMessage(inquiry);
  const message = note.trim() ? `${base} ${note.trim().slice(0, 300)}` : base;
  const href = whatsappHref(inquiry)?.replace(/text=[^&]*/, `text=${encodeURIComponent(message)}`) ?? null;
  return (
    <div className="cc">
      <p className="mono muted">What is it about?</p>
      <div className="cc__topics" role="radiogroup" aria-label="Topic">
        {[{ id: "general", title: "A project" }, ...services.map((s) => ({ id: s.id, title: s.title }))].map((t) => (
          <button key={t.id} role="radio" aria-checked={topic === t.id} className={`cc__t ${topic === t.id ? "is-on" : ""}`} onClick={() => setTopic(t.id)}>
            {t.title}
          </button>
        ))}
      </div>
      <label className="cc__label">
        <span className="mono muted">Add a note (optional)</span>
        <textarea value={note} maxLength={300} rows={3} onChange={(e) => setNote(e.target.value)} placeholder="Location, size, timeline…" />
      </label>
      <div className="cc__preview">
        <span className="mono muted">Message preview</span>
        <p>{message}</p>
      </div>
      {href && (
        <a className="btn cc__send" href={href} target="_blank" rel="noopener noreferrer">
          Open WhatsApp <span className="arrow">→</span>
        </a>
      )}
      <p className="muted cc__fine">WhatsApp opens in a new tab with this message. Nothing is sent until you press send there.</p>
      <style>{`
        .cc__topics{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 30px}
        .cc__t{height:42px;padding:0 16px;border-radius:3px;background:rgba(239,230,221,.06);font-size:14.5px;font-weight:500;color:var(--fg-2);transition:background .3s,color .3s}
        .cc__t:hover{background:rgba(239,230,221,.12);color:var(--fg)}
        .cc__t.is-on{background:var(--fg);color:var(--bg)}
        .cc__label{display:flex;flex-direction:column;gap:10px;margin-bottom:24px}
        .cc__label textarea{font:inherit;color:var(--fg);background:rgba(239,230,221,.06);border:0;border-radius:4px;padding:14px 16px;resize:vertical}
        .cc__label textarea:focus{outline:2px solid var(--rose)}
        .cc__preview{background:rgba(239,230,221,.04);border-radius:4px;padding:16px 18px;margin-bottom:18px}
        .cc__preview p{margin:8px 0 0;font-size:17px;line-height:1.45}
        .cc__fine{font-size:13px;margin-top:12px}
      `}</style>
    </div>
  );
}
