// Shared helpers for product code formatting, SEO slugs, and display titles.
// Used by both the frontend (links, titles) and the backend (slug generation, SSR, sitemap).

export function slugify(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface CodeVariants {
  spaced: string;
  joined: string;
  dashed: string;
}

// Returns spaced / joined / dashed variants of a numeric part code, or null for non-numeric codes.
// Brand-aware formatting (Epiroc / Atlas Copco 4-4-2, Sandvik 3-3-2) with a length-based fallback.
export function getCodeVariants(code: string, brand: string = ""): CodeVariants | null {
  if (!code) return null;

  // Strip existing dashes and spaces to get raw digits
  const raw = code.replace(/[-\s]/g, "");

  // Only format purely numeric codes
  if (!/^\d+$/.test(raw)) return null;

  const brandLower = (brand || "").toLowerCase();
  const isEpiroc =
    brandLower.includes("epiroc") ||
    brandLower.includes("atlas copco") ||
    brandLower.includes("atlas-copco");
  const isSandvik = brandLower.includes("sandvik");

  if (isEpiroc && raw.length === 10) {
    // Epiroc / Atlas Copco: 4-4-2 format
    return {
      spaced: `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 10)}`,
      joined: raw,
      dashed: `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 10)}`,
    };
  }

  if (isSandvik && raw.length === 8) {
    // Sandvik: 3-3-2 format
    return {
      spaced: `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)}`,
      joined: raw,
      dashed: `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 8)}`,
    };
  }

  // Fallback: try to detect by length for any brand
  if (raw.length === 10) {
    return {
      spaced: `${raw.slice(0, 4)} ${raw.slice(4, 8)} ${raw.slice(8, 10)}`,
      joined: raw,
      dashed: `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 10)}`,
    };
  }

  if (raw.length === 8) {
    return {
      spaced: `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6, 8)}`,
      joined: raw,
      dashed: `${raw.slice(0, 3)}-${raw.slice(3, 6)}-${raw.slice(6, 8)}`,
    };
  }

  return null;
}

// Dashed form of a code, falling back to the raw (space-stripped) code for
// non-standard codes so we always have something usable.
export function getDashedCode(code: string, brand = ""): string {
  const variants = getCodeVariants(code, brand);
  if (variants) return variants.dashed;
  return (code || "").replace(/\s+/g, "");
}

// Build the SEO-friendly URL slug: `dashed-code` + `product-name`.
// e.g. ("9128 7345 00", "Bushing") -> "9128-7345-00-bushing".
// Uniqueness is guaranteed because the (unique) product code is part of the slug.
export function buildProductSlug(code: string, name: string, brand = ""): string {
  const codePart = slugify(getDashedCode(code, brand));
  const namePart = slugify(name || "");
  return [codePart, namePart].filter(Boolean).join("-");
}

// Build the display title: `Name – <code> – Brand`
// e.g. "Solenoid Valve – 9106 1607 98 – Epiroc / Atlas Copco"
// One human-readable code form only (no 3-way spaced/joined/dashed keyword stuffing).
// Accepts either { brand, name, code } or a product-like object
// ({ brandCompatibility, name, delkomCode }) for caller convenience.
export function buildProductTitle(input: {
  brand?: string | null;
  name: string;
  code?: string | null;
  brandCompatibility?: string | null;
  delkomCode?: string | null;
}): string {
  const name = input.name;
  const brand = input.brand ?? input.brandCompatibility ?? "";
  const code = input.code ?? input.delkomCode ?? "";

  const parts: string[] = [];
  if (name) parts.push(name);

  const variants = getCodeVariants(code, brand);
  if (variants) parts.push(variants.spaced);
  else if (code) parts.push(code);

  const cleanBrand = brand
    .split(",")
    .map((b) => b.trim())
    .filter(Boolean)
    .join(" / ");
  if (cleanBrand) parts.push(cleanBrand);

  return parts.join(" – ");
}

// Resolve a product's slug, falling back to a generated one if the stored slug
// is missing (e.g. legacy rows not yet backfilled).
export function getProductSlug(product: {
  slug?: string | null;
  delkomCode?: string | null;
  name: string;
  brandCompatibility?: string | null;
}): string {
  return (
    product.slug ||
    buildProductSlug(product.delkomCode || "", product.name, product.brandCompatibility || "")
  );
}

// Convenience: the canonical client-side href for a product.
export function getProductHref(product: {
  slug?: string | null;
  delkomCode?: string | null;
  name: string;
  brandCompatibility?: string | null;
}): string {
  return `/urun/${getProductSlug(product)}`;
}
