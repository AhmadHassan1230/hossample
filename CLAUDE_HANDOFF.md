# House of Sultana — Frontend Demo Handoff for Claude

**Prepared:** 1 November 2026  
**Deliverable:** Implementation-ready specification; no website implementation is included or authorized by creation of this document.  
**Project directory:** `house-of-sultana/` within the Client Work workspace.  
**Audience:** Claude acting as the future frontend implementer, after the owner explicitly requests implementation.

## 1. Read this first

Create an exceptional frontend demonstration of House of Sultana (HoS), a multidisciplinary creative business in Pakistan. The central experience is **The Atelier**: a cinematic, code-first, interactive 3D studio/house that connects the seven services, real portfolio projects, **The Exchange** physical-product marketplace, and one central WhatsApp inquiry destination.

The experience must feel like a coherent creative place, with equal attention to spatial atmosphere, useful interaction, portfolio presentation, and marketplace polish. Do not reduce the homepage to a conventional hero with a decorative rotating model. Equally, do not make users navigate a game to access the business.

**Hard marketplace rule:** The Exchange contains tangible physical objects/products only. No skills, talent, services, rentals, digital downloads, digital assets, job listings, booking listings, or service packages. Architecture, construction, interiors, furniture services, filming, marketing, and content remain business services outside The Exchange.

This is a frontend demo, not a production commerce platform. No checkout, payments, seller payouts, real listing publication, authentication, or backend verification system is required. Do not invent operating infrastructure or imply a demo action performed a real transaction.

## 2. Source integrity and decision status

Source conversation: **Plan House Of Sultana Website**, conversation ID `6ae65b09-83d8-83ed-828b-235dbeec34ea`.

The accessible conversation contains the user's discovery answers and subsequent decisions. Earlier assistant responses resolve only to content-reference markers; their substantive specifications and any research results were not retrievable. Therefore, this handoff preserves every recoverable approved requirement but **does not claim to reproduce inaccessible scene layouts or architecture verbatim**. Detailed implementation decisions below are newly proposed, compatible specifications.

Use these statuses in content records and internal documentation:

- **Approved:** Explicitly stated by the user. This means approved direction or client-supplied information, not independent verification.
- **Sourced:** Supported by an identified primary source; still requires approval before becoming final brand copy.
- **Proposed:** A concrete design or engineering recommendation in this handoff, not historical client approval.
- **Demo:** Invented illustrative content or an artistic asset, visibly identified when a visitor could mistake it for fact.
- **Missing:** Required input not supplied or verified. Never silently fill it with an invented fact.

### Approved requirements and facts

| Item | Recorded direction | Practical interpretation |
| --- | --- | --- |
| Business | House of Sultana in Pakistan | Exact legal name, address, city, and operational scope remain unconfirmed. |
| Official social reference | https://www.instagram.com/houseofsultana.co/ | User-supplied account; no project details or media rights were verified in preparing this file. |
| Seven services | Architecture, construction, interiors, furniture, filming, marketing, content | Preserve all seven as distinct services. |
| Audience | Clients and businesses; broad audience | Do not invent a narrower approved segment. |
| Goal | Combination | Support discovery, portfolio confidence, product exploration, and inquiries; exact business KPI priorities remain open. |
| Homepage reference | Interactive room, inspired by Basement Studio | Inspiration for spatial navigation and craft; no cloning of proprietary assets or layout. |
| Visual ambition | Hyperrealistic and cinematic | Quality target; code-only geometry has practical limits. |
| Spatial premise | Real house/office preferred | No real office photographs, footage, CAD, Revit, SketchUp, or 3D model are available for this sample. |
| Artistic freedom | Granted for sample | Build an interpretive studio, not a claimed accurate reconstruction. |
| Asset creation | Code-first; user lacks Blender | Core room and props must be constructible programmatically. |
| Atmosphere | Hybrid | The specific blend below is a proposal because the prior definition is unavailable. |
| Demo emphasis | Equally polished combination | Balance cinematic space, interaction, real work, and marketplace. |
| Portfolio | Real projects | Do not invent HoS project names, clients, outcomes, locations, awards, or imagery. |
| Inquiry channel | WhatsApp, central routing | Every service, project, and product inquiry uses one configured HoS destination. |
| Verification | HoS team verifies | The specific checks, guarantee, policy, and evidence are not defined. |
| Marketplace | Physical objects/products only | Latest instruction supersedes earlier broad marketplace ideas. |
| Current scope | Handoff only | No application code, dependencies, deployment, or generated assets at this stage. |

### Missing inputs and how to proceed later

| Input | Safe demo handling | Release gate |
| --- | --- | --- |
| Approved central WhatsApp number | Disabled inquiry action with “Contact number pending”; never substitute a guessed number | Validated international-format number required for live links |
| Real portfolio package | Honest empty states or clearly marked layout placeholders; no fictional project cards | Real approved project records and permission-cleared media required to call the portfolio complete |
| Logo, fonts, brand palette | Proposed typographic wordmark and licensed font selection, documented as provisional | Owner confirms brand assets and usage rights |
| Office references | Interpretive procedural Atelier labeled in About/demo information | Do not claim physical accuracy without references |
| Actual product inventory | Explicitly labeled sample physical products | Approved product details, photos, ownership/availability, and seller permission before real listing claims |
| HoS verification policy | Explain that criteria are pending; demonstration badges say “Demo verification” | Policy and record-specific evidence before genuine “HoS Verified” claims |
| Contact details and company story | Omit unknown facts; use neutral provisional introduction | Client approval for final copy |
| Submission and privacy policy | Local demo form with no collection/upload | Separate approval and infrastructure before collecting personal information |

Public research may inform discovery, but does not establish final brand copy. Preserve source URLs, access dates, permission status, and approval status for all factual content. Do not infer blanket guarantees from the earlier answer “all of this”; the options to which it referred are unavailable.

## 3. Proposed creative specification

### Creative idea: one creative house, many disciplines

Treat The Atelier as an authored working environment with signs of making: an architectural model, a material wall, a sculptural furniture piece, a camera/editing corner, and a curated product plinth. Each has a business purpose and a clear route into normal HTML content.

**Proposed interpretation of hybrid:** architectural realism and tactile material detail combined with editorial art direction and restrained surreal lighting. Warm timber, plaster, stone, brushed metal, and smoked glass meet charcoal shadows, warm practical light, and one subtle cool accent. This interpretation is not a recovered prior approval.

Use generous editorial typography, readable text, deliberate asymmetry, and selective motion. Avoid excessive bloom, illegible dark surfaces, gratuitous floating objects, neon gaming aesthetics, or a generic technology dashboard. Typography and color tokens must be finalized against actual brand assets; do not present provisional colors as HoS's established identity.

**Suggested provisional copy, requiring approval:**

- Homepage: “A house of ideas, made real.”
- Supporting line: “Architecture, spaces, objects, and stories.”
- Primary action: “Explore the Atelier.”
- Always-available secondary action: “View our work.”
- Marketplace introduction: “Physical objects, thoughtfully brought together.”

The room itself is a demo artistic interpretation. Keep an accessible note in the demo information/About area: “The Atelier is an artistic interpretation created for this website demonstration.” If the office connection is prominently claimed elsewhere, place the qualification beside that claim.

## 4. Information architecture and detailed pages

Use stable routes. The 3D room is a navigation layer over the same route/content system, never the sole way to reach a destination.

| Route | Purpose and required content | Main actions |
| --- | --- | --- |
| `/` | The Atelier: initial view, short positioning line, spatial hotspots, navigation, featured real work or honest empty state, service overview, Exchange preview, footer | Explore, work, services, Exchange, inquire |
| `/about` | Creative-house introduction, seven-discipline relationship, interpretive-room disclosure; approved team/process/story only when supplied | View work; central inquiry |
| `/services` | Seven distinct service entries, concise approved/provisional descriptions, relevant work links | Open service; inquire |
| `/services/[slug]` | Service title, purpose, proposed scope clearly tracked internally, confirmed capabilities only in final copy, relevant real projects, related services | Contextual WhatsApp inquiry |
| `/work` | Real portfolio grid; discipline filters; informative empty states; no fabricated counts | Filter; open project |
| `/work/[slug]` | Real project title, discipline, factual metadata where approved, image/video story, HoS's confirmed role, approved credits, related work | Project-context inquiry |
| `/exchange` | Physical-product catalog; sample/live distinction; search, category, verification, availability filters; product grid | Open product; learn verification; propose an object |
| `/exchange/[slug]` | Physical product imagery, title, category, condition, dimensions/materials if known, price policy, availability, location if approved, verification explanation | Central product inquiry |
| `/exchange/verification` | Explain verified vs not verified; demo status; scope and limits of actual policy once approved | Return to catalog; ask HoS |
| `/exchange/submit` | Demo “Propose an object” flow for physical products only; local validation; clear non-submission result | Review demo preview; contact HoS |
| `/contact` | Inquiry context picker and message preview, central WhatsApp action, confirmed social link, other confirmed details only | Open WhatsApp |
| Not-found/error | Useful recovery, persistent navigation, readable message | Back to work/catalog/home |

A privacy page is optional for the isolated demo if no personal data is collected. A real data-collection release requires an approved privacy policy and consent behavior. Do not generate a purported legally approved policy.

### Seven service slugs and proposed scope

| Slug | Display name | Illustrative scope to confirm |
| --- | --- | --- |
| `architecture` | Architecture | Architectural concepts, planning, design development |
| `construction` | Construction | Construction delivery and coordination |
| `interiors` | Interiors | Interior concepts, materials, spatial design |
| `furniture` | Furniture | Furniture design or making; exact offering pending |
| `filming` | Filming | Film production and visual storytelling; precise formats pending |
| `marketing` | Marketing | Brand and campaign communication; precise channels pending |
| `content` | Content | Content creation; deliverables and formats pending |

These are proposed description boundaries, not permission to invent capabilities. Furniture service inquiries belong here; an actual chair offered for purchase belongs in The Exchange. A filming service belongs here; a physical camera for sale may belong in The Exchange if accepted inventory criteria permit it.

## 5. The Atelier scene and interaction specification

### Proposed spatial layout

Use a single authored room, built from procedural geometry, with a shallow depth and multiple focal groups. Initial desktop view is a cinematic three-quarter perspective, with clear visual access to the central worktable and several peripheral zones. Start with a prototype coordinate system: Y up; room approximately 12 × 9 × 4 units. Dimensions are scene-design aids, not real-office measurements.

| Zone | Approximate placement | Code-built props | Destination |
| --- | --- | --- | --- |
| Arrival/identity | Foreground/entry plane | Door frame, restrained signage, practical light | About / overview |
| Architecture | Back-left worktable | Massing model, layered site board, drafting sheets | Architecture service |
| Construction | Left material bay | Structural frame fragment, concrete blocks, material samples | Construction service |
| Interiors | Back-center vignette | Wall panels, textile planes, light fixture | Interiors service |
| Furniture | Center-right | Sculptural chair, side table, joinery details | Furniture service |
| Filming | Back-right | Camera-like procedural prop, light stand, screen | Filming service |
| Marketing | Right pinboard | Abstract campaign layouts, non-client placeholder graphics | Marketing service |
| Content | Adjacent edit desk | Monitor, storyboard tiles, desk objects | Content service |
| Portfolio | Back feature wall | Approved project images in frames | Work index / featured real project |
| Exchange | Front-right display plinth | Representative physical sample object | Exchange catalog |
| Contact | Accessible overlay, optional desk cue | Small inquiry marker | Contact route |

Zones can share furniture and sightlines to avoid clutter. Every service gets a distinct named hotspot even where two props occupy one corner. Do not label abstract placeholder screen graphics as real client work.

### Camera and experience states

1. **HTML first:** Brand, navigation, route links, and useful text render before WebGL. Show a lightweight poster/fallback while the scene prepares.
2. **Ready:** The room becomes interactive without requiring a long cinematic preload. An optional short entrance move lasts roughly 1–2 seconds and is skippable.
3. **Explore:** Small bounded pointer parallax on desktop. No unrestricted orbit controls or first-person walking in the final experience.
4. **Focus:** Hover or keyboard focus highlights a hotspot and displays a readable DOM label. Focus does not automatically move the camera.
5. **Select:** Click/tap/Enter opens a concise accessible preview panel and optionally moves the camera to a predefined anchor. Explicit “View service/work/product” navigates to its route. This two-step behavior prevents accidental navigation on touch.
6. **Return:** Close/Escape restores the overview and returns focus to the triggering control. Navigation away cancels camera transitions and releases resources.
7. **Fallback:** Rendering failure, unsupported WebGL, reduced-motion preference, or user selection exposes the complete static overview with the same destinations.

Use one active hotspot/panel at a time. Repeated selections cancel or replace in-flight camera motion safely. Do not trap the page's normal vertical scrolling. Route changes and browser Back must behave normally; do not build a second hidden navigation history inside the canvas.

### Desktop, mobile, and accessible modes

- Desktop: wide room framing, visible navigation, subtle parallax, well-spaced HTML hotspot controls anchored to the scene.
- Tablet: simplified scene, no hover dependency, clear selected state and generous tap targets.
- Mobile: independently composed static/low-cost room view with a labeled destination list or horizontal zone selector. Use a bottom preview sheet if suitable; preserve native scrolling and safe-area spacing.
- Reduced motion: no intro camera flight, parallax, scroll scrub, or automatic ambient motion. Static camera and instant or very short opacity transitions.
- Keyboard/screen reader: semantic HTML navigation and buttons, meaningful accessible names, visible focus, panel focus handling, Escape dismissal, and no canvas-only essential information.
- Always provide “Simple view” / “Explore in 2D” and retain it for the session. A black canvas is never the fallback.

### Code-first construction and realism

Use primitive meshes, extrusions, curves, instancing, and reusable parametric prop builders. Build room architecture, shelves, tables, chairs, plinths, frames, abstract models, and camera props in code. Blender or paid asset tools must not be prerequisites.

Licensed photographic textures/environment maps may complement geometry after permission and size review. If unavailable, use procedural/material-based treatments. Real portfolio photography is content, separate from room geometry. The room's visual fidelity comes from composition, material response, restrained lighting, contact shadows, and detail hierarchy; do not promise indistinguishability from photographs.

Prefer a few effective lights and selective shadow casting. Avoid real-time reflections and heavy postprocessing as defaults. Treat bloom, depth of field, and film grain as optional enhancements only after readability and performance pass.

## 6. The Exchange: physical products only

### Proposed taxonomy

Start with a small controlled set such as furniture, lighting, decor, art objects, physical materials, and equipment. These categories are proposals, not confirmed inventory. Material listings must describe actual physical stock; equipment must be for sale, not rental. Add categories only when they represent tangible goods.

Product cards show image, name, category, price or “Price on inquiry,” availability, and accurately qualified verification state. Product detail pages distinguish actual records from sample inventory. Never label a digital render as a real product photograph without disclosure.

### Verification behavior

- **Verified:** Only for a real listing with approved verification scope and evidence that HoS performed the applicable checks.
- **Not verified:** Means HoS verification is not recorded; it does not mean fraudulent, unsafe, or rejected.
- **Demo verification:** A sample badge demonstrating the interface, never a claim that HoS inspected a real item.
- Do not invent guarantees of authenticity, condition, ownership, safety, warranty, or payment protection.
- Badge explanations are available via click and keyboard, not hover alone. Explain the approved scope and date when available.
- No seller-direct contact details, alternate WhatsApp numbers, or bypass links. Central HoS routing applies to all listings.

### Product inquiry flow

Catalog → filter/search → product detail → inspect details and verification → “Ask HoS about this object” → message preview → WhatsApp. Include listing ID, title, and canonical URL in the message. If availability is unknown, phrase the message as a question. A sold item shows its state and may offer an explicitly labeled related-item inquiry instead of implying availability.

### Propose an object flow

1. Explain that only physical objects/products for sale are eligible.
2. Choose a physical category; enter title, description, condition, optional dimensions, indicative price, and city if desired.
3. Validate that `listingKind` is `physical_product` and transaction intent is `sale`. There must be no option for services, talent, digital goods, rentals, or bookings.
4. Show a local preview; any image selection is local-only, with no upload. No personal contact collection is needed for this demo.
5. Display “Demo preview only — this listing has not been submitted or published.” Offer a separate central WhatsApp inquiry if configured.

Text validation can warn on obvious prohibited requests, but must not claim to provide reliable moderation. Free-text submissions require human review and backend enforcement in any future real system. A user-entered label cannot convert a service into a valid physical listing.

## 7. Core user journeys

| Visitor intent | Journey | Success condition |
| --- | --- | --- |
| Understand HoS | Homepage → room or simple navigation → services/About | Understands all seven disciplines without learning 3D controls |
| Hire a discipline | Service hotspot → preview → service detail → related real work → inquiry | WhatsApp draft identifies the selected service |
| Evaluate credibility | Work index → filter → real project → role/imagery → inquiry | Project claims and imagery trace to approved real sources |
| Explore products | Exchange → filters → product → verification information → inquiry | Physical product context reaches central HoS number |
| Offer an object | Propose an object → valid physical-product preview → optional inquiry | No actual publication is implied |
| Browse on mobile | Lightweight room/2D list → any normal route | All essential content is available without WebGL |
| Recover from scene failure | Scene fails → fallback appears → normal navigation | No dead end or blocked inquiry |

## 8. Proposed technical stack and architecture

Use an existing suitable stack if implementation later finds one. For a new project, the proposed baseline is:

- Next.js App Router with React and TypeScript.
- Three.js through React Three Fiber, with selectively imported Drei utilities.
- GSAP for one coordinated camera/scene transition controller; do not combine several animation libraries for the same values. ScrollTrigger only if a specific justified scroll sequence is added; continuous scroll hijacking is not part of this plan.
- CSS modules or the project's existing styling system; design tokens for color, type, spacing, motion, and surfaces. Tailwind is optional, not an extra requirement.
- Typed local content records for demo data, validated at build time with Zod or equivalent existing validation.
- Native accessible HTML controls; a well-maintained dialog primitive only if needed for reliable panel behavior.
- Playwright for critical navigation/interaction checks; focused unit tests for content eligibility, verification labeling, and inquiry construction.

Resolve mutually compatible stable package versions at implementation time and commit a lockfile. This handoff intentionally does not invent exact future package versions.

### Suggested project organization

```text
house-of-sultana/
  CLAUDE_HANDOFF.md
  app/                      # Routes, layouts, metadata, error boundaries
  components/
    atelier/                # Client-only canvas, room, props, camera, hotspots
    navigation/             # Shared HTML navigation and mobile menu
    portfolio/              # Project cards, filters, galleries
    exchange/               # Physical product UI and demo proposal form
    inquiry/                # Central message builder and CTA
    ui/                     # Shared accessible primitives
  content/                  # Approved records and explicitly marked demos
  lib/                      # Schemas, content loaders, inquiry helper
  public/                   # Permission-cleared optimized assets
  docs/                     # Asset provenance, decisions, QA results
  tests/                    # Focused behavior and acceptance checks
```

Keep page text and navigation server-rendered where practical. Load WebGL as a client-only enhancement. Isolate scene code from product data, routing, and WhatsApp configuration. One shared content layer powers the 3D previews and standard pages. There is no required CMS, database, or account system for this demo.

## 9. Data contracts

The following TypeScript-shaped contracts are specifications, not implemented source files. Use stable IDs and URL-safe unique slugs. Treat validation failures as build errors or explicit content omissions, never silent invented fallbacks.

```ts
type EditorialStatus = 'approved' | 'sourced' | 'proposed' | 'demo' | 'missing';
type ServiceId = 'architecture' | 'construction' | 'interiors' | 'furniture'
  | 'filming' | 'marketing' | 'content';

type Provenance = {
  status: EditorialStatus;
  sourceUrls: string[];
  sourceNote?: string;
  accessedAt?: string;       // ISO date
  approvedBy?: string;
  approvedAt?: string;
};

type MediaAsset = {
  id: string;
  src: string;
  kind: 'image' | 'video';
  alt: string;
  width: number;
  height: number;
  poster?: string;
  credit?: string;
  rights: 'approved' | 'licensed' | 'pending';
  representation: 'real_project' | 'real_product' | 'artistic_demo';
  provenance: Provenance;
};

type Service = {
  id: ServiceId;
  slug: ServiceId;
  title: string;
  summary: string;
  scope: string[];
  projectIds: string[];
  provenance: Provenance;
};

type Project = {
  id: string;
  slug: string;
  title: string;
  serviceIds: ServiceId[];
  hosRole: string;
  summary: string;
  media: MediaAsset[];
  location?: string;
  year?: number;
  clientName?: string;
  credits?: string[];
  provenance: Provenance;
  // Public portfolio requires an approved real project and usable media rights.
};

type ProductCategory = 'furniture' | 'lighting' | 'decor' | 'art_objects'
  | 'physical_materials' | 'equipment';

type Verification =
  | { state: 'not_verified' }
  | { state: 'demo'; explanation: string }
  | { state: 'verified'; checkedAt: string; scope: string[];
      policyVersion: string; evidenceRef: string };

type Product = {
  id: string;
  slug: string;
  listingKind: 'physical_product';
  transactionIntent: 'sale';
  title: string;
  description: string;
  category: ProductCategory;
  condition: 'new' | 'used' | 'refurbished' | 'unknown';
  materials?: string[];
  dimensions?: { width?: number; height?: number; depth?: number;
    unit: 'cm' | 'mm' | 'in' };
  price: { mode: 'inquiry' } | { mode: 'fixed'; amount: number; currency: 'PKR' };
  availability: 'available' | 'reserved' | 'sold' | 'unknown';
  location?: string;
  media: MediaAsset[];
  verification: Verification;
  provenance: Provenance;
  // No seller phone, rental unit, booking URL, downloadable asset, or service field.
};

type InquiryContext =
  | { kind: 'general' }
  | { kind: 'service'; serviceId: ServiceId }
  | { kind: 'project'; projectId: string }
  | { kind: 'product'; productId: string }
  | { kind: 'propose_object'; title?: string };

type Hotspot = {
  id: string;
  label: string;
  position: [number, number, number];
  cameraAnchorId: string;
  href: string;
  target: { kind: 'service'; id: ServiceId }
    | { kind: 'work' | 'exchange' | 'about' | 'contact' };
};

type SiteConfig = {
  brandName: 'House of Sultana';
  instagramUrl: string;
  centralWhatsAppNumber: string | null; // International digits only, no '+'
  canonicalOrigin: string | null;
  demoMode: boolean;
};
```

### Required contract invariants

- Seven and only seven named service records in the initial service taxonomy.
- Every reference resolves; slugs and IDs are unique; no orphan hotspot targets.
- A portfolio record cannot use `demo` imagery as evidence of an actual completed project. Keep layout placeholders outside the `Project` collection.
- Published real project details require approval; any research-only records remain unpublished/staged.
- Every product is a physical sale item. There is no generic listing union accommodating excluded listing kinds.
- `demo` products cannot receive a real `verified` state. Use the demo state and visible sample labeling.
- Real verification requires policy scope and evidence; evidence references may be private and must not leak into client bundles.
- Unknown price is `inquiry`, not zero. Unknown availability is not `available`.
- Currency defaults to proposed PKR for this Pakistan demo; do not infer actual product prices.
- Approved/licensed media only in any publicly shareable build. Pending-rights assets remain excluded.
- Field-level source notes are required where a record mixes sources; record approval must not hide guessed fields.

## 10. Central WhatsApp integration

Implement one helper that accepts an `InquiryContext`, resolves approved display fields, builds a plain-text message, and returns a WhatsApp URL only when the central number is configured and valid. All CTAs call this helper. Do not permit record-level destination overrides.

Proposed URL shape: `https://wa.me/{internationalDigits}?text={encodedMessage}`. Encode the message with `encodeURIComponent`; never concatenate unescaped visitor text. Use only trusted route construction for the context URL. If canonical origin is missing, omit the link rather than inserting localhost into a customer message.

Suggested product message: “Hello House of Sultana, I'm interested in [product title] (reference [ID]). Could you confirm availability and details? [product URL]”. Service and project messages use their corresponding title and identifier. User-added text is optional and length-limited. Do not include private verification notes, hidden seller information, or analytics identifiers.

Show the message before the user deliberately opens WhatsApp. Explain that WhatsApp opens externally and the user sends the message there. Clicking the link is **not** proof of a sent message or a conversion. No automatic sending. If configuration is missing or invalid, show a clear unavailable state and retain the official Instagram link as a separately labeled channel.

## 11. Content and asset intake

Prepare a manifest for each portfolio asset with project identity, source URL, owner/credit, allowed use, local asset path, caption, alt text, and approval status. Ask for a small strong set of real projects rather than filling the grid with inventions. A suggested demo target is 3–6 approved projects; this is a target, not supplied inventory or a required reason to fabricate filler.

For each real project, obtain the confirmed name, HoS role, relevant disciplines, approved description, image/video rights, and any location/date/client details the business wants public. Do not scrape Instagram images and assume permission, invent a project name from a caption, or claim a photographed object was designed by HoS without evidence.

Suggested product-demo target: 6–8 clearly labeled illustrative physical objects across a few proposed categories. Actual product names, prices, sellers, stock, and verification must remain visibly demonstrative until approved. These sample objects must not appear in the real-work portfolio.

Store decisions in `docs/decisions.md` and provenance in `docs/asset-manifest.md` when implementation starts. These files must remain within the client folder.

## 12. Performance, resilience, and accessibility targets

These are proposed acceptance budgets to measure on named devices, not promises already achieved:

- All routes remain usable if JavaScript/WebGL scene loading fails; normal HTML navigation and content must not depend on scene readiness.
- Target LCP ≤2.5 s, CLS ≤0.1, and INP ≤200 ms on representative production-like mobile conditions. Record actual device/network and distinguish lab proxies from real-user metrics.
- Keep critical initial transfer approximately ≤1.5 MB compressed; lazy-load the scene and noncritical media. Target an initial desktop scene payload ≤5 MB; offer a lighter/static mobile mode. Record deviations and their rationale.
- Aim for steady 50–60 fps on a representative desktop and ≥30 fps on a selected mid-range mobile device if 3D is enabled. Downgrade quality or default to static mode when sustained performance is poor.
- Cap device pixel ratio by quality tier, reuse materials/geometries, instance repeated objects, pause rendering when hidden, and use on-demand rendering when the scene is idle.
- Optimize textures, bound shadow resolution, and avoid continuous allocations in frame loops. Dispose GPU resources on unmount and recover from context loss.
- No hover-only controls; touch targets around 44 × 44 CSS pixels; normal-text contrast at least 4.5:1; meaningful focus indicators.
- Semantic landmarks/headings, real links, explicit form labels, useful error text, accessible galleries, captioning for meaningful spoken video where available.
- Pause/stop ambient animation where necessary. No autoplay audio; video uses appropriate poster/loading and reduced-motion behavior.
- Responsive QA at roughly 360, 390, 768, 1024, and 1440 CSS-pixel widths, plus at least one actual touch device where possible.
- Demo deployments should be noindex until publication is approved. Metadata must not include invented ratings, company details, offers, or portfolio claims.

## 13. Prioritized implementation phases

**Do not execute these phases until implementation is requested.** Once requested, do not repeatedly seek approval for routine reversible implementation choices. Missing factual inputs can remain explicit blockers for content completion while independent UI work proceeds.

### Phase 0 — Establish inputs and constraints (P0)

Inspect the client directory, applicable instructions, and existing dependencies. Confirm which approved assets and central number are available. Create content/provenance records and document remaining gaps. Lock the physical-only marketplace invariant and the seven service IDs.

**Exit:** Content status is explicit; no guessed factual copy; proposed technical choices recorded. Missing real projects do not prevent scaffolding, but prevent declaring the real portfolio finished.

### Phase 1 — Functional HTML foundation (P0)

Build the route shell, shared navigation/footer, service pages, portfolio empty/real states, Exchange catalog/detail structure, contact context, and central inquiry helper. Establish responsive tokens and accessible controls. Build data validation before adding sample products.

**Exit:** Every core journey works in 2D; invalid/missing number handled; excluded listing kinds rejected.

### Phase 2 — Atelier spatial prototype (P0)

Create procedural room geometry, rough props, camera anchors, hotspot placement, selection state, and preview panels. Use simple materials first. Verify all seven services and other destinations are reachable by pointer, touch, and keyboard through the HTML interface.

**Exit:** Room is navigable, readable, cancelable, and backed by the same standard routes; no performance-heavy polish yet.

### Phase 3 — Cinematic art direction (P1)

Refine materials, lighting, composition, prop detail, restrained entrance motion, focus transitions, and environmental sound only if separately approved. Add supplied real project imagery to scene frames. Create mobile framing and reduced-motion/static compositions in parallel with desktop polish.

**Exit:** Cohesive artistic experience; scene disclosure retained; acceptable measured performance with graceful downgrade.

### Phase 4 — Portfolio and Exchange completion (P0/P1)

Populate only approved real work. Finish product filters, detail states, verification explanations, local proposal preview, and contextual inquiry previews. Ensure catalog state survives product navigation/back where practical, using URL query parameters for filters.

**Exit:** Real-work evidence is complete or explicitly blocked; all sample products are labeled; no false listing publication or verification claims.

### Phase 5 — QA and demonstration packaging (P0)

Run focused schema/unit checks and end-to-end journeys; inspect desktop/mobile, keyboard, reduced motion, slow load, missing assets, WebGL failure, and invalid routes. Build successfully. Write setup instructions, content-update instructions, measured performance notes, and remaining limitations. Capture representative screenshots for review.

**Exit:** Acceptance checklist below passes or remaining blockers are honestly recorded. Prepare a reviewable local build; external publishing requires authorization if not already requested.

### Priority boundaries

Must-have: full seven-service structure, meaningful interactive Atelier, real portfolio handling, physical-only Exchange, central inquiry, accessible fallback, responsive behavior, content integrity.

Should-have: refined lighting/materials, polished focus transitions, URL-based catalog filters, contextual related work, refined product galleries.

Defer: accounts, seller dashboards, actual uploads, payments, bookings, search service infrastructure, production moderation, live inventory synchronization, advanced physics, multiplayer, elaborate audio, and mandatory external 3D authoring tools.

## 14. Acceptance criteria

### Content and scope

- [ ] Seven services appear with the exact approved discipline names and distinct routes.
- [ ] Real HoS portfolio projects have traceable approved facts and media permissions; no sample project is presented as real work.
- [ ] Missing real projects produce honest empty states and a recorded content blocker.
- [ ] Artistic room interpretation is disclosed; no claim of accurate office reconstruction.
- [ ] Provisional copy, proposed design decisions, and sample inventory are distinguishable from approved facts.
- [ ] No unapproved awards, metrics, testimonials, clients, team biographies, addresses, warranties, or company claims.

### Atelier

- [ ] Room and major props are code-built; no Blender prerequisite.
- [ ] The room provides meaningful selection/focus/navigation rather than decorative rotation alone.
- [ ] Every service plus work, Exchange, About, and contact has a discoverable ordinary HTML route.
- [ ] Click/tap/keyboard selection, panel close, Escape, and focus restoration work.
- [ ] Rapid repeated selections and route changes do not strand the camera or leave an overlay open.
- [ ] Simple view, reduced motion, mobile, and WebGL failure modes are complete and usable.

### Exchange

- [ ] Every catalog record is `physical_product` with sale intent.
- [ ] No skills, talent, services, rentals, bookings, or digital listings exist in filters, cards, copy, examples, or submission options.
- [ ] Furniture service and furniture product flows remain distinct.
- [ ] Search/filter empty states work; filters do not imply inventory that does not exist.
- [ ] Real verified, not verified, and demo verification labels are accurate and explained accessibly.
- [ ] Unknown availability/price and sold/reserved states are truthful.
- [ ] Proposal preview performs no upload/publication and clearly says it was not submitted.

### Inquiry

- [ ] Every inquiry resolves to the same configured central HoS WhatsApp number.
- [ ] Service/project/product context is preserved and URL-encoded correctly, including non-ASCII characters and `&`.
- [ ] Missing/invalid number never opens a guessed or malformed destination.
- [ ] Product inquiry includes stable listing ID; production URL is included only if configured.
- [ ] Message preview and explicit external action exist; no claim that a message was sent.
- [ ] No private verification evidence or seller contact leaks into visible messages/client bundles.

### Quality and delivery

- [ ] Build, relevant type checks, and focused tests pass.
- [ ] No broken routes, missing-media dead ends, overflow, console errors, or persistent loading overlays in tested journeys.
- [ ] Mobile menu, focus order, contrast, labels, dialogs, and reduced motion are checked manually.
- [ ] Performance is measured on documented devices/conditions; fallback is tested, not merely described.
- [ ] Client assets/code/notes stay within `house-of-sultana/`.
- [ ] README explains running the demo, configuring contact, adding real projects/products, and replacing provisional assets.
- [ ] Final report names completed behavior, verified checks, missing inputs, and any acceptance exceptions without calling blocked content finished.

## 15. Suggested demonstration sequence

1. Enter the Atelier and let the viewer register the overall room and visual identity.
2. Select one discipline; show its preview and normal service page.
3. Open an approved real project and explain HoS's confirmed role.
4. Return to the Atelier and enter The Exchange.
5. Filter tangible objects, open one, and explain its truthful verification/sample state.
6. Preview a contextual inquiry routed to central HoS WhatsApp; do not send a message as part of automated QA.
7. Show mobile/simple view to demonstrate that the experience remains useful beyond the cinematic desktop presentation.

## 16. Claude execution guardrails

Use this document as a proposed implementation contract once the owner asks to build. Start with the smallest coherent foundation, then the room, then polish. Preserve all explicit approved requirements. Resolve ordinary engineering details independently, but record material deviations from this specification.

Do not treat missing content as permission to fabricate. Do not expand The Exchange into a general services marketplace. Do not replace the interactive Atelier with prerecorded video as the sole experience. Do not let a cinematic opening obstruct navigation. Do not claim production commerce, real verification, actual submissions, or messages sent when the frontend only demonstrates those interfaces.

**Present handoff status:** Complete as a planning artifact. No website implementation has been performed. Actual portfolio records, approved brand assets, product inventory, verification criteria, and the central WhatsApp number remain inputs to the future build.
