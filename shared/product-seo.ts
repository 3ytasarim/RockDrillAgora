// Single source of truth for product SEO strings. Used by the server-side
// renderer (title / meta / alt / JSON-LD) and by the client (Helmet / alt), so
// the HTML Google reads and the DOM after hydration always agree.
//
// Every part number is searchable in three written forms (spaced / joined /
// dashed); each of them is carried in the title, description, image alt,
// caption and structured data so a search for any form can match the page and
// its photo.

import { buildProductTitle, getCodeVariants } from "./product-utils";

export const SITE_NAME = "Agora Rock Drill";

interface SeoProductInput {
  name: string;
  delkomCode?: string | null;
  brandCompatibility?: string | null;
}

export interface ProductCodeForms {
  /** Every distinct written form of the code, spaced first. Empty if there is no code. */
  all: string[];
  spaced: string;
  joined: string;
  dashed: string;
}

export function getProductCodeForms(p: SeoProductInput): ProductCodeForms {
  const code = (p.delkomCode || "").trim();
  const v = getCodeVariants(code, p.brandCompatibility || "");
  if (v) return { all: [v.spaced, v.joined, v.dashed], ...v };
  return { all: code ? [code] : [], spaced: code, joined: code, dashed: code };
}

export function getPrimaryBrand(p: SeoProductInput): string {
  const b = p.brandCompatibility || "";
  return b ? b.split(",")[0].trim() : "";
}

function clip(text: string, max: number): string {
  const t = text.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/** `<title>`: name + all three code forms first, brand and site last. */
export function buildSeoTitle(p: SeoProductInput): string {
  const { all } = getProductCodeForms(p);
  const brand = getPrimaryBrand(p);
  const head = [p.name, all.join(" | ")].filter(Boolean).join(" ");
  return [head, brand, SITE_NAME].filter(Boolean).join(" | ");
}

/** Meta description: name + every written form of the part number first (the part Google shows), then a call to action. */
export function buildSeoDescription(p: SeoProductInput): string {
  const { all } = getProductCodeForms(p);
  const brand = getPrimaryBrand(p);
  const [first, ...others] = all;
  const codePart = first ? ` ${first}` + (others.length ? ` (${others.join(", ")})` : "") : "";
  const forBrand = brand ? ` for ${brand} rock drills` : " for rock drills";
  return clip(`${p.name}${codePart}${forBrand}. Request a quote from ${SITE_NAME}: price, stock and worldwide delivery.`, 300);
}

/** Visible summary under the H1 (also used as the SSR/client paragraph when no stored description exists). */
export function buildSeoSummary(p: SeoProductInput): string {
  const { spaced } = getProductCodeForms(p);
  const brand = getPrimaryBrand(p);
  const brandPart = brand ? ` compatible with ${brand}` : "";
  return `${p.name}${spaced ? `, OEM part number ${spaced}` : ""}${brandPart} rock drilling equipment. Contact ${SITE_NAME} for price, stock and delivery time.`;
}

/** Main product photo alt: brand, name and all three code forms. */
export function buildImageAlt(p: SeoProductInput, index = 0): string {
  const base = buildProductTitle({ brand: p.brandCompatibility, name: p.name, code: p.delkomCode }).replace(/ – /g, " - ");
  return index > 0 ? `${base} - photo ${index + 1}` : base;
}

/** Visible caption printed under the main photo. */
export function buildImageCaption(p: SeoProductInput): string {
  const { all } = getProductCodeForms(p);
  const brand = getPrimaryBrand(p);
  return `${[brand, p.name].filter(Boolean).join(" ")}${all.length ? ` – part no. ${all.join(" · ")}` : ""}`;
}
