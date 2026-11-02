import catalog from "./catalog.generated.json";
import sizes from "./media.generated.json";

/* The Exchange: physical objects for sale only. These are pieces HoS has offered
   for order (catalog furniture pages and Instagram). Prices, stock and dimensions
   are not published, so every piece is "price on inquiry" and availability is asked. */

export type ProductImg = { src: string; width: number; height: number };
export type Product = {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: "Furniture" | "Decor";
  materials?: string[];
  image: ProductImg;
  gallery: ProductImg[];
};

const cat = (n: number): ProductImg => (catalog as Record<string, ProductImg[]>).furniture[n];
const ig = (id: keyof typeof sizes): ProductImg => ({ src: `/media/${id}.jpg`, ...sizes[id] });

export const products: Product[] = [
  {
    id: "HOS-001",
    slug: "oak-cane-bench",
    title: "Oak and cane bench",
    tagline: "A bench worth pausing for.",
    description: "Solid oak, handcrafted for durability and warmth, with a woven cane seat. Made to any dimension.",
    category: "Furniture",
    materials: ["Solid oak", "Cane"],
    image: cat(0),
    gallery: [ig("oak-cane-bench"), ig("oak-cane-bench-workshop")],
  },
  {
    id: "HOS-002",
    slug: "console-table",
    title: "Console table",
    tagline: "Seventy-two inches, two drawers, one glass shelf.",
    description: "A minimalist console with two drawers, a clear glass shelf and dual cabinets, raised on tapered legs.",
    category: "Furniture",
    materials: ["Premium wood finish", "Glass"],
    image: cat(1),
    gallery: [ig("console-table"), ig("console-table-workshop")],
  },
  {
    id: "HOS-003",
    slug: "boucle-armchair",
    title: "Bouclé armchair",
    tagline: "Soft scallops on solid legs.",
    description: "A scalloped bouclé armchair on angled wooden legs.",
    category: "Furniture",
    materials: ["Bouclé", "Wood"],
    image: cat(2),
    gallery: [ig("boucle-detail")],
  },
  {
    id: "HOS-004",
    slug: "sheesham-chair",
    title: "Sheesham chair",
    tagline: "Bend it like sheesham.",
    description: "A sculpted chair with a curved back rail in sheesham wood.",
    category: "Furniture",
    materials: ["Sheesham"],
    image: cat(3),
    gallery: [ig("sheesham-chair")],
  },
  {
    id: "HOS-005",
    slug: "arch-mirror",
    title: "Arch mirror",
    tagline: "The House of Sultana arch, as a mirror.",
    description: "An arched mirror in a wooden frame. The studio's own shape, made into an object.",
    category: "Decor",
    image: ig("arch-mirror"),
    gallery: [],
  },
  {
    id: "HOS-006",
    slug: "boucle-sofa",
    title: "Curved bouclé sofa",
    tagline: "Now in different shades.",
    description: "A curved sofa in bouclé with natural wood details.",
    category: "Furniture",
    materials: ["Bouclé", "Wood"],
    image: ig("boucle-sofa"),
    gallery: [],
  },
  {
    id: "HOS-007",
    slug: "study-table",
    title: "Study table",
    tagline: "Minimal form. Maximum focus.",
    description: "A mild-steel frame, welded, ground and powder coated, under a top made to your choice.",
    category: "Furniture",
    materials: ["Powder-coated mild steel", "Custom top"],
    image: ig("study-table"),
    gallery: [ig("study-table-workshop")],
  },
  {
    id: "HOS-008",
    slug: "curved-lounge-chair",
    title: "Curved lounge chair",
    tagline: "Built for comfort, designed for desire.",
    description: "An upholstered lounge chair, one continuous curve from head to foot.",
    category: "Furniture",
    image: ig("lounge-chair"),
    gallery: [],
  },
  {
    id: "HOS-009",
    slug: "blue-and-white-vase",
    title: "Blue and white vase",
    tagline: "Home Decor Collection 2025.",
    description: "A blue and white porcelain vase from the HoS Home Decor Collection.",
    category: "Decor",
    image: ig("vase-blue-white"),
    gallery: [],
  },
  {
    id: "HOS-010",
    slug: "banded-vase",
    title: "Banded vase",
    tagline: "Home Decor Collection 2025.",
    description: "A cream ceramic vase with a textured brown band.",
    category: "Decor",
    image: ig("vase-banded"),
    gallery: [],
  },
  {
    id: "HOS-011",
    slug: "cream-vase",
    title: "Cream vase",
    tagline: "Home Decor Collection 2025.",
    description: "A matte cream ceramic bottle vase.",
    category: "Decor",
    image: ig("vase-cream"),
    gallery: [],
  },
];

export const productBySlug = (slug: string) => products.find((x) => x.slug === slug);
