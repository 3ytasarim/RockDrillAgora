---
name: SSR product page content
description: Why product SSR pages carry rich, per-product VARIED auto-generated content and how variation is kept stable.
---

# SSR product page content (generateProductHtml in server/routes.ts)

Each product SSR page must serve substantial, **per-product unique** content for SEO, not shared boilerplate.

**Why:** competitor (agorarock.com) ranks with rich product pages; Google penalises thin/duplicate content (this site previously hit Soft 404s). Identical templated text across 2000+ products reads as duplicate content.

**How to apply:**
- Sections rendered: OEM Part Number, Technical Specifications (table), Compatible Machines (brand-derived via `getCompatibleMachines`), 300–500 word Product Description, 5-item FAQ (same question set, answers interpolate name/code/brand), Related Parts (same category).
- Description uniqueness uses a **deterministic seed = hash of `${code}|${name}`** to pick from sentence-variant pools, so output varies per product but is **stable across requests/restarts** (do not use Math.random — would change on every crawl).
- Word count is enforced at render: pad from a sentence pool until ≥320 words.
- Compatible Machines lists brand-level equipment families with real model names framed as "such as" + a "confirm part number" disclaimer (user explicitly requested generated content; avoid claiming exact part→machine fitment as fact).
- FAQ is rendered twice from one `faqItems` array: HTML (escaped) and FAQPage JSON-LD (raw via safeJsonLd). Keep them in sync from the single source.
- JSON-LD on product pages: Product + BreadcrumbList + FAQPage (+ global Organization/WebSite from index.html).
- Escaping rules still apply — see ssr-html-escaping.md.
