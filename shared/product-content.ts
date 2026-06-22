// Shared SEO/content generation for product pages.
// Used by both the server (SSR HTML for crawlers) and the client (React product
// detail page) so that what Google sees matches exactly what users see.

import { getCodeVariants } from "./product-utils";

export interface ProductContentInput {
  name: string;
  delkomCode?: string | null;
  brandCompatibility?: string | null;
  stockStatus?: string | null;
  description?: string | null;
  category?: { name?: string | null } | null;
}

export interface FaqItem {
  q: string;
  a: string;
}

function getCode(p: ProductContentInput): string {
  return p.delkomCode || "";
}

function getBrands(p: ProductContentInput): string {
  return p.brandCompatibility || "";
}

function getPrimaryBrand(p: ProductContentInput): string {
  const brands = getBrands(p);
  return brands.split(/[,/]/)[0]?.trim() || "";
}

function getCategoryLabel(p: ProductContentInput): string {
  return p.category?.name || "Rock Drill Spare Part";
}

// --- Compatible Machines intro sentence (shared by SSR + React) ---
export function getCompatibleMachinesIntro(p: ProductContentInput): string {
  const code = getCode(p);
  const primaryBrand = getPrimaryBrand(p);
  return `The ${p.name}${code ? ` (part no. ${code})` : ""} is designed for use with the following ${primaryBrand ? `${primaryBrand} ` : ""}equipment families. Always confirm the exact part number with our technical team before ordering to guarantee correct fitment.`;
}

// --- Compatible Machines (brand-level equipment families) ---
export function getCompatibleMachines(brands: string): string[] {
  const b = (brands || "").toLowerCase();
  const list: string[] = [];
  if (b.includes("atlas") || b.includes("epiroc")) {
    list.push("Atlas Copco / Epiroc COP series hydraulic rock drills (e.g. COP 1638, COP 1838, COP 2160, COP 3060)");
    list.push("Boomer face drilling jumbos (Boomer S1 D, S2, M2 C, XE3 C series)");
    list.push("Boltec rock bolting rigs and Simba long-hole production drill rigs");
  }
  if (b.includes("sandvik")) {
    list.push("Sandvik hydraulic rock drills (e.g. HL510, HL550, HL700, HLX5, RD500 series)");
    list.push("DD development drilling jumbos (DD311, DD321, DD421 series)");
    list.push("DT tunnelling jumbos and DL long-hole production drill rigs");
  }
  if (b.includes("furukawa")) {
    list.push("Furukawa hydraulic rock drills (e.g. HD200, HD300, HD500, HD715 series)");
    list.push("Furukawa crawler drills and surface drill rigs");
  }
  if (b.includes("montabert")) {
    list.push("Montabert hydraulic rock drills and drifters (HC series)");
  }
  if (list.length === 0) {
    list.push("Hydraulic rock drills, drifters and drill rigs from leading manufacturers");
    list.push("Surface and underground drilling equipment used in mining, tunnelling and construction");
  }
  return list;
}

// --- Technical Specifications (key/value rows) ---
export function getTechnicalSpecs(p: ProductContentInput): [string, string][] {
  const code = getCode(p);
  const brands = getBrands(p);
  return [
    ["OEM Part Number", code || "N/A"],
    ["Manufacturer Compatibility", brands || "Multiple manufacturers"],
    ["Product Category", getCategoryLabel(p)],
    ["Condition", "New — OEM-quality replacement part"],
    ["Build Standard", "Manufactured to original OEM specifications"],
    ["Warranty", "3 months against manufacturing defects"],
    ["Availability", p.stockStatus === "out_of_stock" ? "Out of stock — contact for lead time" : "In stock"],
    ["Shipped From", "Ankara, Turkey — worldwide delivery"],
  ];
}

// --- FAQ (5 questions, consistent set across all products) ---
export function getFaqItems(p: ProductContentInput): FaqItem[] {
  const code = getCode(p);
  const brands = getBrands(p);
  const primaryBrand = getPrimaryBrand(p);
  return [
    {
      q: `Is the ${p.name} (${code}) in stock?`,
      a: p.stockStatus === "out_of_stock"
        ? `This item is currently out of stock. Please contact us for availability and estimated lead times.`
        : `Yes, the ${p.name} is currently in stock and available for immediate dispatch. Contact us for a quote.`,
    },
    {
      q: `What equipment is part ${code} compatible with?`,
      a: primaryBrand
        ? `This part is compatible with ${brands} hydraulic rock drills and drill rigs. Please confirm the part number with our technical team before ordering.`
        : `Please contact our team to confirm compatibility with your specific equipment model and serial number.`,
    },
    {
      q: `Are these genuine OEM parts or aftermarket replacements?`,
      a: `Agora Rock Drill supplies original-quality replacement parts built to OEM specifications. Every part is inspected for quality before dispatch and carries a warranty.`,
    },
    {
      q: `Do you ship part ${code} internationally?`,
      a: `Yes, Agora Rock Drill ships to over 50 countries worldwide with full export documentation and reliable freight partners for fast delivery.`,
    },
    {
      q: `How can I request a quote or place an order?`,
      a: `Use the "Request a Quote" button on this page, or contact us at info@agorarockdrill.com or +90 312 385 60 03. Our team responds promptly with pricing and lead time.`,
    },
  ];
}

// --- Product Description (300-500 words, deterministically varied per product) ---
// Returns an array of plain-text paragraphs (no HTML).
export function getProductDescription(p: ProductContentInput): string[] {
  const code = getCode(p);
  const brands = getBrands(p);
  const primaryBrand = getPrimaryBrand(p);
  const categoryLabel = getCategoryLabel(p);
  const codeVariants = getCodeVariants(code, brands);

  const descSeed = (() => {
    let h = 0;
    const s = `${code}|${p.name}`;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  })();
  function pickVariant<T>(arr: T[], salt: number): T {
    return arr[(descSeed + salt) % arr.length];
  }
  function countWords(str: string): number {
    return str.replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
  }

  const brandPhrase = primaryBrand ? brands : "leading hydraulic rock drill and drill rig";
  const introVariants = [
    `The ${p.name} is a premium-quality replacement part engineered for ${brandPhrase} equipment, delivering the durability and precise tolerances demanded by professional drilling operations.`,
    `Designed as a direct replacement, the ${p.name} meets the exacting standards of ${brandPhrase} hydraulic drilling systems and is built for long, trouble-free service life.`,
    `Agora Rock Drill supplies the ${p.name}, an original-quality component manufactured to fit ${brandPhrase} rock drills and drill rigs with reliable, consistent performance.`,
  ];
  const appVariants = [
    `Whether you work in underground mining, tunnelling, quarrying or civil construction, dependable spare parts keep penetration rates high and unplanned downtime low.`,
    `From production drilling in mining to face drilling on tunnelling projects, this part supports stable impact energy, smooth operation and predictable maintenance intervals.`,
    `Used across surface and underground drilling applications, it helps operators sustain output, protect surrounding components and extend the service life of the complete drilling system.`,
  ];
  const codeSentenceVariants = [
    `This component is catalogued under part number ${code}${codeVariants ? `, also referenced as ${codeVariants.spaced} or ${codeVariants.dashed}` : ""}, making cross-referencing and reordering straightforward.`,
    `You can identify this item by its OEM part number ${code}${codeVariants ? ` (also written ${codeVariants.spaced} or ${codeVariants.dashed})` : ""}, so you receive exactly the right component for your machine.`,
    `Stocked under part number ${code}${codeVariants ? `, and commonly searched as ${codeVariants.spaced} or ${codeVariants.dashed}` : ""}, this part is quick to locate in our catalogue and easy to quote.`,
  ];
  const qualityVariants = [
    `Every part is inspected and quality-checked before dispatch by Agora Rock Drill A.Ş., a specialist distributor with over 20 years of industry experience operating from a 700+ m² warehouse in Ankara, Turkey.`,
    `Backed by more than two decades of sector knowledge, Agora Rock Drill carefully inspects, packages and labels each component for quality and traceability before it leaves our Ankara facility.`,
    `As a dedicated spare parts specialist, Agora Rock Drill applies rigorous quality control to this part so that it performs exactly as expected, first time and every time.`,
  ];
  const fitSentence = primaryBrand
    ? `It is specifically designed for use with ${brands} equipment, ensuring reliable performance and correct fit.`
    : `It suits a range of rock drilling equipment from leading manufacturers.`;
  const catSentence = categoryLabel !== "Rock Drill Spare Part"
    ? `As part of our ${categoryLabel} range, it is held in our Ankara inventory of more than 15,000 spare parts for fast dispatch worldwide.`
    : `It is held in our Ankara inventory of more than 15,000 spare parts for fast dispatch worldwide.`;
  const closingSentence = `To order the ${p.name} (part no. ${code}), submit a quote request using the button above or contact us at info@agorarockdrill.com or +90 312 385 60 03. Our team responds promptly with pricing and lead-time information.`;
  const padPool = [
    `All orders ship worldwide with full export documentation handled by reliable freight partners.`,
    `Our catalogue covers components for Atlas Copco, Epiroc, Sandvik, Furukawa, Montabert and other leading manufacturers.`,
    `Bulk pricing and consolidated shipments are available for workshops and fleet operators.`,
    `If you are unsure about compatibility, our technical team can confirm fitment from your machine model and serial number.`,
    `Genuine-quality materials and manufacturing tolerances help protect adjacent parts and reduce total cost of ownership.`,
    `Common service items are kept in deep stock so that routine maintenance is never held up waiting for parts.`,
  ];

  const descParas: string[] = [
    `${pickVariant(introVariants, 1)} ${pickVariant(appVariants, 2)}`,
    `${pickVariant(codeSentenceVariants, 3)} ${fitSentence}`,
    `${pickVariant(qualityVariants, 4)} ${catSentence}${p.description ? ` ${p.description}` : ""}`,
  ];
  let descWords = descParas.reduce((n, para) => n + countWords(para), 0) + countWords(closingSentence);
  const padSentences: string[] = [];
  let pIdx = 0;
  while (descWords < 320 && pIdx < padPool.length * 2) {
    const sentence = padPool[(descSeed + pIdx) % padPool.length];
    padSentences.push(sentence);
    descWords += countWords(sentence);
    pIdx++;
  }
  if (padSentences.length) descParas.push(padSentences.join(" "));
  descParas.push(closingSentence);
  return descParas;
}
