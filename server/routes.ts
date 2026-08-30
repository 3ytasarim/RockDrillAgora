import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";
import { buildProductTitle, getCodeVariants, getProductSlug } from "@shared/product-utils";
import { STATIC_SITEMAP_PAGES } from "@shared/sitemap-pages";
import { getCompatibleMachines, getCompatibleMachinesIntro, getTechnicalSpecs, getProductDescription } from "@shared/product-content";
import { BRANDS, brandBySlug, brandForProduct, pickRelated, pickBrandShowcase } from "@shared/catalog";
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

// getCompatibleMachines is imported from @shared/product-content above.

// Helper function to generate dynamic HTML with SEO meta tags
function generateProductHtml(
  templateHtml: string,
  product: {
    name: string;
    slug?: string | null;
    description?: string | null;
    delkomCode?: string | null;
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
    slug?: string | null;
    delkomCode?: string | null;
    brandCompatibility?: string | null;
    imageUrls?: string[] | null;
  }> = []
): string {
  const baseUrl = "https://agorarockdrill.shop";
  const brands = product.brandCompatibility || '';
  const code = product.delkomCode || '';
  const primaryBrand = brands ? brands.split(',')[0].trim() : '';
  const brandDef = brandForProduct(product);

  // --- Combined display title (Brand – Name – spaced – joined – dashed) ---
  const displayTitle = buildProductTitle({ brand: brands, name: product.name, code });

  // --- Unique SEO <title> (keeps brand/site suffix for search snippets) ---
  const title = `${product.name}${code ? ` ${code}` : ''}${primaryBrand ? ` | ${primaryBrand}` : ''} spare part | Agora Rock Drill`;

  // --- Visible one-line summary (shown under the H1) — clean, never truncated ---
  const brandPart = primaryBrand ? ` compatible with ${primaryBrand}` : '';
  const summary = `${product.name}${code ? `, OEM part number ${code}` : ''}${brandPart} rock drilling equipment. Contact Agora Rock Drill for price, stock and delivery time.`;

  // --- Meta description: the real product description if we have one, else the summary ---
  let description: string;
  if (product.description && product.description.trim().length > 40) {
    const d = product.description.trim().replace(/\s+/g, ' ');
    description = d.length > 158 ? d.slice(0, 155).replace(/\s+\S*$/, '') + '…' : d;
  } else {
    description = summary.length > 158 ? summary.slice(0, 155).replace(/\s+\S*$/, '') + '…' : summary;
  }

  // --- Escaped variants for safe HTML insertion (raw versions kept for JSON-LD) ---
  const eName = escapeHtml(product.name);
  const eCode = escapeHtml(code);
  const eBrands = escapeHtml(brands);
  const ePrimaryBrand = escapeHtml(primaryBrand);
  const eTitle = escapeHtml(title);
  const eDescription = escapeHtml(description);
  const eSummary = escapeHtml(summary);

  // --- Image ---
  const productImage = product.imageUrls?.[0] || product.imageUrl || `${baseUrl}/og-image.jpg`;
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${baseUrl}${productImage}`;
  const eFullImageUrl = escapeHtml(fullImageUrl);

  // --- Canonical URL (SEO-friendly /urun/ slug) ---
  const productSlug = getProductSlug({
    slug: product.slug,
    delkomCode: code,
    name: product.name,
    brandCompatibility: brands,
  });
  const canonicalUrl = `${baseUrl}/urun/${productSlug}`;

  // --- Part number: show ONE human-readable form (spaced if numeric, else raw).
  //     Search-friendly variants live in the backend search, not stacked in the UI. ---
  const codeVariants = getCodeVariants(code, brands);
  const displayCode = codeVariants ? codeVariants.spaced : code;
  const codeVariantsHtml = '';

  // --- JSON-LD: Product schema ---
  // description mirrors the visible "Product Description" section verbatim.
  const jsonLdDescription = getProductDescription(product).join(' ');
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": jsonLdDescription,
    "sku": code,
    "mpn": code,
    "image": fullImageUrl,
    "brand": { "@type": "Brand", "name": primaryBrand || "Agora Rock Drill" },
    "manufacturer": { "@type": "Organization", "name": "Agora Rock Drill" },
    "category": product.category?.name || "Rock Drill Spare Parts",
    // Quote-based B2B: no public price. Expose availability + seller only,
    // so structured data matches the visible page (no fake "price": 0).
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "availability": product.stockStatus === 'out_of_stock'
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      "priceSpecification": {
        "@type": "PriceSpecification",
        "priceCurrency": "USD",
        "valueAddedTaxIncluded": false
      },
      "seller": { "@type": "Organization", "name": "Agora Rock Drill" }
    }
  };

  // --- JSON-LD: BreadcrumbList (mirrors the visible breadcrumb nav) ---
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": baseUrl },
      { "@type": "ListItem", "position": 2, "name": "Spare Parts", "item": `${baseUrl}/spare-parts` },
      ...(brandDef ? [{ "@type": "ListItem", "position": 3, "name": brandDef.label, "item": `${baseUrl}/spare-parts/${brandDef.slug}` }] : []),
      { "@type": "ListItem", "position": brandDef ? 4 : 3, "name": product.name, "item": canonicalUrl }
    ]
  };

  // --- SSR body content (factual only — no spun text, no fabricated specs) ---
  const stockLabel = product.stockStatus === 'out_of_stock' ? 'Currently out of stock' : 'In Stock';
  const categoryName = escapeHtml(product.category?.name || '');
  const categoryLabel = product.category?.name || 'Rock Drill Spare Part';

  // --- Compatible Machines (brand-level equipment families) ---
  const compatibleMachines = getCompatibleMachines(brands);
  const compatibleMachinesHtml = `
      <div style="margin-top:40px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Compatible Machines</h2>
        <p style="color:#4a5568;line-height:1.7;margin:0 0 12px;">
          ${escapeHtml(getCompatibleMachinesIntro(product))}
        </p>
        <ul style="color:#4a5568;line-height:1.8;margin:0;padding-left:20px;">
          ${compatibleMachines.map(m => `<li>${escapeHtml(m)}</li>`).join('')}
        </ul>
      </div>`;

  // --- Technical Specifications ---
  const specRows = getTechnicalSpecs(product);
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

  // --- Product Description (one short factual paragraph) ---
  const descParas = getProductDescription(product);
  const descriptionHtml = `
      <div style="margin-top:48px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 16px;color:#1a1a1a;">Product Description</h2>
        ${descParas.map((p, i) => `<p style="color:#4a5568;line-height:1.8;${i < descParas.length - 1 ? 'margin-bottom:16px;' : ''}">${escapeHtml(p)}</p>`).join('\n        ')}
      </div>`;

  // --- Related products HTML (same category) — internal links boost SEO crawling ---
  const relatedProductsHtml = relatedProducts.length > 0
    ? `
      <div style="margin-top:48px;padding-top:32px;border-top:1px solid #e2e8f0;">
        <h2 style="font-size:24px;font-weight:700;margin:0 0 24px;color:#1a1a1a;">Related Products</h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;">
          ${relatedProducts.map(rp => {
            const rpCode = rp.delkomCode || '';
            const rpSlug = getProductSlug({ slug: rp.slug, delkomCode: rpCode, name: rp.name, brandCompatibility: rp.brandCompatibility || '' });
            const rpUrl = `${baseUrl}/urun/${rpSlug}`;
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
        ${brandDef ? `<a href="${baseUrl}/spare-parts/${brandDef.slug}" style="color:#2563eb;text-decoration:none;">${escapeHtml(brandDef.label)}</a> &rsaquo;` : ''}
        <span>${eName}</span>
      </nav>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:start;">
        <div>
          <img src="${eFullImageUrl}" alt="${eName} - ${eCode} spare part" width="500" height="500"
               style="width:100%;max-width:500px;height:auto;border-radius:8px;box-shadow:0 4px 6px rgba(0,0,0,.1);" />
        </div>
        <div>
          <h1 style="font-size:32px;font-weight:700;margin:0 0 12px;color:#1a1a1a;">${escapeHtml(displayTitle)}</h1>
          <p style="font-size:18px;color:#4a5568;margin-bottom:20px;line-height:1.6;">${eSummary}</p>

          <div style="background:#f7fafc;padding:20px;border-radius:8px;margin-bottom:20px;">
            <h2 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#2d3748;">OEM Part Number</h2>
            <p style="margin:0 0 4px;font-family:monospace;font-size:17px;font-weight:700;color:#1a1a1a;">${escapeHtml(displayCode) || 'N/A'}</p>
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

      ${relatedProductsHtml}

      <div style="margin-top:40px;text-align:center;">
        <a href="${baseUrl}${brandDef ? `/spare-parts/${brandDef.slug}` : '/spare-parts'}" style="display:inline-block;background:#f1f5f9;color:#1a1a1a;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:12px;">
          &larr; View all ${escapeHtml(brandDef?.label || 'spare')} parts
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
    () => `<script type="application/ld+json">${safeJsonLd(productJsonLd)}</script>\n<script type="application/ld+json">${safeJsonLd(breadcrumbJsonLd)}</script>\n</head>`
  );
  
  // Add SSR content inside <div id="root"> - React will hydrate over this
  html = html.replace(
    '<div id="root"></div>',
    () => `<div id="root">${ssrContent}</div>`
  );
  
  return html;
}

// Related products for SSR internal linking + the /api/products/:id/related
// endpoint the client uses. Deterministic per product (see pickRelated):
// same brand/category, has image + slug, prefers same name-family, stable order.
async function getRelatedProducts(product: {
  id?: string;
  name?: string;
  categoryId?: string | null;
  delkomCode?: string | null;
}, count = 6): Promise<Array<{ id: string; name: string; slug?: string | null; delkomCode?: string | null; brandCompatibility?: string | null; imageUrls?: string[] | null }>> {
  try {
    if (!product.categoryId || !product.id) return [];
    const sameCategory = await storage.getProductsByCategory(product.categoryId);
    return pickRelated(sameCategory as any, product as any, count).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      delkomCode: p.delkomCode,
      brandCompatibility: p.brandCompatibility,
      imageUrls: p.imageUrls,
    }));
  } catch (err) {
    console.error("Error fetching related products:", err);
    return [];
  }
}

const BASE_URL = "https://agorarockdrill.shop";

// Replace the head SEO tags in the template. All values pre-escaped by caller.
function injectSeo(
  template: string,
  o: { title: string; description: string; canonical: string; ogType?: string; robots?: string; prev?: string; next?: string; jsonLd?: string }
): string {
  let html = template;
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${o.title}</title>`);
  html = html.replace(/<meta name="title" content="[^"]*" \/>/, () => `<meta name="title" content="${o.title}" />`);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, () => `<meta name="description" content="${o.description}" />`);
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, () => `<link rel="canonical" href="${o.canonical}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, () => `<meta property="og:title" content="${o.title}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, () => `<meta property="og:description" content="${o.description}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, () => `<meta property="og:url" content="${o.canonical}" />`);
  html = html.replace(/<meta property="og:type" content="[^"]*" \/>/, () => `<meta property="og:type" content="${o.ogType || "website"}" />`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*" \/>/, () => `<meta name="twitter:title" content="${o.title}" />`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*" \/>/, () => `<meta name="twitter:description" content="${o.description}" />`);
  if (o.robots) {
    // replace the template's default robots meta rather than adding a second one
    html = html.replace(/<meta name="robots" content="[^"]*" \/>/, () => `<meta name="robots" content="${o.robots}" />`);
  }
  const headExtra =
    (o.prev ? `<link rel="prev" href="${o.prev}" />\n` : "") +
    (o.next ? `<link rel="next" href="${o.next}" />\n` : "") +
    (o.jsonLd ? `<script type="application/ld+json">${o.jsonLd}</script>\n` : "");
  if (headExtra) html = html.replace("</head>", () => `${headExtra}</head>`);
  return html;
}

// One product card as a crawlable <a href>. Used by every SSR catalogue grid.
function productCardHtml(p: { name: string; slug?: string | null; delkomCode?: string | null; brandCompatibility?: string | null; imageUrls?: string[] | null }): string {
  const url = `${BASE_URL}/urun/${getProductSlug(p)}`;
  const img = p.imageUrls?.[0];
  const fullImg = img ? (img.startsWith("http") ? img : `${BASE_URL}${img}`) : "";
  const title = escapeHtml(buildProductTitle(p));
  const alt = escapeHtml(`${p.name}${p.delkomCode ? ` – ${p.delkomCode}` : ""}`);
  return `
    <li style="list-style:none;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;">
      <a href="${escapeHtml(url)}" style="text-decoration:none;color:inherit;display:block;">
        ${fullImg
          ? `<img src="${escapeHtml(fullImg)}" alt="${alt}" width="300" height="220" loading="lazy" style="width:100%;height:180px;object-fit:contain;background:#fff;padding:8px;" />`
          : `<div style="width:100%;height:180px;background:#f1f5f9;"></div>`}
        <div style="padding:12px;">
          <h3 style="font-size:14px;font-weight:600;margin:0;color:#1a1a1a;line-height:1.35;">${title}</h3>
        </div>
      </a>
    </li>`;
}

function catalogGridHtml(products: Array<any>): string {
  return `<ul style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;margin:0;padding:0;">${products.map(productCardHtml).join("")}</ul>`;
}

// Crawlable numbered pagination with rel prev/next anchors.
function paginationHtml(basePath: string, page: number, totalPages: number): string {
  if (totalPages <= 1) return "";
  const url = (n: number) => `${BASE_URL}${basePath}${n > 1 ? `${basePath.includes("?") ? "&" : "?"}page=${n}` : ""}`;
  const links: string[] = [];
  if (page > 1) links.push(`<a rel="prev" href="${escapeHtml(url(page - 1))}" style="padding:8px 14px;border:1px solid #cbd5e1;border-radius:6px;color:#1a1a1a;text-decoration:none;">&larr; Previous</a>`);
  const win = 3;
  for (let n = 1; n <= totalPages; n++) {
    if (n === 1 || n === totalPages || (n >= page - win && n <= page + win)) {
      links.push(
        n === page
          ? `<span style="padding:8px 14px;border:1px solid #1a1a1a;border-radius:6px;font-weight:700;">${n}</span>`
          : `<a href="${escapeHtml(url(n))}" style="padding:8px 14px;border:1px solid #cbd5e1;border-radius:6px;color:#1a1a1a;text-decoration:none;">${n}</a>`
      );
    } else if (links[links.length - 1] !== "…") {
      links.push("…");
    }
  }
  if (page < totalPages) links.push(`<a rel="next" href="${escapeHtml(url(page + 1))}" style="padding:8px 14px;border:1px solid #cbd5e1;border-radius:6px;color:#1a1a1a;text-decoration:none;">Next &rarr;</a>`);
  return `<nav aria-label="Pagination" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:40px 0 8px;">${links
    .map((l) => (l === "…" ? `<span style="padding:8px 6px;color:#94a3b8;">…</span>` : l))
    .join("")}</nav>`;
}

const CATALOG_PAGE_SIZE = 48;

export async function registerRoutes(app: Express): Promise<Server> {
  // Static product images (rsynced onto the server, not object storage).
  // Folder lives at the project root; resolve it for both dev (server/) and prod (dist/).
  const productImageDir = [
    path.resolve(import.meta.dirname, "..", "product-images"),
    path.resolve(process.cwd(), "product-images"),
  ].find((p) => fs.existsSync(p)) || path.resolve(process.cwd(), "product-images");
  app.use(
    "/product-images",
    express.static(productImageDir, {
      immutable: true,
      maxAge: "365d",
      fallthrough: false,
    })
  );

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

  // Homepage brand showcase — same deterministic picks the SSR renders.
  app.get("/api/home-showcase", async (_req, res) => {
    try {
      const all = await storage.getAllProducts();
      const out: Record<string, any[]> = {};
      for (const brand of BRANDS) out[brand.slug] = pickBrandShowcase(all as any, brand, 8);
      res.set("Cache-Control", "public, max-age=300");
      res.json(out);
    } catch (error) {
      console.error("Error building home showcase:", error);
      res.status(500).json({ error: "Failed to build showcase" });
    }
  });

  // Related products for a detail page — same set the SSR renders (deterministic).
  app.get("/api/products/:id/related", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) return res.status(404).json({ error: "Product not found" });
      const related = await getRelatedProducts(product, 6);
      const full = await Promise.all(related.map((r) => storage.getProduct(r.id)));
      res.set("Cache-Control", "public, max-age=300");
      res.json(full.filter(Boolean));
    } catch (error) {
      console.error("Error fetching related products:", error);
      res.status(500).json({ error: "Failed to fetch related products" });
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

  // Shared: render a paginated catalogue page (used by /spare-parts and /spare-parts/:brand)
  function renderCatalogSSR(template: string, opts: {
    title: string; description: string; canonicalPath: string; basePath: string;
    h1: string; blurb: string; breadcrumbHtml: string;
    pageProducts: any[]; totalCount: number; page: number; totalPages: number;
  }): string {
    const canonical = `${BASE_URL}${opts.canonicalPath}`;
    const prev = opts.page > 1 ? `${BASE_URL}${opts.basePath}${opts.page - 1 > 1 ? `${opts.basePath.includes("?") ? "&" : "?"}page=${opts.page - 1}` : ""}` : undefined;
    const next = opts.page < opts.totalPages ? `${BASE_URL}${opts.basePath}${opts.basePath.includes("?") ? "&" : "?"}page=${opts.page + 1}` : undefined;
    const ssr = `
    <div id="ssr-catalog" style="padding:40px 20px;max-width:1280px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;">
      <nav aria-label="Breadcrumb" style="margin-bottom:20px;font-size:14px;color:#666;">${opts.breadcrumbHtml}</nav>
      <h1 style="font-size:28px;font-weight:700;margin:0 0 10px;color:#1a1a1a;">${escapeHtml(opts.h1)}</h1>
      <p style="font-size:16px;color:#555;margin:0 0 8px;max-width:760px;line-height:1.6;">${escapeHtml(opts.blurb)}</p>
      <p style="font-size:14px;color:#888;margin:0 0 28px;">${opts.totalCount} parts${opts.totalPages > 1 ? ` · page ${opts.page} of ${opts.totalPages}` : ""}</p>
      ${catalogGridHtml(opts.pageProducts)}
      ${paginationHtml(opts.basePath, opts.page, opts.totalPages)}
    </div>`;
    let html = injectSeo(template, {
      title: escapeHtml(opts.title),
      description: escapeHtml(opts.description),
      canonical: escapeHtml(canonical),
      ogType: "website",
      prev: prev && escapeHtml(prev),
      next: next && escapeHtml(next),
    });
    html = html.replace(/(<div id="root">)/, (m) => `${m}\n${ssr}`);
    return html;
  }

  // SEO: /spare-parts — full catalogue, server-paginated, crawlable.
  //   ?brand=<name>  -> 301 to the clean /spare-parts/<slug> landing page.
  app.get("/spare-parts", async (req, res, next) => {
    try {
      // Legacy ?brand= filter -> 301 to clean brand landing URL
      const brandParam = typeof req.query.brand === "string" ? req.query.brand : "";
      if (brandParam) {
        const b = BRANDS.find((x) => x.match(brandParam) || x.slug === brandParam.toLowerCase().replace(/[^a-z]+/g, "-"));
        if (b) return res.redirect(301, brandParam ? `/spare-parts/${b.slug}` : "/spare-parts");
      }

      const templatePath = findTemplatePath();
      if (!templatePath) return next();
      const template = await fs.promises.readFile(templatePath, "utf-8");

      const all = (await storage.getAllProducts()).filter((p) => p.delkomCode);
      const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
      const totalPages = Math.max(1, Math.ceil(all.length / CATALOG_PAGE_SIZE));
      const pageProducts = all.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);
      if (pageProducts.length === 0 && page > 1) return next();

      const suffix = page > 1 ? ` – Page ${page}` : "";
      const html = renderCatalogSSR(template, {
        title: `Rock Drill Spare Parts Catalogue${suffix} | Agora Rock Drill`,
        description: `Full catalogue of ${all.length} rock drill spare parts for Atlas Copco / Epiroc, Sandvik and Furukawa equipment, listed by OEM part number. Request a quote.`,
        canonicalPath: page > 1 ? `/spare-parts?page=${page}` : `/spare-parts`,
        basePath: `/spare-parts`,
        h1: "Rock Drill Spare Parts Catalogue",
        blurb: "Every part is listed by its OEM part number so you can match it to your machine. Browse by brand or search by part number.",
        breadcrumbHtml: `<a href="${BASE_URL}" style="color:#2563eb;text-decoration:none;">Home</a> &rsaquo; <span>Spare Parts</span>`,
        pageProducts, totalCount: all.length, page, totalPages,
      });
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error("Error generating /spare-parts SSR:", error);
      next();
    }
  });

  // SEO: /spare-parts/<brand> — clean, crawlable brand catalogue landing pages.
  app.get("/spare-parts/:brandSlug", async (req, res, next) => {
    try {
      const brand = brandBySlug(req.params.brandSlug);
      const templatePath = findTemplatePath();
      if (!templatePath) return next();
      const template = await fs.promises.readFile(templatePath, "utf-8");

      // Unknown brand slug -> real 404 (no soft-200 catalogue clone).
      if (!brand) {
        const html404 = injectSeo(template, {
          title: "Page not found | Agora Rock Drill",
          description: "The page you requested does not exist.",
          canonical: `${BASE_URL}${req.originalUrl}`,
          robots: "noindex, follow",
        });
        return res.status(404).set({ "Content-Type": "text/html" }).end(html404);
      }


      const all = (await storage.getAllProducts()).filter((p) => p.delkomCode && brand.match(p.brandCompatibility || ""));
      const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
      const totalPages = Math.max(1, Math.ceil(all.length / CATALOG_PAGE_SIZE));
      const pageProducts = all.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE);
      if (pageProducts.length === 0 && page > 1) return next();

      const suffix = page > 1 ? ` – Page ${page}` : "";
      const html = renderCatalogSSR(template, {
        title: `${brand.label} Spare Parts${suffix} | Agora Rock Drill`,
        description: `${all.length} spare parts compatible with ${brand.label} rock drilling equipment, listed by OEM part number. Request a quote from Agora Rock Drill.`,
        canonicalPath: page > 1 ? `/spare-parts/${brand.slug}?page=${page}` : `/spare-parts/${brand.slug}`,
        basePath: `/spare-parts/${brand.slug}`,
        h1: `${brand.label} Spare Parts`,
        blurb: brand.blurb,
        breadcrumbHtml: `<a href="${BASE_URL}" style="color:#2563eb;text-decoration:none;">Home</a> &rsaquo; <a href="${BASE_URL}/spare-parts" style="color:#2563eb;text-decoration:none;">Spare Parts</a> &rsaquo; <span>${escapeHtml(brand.label)}</span>`,
        pageProducts, totalCount: all.length, page, totalPages,
      });
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error("Error generating brand catalogue SSR:", error);
      next();
    }
  });

  // SEO: "/" — inject real, crawlable product links (per brand) into the first HTML.
  app.get("/", async (req, res, next) => {
    try {
      const templatePath = findTemplatePath();
      if (!templatePath) return next();
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const all = await storage.getAllProducts();

      const sections = BRANDS.map((brand) => {
        const picks = pickBrandShowcase(all as any, brand, 8);
        if (picks.length === 0) return "";
        return `
      <section style="margin:0 0 48px;">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;margin:0 0 16px;">
          <h2 style="font-size:22px;font-weight:700;margin:0;color:#1a1a1a;">${escapeHtml(brand.label)} Spare Parts</h2>
          <a href="${BASE_URL}/spare-parts/${brand.slug}" style="color:#2563eb;text-decoration:none;font-weight:600;white-space:nowrap;">View all ${escapeHtml(brand.label)} parts &rarr;</a>
        </div>
        ${catalogGridHtml(picks)}
      </section>`;
      }).join("");

      const ssr = `
    <div id="ssr-home" style="padding:40px 20px;max-width:1280px;margin:0 auto;font-family:system-ui,-apple-system,sans-serif;">
      <h1 style="font-size:26px;font-weight:700;margin:0 0 8px;color:#1a1a1a;">Rock Drill Spare Parts — Atlas Copco / Epiroc, Sandvik, Furukawa</h1>
      <p style="font-size:16px;color:#555;margin:0 0 32px;max-width:760px;line-height:1.6;">Agora Rock Drill supplies replacement spare parts for hydraulic rock drills and drilling rigs, listed by OEM part number. Browse a selection below or open the full catalogue.</p>
      ${sections}
      <p style="margin-top:8px;"><a href="${BASE_URL}/spare-parts" style="color:#2563eb;text-decoration:none;font-weight:600;">Browse the full spare parts catalogue &rarr;</a></p>
    </div>`;

      let html = injectSeo(template, {
        title: escapeHtml("Agora Rock Drill — Rock Drill Spare Parts (Atlas Copco / Epiroc, Sandvik, Furukawa)"),
        description: escapeHtml("Replacement spare parts for Atlas Copco / Epiroc, Sandvik and Furukawa hydraulic rock drills and drill rigs, listed by OEM part number. Request a quote from Agora Rock Drill."),
        canonical: `${BASE_URL}/`,
        ogType: "website",
      });
      html = html.replace(/(<div id="root">)/, (m) => `${m}\n${ssr}`);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (error) {
      console.error("Error generating home SSR:", error);
      next();
    }
  });

  // SEO: Dynamic HTML for product pages (Server-Side Rendering for meta tags)
  // SEO-friendly slug URL — the primary, canonical product route.
  // Code-based lookups are handled by the legacy /product/:idOrCode and
  // /brand/:brand/:code routes, which 301-redirect to this canonical slug URL.
  app.get("/urun/:slug", async (req, res, next) => {
    try {
      const slug = decodeURIComponent(req.params.slug);
      const product = await storage.getProductBySlug(slug);
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
      console.error("Error generating dynamic product page (slug):", error);
      next();
    }
  });

  // SEO: Legacy product URL — 301 redirect to the canonical /urun/{slug}
  app.get("/brand/:brand/:code", async (req, res, next) => {
    try {
      const productCode = decodeURIComponent(req.params.code);
      const product = await storage.getProductByCode(productCode);
      if (!product) return next();

      res.redirect(301, `/urun/${encodeURIComponent(getProductSlug(product))}`);
    } catch (error) {
      console.error("Error redirecting legacy product page:", error);
      next();
    }
  });

  // SEO: Legacy product URL (by ID or product code) — 301 redirect to /urun/{slug}
  app.get("/product/:idOrCode", async (req, res, next) => {
    try {
      const idOrCode = decodeURIComponent(req.params.idOrCode);
      let product = await storage.getProductByCode(idOrCode);
      if (!product) product = await storage.getProduct(idOrCode);
      if (!product) return next();

      res.redirect(301, `/urun/${encodeURIComponent(getProductSlug(product))}`);
    } catch (error) {
      console.error("Error redirecting legacy product page:", error);
      next();
    }
  });

  // robots.txt
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /agoraadminpanel
Disallow: /api/

Sitemap: https://agorarockdrill.shop/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Shared sitemap helper functions
  const sitemapEscapeXml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const isoDay = (d: unknown): string | null => {
    if (!d) return null;
    try {
      const dt = d instanceof Date ? d : new Date(d as string);
      return isNaN(dt.getTime()) ? null : dt.toISOString().split("T")[0];
    } catch { return null; }
  };

  // Sitemap index. No fake freshness: product-sitemap lastmod = newest real
  // product updated_at; static sitemap carries no lastmod.
  app.get(["/sitemap.xml", "/site-sitemap.xml"], async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const baseUrl = "https://agorarockdrill.shop";
      const CHUNK_SIZE = 500;
      const valid = products.filter((p) => p.delkomCode);
      const productChunks = Math.max(1, Math.ceil(valid.length / CHUNK_SIZE));
      const newest = valid
        .map((p) => isoDay(p.updatedAt))
        .filter(Boolean)
        .sort()
        .pop();

      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
      xml += `  <sitemap><loc>${baseUrl}/sitemap-static.xml</loc></sitemap>\n`;
      for (let i = 0; i < productChunks; i++) {
        xml += `  <sitemap><loc>${baseUrl}/sitemap-products-${i + 1}.xml</loc>${newest ? `<lastmod>${newest}</lastmod>` : ""}</sitemap>\n`;
      }
      xml += "</sitemapindex>";
      res.header("Content-Type", "application/xml").send(xml);
    } catch (error) {
      console.error("Error generating sitemap index:", error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  // Static pages + brand catalogue landing pages. No changefreq/priority/lastmod.
  app.get("/sitemap-static.xml", (req, res) => {
    const baseUrl = "https://agorarockdrill.shop";
    const urls = [
      ...STATIC_SITEMAP_PAGES.map((p) => p.url),
      "/spare-parts",
      ...BRANDS.map((b) => `/spare-parts/${b.slug}`),
    ];
    const seen = new Set<string>();
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    for (const u of urls) {
      if (seen.has(u)) continue;
      seen.add(u);
      xml += `  <url><loc>${baseUrl}${u}</loc></url>\n`;
    }
    xml += "</urlset>";
    res.header("Content-Type", "application/xml").send(xml);
  });

  // Product sitemaps - paginated at 500 per file.
  // lastmod ONLY from real updated_at; no changefreq/priority.
  app.get("/sitemap-products-:page.xml", async (req, res) => {
    try {
      const page = parseInt(req.params.page) || 1;
      const CHUNK_SIZE = 500;
      const baseUrl = "https://agorarockdrill.shop";

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
        const productUrl = `/urun/${getProductSlug(product)}`;
        const lastMod = isoDay(product.updatedAt);

        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${productUrl}</loc>\n`;
        if (lastMod) xml += `    <lastmod>${lastMod}</lastmod>\n`;

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
