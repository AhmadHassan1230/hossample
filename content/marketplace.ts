import { products } from "./products";

/* SAMPLE marketplace for the demo (no backend, no product pages). HoS's own pieces are the real
   Exchange products and show as "HoS verified"; the community listings are placeholders built on
   CC0 Poly Haven renders and show as "Not verified". Replace before any real launch. */

export type Listing = {
  id: string;
  title: string;
  category: "Furniture" | "Decor";
  detail: string;
  image: string;
  verified: boolean;
  seller: string;
  /** HoS pieces carry their product reference for the WhatsApp inquiry */
  ref?: string;
};

const hos: Listing[] = products.map((p) => ({
  id: p.slug,
  title: p.title,
  category: p.category,
  detail: p.materials?.join(", ") ?? p.tagline,
  image: p.image.src,
  verified: true,
  seller: "House of Sultana",
  ref: p.id,
}));

const community: Listing[] = [
  ["GreenChair_01", "Velvet wing chair", "Furniture", "Carved frame, green velvet"],
  ["sofa_02", "Tufted leather sofa", "Furniture", "Two-seater, deep buttoning"],
  ["modern_coffee_table_02", "Lattice coffee table", "Furniture", "Fretwork top on a dark base"],
  ["chinese_armchair", "Carved high-back chair", "Furniture", "Hardwood, hand-carved splat"],
  ["coffee_table_round_01", "Marble round table", "Furniture", "Stone top, steel loop legs"],
  ["Ottoman_01", "Leather ottoman", "Furniture", "Aged leather, low and wide"],
  ["ornate_mirror_01", "Arched gilt mirror", "Decor", "Gilded frame, bevelled glass"],
  ["modern_wooden_cabinet", "Fluted media cabinet", "Furniture", "Walnut with reeded doors"],
  ["ArmChair_01", "Upholstered armchair", "Furniture", "Carved frame, linen seat"],
  ["gallinera_chair", "Carved hall chair", "Furniture", "Dark wood, box seat"],
  ["side_table_tall_01", "Tall side table", "Furniture", "Turned legs, two tiers"],
].map(([id, title, category, detail]) => ({
  id,
  title,
  category: category as Listing["category"],
  detail,
  image: `/marketplace/${id}.webp`,
  verified: false,
  seller: "Community seller (sample)",
}));

// interleave so the two kinds sit side by side
export const listings: Listing[] = hos.flatMap((h, i) => (community[i] ? [h, community[i]] : [h])).concat(community.slice(hos.length));
