import { describe, it, expect, beforeAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { getCodeVariants, getProductSlug } from "@shared/product-utils";
import {
  buildSeoTitle,
  buildSeoDescription,
  buildImageAlt,
  buildImageCaption,
  getProductCodeForms,
} from "@shared/product-seo";
import type { ProductWithCategory } from "@shared/schema";

const sample = { name: "Bushing", delkomCode: "3128 3136 18", brandCompatibility: "Epiroc / Atlas Copco" };
const FORMS = ["3128 3136 18", "3128313618", "3128-3136-18"];

describe("product SEO strings carry all three code forms", () => {
  it("exposes spaced / joined / dashed forms", () => {
    expect(getProductCodeForms(sample).all).toEqual(FORMS);
  });

  it.each([
    ["title", buildSeoTitle(sample)],
    ["description", buildSeoDescription(sample)],
    ["image alt", buildImageAlt(sample)],
    ["image caption", buildImageCaption(sample)],
  ])("%s contains every written form", (_label, text) => {
    for (const form of FORMS) expect(text).toContain(form);
  });

  it("keeps the title short enough to keep brand and site name", () => {
    const t = buildSeoTitle(sample);
    expect(t.startsWith("Bushing 3128 3136 18")).toBe(true);
    expect(t.endsWith("| Agora Rock Drill")).toBe(true);
  });

  it("falls back to the single raw code for non-numeric part numbers", () => {
    const odd = { name: "Seal Kit", delkomCode: "ABC-12/X", brandCompatibility: "Furukawa" };
    expect(getCodeVariants(odd.delkomCode, odd.brandCompatibility)).toBeNull();
    expect(getProductCodeForms(odd).all).toEqual(["ABC-12/X"]);
    expect(buildSeoTitle(odd)).toContain("ABC-12/X");
  });
});

describe("SSR product page + infrastructure", () => {
  let app: Express;
  let product: ProductWithCategory;
  let slug: string;

  beforeAll(async () => {
    app = express();
    await registerRoutes(app);
    const products = await storage.getAllProducts();
    product =
      products.find((p) => !!p.delkomCode && !!p.slug && !!getCodeVariants(p.delkomCode, p.brandCompatibility || "") && p.imageUrls?.length) ??
      products[0];
    slug = product.slug || getProductSlug(product);
  });

  it("puts every code form in title, description, image alt, caption and JSON-LD", async () => {
    const res = await request(app).get(`/urun/${encodeURIComponent(slug)}`);
    expect(res.status).toBe(200);
    const forms = getProductCodeForms(product).all;
    const title = res.text.match(/<title>(.*?)<\/title>/)![1];
    const desc = res.text.match(/<meta name="description" content="(.*?)" \/>/)![1];
    const imgAlt = res.text.match(/<figure[^>]*>\s*<img[^>]*alt="(.*?)"/)![1];
    const caption = res.text.match(/<figcaption[^>]*>(.*?)<\/figcaption>/)![1];
    const ld = JSON.parse(
      res.text.match(/<script type="application\/ld\+json">(\{"@context":"https:\/\/schema.org","@type":"Product".*?)<\/script>/)![1].replace(/\\u003c/g, "<"),
    );
    for (const f of forms) {
      for (const [label, text] of [["title", title], ["description", desc], ["alt", imgAlt], ["caption", caption]] as const) {
        expect(text, `${label} should contain ${f}`).toContain(f);
      }
    }
    if (forms.length > 1) expect(ld.alternateName).toEqual(forms);
    expect(Array.isArray(ld.image)).toBe(true);
    expect(res.text).toContain('fetchpriority="high"');
  });

  it("renders the crawlable site header and footer", async () => {
    const res = await request(app).get(`/urun/${encodeURIComponent(slug)}`);
    expect(res.text).toContain('id="ssr-site-header"');
    expect(res.text).toContain('id="ssr-site-footer"');
    expect(res.text).toContain('href="/spare-parts/sandvik"');
  });

  it("serves 410 Gone for the removed parts-index pages", async () => {
    for (const p of ["/parts-index", "/parts-index/2.html", "/sitemap-parts-index.xml"]) {
      const res = await request(app).get(p);
      expect(res.status, p).toBe(410);
    }
  });

  it("catalogue pages ship BreadcrumbList and CollectionPage JSON-LD plus an h2", async () => {
    const res = await request(app).get("/spare-parts/sandvik");
    expect(res.status).toBe(200);
    expect(res.text).toContain('"@type":"BreadcrumbList"');
    expect(res.text).toContain('"@type":"CollectionPage"');
    expect(res.text).toMatch(/<h2[^>]*>.*part numbers<\/h2>/);
  });
});
