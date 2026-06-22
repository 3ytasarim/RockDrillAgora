import { describe, it, expect, beforeAll } from "vitest";
import express, { type Express } from "express";
import request from "supertest";
import { registerRoutes } from "../server/routes";
import { storage } from "../server/storage";
import { getProductSlug } from "@shared/product-utils";
import type { ProductWithCategory } from "@shared/schema";

const UNKNOWN_CODE = "__definitely-not-a-real-product-code-zzz999__";

let app: Express;
let product: ProductWithCategory;
// Independent oracle: prefer the slug persisted in the DB over the shared
// helper, so a shared regression in slug generation can't mask a bad redirect.
let expectedLocation: string;

beforeAll(async () => {
  app = express();
  await registerRoutes(app);

  const products = await storage.getAllProducts();
  if (products.length === 0) {
    throw new Error(
      "No products in the database — cannot verify legacy product redirects."
    );
  }

  // Pick a deterministic, well-formed row: one that has both a product code
  // and a persisted slug, so the assertions exercise route behavior rather
  // than fixture gaps. Fall back to the first product if none qualify.
  product =
    products.find((p) => !!p.delkomCode && !!p.slug) ?? products[0];

  expectedLocation = `/urun/${encodeURIComponent(
    product.slug || getProductSlug(product)
  )}`;
});

describe("Legacy product URL redirects", () => {
  it("GET /product/{id} returns 301 to the canonical /urun/{slug}", async () => {
    const res = await request(app).get(
      `/product/${encodeURIComponent(product.id)}`
    );
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(expectedLocation);
  });

  it("GET /product/{code} returns 301 to the canonical /urun/{slug}", async () => {
    const code = product.delkomCode;
    expect(code, "test product must have a delkomCode").toBeTruthy();
    const res = await request(app).get(
      `/product/${encodeURIComponent(code as string)}`
    );
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(expectedLocation);
  });

  it("GET /brand/{brand}/{code} returns 301 to the canonical /urun/{slug}", async () => {
    const code = product.delkomCode;
    expect(code, "test product must have a delkomCode").toBeTruthy();
    const brand = product.brandCompatibility || "atlas-copco";
    const res = await request(app).get(
      `/brand/${encodeURIComponent(brand)}/${encodeURIComponent(code as string)}`
    );
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(expectedLocation);
  });

  it("GET /product/{code} decodes URL-encoded codes before lookup", async () => {
    // Round-trips the same code through encodeURIComponent; the handler must
    // decodeURIComponent it back to resolve the product. Asserts the
    // decode path works for the real code (which may contain spaces/slashes).
    const code = product.delkomCode as string;
    const res = await request(app).get(`/product/${encodeURIComponent(code)}`);
    expect(res.status).toBe(301);
    expect(res.headers.location).toBe(expectedLocation);
  });

  it("GET /product/{unknown} falls through to a 404 (no redirect)", async () => {
    const res = await request(app).get(`/product/${UNKNOWN_CODE}`);
    expect(res.status).toBe(404);
    expect(res.headers.location).toBeUndefined();
  });

  it("GET /brand/{brand}/{unknown} falls through to a 404 (no redirect)", async () => {
    const res = await request(app).get(`/brand/atlas-copco/${UNKNOWN_CODE}`);
    expect(res.status).toBe(404);
    expect(res.headers.location).toBeUndefined();
  });
});
