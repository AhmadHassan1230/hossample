import type { SiteConfig } from "@/lib/schema";

export const site: SiteConfig = {
  brandName: "House of Sultana",
  instagramUrl: "https://www.instagram.com/houseofsultana.co/",
  linkedinUrl: "https://www.linkedin.com/company/houseofsultana",
  // Listed in the HoS Instagram bio and on hosultana.com; owner confirmed routing (1 Nov 2026).
  centralWhatsAppNumber: "923471237775",
  // Unset until a production domain is approved, so demo URLs never reach a customer message.
  canonicalOrigin: null,
  demoMode: true,
  studioAddress: "Office 303, C-9C, Lane 1, Murtaza Commercial, Phase 8, DHA, Karachi",
  provenance: {
    status: "sourced",
    sourceUrls: ["https://www.instagram.com/houseofsultana.co/", "https://hosultana.com/"],
    accessedAt: "2026-11-01",
    sourceNote: "WhatsApp routing confirmed by the site owner; address taken from hosultana.com and awaiting approval.",
  },
};
