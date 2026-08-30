# SEO Implementation Report — agorarockdrill.shop

Branch: `seo/thin-content-cleanup` · `main` untouched
Build: `npm run build` ✅ · Tests: `npm test` → **39/39 passed** · `tsc --noEmit` ✅
Verified against the staging DB (`ep-still-mouse-b1p1ep4v`, 2,535 products) with a
production build (`npm run start`) and a Googlebot user-agent.

---

## 1. Homepage product links

| | Before | After |
|---|---|---|
| Real product `<a href="/urun/…">` links in the first HTML response | **0** | **24** (8 per brand × 3 brands) |
| Rendering | client-only `fetch('/api/products?featured=true')` → returned `[]` (no product is flagged featured) → "Our Products & Facilities" photo banner | **server-rendered** into `<div id="root">` before the page is sent, then React hydrates the same set |
| Brand catalogue links | 0 | 3 — `View all <brand> parts →` under each brand section, plus `Browse the full spare parts catalogue →` |

The 24 products are chosen deterministically (`pickBrandShowcase` in `shared/catalog.ts`):
image present + valid slug, ordered by an FNV hash of `home|<brandSlug>|<productId>`.
Stable across requests (no per-request `Math.random`, no daily churn) but spread
across each brand's inventory rather than "the first 8".

Client parity: `GET /api/home-showcase` runs the exact same picker server-side, so
the hydrated homepage shows the identical products.

### Click depth from the homepage
- **24 showcased products: depth 1** (Home → product).
- **Every other product: depth 2** — Home → `/spare-parts/<brand>` (or `/spare-parts`) → product, because the brand landing page and the catalogue page 1 both link 48 products and expose crawlable pagination to the rest.
- Deepest path via brand pagination: Furukawa 2 pages, Sandvik ~15, Atlas Copco / Epiroc ~37. Google also has every product URL directly from the sitemap, so index discovery is not gated on click depth.
- Before: product pages received **no internal links from the homepage at all** — only the sitemap and the single 2,535-link `/spare-parts` blob.

---

## 2. `/spare-parts` — server-side pagination

- **First HTML response contains 48 product `<a href>` links** (was: all ~2,535 links + 2,535 `<img>` on one page).
- Page size `CATALOG_PAGE_SIZE = 48` (server) = `ITEMS_PER_PAGE = 48` (client).
- URL scheme: `/spare-parts?page=2`, `?page=3`, …
- Pagination is real crawlable HTML: `<a rel="prev">` / `<a rel="next">` plus numbered `<a href>` links, rendered server-side. Google reaches every page without running JS.
- **Canonicals are per-page**: `/spare-parts?page=2` → `<link rel="canonical" href="https://agorarockdrill.shop/spare-parts?page=2">` (NOT collapsed to page 1). `<link rel="prev">` / `<link rel="next">` in `<head>` too.
- `?page=` past the last page → falls through to a 404 (no soft-200 empty grid).
- Legacy `?brand=<name>` → **301** to the clean brand URL (see §3).

---

## 3. Brand landing pages — clean, crawlable URLs

New real pages (not query-string filters):

| URL | Brand | Products |
|---|---|---|
| `/spare-parts/atlas-copco-epiroc` | Atlas Copco / Epiroc | 1,735 |
| `/spare-parts/sandvik` | Sandvik | 705 |
| `/spare-parts/furukawa` | Furukawa | 95 |

Each page (server-rendered):
- unique `<title>` — e.g. `Sandvik Spare Parts | Agora Rock Drill` (+ ` – Page N`)
- unique `<meta name="description">` — count-based, factual
- **self-referential canonical** (per page: `/spare-parts/sandvik?page=2` → canonical to itself)
- one `<h1>` — `Sandvik Spare Parts`
- a **short, true** intro paragraph (`BRANDS[i].blurb` in `shared/catalog.ts`) — 1–2 sentences, no invented specs, no marketing filler. Not a doorway page: it is the real product catalogue for that brand with 48 products per page and full pagination.
- product grid + crawlable `<a rel="prev/next">` pagination (same component as `/spare-parts`)
- breadcrumb: `Home › Spare Parts › <brand>`

Redirects (301, permanent):
- `/spare-parts?brand=Sandvik` → `/spare-parts/sandvik`
- `/spare-parts?brand=Epiroc` (and `Atlas Copco - Epiroc`) → `/spare-parts/atlas-copco-epiroc`
- `/spare-parts?brand=Furukawa` → `/spare-parts/furukawa`

Unknown brand slug (`/spare-parts/anything-else`) → **HTTP 404** with `<meta name="robots" content="noindex, follow">` (was: soft-200 that rendered the full catalogue under a bogus URL).

Header "By Brand" dropdown and the footer now link to these clean URLs. The
static sitemap lists them. `product-detail` breadcrumb + "View all … parts" link
to them.

---

## 4. Related products

`pickRelated()` in `shared/catalog.ts`, used by **both** the SSR HTML and the new
`GET /api/products/:id/related` endpoint (the client calls the endpoint, so the
hydrated section matches the crawled one).

Algorithm, in priority order:
1. exclude the current product
2. same brand / category
3. must have an image **and** a valid slug
4. prefer the same product family — products whose name shares its first word
   (e.g. `Valve Piston` → other `Valve …` parts first), then fill from the rest
5. deterministic ordering: FNV hash seeded by `rel|<currentProductId>` — **stable
   for a given product** across every request, but different from one product to
   the next (no `Math.random`, no "always the same first 6")
6. take 6

Rendered as 6 crawlable `<a href="/urun/…">` cards inside the server HTML.
(Before: `sameCategory.slice(0, 8)` — always the first 8 rows of the category, which after the catalogue import were all image-less.)

---

## 5. Product page fixes

- **Broken half-sentence under the H1** (`"…Request a quote for fast worldwide del…"`) is gone. The visible one-line summary is now a complete, non-truncated sentence built from real fields (name, part number, brand). The `<meta name="description">` is derived separately and trimmed on a word boundary with a real ellipsis, never mid-word. Meta text is no longer dumped verbatim into visible page copy.
- **Part number** now shows **one** human-readable form in the "OEM Part Number" box — e.g. `3115 1765 00` — instead of stacking `3115 1765 00 / 3115176500 / 3115-1765-00`. The spaced/joined/dashed variants still exist in `getCodeVariants()` and remain available to the backend search; they are just not printed three times in the UI. Same change in `client/src/pages/product-detail.tsx`.
- **H1** de-stuffed: `Valve Piston – 3115 1765 00 – Epiroc / Atlas Copco` (was `Epiroc / Atlas Copco – Valve Piston – 3115 1765 00 – 3115176500 – 3115-1765-00`).

---

## 6. Thin / template content — kept out

The earlier cleanup is intact and nothing was re-added to "help SEO":
- the 320-word spun `getProductDescription` (sentence-pool spinner + pad-to-word-count) — **still removed**; replaced by one factual sentence
- the identical 5-question FAQ block + `FAQPage` JSON-LD — **still removed** (SSR + client)
- fabricated `getTechnicalSpecs` rows ("3 months warranty", "Manufactured to original OEM specifications", "Condition: New") — **still removed**; the spec table now carries only Part Number, Brand Compatibility, Category, Availability, Ships From
- fake `price: "0"` / `priceValidUntil` in Product schema — **still removed**

The brand landing blurbs are the only new prose: 1–2 factual sentences each, written once, no per-product templating.

---

## 7. Structured data

`Product` JSON-LD (server SSR + client `ProductSchema`) now:
- `description` = **the exact text of the visible "Product Description" section** (`getProductDescription(product).join(' ')`) — visible page and JSON-LD say the same thing.
- `offers` = `{ "@type": "Offer", url, availability, priceSpecification: { priceCurrency: "USD" }, seller }` — **no `price`, no `priceValidUntil`, no `priceSpecification.price`**. Quote-based B2B, so there is no price to state; the markup no longer claims `0`.
- kept: `name`, `sku`, `mpn` (= part number), `brand`, `image`, `category`, `manufacturer`.
- **not present**: `review`, `aggregateRating`, `rating`, fabricated spec properties, price.
- `BreadcrumbList` now includes the brand level (`Home › Spare Parts › <brand> › <product>`), matching the visible breadcrumb.
- `FAQPage` — removed.

---

## 8. Cross-domain canonical — NOT used

`agorarockdrill.shop` and `agorarock.com` must both stay independently indexed, so
**no cross-domain canonical was added in either direction.** Every `.shop` page keeps
a **self-referential** canonical:
- `/` → `https://agorarockdrill.shop/`
- `/spare-parts` / `/spare-parts?page=N` → itself (per page)
- `/spare-parts/<brand>` / `?page=N` → itself (per page)
- `/urun/<slug>` → itself

Verified across all page types via Googlebot UA — no page canonicalises to another
domain or to a different `.shop` URL.

---

## 9. hreflang — investigated, NOT added

**Overlap check** (`.seo-audit` datasets, matched by normalised part number):
**2,483 of 2,535** `.shop` products (**97.9%**) have a same-part-number page on
`agorarock.com`. Equivalent pages therefore do exist.

**hreflang was still not added, because:**
1. **Same language.** `agorarock.com`'s `/urun/` product pages are in **English**
   ("Epiroc – Atlas Copco – Commulator …"), not Turkish. hreflang is for
   language/region alternates; en↔en across two domains is not that — Google would
   read it as a duplicate signal, not a localisation signal.
2. **hreflang must be reciprocal.** Every `.shop` page would need a matching
   `<link rel="alternate" hreflang>` **on the `agorarock.com` side** pointing back.
   `agorarock.com` is a separate WordPress install not in this repo; we cannot add
   return tags there. One-sided hreflang is ignored by Google and shows as an error
   in Search Console.
3. Net effect of adding it now = GSC errors, zero ranking benefit.

**What we rely on instead for "both indexed":** self-canonical on both domains +
genuinely different pages. `.shop` now has real product photos, clean
`/urun/{code-name}` slugs, brand catalogue landing pages, server pagination and
honest minimal copy; `agorarock.com`'s `/urun/{brand-name-codes}` pages are near-empty
(no H1, generic title, ~15 words). The two are structurally distinct, which is the
legitimate basis for both to hold their own in the index.

If a true Turkish storefront is built later on `.shop` (or a `/tr/` subtree) with
Turkish content, hreflang between the `en` and `tr` versions **of the same domain**
would be appropriate then.

---

## 10. Sitemap changes

Architecture is unchanged and deliberately flat:
```
/sitemap.xml            → sitemap index
  /sitemap-static.xml   → home, /spare-parts, about, contact, privacy, terms,
                          + /spare-parts/atlas-copco-epiroc, /sandvik, /furukawa
  /sitemap-products-1..6.xml   → 500 product URLs per file (2,535 total)
```

Removed (no fake freshness / no low-value signals):
- **`<changefreq>` — removed everywhere** (product + static sitemaps).
- **`<priority>` — removed everywhere.**
- **Static sitemap `<lastmod>` — removed.** Those pages have no meaningful per-page mtime; a per-request `today` was a fake signal. Static entries are now `<loc>`-only.
- **Sitemap-index `<lastmod>` no longer `today` on every request.** It is now the newest **real** `products.updated_at` across the catalogue (or omitted if none).
- **Product `<lastmod>` comes only from the real `products.updated_at`** — and is omitted entirely if that column is null (was: fall back to `today`).

Kept:
- image entries (`<image:image>` / `<image:loc>` / title / caption) for products that have a photo.
- `/site-sitemap.xml` still served as an alias of `/sitemap.xml` so nothing 404s if Google already has the old URL.

`robots.txt`:
```
User-agent: *
Allow: /
Disallow: /admin
Disallow: /agoraadminpanel
Disallow: /api/

Sitemap: https://agorarockdrill.shop/sitemap.xml
```
(was: `Sitemap: …/site-sitemap.xml` and per-endpoint `/api/upload` disallows). `/api/` is now blocked wholesale — the site is SSR-first, Googlebot does not need the JSON endpoints to see content, and thin JSON responses should not be indexed.

---

## 11. parts-index

**There is no `/parts-index` in this codebase** — no route, no component, no
reference in `server/` or `client/`. Nothing to remove, noindex, or redirect. It
was either never deployed from this repo or removed earlier. The internal-linking
job it was meant to do (expose every product to Googlebot) is now done properly:

```
Home → brand landing page → paginated catalogue → product → related products
```

plus the product sitemaps. If a `/parts-index/*` structure exists on the live
server outside this repo, it should be dropped from the sitemap and 301'd to
`/spare-parts` — but that is a server-side artefact, not something in this branch.

---

## 12. Image SEO

For every product that has a photo:
- real `<img>` element with a working `src` (absolute `https://agorarockdrill.shop/product-images/<slug>.webp` in SSR; root-relative in the hydrated client)
- **descriptive `alt`** — `"<name> – <part number>"` (product cards) / `"<name> - <code> spare part"` (main product image)
- explicit `width` / `height` (300×220 on cards, 500×500 on the main image, 180×160 on related) to reduce CLS
- `loading="lazy"` + `decoding="async"` on grid images; the main product image stays eager
- crawlable URLs, served by a dedicated `express.static('/product-images', { immutable, maxAge: 365d })` route → **HTTP 200, `Content-Type: image/webp`**, verified
- product images also appear on the homepage brand sections, the catalogue, the brand landing pages and the related-products strip — all as real `<img src>` inside crawlable markup
- 2,235 of 2,535 products have a photo; the other 300 render a neutral placeholder (no broken `<img>`), to be filled from the admin panel

The images themselves: downloaded from agorarock.com, re-encoded to WebP q80,
max 1000px, ~114 MB total, hosted on our own server (`product-images/`, rsynced
on deploy — not a paid bucket).

---

## 13. Build + SEO regression test

`npm run build` ✅ (client + `dist/index.js`) · `tsc --noEmit` ✅ · `npm test` → **39/39** ✅
(the sitemap tests were updated to the new spec — no changefreq/priority, `/sitemap.xml`
in robots, dynamic catalogue size; `vitest.config.ts` now loads `.env` and runs test
files serially since they share one real DB.)

Production build (`npm run start`, `NODE_ENV=production`) tested with
`User-Agent: Googlebot/2.1`. First HTML response per page type:

| URL | Status | `<title>` unique | canonical (self) | robots | `<h1>` | crawlable `/urun/` links in first HTML |
|---|---|---|---|---|---|---|
| `/` | 200 | ✅ | `…/` | index, follow | ✅ | **24** |
| `/spare-parts` | 200 | ✅ | `…/spare-parts` | index, follow | ✅ | **48** + `rel=next` |
| `/spare-parts?page=2` | 200 | ✅ (`– Page 2`) | `…/spare-parts?page=2` | index, follow | ✅ | **48** + `rel=prev` + `rel=next` |
| `/spare-parts/sandvik` | 200 | ✅ | `…/spare-parts/sandvik` | index, follow | ✅ `Sandvik Spare Parts` | **48** + `rel=next` |
| `/spare-parts/atlas-copco-epiroc?page=3` | 200 | ✅ | `…?page=3` | index, follow | ✅ | **48** + prev/next |
| `/spare-parts/furukawa` | 200 | ✅ | `…/spare-parts/furukawa` | index, follow | ✅ | **48** |
| `/urun/3115-1765-00-valve-piston` (with photo) | 200 | ✅ | self | index, follow | ✅ | 6 related + brand link |
| `/urun/3115-2760-80-seal-housing` (no photo) | 200 | ✅ | self | index, follow | ✅ | 6 related + brand link |
| `/spare-parts/nonsense-brand` | **404** | — | — | **noindex, follow** | — | — |
| `/product/3115176500` (legacy) | **301** → `/urun/3115-1765-00-valve-piston` | | | | | |

- **No page carries an accidental `noindex`.** Every real page is `index, follow`; the only `noindex` is the 404 for an unknown brand slug (correct), and it now emits **exactly one** `<meta name="robots">` (the injector replaces the template default instead of appending a second tag).
- JSON-LD present on product pages: `Product` + `BreadcrumbList` (+ the global `Organization`/`WebSite` from the template). No `FAQPage`. `Product.offers.url` = canonical.
- Hydration verified on the production build: React replaces the SSR block cleanly, **no console errors**, product images return 200 `image/webp`.
- Legacy `/product/:idOrCode` and `/brand/:brand/:code` still 301 to `/urun/{slug}`.

### What Googlebot sees in the first response (summary)
- correct unique `<title>` and `<meta name="description">`
- a **self-referential** `<link rel="canonical">` (per page, including pagination)
- `<meta name="robots" content="index, follow">` (except the deliberate 404)
- one `<h1>` describing the page
- real product / brand / catalogue content as text
- crawlable `<a href>` internal links: 24 on the homepage, 48 on catalogue & brand pages, `rel=prev`/`rel=next` pagination, 6 related + a brand link on product pages
- `Product` + `BreadcrumbList` JSON-LD on product pages, consistent with the visible content

---

## Files changed on `seo/thin-content-cleanup`

```
shared/catalog.ts            NEW  brand config + deterministic pickers (showcase / related / diverse)
shared/product-content.ts         factual-only description + specs (FAQ already gone)
shared/product-utils.ts           buildProductTitle de-stuffed
shared/schema.ts                  categories.name UNIQUE
shared/sitemap-pages.ts           brand landing pages = clean URLs
server/routes.ts                  SSR "/", "/spare-parts", "/spare-parts/:brand" + pagination;
                                  injectSeo/catalogGridHtml/paginationHtml helpers;
                                  /api/home-showcase, /api/products/:id/related;
                                  sitemap freshness cleanup; robots.txt; static /product-images
client/src/App.tsx                + /spare-parts/:brandSlug route
client/src/pages/home.tsx         brand showcase sections (real <a href>)
client/src/pages/spare-parts.tsx  brand param + ?page= sync + per-page canonical/prev/next; 404 on bad brand
client/src/pages/product-detail.tsx  related via /api endpoint; single part-number form
client/src/components/product-card.tsx   imageUrls[0], descriptive alt, width/height
client/src/components/header.tsx  brand dropdown → clean URLs
client/src/components/footer.tsx  "by brand" links → clean URLs
tests/sitemap-coverage.test.ts    updated to the new sitemap spec
vitest.config.ts                  load .env, serial test files
```

Nothing merged or pushed to `main`.
