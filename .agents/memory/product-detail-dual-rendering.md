---
name: Product page dual rendering (SSR + React must match)
description: Why product detail content is generated from a shared module, and the anti-cloaking rule that SSR HTML and the React page must render identical content.
---

Product pages (`/urun/:slug`, `/brand/...`, `/product/:id`) are served as SSR HTML (injected into `#root` for crawlers) and then taken over by the React SPA (`client/src/pages/product-detail.tsx`). Both renderings are visible to different audiences: Google reads the SSR HTML, users see the React page.

**Rule:** Any SEO/content section (Product Description, Compatible Machines, Technical Specifications, FAQ, Related Products, titles) MUST render identical text in both. If Google indexes content users can't see (or vice-versa) it is cloaking and risks ranking penalties.

**Why:** A previous change added these sections only to the SSR side; users saw a bare page while crawlers saw rich content — exactly the mismatch that triggers cloaking.

**How to apply:** Generate all such content from a single shared module (`shared/product-content.ts`: `getProductDescription`, `getCompatibleMachines`, `getCompatibleMachinesIntro`, `getTechnicalSpecs`, `getFaqItems`) consumed by BOTH `server/routes.ts` (SSR, wraps in HTML + `escapeHtml`) and the React page. The description generator is deterministic (seeded by code+name) so both sides produce the same text. Related Products selection must also match SSR `getRelatedProducts` (same category, exclude same delkomCode, first 8) and use `buildProductTitle` for the card title in both. When editing one side, mirror the other.
