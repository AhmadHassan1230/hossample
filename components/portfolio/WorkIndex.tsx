"use client";
import { useMemo, useState } from "react";
import ProjectCard from "./ProjectCard";
import type { Project } from "@/content/projects";

const CLIENTS = ["All", "Loop", "Overdose", "OD × Loop", "Overdose Express"] as const;

export default function WorkIndex({ projects }: { projects: Project[] }) {
  const [client, setClient] = useState<(typeof CLIENTS)[number]>("All");
  const list = useMemo(() => (client === "All" ? projects : projects.filter((p) => p.client === client)), [client, projects]);
  return (
    <>
      <div className="wf" role="group" aria-label="Filter by brand">
        {CLIENTS.map((c) => {
          const n = c === "All" ? projects.length : projects.filter((p) => p.client === c).length;
          return (
            <button key={c} className={`wf__b ${client === c ? "is-on" : ""}`} aria-pressed={client === c} onClick={() => setClient(c)}>
              {c} <sup>{n}</sup>
            </button>
          );
        })}
      </div>
      <div className="wg">
        {list.map((p, i) => (
          <ProjectCard key={p.slug} p={p} size={i % 5 === 0 ? "l" : "m"} priority={i < 2} />
        ))}
      </div>
      <style>{`
        .wf{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:clamp(30px,4vw,56px)}
        .wf__b{height:40px;padding:0 16px;border-radius:3px;background:rgba(239,230,221,.06);font-size:14px;font-weight:500;color:var(--fg-2);transition:background .3s,color .3s}
        .wf__b sup{font-size:10px;color:var(--muted);margin-left:2px}
        .wf__b:hover{background:rgba(239,230,221,.12);color:var(--fg)}
        .wf__b.is-on{background:var(--fg);color:var(--bg)}
        .wf__b.is-on sup{color:var(--bg)}
        .wg{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(28px,3vw,48px) clamp(14px,1.6vw,24px)}
        .wg > .pc--l{grid-column:1 / -1}
        .wg > .pc--l .pc__img{aspect-ratio:21/9}
      `}</style>
    </>
  );
}
