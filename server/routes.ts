import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";
import { buildProductSlug, buildProductTitle, getCodeVariants } from "@shared/product-utils";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";
import { sendQuoteRequestEmail } from "./email";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });

// Escape dynamic values for safe insertion into HTML text and double-quoted attributes
function escapeHtml(text: string | null | undefined): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Serialize JSON-LD safely for embedding inside a <script> tag (prevents </script> breakout)
function safeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, '\\u003c');
}

// Generate a list of compatible machine families based on the product's brand compatibility.
// Returns brand-level equipment families (not part-specific claims) for SEO context.
function getCompatibleMachines(brands: string): string[] {
  const b = (brands || '').toLowerCase();
  const list: string[] = [];
  if (b.includes('atlas') || b.includes('epiroc')) {
    list.push('Atlas Copco / Epiroc COP series hydraulic rock drills (e.g. COP 1638, COP 1838, COP 2160, COP 3060)');
    list.push('Boomer face drilling jumbos (Boomer S1 D, S2, M2 C, XE3 C series)');
    list.push('Boltec rock bolting rigs and Simba long-hole production drill rigs');
  }
  if (b.includes('sandvik')) {
    list.push('Sandvik hydraulic rock drills (e.g. HL510, HL550, HL700, HLX5, RD500 series)');
    list.push('DD development drilling jumbos (DD311, DD321, DD421 series)');
    list.push('DT tunnelling jumbos and DL long-hole production drill rigs');
  }
  if (b.includes('furukawa')) {
    list.push('Furukawa hydraulic rock drills (e.g. HD200, HD300, HD500, HD715 series)');
    list.push('Furukawa crawler drills and surface drill rigs');
  }
  if (b.includes('montabert')) {
    list.push('Montabert hydraulic rock drills and drifters (HC series)');
  }
  if (list.length === 0) {
    list.push('Hydraulic rock drills, drifters and drill rigs from leading manufacturers');
    list.push('Surface and underground drilling equipment used in mining, tunnelling and construction');
  }
  return list;
}

// Helper function to create URL-friendly slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}


// Helper function to generate dynamic HTML with SEO meta tags
function generateProductHtml(
  templateHtml: string,
  product: {
    name: string;
    description?: string | null;
    delkomCode?: string | null;
    slug?: string | null;
    brandCompatibility?: string | null;
    imageUrls?: string[] | null;
    imageUrl?: string | null;
    finalPrice?: string | null;
    originalPrice?: string | null;
    stockStatus?: string | null;
    category?: { id: string; name: string } | null;
  },
  relatedProducts: Array<{
    name: string;
    delkomCode?: string | null;
    slug?: string | null;
    brandCompatibility?: string | null;
    imageUrls?: string[] | null;
  }> = []
): string {
  const baseUrl = "https://agorarockdrill.shop";
  const brands = product.brandCompatibility || '';
  const code = product.delkomCode || '';
  const primaryBrand = brands ? brands.split(',')[0].trim() : '';

  // --- Unique title ---
  const title = `${product.name}${code ? ` - ${code}` : ''}${primaryBrand ? ` | ${primaryBrand}` : ''} Spare Part | Agora Rock Drill`;

  // --- Unique meta description (never duplicate) ---
  let description: string;
  if (product.description && product.description.trim().length > 40) {
    description = product.description.slice(0, 155) + (product.description.length > 155 ? '...' : '');
  } else {
    const brandPart = primaryBrand ? `for ${primaryBrand}` : 'for rock drilling equipment';
    const codePart = code ? ` Part number: ${code}.` : '';
    description = `${product.name} — OEM-quality spare part ${brandPart}.${codePart} In stock at Agora Rock Drill. Request a quote for fast worldwide delivery from Ankara, Turkey.`;
    if (description.length > 160) description = description.slice(0, 157) + '...';
  }

  // --- Escaped variants for safe HTML insertion (raw versions kept for JSON-LD) ---
  const eName = escapeHtml(product.name);
  const eCode = escapeHtml(code);
  const eBrands = escapeHtml(brands);
  const ePrimaryBrand = escapeHtml(primaryBrand);
  const eTitle = escapeHtml(title);
  const eDescription = escapeHtml(description);

  // --- Image ---
  const productImage = product.imageUrls?.[0] || product.imageUrl || `${baseUrl}/og-image.jpg`;
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${baseUrl}${productImage}`;
  const eFullImageUrl = escapeHtml(fullImageUrl);

  // --- Canonical URL (SEO-friendly slug) ---
  const productSlug = product.slug || buildProductSlug(product);
  const canonicalUrl = `${baseUrl}/urun/${productSlug}`;

  // --- Code variants for SEO ---
  const codeVariants = getCodeVariants(code, brands);
  const codeVariantsHtml = codeVariants
    ? `<p style="margin:4px 0;font-family:monospace;color:#555;">${codeVariants.spaced}</p>
       <p style="margin:4px 0;font-family:monospace;color:#555;">${codeVariants.joined}</p>
       <p style="margin:4px 0;font-family:monospace;color:#555;">${codeVariants.dashed}</p>`
    : '';

  // --- JSON-LD: Product schema ---
  const priceValidUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": description,
    "sku": code,
    "mpn": code,
    "image": fullImageUrl,
    "brand": { "@type": "Brand", "name": primaryBrand || "Agora Rock Drill" },
    "manufacturer": { "@type": "Organization", "name": "Agora Rock Drill" },
    "category": product.category?.name || "Rock Drill Spare Parts",
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "availability": product.stockStatus === 'out_of_stock'
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "price": "0",
      "priceCurrency": "USD",
      "priceValidUntil": priceValidUntil,
      "seller": { "@type": "Organization", "name": "Agora Rock Drill" }
    }
  };

  // --- JSON-LD: BreadcrumbList ---
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Spare Parts", "item": `${baseUrl}/spare-parts` },
      { "@type": "ListItem", "position": 3, "name": product.name, "item": canonicalUrl }
    ]
  };

  // --- Rich SSR body content for Google (300+ words, unique per product) ---
  const stockLabel = product.stockStatus === 'out_of_stock' ? 'Currently out of stock' : 'In Stock';
  const categoryName = escapeHtml(product.category?.name || '');
  const categoryLabel = product.category?.name || 'Rock Drill Spare Part';

  // --- Compatible Machines (brand-level equipment families) ---
  const compatibleMachines = getCompatibleMachines(brands);
  const compatibleMachinesHtml = `
      <div style="margin-top:40px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Compatible Machines</h2>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 12px;">
          The <strong>${eName}</strong>${eCode ? ` (part no. <strong>${eCode}</strong>)` : ''} is designed for use with the following ${ePrimaryBrand ? `${ePrimaryBrand} ` : ''}equipment families. Always confirm the exact part number with our technical team before ordering to guarantee correct fitment.
        </p>
        <ul style="color:#4a5568;line-height:1.8;margin:0;padding-left:20px;">
          ${compatibleMachines.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
        </ul>
      </div>`;

  // --- Technical Specifications ---
  const specRows: [string, string][] = [
    ['OEM Part Number', code || 'N/A'],
    ['Manufacturer Compatibility', brands || 'Multiple manufacturers'],
    ['Product Category', categoryLabel],
    ['Condition', 'New — OEM-quality replacement part'],
    ['Build Standard', 'Manufactured to original OEM specifications'],
    ['Warranty', '3 months against manufacturing defects'],
    ['Availability', product.stockStatus === 'out_of_stock' ? 'Out of stock — contact for lead time' : 'In stock'],
    ['Shipped From', 'Ankara, Turkey — worldwide delivery'],
  ];
  const technicalSpecsHtml = `
      <div style="margin-top:40px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Technical Specifications</h2>
        <table style="width:100%;border-collapse:collapse;font-size:15px;">
          <tbody>
            ${specRows.map(([k, v], i) => `
            <tr style="background:${i % 2 === 0 ? '#f7fafc' : '#fff'};">
              <td style="padding:10px 14px;font-weight:600;color:#2d3748;width:40%;border:1px solid #e2e8f0;">${escapeHtml(k)}</td>
              <td style="padding:10px 14px;color:#1a1a1a;border:1px solid #e2e8f0;">${escapeHtml(v)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>`;

  // --- FAQ (5 questions, consistent set across all products) ---
  const faqItems = [
    {
      q: `Is the ${product.name} (${code}) in stock?`,
      a: product.stockStatus === 'out_of_stock'
        ? `This item is currently out of stock. Please contact us for availability and estimated lead times.`
        : `Yes, the ${product.name} is currently in stock and available for immediate dispatch. Contact us for a quote.`
    },
    {
      q: `What equipment is part ${code} compatible with?`,
      a: primaryBrand
        ? `This part is compatible with ${brands} hydraulic rock drills and drill rigs. Please confirm the part number with our technical team before ordering.`
        : `Please contact our team to confirm compatibility with your specific equipment model and serial number.`
    },
    {
      q: `Are these genuine OEM parts or aftermarket replacements?`,
      a: `Agora Rock Drill supplies original-quality replacement parts built to OEM specifications. Every part is inspected for quality before dispatch and carries a warranty.`
    },
    {
      q: `Do you ship part ${code} internationally?`,
      a: `Yes, Agora Rock Drill ships to over 50 countries worldwide with full export documentation and reliable freight partners for fast delivery.`
    },
    {
      q: `How can I request a quote or place an order?`,
      a: `Use the "Request a Quote" button on this page, or contact us at info@agorarockdrill.com or +90 312 385 60 03. Our team responds promptly with pricing and lead time.`
    },
  ];
  const faqHtml = `
      <div style="margin-top:40px;padding:24px;background:#f0f4ff;border-radius:8px;">
        <h2 style="font-size:20px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Frequently Asked Questions</h2>
        ${faqItems.map((f, i) => `
        <div style="${i < faqItems.length - 1 ? 'margin-bottom:16px;' : ''}">
          <h3 style="font-size:16px;font-weight:600;margin:0 0 6px;color:#2d3748;">${escapeHtml(f.q)}</h3>
          <p style="color:#4a5568;margin:0;">${escapeHtml(f.a)}</p>
        </div>`).join('')}
      </div>`;

  // --- JSON-LD: FAQPage (raw values; serialized via safeJsonLd) ---
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqItems.map(f => ({
      "@type": "Question",
      "name": f.q,
      "acceptedAnswer": { "@type": "Answer", "text": f.a }
    }))
  };

  // --- Product Description (300-500 words, deterministically varied per product) ---
  const descSeed = (() => {
    let h = 0;
    const s = `${code}|${product.name}`;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  })();
  function pickVariant<T>(arr: T[], salt: number): T {
    return arr[(descSeed + salt) % arr.length];
  }
  function countWords(htmlStr: string): number {
    return htmlStr.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length;
  }
  const brandPhrase = primaryBrand ? `<strong>${eBrands}</strong>` : 'leading hydraulic rock drill and drill rig';
  const introVariants = [
    `The <strong>${eName}</strong> is a premium-quality replacement part engineered for ${brandPhrase} equipment, delivering the durability and precise tolerances demanded by professional drilling operations.`,
    `Designed as a direct replacement, the <strong>${eName}</strong> meets the exacting standards of ${brandPhrase} hydraulic drilling systems and is built for long, trouble-free service life.`,
    `Agora Rock Drill supplies the <strong>${eName}</strong>, an original-quality component manufactured to fit ${brandPhrase} rock drills and drill rigs with reliable, consistent performance.`,
  ];
  const appVariants = [
    `Whether you work in underground mining, tunnelling, quarrying or civil construction, dependable spare parts keep penetration rates high and unplanned downtime low.`,
    `From production drilling in mining to face drilling on tunnelling projects, this part supports stable impact energy, smooth operation and predictable maintenance intervals.`,
    `Used across surface and underground drilling applications, it helps operators sustain output, protect surrounding components and extend the service life of the complete drilling system.`,
  ];
  const codeSentenceVariants = [
    `This component is catalogued under part number <strong>${eCode}</strong>${codeVariants ? `, also referenced as <strong>${escapeHtml(codeVariants.spaced)}</strong> or <strong>${escapeHtml(codeVariants.dashed)}</strong>` : ''}, making cross-referencing and reordering straightforward.`,
    `You can identify this item by its OEM part number <strong>${eCode}</strong>${codeVariants ? ` (also written ${escapeHtml(codeVariants.spaced)} or ${escapeHtml(codeVariants.dashed)})` : ''}, so you receive exactly the right component for your machine.`,
    `Stocked under part number <strong>${eCode}</strong>${codeVariants ? `, and commonly searched as ${escapeHtml(codeVariants.spaced)} or ${escapeHtml(codeVariants.dashed)}` : ''}, this part is quick to locate in our catalogue and easy to quote.`,
  ];
  const qualityVariants = [
    `Every part is inspected and quality-checked before dispatch by Agora Rock Drill A.Ş., a specialist distributor with over 20 years of industry experience operating from a 700+ m² warehouse in Ankara, Turkey.`,
    `Backed by more than two decades of sector knowledge, Agora Rock Drill carefully inspects, packages and labels each component for quality and traceability before it leaves our Ankara facility.`,
    `As a dedicated spare parts specialist, Agora Rock Drill applies rigorous quality control to this part so that it performs exactly as expected, first time and every time.`,
  ];
  const fitSentence = primaryBrand
    ? `It is specifically designed for use with <strong>${eBrands}</strong> equipment, ensuring reliable performance and correct fit.`
    : `It suits a range of rock drilling equipment from leading manufacturers.`;
  const catSentence = categoryLabel !== 'Rock Drill Spare Part'
    ? `As part of our ${escapeHtml(categoryLabel)} range, it is held in our Ankara inventory of more than 15,000 spare parts for fast dispatch worldwide.`
    : `It is held in our Ankara inventory of more than 15,000 spare parts for fast dispatch worldwide.`;
  const closingSentence = `To order the <strong>${eName}</strong> (part no. <strong>${eCode}</strong>), submit a quote request using the button above or contact us at <a href="mailto:info@agorarockdrill.com" style="color:#2563eb;">info@agorarockdrill.com</a> or <a href="tel:+903123856003" style="color:#2563eb;">+90 312 385 60 03</a>. Our team responds promptly with pricing and lead-time information.`;
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
    `${pickVariant(qualityVariants, 4)} ${catSentence}${product.description ? ` ${escapeHtml(product.description)}` : ''}`,
  ];
  let descWords = descParas.reduce((n, p) => n + countWords(p), 0) + countWords(closingSentence);
  const padSentences: string[] = [];
  let pIdx = 0;
  while (descWords < 320 && pIdx < padPool.length * 2) {
    const sentence = padPool[(descSeed + pIdx) % padPool.length];
    padSentences.push(sentence);
    descWords += countWords(sentence);
    pIdx++;
  }
  if (padSentences.length) descParas.push(padSentences.join(' '));
  descParas.push(closingSentence);
  const descriptionHtml = `
      <div style="margin-top:48px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Product Description</h2>
        ${descParas.map((p, i) => `<p style="color:#4a5568;line-height:1.8;${i < descParas.length - 1 ? 'margin-bottom:16px;' : ''}">${p}</p>`).join('\n        ')}
      </div>`;

  // --- Related products HTML (same category) — internal links boost SEO crawling ---
  const relatedProductsHtml = relatedProducts.length > 0
    ? `
      <div style="margin-top:48px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 24px;color:#1a1a1a;">Related Products</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;">
          ${relatedProducts.map(rp => {
            const rpCode = rp.delkomCode || '';
            const rpUrl = `${baseUrl}/urun/${rp.slug || buildProductSlug(rp)}`;
            const rpImg = rp.imageUrls?.[0] || `${baseUrl}/og-image.jpg`;
            const rpFullImg = rpImg.startsWith('http') ? rpImg : `${baseUrl}${rpImg}`;
            const rpBrand = rp.brandCompatibility ? rp.brandCompatibility.split(',')[0].trim() : '';
            const eRpName = escapeHtml(rp.name);
            const eRpTitle = escapeHtml(buildProductTitle(rp));
            const eRpCode = escapeHtml(rpCode);
            const eRpBrand = escapeHtml(rpBrand);
            return `
            <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;">
              <a href="${escapeHtml(rpUrl)}" style="text-decoration:none;color:inherit;display:block;">
                <img src="${escapeHtml(rpFullImg)}" alt="${eRpName} - ${eRpCode}" width="180" height="160"
                     loading="lazy" style="width:100%;height:160px;object-fit:cover;" />
                <div style="padding:12px;">
                  <h3 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#1a1a1a;line-height:1.3;">${eRpTitle}</h3>
                  ${eRpBrand ? `<p style="font-size:12px;color:#2563eb;margin:0;">${eRpBrand}</p>` : ''}
                </div>
              </a>
            </div>`;
          }).join('')}
        </div>
      </div>`
    : '';

  const ssrContent = `
    <div id="ssr-product-content" style="padding:40px 20px;max-width:1200px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;">

      <nav aria-label="Breadcrumb" style="margin-bottom:20px;font-size:14px;color:#666;">
        <a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &rsaquo;
        <a href="${baseUrl}/spare-parts" style="color:#2563eb;text-decoration:none;">Spare Parts</a> &rsaquo;
        ${primaryBrand ? `<a href="${baseUrl}/spare-parts?brand=${encodeURIComponent(primaryBrand)}" style="color:#2563eb;text-decoration:none;">${ePrimaryBrand}</a> &rsaquo;` : ''}
        <span>${eName}</span>
      </nav>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;">
        <div>
          <img src="${eFullImageUrl}" alt="${eName} - ${eCode} spare part" width="500" height="500"
               style="width:100%;max-width:500px;height:auto;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.1);" />
        </div>
        <div>
          <h1 style="font-size:32px;font-weight:700;margin:0 0 12px;color:#1a1a1a;">${escapeHtml(buildProductTitle(product))}</h1>
          <p style="font-size:18px;color:#4a5568;margin-bottom:20px;line-height:1.6;">${eDescription}</p>

          <div style="background:#f7fafc;padding:20px;border-radius:8px;margin-bottom:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#2d3748;">OEM Part Number</h2>
            <p style="margin:0 0 4px;font-family:monospace;font-size:17px;font-weight:700;color:#1a1a1a;">${eCode || 'N/A'}</p>
            ${codeVariantsHtml}
            ${primaryBrand ? `<p style="margin:12px 0 0;"><strong style="color:#2d3748;">Brand:</strong> <span style="color:#1a1a1a;">${eBrands}</span></p>` : ''}
            ${categoryName ? `<p style="margin:8px 0 0;"><strong style="color:#2d3748;">Category:</strong> <span style="color:#1a1a1a;">${categoryName}</span></p>` : ''}
            <p style="margin:8px 0 0;"><strong style="color:#2d3748;">Availability:</strong>
              <span style="color:${product.stockStatus === 'out_of_stock' ? '#c53030' : '#276749'};">${stockLabel}</span></p>
          </div>

          <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;">
            <span style="background:#e6fffa;color:#047857;padding:8px 16px;border-radius:6px;font-size:14px;">&#10003; Quality Guaranteed</span>
            <span style="background:#eff6ff;color:#1d4ed8;padding:8px 16px;border-radius:6px;font-size:14px;">&#9992; Worldwide Shipping</span>
            <span style="background:#fefce8;color:#854d0e;padding:8px 16px;border-radius:6px;font-size:14px;">&#8635; Fast Delivery</span>
          </div>

          <a href="${baseUrl}/contact" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;padding:16px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:16px;">
            Request a Quote
          </a>
        </div>
      </div>

      ${descriptionHtml}

      ${technicalSpecsHtml}

      ${compatibleMachinesHtml}

      ${faqHtml}

      ${relatedProductsHtml}

      <div style="margin-top:40px;text-align:center;">
        <a href="${baseUrl}/spare-parts${primaryBrand ? `?brand=${encodeURIComponent(primaryBrand)}` : ''}" style="display:inline-block;background:#f1f5f9;color:#1a1a1a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:12px;">
          &larr; View More ${ePrimaryBrand || 'Spare'} Parts
        </a>
        <a href="${baseUrl}/contact" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
          Contact Us
        </a>
      </div>
    </div>
  `;
  
  // Replace meta tags in template
  let html = templateHtml;
  
  const eCanonicalUrl = escapeHtml(canonicalUrl);

  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/,
    () => `<title>${eTitle}</title>`
  );
  
  // Replace meta title
  html = html.replace(
    /<meta name="title" content=".*?" \/>/,
    () => `<meta name="title" content="${eTitle}" />`
  );
  
  // Replace meta description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    () => `<meta name="description" content="${eDescription}" />`
  );
  
  // Replace canonical URL
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/,
    () => `<link rel="canonical" href="${eCanonicalUrl}" />`
  );
  
  // Replace OG tags
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    () => `<meta property="og:title" content="${eTitle}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    () => `<meta property="og:description" content="${eDescription}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    () => `<meta property="og:url" content="${eCanonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:image" content=".*?" \/>/,
    () => `<meta property="og:image" content="${eFullImageUrl}" />`
  );
  html = html.replace(
    /<meta property="og:type" content=".*?" \/>/,
    `<meta property="og:type" content="product" />`
  );
  
  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    () => `<meta name="twitter:title" content="${eTitle}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    () => `<meta name="twitter:description" content="${eDescription}" />`
  );
  html = html.replace(
    /<meta name="twitter:url" content=".*?" \/>/,
    () => `<meta name="twitter:url" content="${eCanonicalUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content=".*?" \/>/,
    () => `<meta name="twitter:image" content="${eFullImageUrl}" />`
  );
  
  // Add JSON-LD structured data before </head>
  html = html.replace(
    '</head>',
    () => `<script type="application/ld+json">${safeJsonLd(productJsonLd)}</script>\n<script type="application/ld+json">${safeJsonLd(breadcrumbJsonLd)}</script>\n<script type="application/ld+json">${safeJsonLd(faqJsonLd)}</script>\n</head>`
  );
  
  // Add SSR content inside <div id="root"> - React will hydrate over this
  html = html.replace(
    '<div id="root"></div>',
    () => `<div id="root">${ssrContent}</div>`
  );
  
  return html;
}

// Fetch related products from the same category (for SSR internal linking)
async function getRelatedProducts(product: {
  id?: string;
  categoryId?: string | null;
  delkomCode?: string | null;
}): Promise<Array<{ name: string; delkomCode?: string | null; slug?: string | null; brandCompatibility?: string | null; imageUrls?: string[] | null }>> {
  try {
    if (!product.categoryId) return [];
    const sameCategory = await storage.getProductsByCategory(product.categoryId);
    return sameCategory
      .filter(p => p.delkomCode && p.delkomCode !== product.delkomCode)
      .slice(0, 8)
      .map(p => ({
        name: p.name,
        delkomCode: p.delkomCode,
        slug: p.slug,
        brandCompatibility: p.brandCompatibility,
        imageUrls: p.imageUrls,
      }));
  } catch (err) {
    console.error("Error fetching related products:", err);
    return [];
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, featured, discounted } = req.query;
      
      let products;
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else if (featured === 'true') {
        const allFeatured = await storage.getFeaturedProducts();
        // Limit featured products to 12 for performance
        products = allFeatured.slice(0, 12);
      } else if (discounted === 'true') {
        products = await storage.getDiscountedProducts();
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Paginated products endpoint for better performance
  app.get("/api/products/paginated", async (req, res) => {
    try {
      const { search, brand, category, page, limit } = req.query;
      
      const result = await storage.getProductsPaginated({
        search: search as string,
        brand: brand as string,
        categoryId: category as string,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 24,
      });
      
      // Add cache headers for better performance
      res.set('Cache-Control', 'public, max-age=60');
      res.json(result);
    } catch (error) {
      console.error('Error fetching paginated products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/by-code/:code", async (req, res) => {
    try {
      const product = await storage.getProductByCode(req.params.code);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product by code:', error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/by-slug/:slug", async (req, res) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      let product = await storage.getProductBySlug(slug);
      // Fallback: tolerate old links where the param is a product code.
      if (!product) product = await storage.getProductByCode(slug);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product by slug:', error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      
      if (validatedProduct.categoryId === "") {
        validatedProduct.categoryId = undefined;
      }
      if (validatedProduct.brandCompatibility === "") {
        validatedProduct.brandCompatibility = undefined;
      }
      
      const product = await storage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.partial().parse(req.body);
      
      if (validatedProduct.categoryId === "") {
        validatedProduct.categoryId = undefined;
      }
      if (validatedProduct.brandCompatibility === "") {
        validatedProduct.brandCompatibility = undefined;
      }
      
      const product = await storage.updateProduct(req.params.id, validatedProduct);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Bulk Import Products
  app.post("/api/products/bulk-import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const results = {
        success: [] as any[],
        errors: [] as any[],
      };

      for (const row of data) {
        try {
          const productData: any = {
            name: (row as any)['Product Name'] || (row as any)['name'] || '',
            delkomCode: (row as any)['Product Number'] || (row as any)['productNumber'] || '',
            brandCompatibility: (row as any)['Brand'] || (row as any)['brand'] || '',
            stockStatus: 'in_stock',
          };

          if (!productData.name || !productData.delkomCode) {
            results.errors.push({
              row,
              error: 'Missing required fields: Product Name or Product Number'
            });
            continue;
          }

          const validatedProduct = insertProductSchema.parse(productData);
          const product = await storage.createProduct(validatedProduct);
          results.success.push(product);
        } catch (error) {
          results.errors.push({
            row,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        message: `Import completed: ${results.success.length} products added, ${results.errors.length} errors`,
        success: results.success.length,
        errors: results.errors.length,
        errorDetails: results.errors,
      });
    } catch (error) {
      console.error('Error importing products:', error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedCategory);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      console.error('Error creating category:', error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedCategory);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      console.error('Error updating category:', error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Object Storage - Product Images
  app.post("/api/products/image-upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProductImageUploadURL();
      const publicPath = objectStorageService.normalizeProductImagePath(uploadURL);
      res.json({ uploadURL, publicPath: `/public-objects/${publicPath}` });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.put("/api/products/:id/image", async (req, res) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      let imagePath = objectStorageService.normalizeProductImagePath(req.body.imageURL);
      
      if (!imagePath.startsWith("/public-objects/")) {
        imagePath = `/public-objects/${imagePath}`;
      }
      
      await storage.updateProduct(req.params.id, { imageUrl: imagePath });
      
      res.json({ imagePath });
    } catch (error) {
      console.error('Error updating product image:', error);
      res.status(500).json({ error: "Failed to update product image" });
    }
  });

  app.put("/api/products/:id/images", async (req, res) => {
    try {
      if (!req.body.imageURLs || !Array.isArray(req.body.imageURLs)) {
        return res.status(400).json({ error: "imageURLs array is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const imagePaths = req.body.imageURLs.map((imageURL: string) => {
        let imagePath = objectStorageService.normalizeProductImagePath(imageURL);
        if (!imagePath.startsWith("/public-objects/")) {
          imagePath = `/public-objects/${imagePath}`;
        }
        return imagePath;
      });
      
      await storage.updateProduct(req.params.id, { imageUrls: imagePaths });
      
      res.json({ imagePaths });
    } catch (error) {
      console.error('Error updating product images:', error);
      res.status(500).json({ error: "Failed to update product images" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    
    // Get optional width parameter for resizing (thumbnail optimization)
    const width = req.query.w ? parseInt(req.query.w as string) : null;
    const maxWidth = width ? Math.min(width, 1200) : null; // Max 1200px
    
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Check if client accepts WebP and file is an image
      const acceptsWebP = req.headers.accept?.includes('image/webp');
      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filePath);
      
      if (isImage && (acceptsWebP || maxWidth)) {
        // Convert to WebP and/or resize for better performance
        try {
          const sharp = (await import('sharp')).default;
          const chunks: Buffer[] = [];
          const stream = objectStorageService.getObjectStream(file);
          
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              let pipeline = sharp(buffer);
              
              // Resize if width specified
              if (maxWidth) {
                pipeline = pipeline.resize(maxWidth, null, { 
                  withoutEnlargement: true,
                  fit: 'inside'
                });
              }
              
              // Convert to WebP if supported
              if (acceptsWebP) {
                pipeline = pipeline.webp({ quality: 80 });
                res.set('Content-Type', 'image/webp');
              } else {
                pipeline = pipeline.jpeg({ quality: 85 });
                res.set('Content-Type', 'image/jpeg');
              }
              
              const optimizedBuffer = await pipeline.toBuffer();
              res.set('Cache-Control', 'public, max-age=31536000, immutable');
              res.send(optimizedBuffer);
            } catch (conversionError) {
              console.error('Image optimization failed, serving original:', conversionError);
              objectStorageService.downloadObject(file, res);
            }
          });
          stream.on('error', () => {
            objectStorageService.downloadObject(file, res);
          });
        } catch (sharpError) {
          console.error('Sharp import failed:', sharpError);
          objectStorageService.downloadObject(file, res);
        }
      } else {
        // Serve original with caching
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        objectStorageService.downloadObject(file, res);
      }
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Helper: find the HTML template, trying multiple paths (robust for dev + prod)
  function findTemplatePath(): string | null {
    const candidates = [
      // Production build output (esbuild compiles server to dist/index.js)
      path.resolve(import.meta.dirname, "public", "index.html"),
      // Alternative: project root dist/public
      path.resolve(process.cwd(), "dist", "public", "index.html"),
      // Development source
      path.resolve(import.meta.dirname, "..", "client", "index.html"),
      path.resolve(process.cwd(), "client", "index.html"),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }

  // SEO: SSR for /spare-parts — inject product links so Google can discover all products via link-following
  app.get("/spare-parts", async (req, res, next) => {
    try {
      const templatePath = findTemplatePath();
      if (!templatePath) return next();

      const template = await fs.promises.readFile(templatePath, "utf-8");
      const baseUrl = "https://agorarockdrill.shop";
      const brandFilter = typeof req.query.brand === 'string' ? req.query.brand : null;

      let products = await storage.getAllProducts();
      if (brandFilter) {
        products = products.filter(p =>
          p.brandCompatibility && p.brandCompatibility.toLowerCase().includes(brandFilter.toLowerCase())
        );
      }
      const validProducts = products.filter(p => p.delkomCode);

      // Build SEO title & description
      const eBrandFilter = escapeHtml(brandFilter);
      const pageTitle = brandFilter
        ? `${eBrandFilter} Spare Parts | Agora Rock Drill`
        : `Spare Parts Catalog | Atlas Copco, Sandvik, Furukawa | Agora Rock Drill`;
      const pageDescription = brandFilter
        ? `Browse ${validProducts.length}+ ${eBrandFilter} compatible spare parts. Rock drill components, drifter parts and more. Fast worldwide delivery from Agora Rock Drill, Ankara Turkey.`
        : `Browse ${validProducts.length}+ spare parts for Atlas Copco, Epiroc, Sandvik and Furukawa rock drilling equipment. Drifter parts, machine parts, OEM quality. Request a quote today.`;

      // Build HTML grid of product links — critical for Google to follow links to all product pages
      const productLinksHtml = validProducts.map(p => {
        const productUrl = `${baseUrl}/urun/${p.slug || buildProductSlug(p)}`;
        const imgSrc = p.imageUrls?.[0] || `${baseUrl}/og-image.jpg`;
        const fullImg = imgSrc.startsWith('http') ? imgSrc : `${baseUrl}${imgSrc}`;
        const brand = p.brandCompatibility ? p.brandCompatibility.split(',')[0].trim() : '';
        const epName = escapeHtml(p.name);
        const epTitle = escapeHtml(buildProductTitle(p));
        const epCode = escapeHtml(p.delkomCode);
        const epBrand = escapeHtml(brand);
        return `
          <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;">
            <a href="${escapeHtml(productUrl)}" style="text-decoration:none;color:inherit;display:block;">
              <img src="${escapeHtml(fullImg)}" alt="${epName} - ${epCode}" width="200" height="200"
                   loading="lazy" style="width:100%;height:160px;object-fit:cover;" />
              <div style="padding:12px;">
                <h2 style="font-size:14px;font-weight:600;margin:0 0 4px;color:#1a1a1a;line-height:1.3;">${epTitle}</h2>
                ${epBrand ? `<p style="font-size:12px;color:#2563eb;margin:0;">${epBrand}</p>` : ''}
              </div>
            </a>
          </div>`;
      }).join('');

      const ssrContent = `
    <div id="ssr-spare-parts" style="padding:40px 20px;max-width:1400px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;">
      <nav aria-label="Breadcrumb" style="margin-bottom:20px;font-size:14px;color:#666;">
        <a href="${baseUrl}" style="color:#2563eb;text-decoration:none;">Home</a> &rsaquo;
        ${brandFilter ? `<a href="${baseUrl}/spare-parts" style="color:#2563eb;text-decoration:none;">Spare Parts</a> &rsaquo; <span>${eBrandFilter}</span>` : '<span>Spare Parts</span>'}
      </nav>
      <h1 style="font-size:28px;font-weight:700;margin:0 0 8px;color:#1a1a1a;">
        ${brandFilter ? `${eBrandFilter} Spare Parts` : 'Rock Drill Spare Parts Catalog'}
      </h1>
      <p style="font-size:16px;color:#555;margin:0 0 32px;max-width:700px;">${pageDescription}</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;">
        ${productLinksHtml}
      </div>
      <p style="margin-top:32px;font-size:14px;color:#666;">
        Showing ${validProducts.length} products. 
        <a href="${baseUrl}/contact" style="color:#2563eb;">Contact us</a> for custom orders or bulk pricing.
      </p>
    </div>`;

      const canonicalUrl = brandFilter
        ? `${baseUrl}/spare-parts?brand=${encodeURIComponent(brandFilter)}`
        : `${baseUrl}/spare-parts`;
      const eCanonicalUrl = escapeHtml(canonicalUrl);

      // Inject meta tags + SSR content
      let html = template;
      html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${pageTitle}</title>`);
      html = html.replace(
        /<meta name="description"[^>]*>/,
        () => `<meta name="description" content="${pageDescription}" />`
      );
      html = html.replace(/<link rel="canonical"[^>]*>/, () => `<link rel="canonical" href="${eCanonicalUrl}" />`);
      html = html.replace(/<meta property="og:title"[^>]*>/, () => `<meta property="og:title" content="${pageTitle}" />`);
      html = html.replace(/<meta property="og:description"[^>]*>/, () => `<meta property="og:description" content="${pageDescription}" />`);
      html = html.replace(/<meta property="og:url"[^>]*>/, () => `<meta property="og:url" content="${eCanonicalUrl}" />`);
      html = html.replace(/(<div id="root">)/, (m) => `${m}\n${ssrContent}`);

      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error("Error generating spare-parts SSR page:", error);
      next();
    }
  });

  // SEO: Dynamic HTML for product pages (Server-Side Rendering for meta tags)
  // SEO: SEO-friendly slug URL — the primary, canonical product route
  app.get("/urun/:slug", async (req, res, next) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      let product = await storage.getProductBySlug(slug);
      if (!product) product = await storage.getProductByCode(slug);
      if (!product) return next();

      const templatePath = findTemplatePath();
      if (!templatePath) {
        console.warn("SSR template not found in any candidate path — serving SPA fallback");
        return next();
      }

      const relatedProducts = await getRelatedProducts(product);
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const dynamicHtml = generateProductHtml(template, product, relatedProducts);
      res.status(200).set({ "Content-Type": "text/html" }).end(dynamicHtml);
    } catch (error) {
      console.error("Error generating dynamic product page:", error);
      next();
    }
  });

  app.get("/brand/:brand/:code", async (req, res, next) => {
    try {
      const productCode = decodeURIComponent(req.params.code);
      const product = await storage.getProductByCode(productCode);
      if (!product) return next();

      const templatePath = findTemplatePath();
      if (!templatePath) {
        console.warn("SSR template not found in any candidate path — serving SPA fallback");
        return next();
      }

      const relatedProducts = await getRelatedProducts(product);
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const dynamicHtml = generateProductHtml(template, product, relatedProducts);
      res.status(200).set({ "Content-Type": "text/html" }).end(dynamicHtml);
    } catch (error) {
      console.error("Error generating dynamic product page:", error);
      next();
    }
  });

  // SEO: Dynamic HTML for product pages accessed by ID or product code
  app.get("/product/:idOrCode", async (req, res, next) => {
    try {
      const idOrCode = decodeURIComponent(req.params.idOrCode);
      let product = await storage.getProductByCode(idOrCode);
      if (!product) product = await storage.getProduct(idOrCode);
      if (!product) return next();

      const templatePath = findTemplatePath();
      if (!templatePath) {
        console.warn("SSR template not found in any candidate path — serving SPA fallback");
        return next();
      }

      const relatedProducts = await getRelatedProducts(product);
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const dynamicHtml = generateProductHtml(template, product, relatedProducts);
      res.status(200).set({ "Content-Type": "text/html" }).end(dynamicHtml);
    } catch (error) {
      console.error("Error generating dynamic product page:", error);
      next();
    }
  });

  // robots.txt
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /agoraadminpanel
Disallow: /api/upload
Disallow: /api/presigned-url

Sitemap: https://agorarockdrill.shop/site-sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Shared sitemap helper functions
  const sitemapCreateSlug = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-')
      .trim();
  };

  const sitemapEscapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Sitemap index - points to sub-sitemaps
  // Served at /site-sitemap.xml (primary, submitted to Google) and /sitemap.xml (standard fallback)
  app.get(["/site-sitemap.xml", "/sitemap.xml"], async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const baseUrl = "https://agorarockdrill.shop";
      const today = new Date().toISOString().split('T')[0];
      const CHUNK_SIZE = 500;
      const productChunks = Math.ceil(products.filter(p => p.delkomCode).length / CHUNK_SIZE);

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Static pages sitemap
      xml += '  <sitemap>\n';
      xml += `    <loc>${baseUrl}/sitemap-static.xml</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += '  </sitemap>\n';

      // Product sitemaps (500 per file)
      for (let i = 0; i < productChunks; i++) {
        xml += '  <sitemap>\n';
        xml += `    <loc>${baseUrl}/sitemap-products-${i + 1}.xml</loc>\n`;
        xml += `    <lastmod>${today}</lastmod>\n`;
        xml += '  </sitemap>\n';
      }

      xml += '</sitemapindex>';
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap index:', error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  // Static pages sitemap
  app.get("/sitemap-static.xml", (req, res) => {
    const baseUrl = "https://agorarockdrill.shop";
    const today = new Date().toISOString().split('T')[0];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'daily' },
      { url: '/spare-parts', priority: '0.9', changefreq: 'daily' },
      { url: '/about', priority: '0.8', changefreq: 'monthly' },
      { url: '/contact', priority: '0.8', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.5', changefreq: 'yearly' },
      { url: '/terms', priority: '0.5', changefreq: 'yearly' },
      { url: '/spare-parts?brand=Atlas%20Copco%20-%20Epiroc', priority: '0.85', changefreq: 'daily' },
      { url: '/spare-parts?brand=Sandvik', priority: '0.85', changefreq: 'daily' },
      { url: '/spare-parts?brand=Furukawa', priority: '0.85', changefreq: 'daily' },
    ];

    staticPages.forEach(page => {
      xml += '  <url>\n';
      xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  });

  // Product sitemaps - paginated at 500 per file
  app.get("/sitemap-products-:page.xml", async (req, res) => {
    try {
      const page = parseInt(req.params.page) || 1;
      const CHUNK_SIZE = 500;
      const baseUrl = "https://agorarockdrill.shop";
      const today = new Date().toISOString().split('T')[0];

      const allProducts = await storage.getAllProducts();
      const validProducts = allProducts.filter(p => p.delkomCode);
      const start = (page - 1) * CHUNK_SIZE;
      const chunk = validProducts.slice(start, start + CHUNK_SIZE);

      if (chunk.length === 0) {
        return res.status(404).send('Sitemap page not found');
      }

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

      chunk.forEach(product => {
        const slug = product.slug || buildProductSlug(product);
        const productUrl = `/urun/${slug}`;

        let lastModDate = today;
        if (product.updatedAt) {
          try {
            const dateObj = product.updatedAt instanceof Date
              ? product.updatedAt
              : new Date(product.updatedAt);
            lastModDate = dateObj.toISOString().split('T')[0];
          } catch (e) { /* use today */ }
        }

        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${productUrl}</loc>\n`;
        xml += `    <lastmod>${lastModDate}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;

        if (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
          product.imageUrls.forEach((imageUrl: string) => {
            if (imageUrl) {
              const fullImageUrl = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`;
              xml += '    <image:image>\n';
              xml += `      <image:loc>${sitemapEscapeXml(fullImageUrl)}</image:loc>\n`;
              xml += `      <image:title>${sitemapEscapeXml(product.name || 'Product Image')}</image:title>\n`;
              xml += `      <image:caption>${sitemapEscapeXml(product.name + ' - ' + (product.delkomCode || ''))}</image:caption>\n`;
              xml += '    </image:image>\n';
            }
          });
        }

        xml += '  </url>\n';
      });

      xml += '</urlset>';
      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating product sitemap:', error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  // Quote request email endpoint
  const quoteRequestSchema = z.object({
    name: z.string().min(1, "Name is required"),
    company: z.string().optional(),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional(),
    message: z.string().min(1, "Message is required"),
    productName: z.string().optional(),
    productCode: z.string().optional(),
  });

  app.post("/api/quote-request", async (req, res) => {
    try {
      const validatedData = quoteRequestSchema.parse(req.body);
      
      await sendQuoteRequestEmail(validatedData);
      
      res.json({ success: true, message: "Quote request sent successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Validation error", 
          details: error.errors 
        });
      }
      console.error('Error sending quote request email:', error);
      res.status(500).json({ error: "Failed to send quote request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
