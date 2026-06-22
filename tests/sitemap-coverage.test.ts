import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { like } from "drizzle-orm";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { getDb } from "../server/db";
import { products } from "@shared/schema";
import { getProductSlug } from "@shared/product-utils";
import { STATIC_SITEMAP_PAGES } from "@shared/sitemap-pages";
import type { ProductWithCategory } from "@shared/schema";

// These tests verify the sitemap actually exposes EVERY indexable product to
// search engines, using the real Express routes + real storage (same pattern as
// tests/legacy-redirects.test.ts). A silent regression that drops products from
// the paginated product sitemaps would let them fall out of Google's index.

const CHUNK_SIZE = 500; // must match the route's pagination size
const BASE_URL = "https://agorarockdrill.shop";

let app: Express;
let allProducts: ProductWithCategory[];
// The sitemap only lists products that have a delkomCode (the route filters on
// it), so that's the canonical indexable set we hold the sitemap accountable to.
let indexableProducts: ProductWithCategory[];

// Pull every <loc> value out of a sitemap/urlset XML document.
function extractLocs(xml: string): string[] {
  const locs: string[] = [];
  // Image entries also use <image:loc>; the negative-lookbehind-free approach:
  // match <loc> tags only (image locs are <image:loc>, so requiring '<loc>'
  // exactly excludes them).
  const re = /<loc>([^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    locs.push(m[1]);
  }
  return locs;
}

// Turn a full sitemap URL into the request path supertest can hit locally.
function toPath(fullUrl: string): string {
  return fullUrl.replace(BASE_URL, "");
}

beforeAll(async () => {
  app = express();
  await registerRoutes(app);

  allProducts = await storage.getAllProducts();
  if (allProducts.length === 0) {
    throw new Error(
      "No products in the database — cannot verify sitemap coverage."
    );
  }
  indexableProducts = allProducts.filter((p) => !!p.delkomCode);
  if (indexableProducts.length === 0) {
    throw new Error(
      "No products with a delkomCode — sitemap would be empty, nothing to verify."
    );
  }
});

describe("Sitemap index", () => {
  it("links one product sitemap per 500 indexable products", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("xml");

    const productSitemaps = extractLocs(res.text).filter((loc) =>
      /\/sitemap-products-\d+\.xml$/.test(loc)
    );

    const expectedChunks = Math.ceil(indexableProducts.length / CHUNK_SIZE);
    expect(productSitemaps.length).toBe(expectedChunks);
  });

  it("is also served at /site-sitemap.xml (the Google-submitted alias)", async () => {
    const res = await request(app).get("/site-sitemap.xml");
    expect(res.status).toBe(200);
    expect(res.text).toContain("/sitemap-products-1.xml");
  });
});

describe("robots.txt", () => {
  // robots.txt is the entry point crawlers read first: it must point them at the
  // sitemap (so the Task #6 sitemap work is actually discoverable) and keep them
  // out of the admin panel. A regression here could de-index the site or expose
  // /agoraadminpanel to crawlers, so we pin both behaviours down.
  const SITEMAP_URL = `${BASE_URL}/site-sitemap.xml`;

  it("returns 200 with plain-text content", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/plain");
  });

  it("points crawlers at the sitemap", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.text).toContain(`Sitemap: ${SITEMAP_URL}`);
  });

  it("disallows the admin panel", async () => {
    const res = await request(app).get("/robots.txt");
    expect(res.text).toMatch(/^Disallow:\s*\/agoraadminpanel\s*$/m);
  });
});

describe("Static sitemap (/sitemap-static.xml)", () => {
  // The static sitemap is the only path search engines have to the most
  // important non-product pages (home, spare-parts, about, contact, privacy,
  // terms) and the three brand-filter landing pages. A regression that drops
  // one of these — or mangles its loc/changefreq/priority shape — would
  // silently de-index a high-value page, so we pin the whole set down here.
  // Derived from the single shared source of truth so the test can never drift
  // from the real /sitemap-static.xml page list.
  const EXPECTED_STATIC = STATIC_SITEMAP_PAGES.map((p) => p.url);

  it("returns 200 with XML content", async () => {
    const res = await request(app).get("/sitemap-static.xml");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("xml");
    expect(res.text).toContain("<urlset");
  });

  it("lists exactly the expected set of static URLs", async () => {
    const res = await request(app).get("/sitemap-static.xml");
    const actual = new Set(extractLocs(res.text).map(toPath));
    const expected = new Set(EXPECTED_STATIC);
    expect(actual).toEqual(expected);
  });

  it("references the static sitemap from the sitemap index", async () => {
    const res = await request(app).get("/sitemap.xml");
    expect(res.status).toBe(200);
    expect(extractLocs(res.text).map(toPath)).toContain("/sitemap-static.xml");
  });

  it("gives every <url> a well-formed loc, changefreq and priority", async () => {
    const res = await request(app).get("/sitemap-static.xml");

    // Pull each <url>...</url> block so we can assert the children travel
    // together (a stray loc without a changefreq/priority would be invalid).
    const blocks = res.text.match(/<url>[\s\S]*?<\/url>/g) ?? [];
    expect(blocks.length).toBe(EXPECTED_STATIC.length);

    const validChangefreq = new Set([
      "always",
      "hourly",
      "daily",
      "weekly",
      "monthly",
      "yearly",
      "never",
    ]);

    for (const block of blocks) {
      const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1];
      const changefreq = block.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1];
      const priority = block.match(/<priority>([^<]+)<\/priority>/)?.[1];

      // loc must be the absolute https URL on the canonical host.
      expect(loc, `missing loc in block: ${block}`).toBeDefined();
      expect(loc!).toMatch(
        /^https:\/\/agorarockdrill\.shop(\/|\/[^\s<>]*)$/
      );

      // changefreq must be one of the sitemap-spec values.
      expect(
        changefreq && validChangefreq.has(changefreq),
        `bad changefreq "${changefreq}" in block: ${block}`
      ).toBe(true);

      // priority must be a number in [0.0, 1.0].
      expect(priority, `missing priority in block: ${block}`).toBeDefined();
      const p = Number(priority);
      expect(Number.isNaN(p), `non-numeric priority "${priority}"`).toBe(false);
      expect(p).toBeGreaterThanOrEqual(0.0);
      expect(p).toBeLessThanOrEqual(1.0);
    }
  });
});

describe("Product sitemap coverage", () => {
  it("lists exactly one URL per indexable product across all pages", async () => {
    const index = await request(app).get("/sitemap.xml");
    const productSitemaps = extractLocs(index.text)
      .filter((loc) => /\/sitemap-products-\d+\.xml$/.test(loc))
      .map(toPath);

    const allUrls: string[] = [];
    for (const path of productSitemaps) {
      const res = await request(app).get(path);
      expect(res.status, `expected 200 for ${path}`).toBe(200);
      const urls = extractLocs(res.text).filter((loc) =>
        loc.includes("/urun/")
      );
      allUrls.push(...urls);
    }

    // Total URL count must equal the indexable product count: no product is
    // dropped, none is duplicated across pages.
    expect(allUrls.length).toBe(indexableProducts.length);
    expect(new Set(allUrls).size).toBe(indexableProducts.length);
  });

  it("uses the canonical /urun/{slug} form for every product URL", async () => {
    const index = await request(app).get("/sitemap.xml");
    const productSitemaps = extractLocs(index.text)
      .filter((loc) => /\/sitemap-products-\d+\.xml$/.test(loc))
      .map(toPath);

    const allUrls: string[] = [];
    for (const path of productSitemaps) {
      const res = await request(app).get(path);
      const urls = extractLocs(res.text).filter((loc) =>
        loc.includes("/urun/")
      );
      allUrls.push(...urls);
    }

    // Independent oracle: the set of URLs the sitemap SHOULD contain, built
    // straight from storage. This catches both missing and extra products and
    // confirms each loc is the canonical absolute /urun/{slug} URL.
    const expected = new Set(
      indexableProducts.map(
        (p) => `${BASE_URL}/urun/${encodeURIComponent(getProductSlug(p))}`
      )
    );
    const actual = new Set(allUrls);
    expect(actual).toEqual(expected);

    // Every URL is the canonical absolute form (URL-encoded path, no spaces).
    const canonical = /^https:\/\/agorarockdrill\.shop\/urun\/[^\s<>]+$/;
    for (const url of allUrls) {
      expect(url, `non-canonical sitemap URL: ${url}`).toMatch(canonical);
      expect(url).toBe(encodeURI(url)); // already URL-encoded
    }
  });
});

describe("Product sitemap pagination boundary", () => {
  it("fills every page except the last to exactly the chunk size", async () => {
    const expectedChunks = Math.ceil(indexableProducts.length / CHUNK_SIZE);

    for (let page = 1; page <= expectedChunks; page++) {
      const res = await request(app).get(`/sitemap-products-${page}.xml`);
      expect(res.status).toBe(200);
      const count = extractLocs(res.text).filter((loc) =>
        loc.includes("/urun/")
      ).length;

      if (page < expectedChunks) {
        expect(count, `page ${page} should be full`).toBe(CHUNK_SIZE);
      } else {
        const remainder =
          indexableProducts.length - (expectedChunks - 1) * CHUNK_SIZE;
        expect(count, "last page holds the remainder").toBe(remainder);
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThanOrEqual(CHUNK_SIZE);
      }
    }
  });

  it("returns 404 for a product sitemap page past the last one", async () => {
    const expectedChunks = Math.ceil(indexableProducts.length / CHUNK_SIZE);
    const res = await request(app).get(
      `/sitemap-products-${expectedChunks + 1}.xml`
    );
    expect(res.status).toBe(404);
  });
});

// The live DB has far fewer than 500 products, so the single-file path above
// never exercises the actual 500-per-file split. Here we seed past the boundary
// so a real second page exists, then clean up. Runs last so it doesn't perturb
// the count-based assertions above (which cached their counts in beforeAll).
describe("Product sitemap pagination — real 500-URL split", () => {
  const SEED_PREFIX = `__sitemaptest_${Date.now()}_`;
  let baselineIndexable = 0;
  let totalIndexable = 0;

  beforeAll(async () => {
    const before = await storage.getAllProducts();
    baselineIndexable = before.filter((p) => !!p.delkomCode).length;

    // Seed just enough so the indexable total lands a few past CHUNK_SIZE,
    // guaranteeing exactly two pages: a full first page + a small remainder.
    const target = CHUNK_SIZE + 5;
    const toInsert = Math.max(0, target - baselineIndexable);

    const rows = Array.from({ length: toInsert }, (_, i) => {
      const tag = `${SEED_PREFIX}${i}`;
      return {
        name: `Sitemap Seed Part ${i}`,
        delkomCode: tag,
        slug: tag, // already URL-safe; satisfies NOT NULL + unique
        originalPrice: "100.00",
        finalPrice: "100.00",
      };
    });

    const db = getDb();
    // Batch inserts to stay well under any parameter limits.
    for (let i = 0; i < rows.length; i += 200) {
      await db.insert(products).values(rows.slice(i, i + 200));
    }

    const after = await storage.getAllProducts();
    totalIndexable = after.filter((p) => !!p.delkomCode).length;
  });

  afterAll(async () => {
    await getDb()
      .delete(products)
      .where(like(products.delkomCode, `${SEED_PREFIX}%`));
  });

  it("splits into a full first page and a remainder second page", async () => {
    expect(totalIndexable).toBeGreaterThan(CHUNK_SIZE);
    const expectedChunks = Math.ceil(totalIndexable / CHUNK_SIZE);
    expect(expectedChunks).toBeGreaterThanOrEqual(2);

    const page1 = await request(app).get("/sitemap-products-1.xml");
    expect(page1.status).toBe(200);
    const page1Count = extractLocs(page1.text).filter((loc) =>
      loc.includes("/urun/")
    ).length;
    expect(page1Count).toBe(CHUNK_SIZE);

    const page2 = await request(app).get("/sitemap-products-2.xml");
    expect(page2.status).toBe(200);
    const page2Count = extractLocs(page2.text).filter((loc) =>
      loc.includes("/urun/")
    ).length;
    expect(page2Count).toBe(totalIndexable - CHUNK_SIZE);

    // No product is dropped or duplicated at the page boundary.
    expect(page1Count + page2Count).toBe(totalIndexable);
  });

  it("lists every seeded product exactly once across all pages", async () => {
    const index = await request(app).get("/sitemap.xml");
    const productSitemaps = extractLocs(index.text)
      .filter((loc) => /\/sitemap-products-\d+\.xml$/.test(loc))
      .map(toPath);

    const allUrls: string[] = [];
    for (const path of productSitemaps) {
      const res = await request(app).get(path);
      const urls = extractLocs(res.text).filter((loc) =>
        loc.includes("/urun/")
      );
      allUrls.push(...urls);
    }

    expect(allUrls.length).toBe(totalIndexable);
    expect(new Set(allUrls).size).toBe(totalIndexable);

    // Every seeded slug shows up exactly once.
    for (let i = 0; i < totalIndexable - baselineIndexable; i++) {
      const url = `${BASE_URL}/urun/${SEED_PREFIX}${i}`;
      expect(allUrls.includes(url), `missing seeded URL ${url}`).toBe(true);
    }
  });
});
