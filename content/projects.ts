import catalog from "./catalog.generated.json";
import type { ServiceId } from "@/lib/schema";

/* Portfolio from the HOUSE OF SULTANA catalog (supplied by the owner, 1 Nov 2026).
   Names, locations, typologies and years are as printed in the catalog. Lines are
   short visual descriptions written for the site (provisional copy). */

export type Img = { src: string; width: number; height: number; built: boolean };
export type Project = {
  slug: string;
  client: "Loop" | "Overdose" | "OD × Loop" | "Overdose Express";
  branch: string;
  location: string;
  typology: "Café" | "Kiosk" | "Rooftop" | "Office";
  year: number;
  services: ServiceId[];
  line: string;
  images: Img[];
};

const imgs = (slug: string) => (catalog as Record<string, Img[]>)[slug];

const p = (
  slug: string,
  client: Project["client"],
  branch: string,
  location: string,
  typology: Project["typology"],
  services: ServiceId[],
  line: string,
): Project => ({ slug, client, branch, location, typology, year: 2026, services, line, images: imgs(slug) });

export const projects: Project[] = [
  p("loop-bukhari", "Loop", "Bukhari", "DHA Phase 6, Karachi", "Café", ["architecture", "interiors"], "Concrete calm, orange warmth and a bar for every kind of stay."),
  p("overdose-technopark", "Overdose", "Technopark", "DHA Phase 1, Islamabad", "Café", ["architecture", "interiors"], "A timber pavilion with a terrace that catches the evening."),
  p("loop-dolmen", "Loop", "Dolmen Mall", "Dolmen Mall, Karachi", "Kiosk", ["architecture", "interiors"], "A ring of light and planting in the middle of the mall."),
  p("overdose-mm-alam", "Overdose", "MM Alam", "MM Alam, Lahore", "Rooftop", ["architecture", "interiors"], "A rooftop under a timber lattice, wrapped in green."),
  p("od-loop-tipu", "OD × Loop", "Tipu", "Tipu, Karachi", "Café", ["architecture", "interiors"], "A glass box with a garden on its roof."),
  p("overdose-sialkot", "Overdose", "Sialkot", "V Mall, Sialkot", "Café", ["architecture", "interiors"], "Terrazzo, slats and planters stacked over two floors."),
  p("loop-heuser", "Loop", "Heuser", "Heuser, Karachi", "Café", ["architecture", "interiors"], "An open-air counter built for the golden hour."),
  p("overdose-civic-avenue", "Overdose", "Civic Avenue", "Bahria Town, Islamabad", "Café", ["interiors"], "Shelves, stairs and a lit oval bar inside the avenue."),
  p("loop-johar", "Loop", "Johar", "Gulistan-e-Johar, Karachi", "Café", ["interiors"], "Black steel stairs, long benches and Loop orange."),
  p("overdose-new-blue-area", "Overdose", "New Blue Area", "New Blue Area, Islamabad", "Café", ["interiors"], "Warm timber walls, built and open in Islamabad."),
  p("od-loop-jinnah-icon", "OD × Loop", "Jinnah Icon", "Saima Jinnah Icon Mall, Malir", "Café", ["interiors"], "Two brands, one counter, a ceiling of light."),
  p("loop-north-nazimabad", "Loop", "North Nazimabad", "North Nazimabad, Karachi", "Café", ["architecture", "interiors"], "A dark frontage that opens into a long orange room."),
  p("overdose-five-star", "Overdose", "Five Star", "North Nazimabad, Karachi", "Café", ["architecture", "interiors"], "A lantern of a building on a Karachi corner."),
  p("loop-gulgasht", "Loop", "Gulgasht", "Gulgasht, Multan", "Café", ["architecture", "interiors"], "A double-height room with seating that climbs the stairs."),
  p("overdose-gujrat", "Overdose", "Gujrat", "Gujrat", "Café", ["interiors"], "Planters, pendants and long timber tables."),
  p("loop-bahria", "Loop", "Bahria", "Bahria Town, Karachi", "Café", ["architecture", "interiors"], "A tall concrete house for coffee, with a garden inside."),
  p("loop-badar", "Loop", "Badar", "Badar, Karachi", "Café", ["interiors"], "A grab-and-go Loop: minimal, quick, convenient."),
  p("overdose-bahria-lahore", "Overdose", "Bahria", "Bahria Town, Lahore", "Café", ["interiors"], "A shopfront under the trees and a room of hanging green."),
  p("loop-iqra", "Loop", "Iqra University", "Iqra University, Juma Khan Kalhoro", "Kiosk", ["architecture", "interiors"], "A compact campus kiosk with a terrace of umbrellas."),
  p("overdose-express-ittehad", "Overdose Express", "Ittehad", "Khayaban-e-Ittehad, Karachi", "Café", ["interiors"], "A small, bright express counter, built."),
  p("overdose-express-lucky-one", "Overdose Express", "Lucky One Mall", "Lucky One Mall, Karachi", "Kiosk", ["architecture", "interiors"], "A freestanding express kiosk in the mall."),
  p("overdose-factory", "Overdose", "Factory office", "Karachi", "Office", ["interiors"], "Workplace for the Overdose team, with a green heart."),
];

export const projectBySlug = (slug: string) => projects.find((x) => x.slug === slug);
export const projectTitle = (x: Project) => `${x.client} ${x.branch}`;
export const builtCount = projects.filter((x) => x.images.some((i) => i.built)).length;
// Malir and Juma Khan Kalhoro are areas of Karachi.
const KARACHI_AREAS = ["Malir", "Juma Khan Kalhoro"];
export const cityOf = (x: Project) => {
  const last = x.location.split(", ").pop()!;
  return KARACHI_AREAS.includes(last) ? "Karachi" : last;
};
export const cities = [...new Set(projects.map(cityOf))];
