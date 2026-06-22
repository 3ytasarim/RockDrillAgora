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
export function getCodeVariants(code: string, brand: string = ""): CodeVariants | null {
  if (!code) return null;

  const raw = code.replace(/[-\s]/g, "");
  if (!/^\d+$/.test(raw)) return null;

  if (raw.length === 10) {
    const a = raw.slice(0, 4);
    const b = raw.slice(4, 8);
    const c = raw.slice(8, 10);
    return { spaced: `${a} ${b} ${c}`, joined: raw, dashed: `${a}-${b}-${c}` };
  }

  if (raw.length === 8) {
    const a = raw.slice(0, 3);
    const b = raw.slice(3, 6);
    const c = raw.slice(6, 8);
    return { spaced: `${a} ${b} ${c}`, joined: raw, dashed: `${a}-${b}-${c}` };
  }

  return null;
}

interface ProductLike {
  delkomCode?: string | null;
  name: string;
  brandCompatibility?: string | null;
}

// Builds the SEO-friendly URL slug, e.g. "9128-7345-00-bushing".
export function buildProductSlug(product: ProductLike): string {
  const code = product.delkomCode || "";
  const variants = getCodeVariants(code, product.brandCompatibility || "");
  const codePart = variants ? variants.dashed : code;
  const base = slugify(`${codePart} ${product.name}`);
  return base || slugify(product.name) || slugify(code);
}

// Builds the combined display title, e.g.
// "Atlas Copco - Epiroc – Solenoid Valve – 9106 1607 98 – 9106106798 – 9106-1607-98".
export function buildProductTitle(product: ProductLike): string {
  const parts: string[] = [];
  if (product.brandCompatibility) parts.push(product.brandCompatibility);
  parts.push(product.name);

  const code = product.delkomCode || "";
  const variants = getCodeVariants(code, product.brandCompatibility || "");
  if (variants) {
    parts.push(variants.spaced, variants.joined, variants.dashed);
  } else if (code) {
    parts.push(code);
  }

  return parts.join(" – ");
}
