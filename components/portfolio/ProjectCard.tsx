import Image from "next/image";
import TLink from "@/components/navigation/TLink";
import { cityOf, type Project } from "@/content/projects";

export default function ProjectCard({ p, size = "m", priority = false }: { p: Project; size?: "l" | "m" | "s"; priority?: boolean }) {
  const img = p.images[0];
  const built = p.images.some((i) => i.built);
  return (
    <TLink href={`/work/${p.slug}`} className={`pc pc--${size} reveal`}>
      <div className="pc__img img-reveal">
        <Image src={img.src} alt={`${p.client} ${p.branch}`} width={img.width} height={img.height} sizes={size === "l" ? "66vw" : "33vw"} priority={priority} />
      </div>
      <div className="pc__meta">
        <span className="pc__title">
          {p.client} <em>{p.branch}</em>
        </span>
        <span className="mono muted">
          {p.typology} · {cityOf(p)}
          {built ? " · Built" : ""}
        </span>
      </div>
      <style>{`
        .pc{display:block}
        .pc__img{position:relative;border-radius:4px;overflow:hidden;background:var(--blush-2)}
        .pc__img img{width:100%;height:100%;object-fit:cover;transition:transform 1.4s var(--ease),filter .6s}
        .pc:hover .pc__img img{transform:scale(1.035)}
        .pc--l .pc__img{aspect-ratio:16/10}
        .pc--m .pc__img{aspect-ratio:4/3.1}
        .pc--s .pc__img{aspect-ratio:4/5}
        .pc__meta{display:flex;justify-content:space-between;align-items:baseline;gap:16px;padding-top:14px}
        .pc__title{font-family:var(--font-display);font-size:clamp(20px,1.7vw,28px);letter-spacing:-.01em}
        .pc__title em{font-style:normal;color:var(--clay)}
      `}</style>
    </TLink>
  );
}
