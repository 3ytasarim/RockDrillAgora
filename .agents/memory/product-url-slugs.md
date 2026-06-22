---
name: Product URL slugs
description: Durable decisions behind SEO product URLs and combined display titles
---
- Canonical product URL is `/urun/{slug}`; slug is persisted on the product row and generated from code+name+brand via the shared helper. Old `/product` & `/brand` routes still resolve (no redirects) by design.
- **Resolution must never depend solely on a stored slug.** A slug lookup falls back to recomputing slugs across products so legacy/direct-DB rows without a stored slug still resolve, and a startup backfill populates any null slugs.
  - **Why:** the slug column is nullable and rows can be imported bypassing the storage layer; without the fallback those products would 404 and drop out of internal links/sitemap.
  - **How to apply:** keep both the defensive fallback in the by-slug resolver and the startup backfill whenever touching slug logic; if you make the column NOT NULL the fallback can be removed.
- Display titles (cards, h1, SSR h1) use the combined `Brand – Name – spaced – joined – dashed` format, where spaced/joined/dashed only appear for codes matching a known brand format (Epiroc 4-4-2 10-digit, Sandvik 3-3-2 8-digit). The Helmet `<title>` SEO tag keeps the `... | Agora Rock Drill` suffix, NOT the combined format.
- All product link/title/slug construction is centralized in `shared/product-utils.ts`; import from there rather than rebuilding URLs locally to avoid drift between sitemap, canonical, SSR, and client links.
