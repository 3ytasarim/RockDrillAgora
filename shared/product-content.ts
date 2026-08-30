// Shared content helpers for product pages (server SSR + client React).
// Kept deliberately minimal and factual: no spun text, no fabricated specs,
// no repeated FAQ. A short honest page indexes better than a long templated one.

import { getCodeVariants } from "./product-utils";

export interface ProductContentInput {
  name: string;
  delkomCode?: string | null;
  brandCompatibility?: string | null;
  stockStatus?: string | null;
  description?: string | null;
  category?: { name?: string | null } | null;
}

function getCode(p: ProductContentInput): string {
  return p.delkomCode || "";
}
function getBrands(p: ProductContentInput): string {
  return p.brandCompatibility || "";
}
function getPrimaryBrand(p: ProductContentInput): string {
  return getBrands(p).split(/[,/]/)[0]?.trim() || "";
}

// --- Compatible Machines (brand-level equipment families) ---
// Factual reference info that genuinely helps a buyer confirm fitment.
export function getCompatibleMachinesIntro(p: ProductContentInput): string {
  const primaryBrand = getPrimaryBrand(p);
  return primaryBrand
    ? `Commonly fitted to ${primaryBrand} rock drilling equipment. Confirm the exact part number against your machine before ordering.`
    : `Confirm the exact part number against your machine model and serial number before ordering.`;
}

export function getCompatibleMachines(brands: string): string[] {
  const b = (brands || "").toLowerCase();
  const list: string[] = [];
  if (b.includes("atlas") || b.includes("epiroc")) {
    list.push("Atlas Copco / Epiroc COP series hydraulic rock drills");
    list.push("Boomer face-drilling jumbos, Boltec bolting rigs, Simba long-hole rigs");
  }
  if (b.includes("sandvik")) {
    list.push("Sandvik HL and RD series hydraulic rock drills");
    list.push("DD / DT development and tunnelling jumbos, DL long-hole rigs");
  }
  if (b.includes("furukawa")) {
    list.push("Furukawa HD series hydraulic rock drills and crawler drills");
  }
  if (b.includes("montabert")) {
    list.push("Montabert HC series hydraulic rock drills and drifters");
  }
  if (list.length === 0) {
    list.push("Hydraulic rock drills, drifters and drill rigs from major manufacturers");
  }
  return list;
}

// --- Technical Specifications ---
// Only rows we can actually stand behind. No invented condition/warranty/build claims.
export function getTechnicalSpecs(p: ProductContentInput): [string, string][] {
  const rows: [string, string][] = [];
  rows.push(["OEM Part Number", getCode(p) || "Contact us"]);
  rows.push(["Brand Compatibility", getBrands(p) || "Contact us to confirm"]);
  if (p.category?.name) rows.push(["Category", p.category.name]);
  rows.push(["Availability", p.stockStatus === "out_of_stock" ? "Out of stock — ask for lead time" : "In stock"]);
  rows.push(["Ships From", "Ankara, Türkiye — worldwide delivery"]);
  return rows;
}

// --- Product description ---
// One short factual paragraph. No spinner, no padding-to-word-count.
export function getProductDescription(p: ProductContentInput): string[] {
  if (p.description && p.description.trim().length > 40) {
    return p.description.trim().split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  }
  const code = getCode(p);
  const primaryBrand = getPrimaryBrand(p);
  const variants = getCodeVariants(code, getBrands(p));
  const codeText = variants
    ? `Part number ${code} (also written ${variants.spaced} or ${variants.dashed}).`
    : code
    ? `Part number ${code}.`
    : "";
  const forBrand = primaryBrand ? ` for ${primaryBrand} rock drilling equipment` : " for rock drilling equipment";
  return [
    `${p.name} — replacement spare part${forBrand}. ${codeText} Supplied by Agora Rock Drill. Contact us for current price, stock and delivery time.`.replace(/\s+/g, " ").trim(),
  ];
}
