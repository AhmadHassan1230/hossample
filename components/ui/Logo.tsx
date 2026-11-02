/* The HoS mark, redrawn from the studio's logo: an arched door (the "o" is its knob)
   standing on a threshold, between an H and an S. Geometry is shared with the
   Atelier intro and the page transition. */

export const ARCH = {
  viewBox: "0 0 560 520",
  // Door outline: x 160–357, springing at y 163.5, closed at the floor (455).
  door: "M160 455 V163.5 A98.5 98.5 0 0 1 357 163.5 V455 Z",
  bar: { x: 75, y: 327, w: 417, h: 13 },
  h: { x: 125, y: 322 },
  s: { x: 448, y: 322 },
  knob: { x: 323, y: 289 },
};

export function Mark({ size = 40, title = "House of Sultana" }: { size?: number; title?: string }) {
  return (
    <svg viewBox={ARCH.viewBox} width={size} height={(size * 520) / 560} role="img" aria-label={title}>
      <path d={ARCH.door} fill="none" stroke="currentColor" strokeWidth={9} />
      <rect x={ARCH.bar.x} y={ARCH.bar.y} width={ARCH.bar.w} height={ARCH.bar.h + 4} fill="currentColor" />
      <text x={ARCH.h.x} y={ARCH.h.y} textAnchor="middle" fontSize={150} fill="currentColor" style={{ fontFamily: "var(--font-logo)" }}>
        H
      </text>
      <text x={ARCH.s.x} y={ARCH.s.y} textAnchor="middle" fontSize={150} fill="currentColor" style={{ fontFamily: "var(--font-logo)" }}>
        S
      </text>
      <text x={ARCH.knob.x} y={ARCH.knob.y} textAnchor="middle" fontSize={44} fill="currentColor" style={{ fontFamily: "var(--font-logo)" }}>
        o
      </text>
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      House of Sultana
      <style>{`.wordmark{font-family:var(--font-display);font-size:12.5px;letter-spacing:.32em;text-transform:uppercase;font-weight:500}`}</style>
    </span>
  );
}
