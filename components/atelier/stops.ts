/* The scroll journey through the studio: one stop per discipline.
   Camera positions/targets are room metres. Copy is provisional, kept short on purpose. */

export type V3 = [number, number, number];
export type Stop = {
  id: string;
  kicker: string;
  title: string;
  line: string;
  href?: string;
  cta?: string;
  pos: V3;
  target: V3;
};

export const STOPS: Stop[] = [
  { id: "arrive", kicker: "House of Sultana", title: "We design beyond boundaries.", line: "Architecture, interiors and furniture. Scroll to walk through the studio.", pos: [0.5, 1.75, 8.6], target: [0.4, 1.75, -4.5] },
  { id: "furniture", kicker: "01 — Furniture", title: "Furniture", line: "Made to measure, built by our own craftsmen.", href: "/services/furniture", cta: "Furniture", pos: [1.9, 1.3, 3.6], target: [0.1, 0.5, 0.7] },
  { id: "exchange", kicker: "02 — The Exchange", title: "The Exchange", line: "Objects from the workshop, made to order.", href: "/exchange", cta: "Browse objects", pos: [4.3, 1.5, 4.4], target: [2.7, 0.8, 1.75] },
  { id: "content", kicker: "03 — Content", title: "Content", line: "Everyday content for the feed and the shop floor.", href: "/services/content", cta: "Content", pos: [3.2, 1.55, 1.7], target: [5.4, 1.15, -0.45] },
  { id: "marketing", kicker: "04 — Marketing", title: "Marketing", line: "Campaigns that bring spaces and products to market.", href: "/services/marketing", cta: "Marketing", pos: [3.4, 1.95, 0.7], target: [6.0, 1.95, -0.45] },
  { id: "filming", kicker: "05 — Filming", title: "Filming", line: "Film for brands and the spaces they live in.", href: "/services/filming", cta: "Filming", pos: [1.5, 1.7, 0.6], target: [3.9, 1.0, -3.3] },
  { id: "studio", kicker: "06 — The studio", title: "The house", line: "Founded 2025. Design consultants to brands across Pakistan.", href: "/about", cta: "About HoS", pos: [0.4, 1.65, -0.3], target: [0.4, 1.8, -4.6] },
  { id: "work", kicker: "07 — Work", title: "Selected work", line: "Twenty-two spaces in six cities.", href: "/work", cta: "All projects", pos: [-2.4, 1.8, -0.5], target: [-2.85, 1.85, -4.45] },
  { id: "construction", kicker: "08 — Construction", title: "Construction", line: "From concept to execution, on site.", href: "/services/construction", cta: "Construction", pos: [-3.2, 1.75, -1.4], target: [-5.4, 1.0, -3.95] },
  { id: "architecture", kicker: "09 — Architecture", title: "Architecture", line: "Frontages, kiosks and buildings, from the ground up.", href: "/services/architecture", cta: "Architecture", pos: [-1.0, 2.0, 0.7], target: [-3.0, 0.95, -1.6] },
  { id: "interiors", kicker: "10 — Interiors", title: "Interiors", line: "Cafés and workplaces people come back to.", href: "/services/interiors", cta: "Interiors", pos: [-2.0, 1.45, 3.5], target: [-4.6, 0.8, 0.9] },
  { id: "outro", kicker: "House of Sultana", title: "Every corner, one house.", line: "Seven disciplines under one roof.", href: "/contact", cta: "Start a project", pos: [0.2, 2.3, 8.9], target: [0.0, 1.35, -2.2] },
];

/** Shared scroll state (written by the page, read by the 3D camera and the overlays). */
export const journey = { progress: 0, smooth: 0, visible: true };
