// Brand catalogue config + deterministic product-selection helpers.
// Shared by server SSR (routes.ts) and the React client so the crawlable HTML
// and the hydrated page pick the same products.

import { getProductSlug } from "./product-utils";

export interface BrandDef {
  slug: string;            // clean URL segment: /spare-parts/<slug>
  name: string;            // stored category / brand_compatibility value
  label: string;           // display label
  match: (brandCompat: string) => boolean;
  blurb: string;           // short, factual — NOT marketing filler, NOT fabricated specs
}

export const BRANDS: BrandDef[] = [
  {
    slug: "atlas-copco-epiroc",
    name: "Epiroc / Atlas Copco",
    label: "Atlas Copco / Epiroc",
    match: (b) => /atlas\s*copco|epiroc/i.test(b || ""),
    blurb:
      "Replacement spare parts compatible with Atlas Copco and Epiroc hydraulic rock drills and drill rigs. Every item is listed by its OEM part number so you can match it to your machine.",
  },
  {
    slug: "sandvik",
    name: "Sandvik",
    label: "Sandvik",
    match: (b) => /sandvik/i.test(b || ""),
    blurb:
      "Replacement spare parts compatible with Sandvik hydraulic rock drills and drilling rigs, listed by OEM part number for straightforward identification and quoting.",
  },
  {
    slug: "furukawa",
    name: "Furukawa",
    label: "Furukawa",
    match: (b) => /furukawa/i.test(b || ""),
    blurb:
      "Replacement spare parts compatible with Furukawa hydraulic rock drills and crawler drills, listed by OEM part number.",
  },
];

export function brandBySlug(slug: string): BrandDef | undefined {
  return BRANDS.find((b) => b.slug === slug);
}

export function brandForProduct(p: { brandCompatibility?: string | null }): BrandDef | undefined {
  const b = p.brandCompatibility || "";
  return BRANDS.find((def) => def.match(b));
}

export function brandCatalogPath(slug: string, page = 1): string {
  return page > 1 ? `/spare-parts/${slug}?page=${page}` : `/spare-parts/${slug}`;
}

// --- deterministic pseudo-random ordering -------------------------------------
// FNV-1a 32-bit hash of a string -> stable number. No Math.random anywhere:
// the same inputs always produce the same output, so SSR HTML is stable.
export function hashStr(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

// Stable diverse pick: order `items` by hash(seed + '|' + id) and take `count`.
// Same seed -> same result; different seed -> different spread.
export function pickDiverse<T extends { id: string }>(items: T[], count: number, seed: string): T[] {
  return [...items]
    .map((it) => ({ it, k: hashStr(`${seed}|${it.id}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map((x) => x.it);
}

type Prod = {
  id: string;
  name: string;
  slug?: string | null;
  delkomCode?: string | null;
  brandCompatibility?: string | null;
  imageUrls?: string[] | null;
  categoryId?: string | null;
};

function hasUsableImage(p: Prod): boolean {
  return Array.isArray(p.imageUrls) && p.imageUrls.length > 0 && !!p.imageUrls[0];
}
function hasSlug(p: Prod): boolean {
  return !!getProductSlug(p as any);
}
function firstWord(name: string): string {
  return (name || "").trim().split(/\s+/)[0]?.toLowerCase() || "";
}

// Related products for a detail page.
// Rules (in priority order): exclude self, same brand/category, has image, has
// slug, prefer same name-family (first word), then fill from the rest.
// Deterministic per product (seed = product id) so results are stable per page
// but differ across products.
export function pickRelated<T extends Prod>(all: T[], current: Prod, count = 6): T[] {
  const sameBrand = all.filter(
    (p) => p.id !== current.id && hasSlug(p) && p.categoryId === current.categoryId
  );
  const withImg = sameBrand.filter(hasUsableImage);
  const pool = withImg.length >= count ? withImg : sameBrand;

  const fam = firstWord(current.name);
  const family = pool.filter((p) => firstWord(p.name) === fam);
  const rest = pool.filter((p) => firstWord(p.name) !== fam);

  const seed = `rel|${current.id}`;
  const ordered = [...pickDiverse(family, count, seed), ...pickDiverse(rest, count, seed)];
  return ordered.slice(0, count);
}

// Homepage: a stable, diverse set of image-having products for one brand.
export function pickBrandShowcase<T extends Prod>(all: T[], brand: BrandDef, count = 8): T[] {
  const pool = all.filter(
    (p) => brand.match(p.brandCompatibility || "") && hasSlug(p) && hasUsableImage(p)
  );
  return pickDiverse(pool, count, `home|${brand.slug}`);
}
