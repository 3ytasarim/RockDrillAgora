import { describe, it, expect, beforeAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { getProductSlug } from "@shared/product-utils";
import type { ProductWithCategory } from "@shared/schema";

// Must match the baseUrl used by the SSR handler in server/routes.ts.
const BASE_URL = "https://agorarockdrill.shop";
const UNKNOWN_SLUG = "__definitely-not-a-real-product-slug-zzz999__";

let app: Express;
let product: ProductWithCategory;
// Prefer the slug persisted in the DB; fall back to the shared helper only when
// a row hasn't been backfilled. This mirrors how the SSR handler resolves it.
let slug: string;
let canonicalUrl: string;

beforeAll(async () => {
  app = express();
  await registerRoutes(app);

  const products = await storage.getAllProducts();
  if (products.length === 0) {
    throw new Error(
      "No products in the database — cannot verify product page SSR."
    );
  }

  // Pick a deterministic, well-formed row: one with both a code and a slug, so
  // the assertions exercise the real serving path rather than fixture gaps.
  product = products.find((p) => !!p.delkomCode && !!p.slug) ?? products[0];

  slug = product.slug || getProductSlug(product);
  canonicalUrl = `${BASE_URL}/urun/${slug}`;
});

describe("Product page SSR (GET /urun/:slug)", () => {
  it("serves a 200 HTML page for an existing product", async () => {
    const res = await request(app).get(`/urun/${encodeURIComponent(slug)}`);
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/text\/html/);
  });

  it("renders the canonical URL matching the sitemap slug structure", async () => {
    const res = await request(app).get(`/urun/${encodeURIComponent(slug)}`);
    expect(res.status).toBe(200);
    expect(res.text).toContain(
      `<link rel="canonical" href="${canonicalUrl}" />`
    );
  });

  it("renders a <title> containing the product name", async () => {
    const res = await request(app).get(`/urun/${encodeURIComponent(slug)}`);
    expect(res.status).toBe(200);

    const titleMatch = res.text.match(/<title>(.*?)<\/title>/);
    expect(titleMatch, "rendered HTML must contain a <title> tag").toBeTruthy();

    const titleText = titleMatch![1];
    // The SSR title embeds the product name; HTML-escape it the same way the
    // handler does so codes/names with special chars still match.
    const escapedName = escapeHtml(product.name);
    expect(titleText).toContain(escapedName);
    expect(titleText).toContain("Agora Rock Drill");
  });

  it("embeds Product JSON-LD with the matching name and canonical offer URL", async () => {
    const res = await request(app).get(`/urun/${encodeURIComponent(slug)}`);
    expect(res.status).toBe(200);

    const ldBlocks = [
      ...res.text.matchAll(
        /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g
      ),
    ].map((m) => m[1]);
    expect(
      ldBlocks.length,
      "page must contain at least one JSON-LD block"
    ).toBeGreaterThan(0);

    // safeJsonLd escapes "<" as \u003c — undo that before parsing.
    const productLd = ldBlocks
      .map((raw) => {
        try {
          return JSON.parse(raw.replace(/\\u003c/g, "<"));
        } catch {
          return null;
        }
      })
      .find((obj) => obj && obj["@type"] === "Product");

    expect(productLd, "page must contain Product JSON-LD").toBeTruthy();
    expect(productLd.name).toBe(product.name);
    expect(productLd.offers?.url).toBe(canonicalUrl);
  });

  it("returns 404 for an unknown slug (no soft-200)", async () => {
    const res = await request(app).get(
      `/urun/${encodeURIComponent(UNKNOWN_SLUG)}`
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when requested by part code instead of slug (no duplicate URL)", async () => {
    // The canonical /urun/:slug route resolves by slug ONLY. Requesting a
    // product by its part code must NOT serve a 200 page, otherwise the same
    // product would be reachable at two URLs (/urun/{slug} and /urun/{code}),
    // creating a non-canonical duplicate. Code-based access is the job of the
    // legacy /product and /brand routes, which 301-redirect to /urun/{slug}.
    const code = product.delkomCode as string;
    expect(code, "test product must have a delkomCode").toBeTruthy();
    // Guard the premise: the slug must genuinely differ from the raw code, so a
    // 404 proves code-as-slug is rejected rather than coincidentally matching.
    expect(slug).not.toBe(code);

    const res = await request(app).get(`/urun/${encodeURIComponent(code)}`);
    expect(res.status).toBe(404);
  });
});

// Mirrors escapeHtml in server/routes.ts so title assertions compare like-for-like.
function escapeHtml(text: string | null | undefined): string {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
