import { cities, projectBySlug, projects } from "@/content/projects";
import { site } from "@/content/site";
import { productBySlug } from "@/content/products";
import { services } from "@/content/services";
import type { Inquiry } from "@/lib/inquiry";
import type { ViewId } from "./views";

/* What each clickable object in the studio opens. Facts come from content/ (catalogue projects,
   Exchange products, the seven services); nothing here is invented about HoS itself. */

export type ItemInfo = {
  title: string;
  meta?: string;
  line?: string;
  image?: string;
  href?: string;
  hrefLabel?: string;
  inquiry?: Inquiry;
  /** small thumbnails under the title (selected work) */
  gallery?: { src: string; href: string; title: string }[];
  /** the link leaves the site (Instagram) */
  external?: boolean;
  /** clicking the object goes straight to this page instead of opening a card */
  navigate?: string;
};

const CONTENT_ITEMS = new Set(["neon", "monitor_0", "monitor_1", "content_desk", "sweep", "set_chair", "camera", "softbox", "reflector", "screens", "tv"]);
const GALLERY = ["overdose-technopark", "loop-bukhari", "overdose-sialkot", "overdose-mm-alam", "od-loop-tipu", "loop-dolmen"];

/** Which space an item lives in (the first click goes there, the second opens the item). */
export function zoneOfItem(id: string, atlas?: string): ViewId {
  if (CONTENT_ITEMS.has(id)) return "content";
  if (id === "gateway" || atlas === "court") return "court";
  return atlas === "left" || atlas === "centre" || atlas === "right" ? atlas : "centre";
}

const SWATCH: Record<string, string> = {
  red_sandstone_wall: "Red sandstone",
  marble_01: "Marble",
  oak_veneer_01: "Oak",
  wool_boucle: "Bouclé wool",
  rough_linen: "Linen",
  red_sandstone_pavement: "Sandstone paving",
};

function project(slug: string, image = 1): ItemInfo | null {
  const p = projectBySlug(slug);
  if (!p) return null;
  return {
    title: `${p.client} ${p.branch}`,
    meta: `${p.typology} · ${p.location}`,
    line: p.line,
    image: p.images[image - 1]?.src ?? p.images[0]?.src,
    href: `/work/${slug}`,
    hrefLabel: "View project",
    inquiry: { kind: "project", title: `${p.client} ${p.branch}` },
  };
}

function product(slug: string): ItemInfo | null {
  const p = productBySlug(slug);
  if (!p) return null;
  return {
    title: p.title,
    meta: [p.category, ...(p.materials ?? [])].join(" · "),
    line: p.tagline,
    image: p.image?.src,
    href: `/exchange/${slug}`,
    hrefLabel: "In The Exchange",
    inquiry: { kind: "product", title: p.title, id: p.id },
  };
}

function service(id: string, title?: string): ItemInfo | null {
  const s = services.find((x) => x.id === id);
  if (!s) return null;
  return { title: title ?? s.title, meta: "Service", line: s.line, image: s.cover, href: `/services/${id}`, hrefLabel: `About ${s.title.toLowerCase()}`, inquiry: { kind: "service", title: s.title } };
}

export function infoFor(id: string): ItemInfo | null {
  switch (id) {
    case "selected_work":
      return {
        title: "Selected work",
        meta: `${projects.length} spaces · ${cities.length} cities`,
        line: "Cafés, kiosks, rooftops and offices across Pakistan, from the HoS catalogue.",
        href: "/work",
        hrefLabel: "All projects",
        gallery: GALLERY.map((slug) => projectBySlug(slug)).filter(Boolean).map((p) => ({ src: p!.images[0].src, href: `/work/${p!.slug}`, title: `${p!.client} ${p!.branch}` })),
      };
    case "drawing_board":
      return { ...service("architecture")!, title: "The drawing board", meta: "Architecture" };
    case "hero_model":
      return { ...service("architecture")!, title: "Study model", meta: "Architecture · models" };
    case "showroom":
      return { title: "The furniture floor", meta: "The Exchange", line: "Pieces to sit on, walk round and order. Every listing says whether HoS has verified it.", href: "/marketplace", hrefLabel: "Enter the marketplace" };
    case "marketplace":
      return { title: "Enter the marketplace", navigate: "/marketplace" };
    case "living":
      return { ...service("interiors")!, title: "A living room", meta: "Interiors" };
    case "screens":
      return { title: "@houseofsultana.co", meta: "Content · Instagram", line: "The studio's own channel: projects, products and process.", image: "/media/studio-site-arch.jpg", href: site.instagramUrl, hrefLabel: "Open Instagram", external: true, inquiry: { kind: "service", title: "Content" } };
    case "tv":
      return service("filming");
  }
  if (id.startsWith("work_")) return project(id.slice(5));
  if (id.startsWith("swatch_") && id !== "swatch_table") return { ...service("interiors")!, title: SWATCH[id.slice(7)] ?? "Material sample", meta: "Material library" };
  switch (id) {
    case "monitor_0":
      return project("overdose-five-star");
    case "monitor_1":
      return project("loop-heuser");
    case "interiors_print":
      return project("overdose-sialkot", 2);
    case "bench":
      return product("oak-cane-bench");
    case "sheesham_chair_a":
    case "sheesham_chair_b":
    case "set_chair":
      return product("sheesham-chair");
    case "armchair":
      return product("boucle-armchair");
    case "console":
      return product("console-table");
    case "plan_0":
    case "plan_1":
    case "plan_2":
    case "table_plan_0":
    case "table_plan_1":
    case "drafting_table":
    case "plan_chest":
    case "roll_basket":
      return { ...service("architecture")!, title: "Drawings", meta: "From the HoS catalogue" };
    case "model_frame":
    case "model_courtyard":
    case "model_jaali":
    case "masterplan":
      return { ...service("architecture")!, title: "Study models", meta: "Architecture" };
    case "site_model":
    case "long_table":
      return { title: "House of Sultana", meta: "Architecture · Interiors · Furniture", line: "A studio that designs the building, fits it out and makes the furniture.", href: "/about", hrefLabel: "The studio", inquiry: { kind: "general" } };
    case "catalog":
      return { title: "The 2026 catalogue", meta: "Selected work", line: "Cafés, kiosks and rooftops, Karachi to Sialkot.", href: "/work", hrefLabel: "All projects" };
    case "sample_board":
    case "swatch_table":
    case "library":
      return { ...service("interiors")!, title: "Material library", meta: "Interiors" };
    case "lounge_chair":
    case "floor_lamp":
      return service("interiors");
    case "content_desk":
    case "neon":
      return service("content");
    case "sweep":
    case "camera":
    case "softbox":
    case "reflector":
      return service("filming");
    case "gateway":
      return { title: "The HoS arch", meta: "House of Sultana", line: "The arch from the House of Sultana mark, in brass.", href: "/about", hrefLabel: "The studio" };
  }
  return null;
}
