import { z } from "zod";

/* Content contracts from CLAUDE_HANDOFF.md §9, enforced at build time.
   Deviations are recorded in docs/decisions.md. */

export const SERVICE_IDS = [
  "architecture",
  "construction",
  "interiors",
  "furniture",
  "filming",
  "marketing",
  "content",
] as const;
export const ServiceIdSchema = z.enum(SERVICE_IDS);
export type ServiceId = z.infer<typeof ServiceIdSchema>;

export const EditorialStatusSchema = z.enum(["approved", "sourced", "proposed", "demo", "missing"]);
export type EditorialStatus = z.infer<typeof EditorialStatusSchema>;

export const ProvenanceSchema = z
  .object({
    status: EditorialStatusSchema,
    sourceUrls: z.array(z.url()),
    sourceNote: z.string().optional(),
    accessedAt: z.iso.date().optional(),
    approvedBy: z.string().optional(),
    approvedAt: z.iso.date().optional(),
  })
  .refine((p) => p.status !== "approved" || (p.approvedBy && p.approvedAt), {
    message: "Approved records must name who approved them and when.",
  })
  .refine((p) => p.status !== "sourced" || p.sourceUrls.length > 0, {
    message: "Sourced records must cite at least one source URL.",
  });
export type Provenance = z.infer<typeof ProvenanceSchema>;

export const MediaAssetSchema = z.object({
  id: z.string().min(1),
  src: z.string().startsWith("/"),
  kind: z.enum(["image", "video"]),
  alt: z.string().min(8),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  poster: z.string().optional(),
  credit: z.string().optional(),
  rights: z.enum(["approved", "licensed", "pending"]),
  /** studio_content = HoS's own channel (behind the scenes), never presented as client work. */
  representation: z.enum(["real_project", "real_product", "artistic_demo", "studio_content"]),
  /** True for renders/visualisations, so they are never captioned as photographs. */
  visualisation: z.boolean().optional(),
  provenance: ProvenanceSchema,
});
export type MediaAsset = z.infer<typeof MediaAssetSchema>;

export const ServiceSchema = z
  .object({
    id: ServiceIdSchema,
    slug: ServiceIdSchema,
    title: z.string(),
    /** One short line (≈10 words). */
    line: z.string().max(90),
    summary: z.string(),
    scope: z.array(z.string()),
    projectIds: z.array(z.string()),
    /** Supporting imagery from HoS's own channel when no client project exists yet. */
    studioMediaIds: z.array(z.string()),
    provenance: ProvenanceSchema,
  })
  .refine((s) => s.id === s.slug, { message: "Service slug must equal its id." });
export type Service = z.infer<typeof ServiceSchema>;

export const ProjectSchema = z
  .object({
    id: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string(),
    /** Set when HoS has not confirmed the project's public name. */
    namePending: z.boolean().optional(),
    serviceIds: z.array(ServiceIdSchema).min(1),
    hosRole: z.string(),
    roleConfirmed: z.boolean(),
    summary: z.string(),
    stage: z.enum(["completed", "in_progress", "opening_soon"]),
    media: z.array(MediaAssetSchema).min(1),
    location: z.string().optional(),
    year: z.number().int().optional(),
    clientName: z.string().optional(),
    credits: z.array(z.string()).optional(),
    provenance: ProvenanceSchema,
  })
  .refine((p) => p.media.every((m) => m.representation === "real_project"), {
    message: "Portfolio records may only use real project media (no demo or studio imagery as evidence).",
  })
  .refine((p) => p.provenance.status !== "demo", { message: "Demo records cannot be portfolio projects." });
export type Project = z.infer<typeof ProjectSchema>;

export const PRODUCT_CATEGORIES = [
  "furniture",
  "lighting",
  "decor",
  "art_objects",
  "physical_materials",
  "equipment",
] as const;
export const ProductCategorySchema = z.enum(PRODUCT_CATEGORIES);
export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const VerificationSchema = z.discriminatedUnion("state", [
  z.object({ state: z.literal("not_verified") }),
  z.object({ state: z.literal("demo"), explanation: z.string() }),
  z.object({
    state: z.literal("verified"),
    checkedAt: z.iso.date(),
    scope: z.array(z.string()).min(1),
    policyVersion: z.string(),
    evidenceRef: z.string(),
  }),
  /** Deviation: pieces HoS makes itself. Verification describes third-party listings, so it does not apply. */
  z.object({ state: z.literal("hos_made") }),
]);
export type Verification = z.infer<typeof VerificationSchema>;

const DimensionsSchema = z.object({
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  depth: z.number().positive().optional(),
  unit: z.enum(["cm", "mm", "in"]),
});

export const ProductSchema = z
  .strictObject({
    id: z.string(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    listingKind: z.literal("physical_product"),
    transactionIntent: z.literal("sale"),
    source: z.enum(["hos_workshop", "sample_listing"]),
    title: z.string(),
    tagline: z.string().optional(),
    description: z.string(),
    category: ProductCategorySchema,
    condition: z.enum(["new", "used", "refurbished", "unknown"]),
    materials: z.array(z.string()).optional(),
    dimensions: DimensionsSchema.optional(),
    price: z.discriminatedUnion("mode", [
      z.object({ mode: z.literal("inquiry") }),
      z.object({ mode: z.literal("fixed"), amount: z.number().positive(), currency: z.literal("PKR") }),
    ]),
    availability: z.enum(["available", "reserved", "sold", "unknown"]),
    location: z.string().optional(),
    media: z.array(MediaAssetSchema).min(1),
    verification: VerificationSchema,
    provenance: ProvenanceSchema,
    // Deliberately absent: seller phone, rental unit, booking URL, downloadable asset, service fields.
  })
  .superRefine((p, ctx) => {
    const demo = p.provenance.status === "demo";
    if (p.source === "sample_listing" && !demo)
      ctx.addIssue({ code: "custom", message: "Sample listings must carry demo provenance." });
    if (demo && p.verification.state === "verified")
      ctx.addIssue({ code: "custom", message: "Demo products can never be HoS Verified." });
    if (demo && p.verification.state !== "demo")
      ctx.addIssue({ code: "custom", message: "Demo products must use the demo verification state." });
    if (p.verification.state === "hos_made" && p.source !== "hos_workshop")
      ctx.addIssue({ code: "custom", message: "Only HoS workshop pieces can be marked as made by HoS." });
    if (p.source === "hos_workshop" && demo)
      ctx.addIssue({ code: "custom", message: "Workshop pieces must come from a real source." });
  });
export type Product = z.infer<typeof ProductSchema>;

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

export const CameraAnchorSchema = z.object({ id: z.string(), position: Vec3, target: Vec3 });
export type CameraAnchor = z.infer<typeof CameraAnchorSchema>;

export const HotspotSchema = z.object({
  id: z.string(),
  label: z.string(),
  line: z.string(),
  position: Vec3,
  cameraAnchorId: z.string(),
  href: z.string().startsWith("/"),
  target: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("service"), id: ServiceIdSchema }),
    z.object({ kind: z.enum(["work", "exchange", "about", "contact"]) }),
  ]),
  /** Real media shown in the preview panel. */
  mediaIds: z.array(z.string()),
});
export type Hotspot = z.infer<typeof HotspotSchema>;

export const SiteConfigSchema = z.object({
  brandName: z.literal("House of Sultana"),
  instagramUrl: z.url(),
  linkedinUrl: z.url().optional(),
  /** International digits only, no '+'. Null shows "Contact number pending". */
  centralWhatsAppNumber: z.string().nullable(),
  /** Null keeps localhost or demo URLs out of customer messages. */
  canonicalOrigin: z.url().nullable(),
  demoMode: z.boolean(),
  studioAddress: z.string().optional(),
  provenance: ProvenanceSchema,
});
export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export type InquiryContext =
  | { kind: "general" }
  | { kind: "service"; serviceId: ServiceId }
  | { kind: "project"; projectId: string }
  | { kind: "product"; productId: string }
  | { kind: "propose_object"; title?: string };
