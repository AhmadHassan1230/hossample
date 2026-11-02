import { site } from "@/content/site";

/* One helper builds every WhatsApp inquiry. All CTAs route to the single central
   HoS number; nothing is sent until the visitor presses send inside WhatsApp. */

export type Inquiry =
  | { kind: "general" }
  | { kind: "service"; title: string }
  | { kind: "project"; title: string }
  | { kind: "product"; title: string; id: string };

export function inquiryMessage(i: Inquiry): string {
  switch (i.kind) {
    case "service":
      return `Hello House of Sultana, I'd like to talk about ${i.title.toLowerCase()} for my project.`;
    case "project":
      return `Hello House of Sultana, I saw your work on ${i.title} and would like something similar.`;
    case "product":
      return `Hello House of Sultana, I'm interested in the ${i.title} (reference ${i.id}). Could you confirm availability and details?`;
    default:
      return "Hello House of Sultana, I'd like to discuss a project.";
  }
}

export function whatsappHref(i: Inquiry): string | null {
  const n = site.centralWhatsAppNumber;
  if (!n || !/^[1-9]\d{7,14}$/.test(n)) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(inquiryMessage(i))}`;
}

export const displayNumber = "+92 347 123 7775";
