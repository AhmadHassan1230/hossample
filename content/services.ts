import type { ServiceId } from "@/lib/schema";
import sizes from "./media.generated.json";

/* The seven approved services. Lines are provisional copy pending HoS approval. */

export type Service = {
  id: ServiceId;
  title: string;
  line: string;
  scope: string[];
  /** Hover/cover image */
  cover: string;
  /** Imagery from HoS's own channel when no client project shows this service yet */
  studio: { src: string; width: number; height: number; caption: string }[];
};

const ig = (id: keyof typeof sizes, caption: string) => ({ src: `/media/${id}.jpg`, ...sizes[id], caption });

export const services: Service[] = [
  {
    id: "architecture",
    title: "Architecture",
    line: "Buildings, frontages and kiosks, planned from the ground up.",
    scope: ["Architectural concepts", "Space planning", "Facades and frontages", "Design development"],
    cover: "/work/overdose-technopark/1.jpg",
    studio: [ig("studio-site-arch", "An arch taking shape on site")],
  },
  {
    id: "construction",
    title: "Construction",
    line: "From concept to execution, on site until opening day.",
    scope: ["Turnkey delivery", "Site coordination", "Execution follow-through"],
    cover: "/work/loop-bukhari/2.jpg",
    studio: [ig("studio-site-visit", "Site visit"), ig("studio-out-of-site", "On site with the team")],
  },
  {
    id: "interiors",
    title: "Interiors",
    line: "Cafés, kiosks and workplaces people come back to.",
    scope: ["Interior concepts", "Materials and finishes", "Lighting and joinery", "Floor plans"],
    cover: "/work/overdose-sialkot/2.jpg",
    studio: [],
  },
  {
    id: "furniture",
    title: "Furniture",
    line: "Made to measure, built by our own craftsmen.",
    scope: ["Custom furniture", "Bespoke house decor", "Workshop production"],
    cover: "/work/furniture/1.jpg",
    studio: [ig("studio-craftsman", "In the HoS workshop"), ig("studio-factory-tour", "Workshop tour")],
  },
  {
    id: "filming",
    title: "Filming",
    line: "Film and visual stories for brands and spaces.",
    scope: ["Film production", "Visual storytelling"],
    cover: "/media/studio-out-of-site.jpg",
    studio: [ig("studio-out-of-site", "From HoS's own channel")],
  },
  {
    id: "marketing",
    title: "Marketing",
    line: "Campaigns that bring a space or product to market.",
    scope: ["Brand communication", "Campaigns", "Launches"],
    cover: "/media/studio-expo.jpg",
    studio: [ig("studio-expo", "HoS at City Property Expo 2026")],
  },
  {
    id: "content",
    title: "Content",
    line: "Everyday content for the feed, the site and the shop floor.",
    scope: ["Content creation", "Product imagery"],
    cover: "/media/sheesham-chair.jpg",
    studio: [ig("sheesham-chair", "Product post from HoS's own channel")],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);
