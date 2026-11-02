"use client";
import { cityOf, cities, projects } from "@/content/projects";
import { CITY_AT, PAKISTAN } from "./story";

/* The courtyard's two floating cards, bottom-left and bottom-right: a few lines of the story and
   the map of where HoS has built (catalogue cities, dot size = number of spaces). */

const counts = new Map<string, number>();
for (const p of projects) counts.set(cityOf(p), (counts.get(cityOf(p)) ?? 0) + 1);
const X = (lon: number) => (lon - 60.5) * 18;
const Y = (lat: number) => (37.6 - lat) * 20;
const outline = PAKISTAN.map(([lo, la]) => `${X(lo).toFixed(1)},${Y(la).toFixed(1)}`).join(" ");

export default function CourtCards({ show }: { show: boolean }) {
  return (
    <div className={`cc ${show ? "is-on" : ""}`} aria-hidden={!show}>
      <article className="cc__card cc__story">
        <svg viewBox="0 0 60 60" className="cc__mark" aria-hidden>
          <path d="M18 56V22a12 12 0 0 1 24 0v34M6 38h48" fill="none" stroke="currentColor" strokeWidth="2" />
          <text x="11" y="35" fontSize="12" fontFamily="var(--font-logo)">H</text>
          <text x="42" y="35" fontSize="12" fontFamily="var(--font-logo)">S</text>
        </svg>
        <h3>
          Global thinking,
          <br />
          local insight.
        </h3>
        <p>Design consultants to established brands across Pakistan. Every project is a dialogue between space, material and the people who use it.</p>
        <span>House of Sultana · since 2025</span>
      </article>
      <article className="cc__card cc__map">
        <h3>Built across Pakistan</h3>
        <p>
          {projects.length} spaces in {cities.length} cities, from the HoS catalogue
        </p>
        <svg viewBox="-10 -10 330 300" className="cc__svg" role="img" aria-label="Map of Pakistan with HoS project cities">
          <polygon points={outline} />
          {[...counts.entries()].map(([name, n]) => {
            const at = CITY_AT[name];
            if (!at) return null;
            const r = 3 + Math.sqrt(n) * 2.4, left = name === "Lahore" || name === "Gujrat";
            const dy = name === "Gujrat" ? -6 : name === "Sialkot" ? 6 : 0;
            return (
              <g key={name}>
                <circle cx={X(at[0])} cy={Y(at[1])} r={r * 1.9} className="halo" />
                <circle cx={X(at[0])} cy={Y(at[1])} r={r} className="dot" />
                <text x={X(at[0]) + (left ? -r - 5 : r + 5)} y={Y(at[1]) + 4 + dy} textAnchor={left ? "end" : "start"}>
                  {name} <tspan>{n}</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      </article>
      <style>{`
        .cc{position:absolute;inset:auto 0 0 0;z-index:9;display:flex;justify-content:space-between;align-items:flex-end;padding:0 clamp(18px,3vw,40px) clamp(64px,8vh,90px);pointer-events:none;opacity:0;transform:translateY(14px);transition:opacity .9s var(--ease) .9s,transform 1.1s var(--ease) .9s}
        .cc.is-on{opacity:1;transform:none}
        .cc:not(.is-on){transition-delay:0s;transition-duration:.35s}
        .cc__card{pointer-events:auto;width:min(360px,30vw);padding:22px 24px;border-radius:16px;background:rgba(18,14,12,.28);backdrop-filter:blur(14px) saturate(1.1);-webkit-backdrop-filter:blur(14px) saturate(1.1);color:#f6efe6;text-shadow:0 1px 10px rgba(0,0,0,.25)}
        .cc__mark{width:38px;height:38px;color:#f6efe6;margin-bottom:10px}
        .cc__card h3{font-family:var(--font-display);font-weight:500;font-size:clamp(24px,2vw,32px);line-height:1.05;margin:0 0 10px}
        .cc__card p{margin:0 0 12px;font-size:14px;line-height:1.5;color:rgba(246,239,230,.86)}
        .cc__story span{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--rose)}
        .cc__map{width:min(330px,28vw)}
        .cc__svg{width:100%;height:auto;display:block}
        .cc__svg polygon{fill:rgba(246,239,230,.1);stroke:rgba(246,239,230,.6);stroke-width:1.4;stroke-linejoin:round}
        .cc__svg .dot{fill:var(--rose)}
        .cc__svg .halo{fill:rgba(255,90,31,.25)}
        .cc__svg text{fill:#f6efe6;font-size:12px;font-family:var(--font-sans)}
        .cc__svg tspan{fill:rgba(246,239,230,.6)}
      `}</style>
    </div>
  );
}
