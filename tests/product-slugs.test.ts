import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq, like, or } from "drizzle-orm";
import { storage } from "../server/storage";
import { getDb } from "../server/db";
import { products } from "@shared/schema";
import { buildProductSlug } from "@shared/product-utils";

// These tests exercise the three slug safety layers against the real database:
//   1. createProduct / updateProduct always persist a unique, non-empty slug.
//   2. backfillProductSlugs heals empty-string slugs without breaking uniqueness.
//   3. getProductBySlug resolves a product even when its stored slug is empty.
//
// Every product created here uses a recognizable code prefix so an afterAll
// sweep can delete them even if a test throws midway.
const PREFIX = `__slugtest_${Date.now()}_`;

// Track ids we create so cleanup is exact; the prefix sweep is the safety net.
const createdIds = new Set<string>();

async function makeProduct(opts: {
  code: string;
  name: string;
  brand?: string;
}) {
  const p = await storage.createProduct({
    name: opts.name,
    delkomCode: opts.code,
    brandCompatibility: opts.brand ?? null,
  } as any);
  createdIds.add(p.id);
  return p;
}

// Force a row's stored slug to '' directly, bypassing the storage layer's
// slug generation, to simulate legacy rows that predate the NOT NULL backfill.
async function forceEmptySlug(id: string) {
  await getDb().update(products).set({ slug: "" }).where(eq(products.id, id));
}

afterAll(async () => {
  const db = getDb();
  // Exact cleanup first.
  for (const id of createdIds) {
    try {
      await storage.deleteProduct(id);
    } catch {
      // ignore — covered by the sweep below
    }
  }
  // Safety-net sweep for anything left behind under our prefix.
  await db.delete(products).where(like(products.delkomCode, `${PREFIX}%`));
});

describe("buildProductSlug (pure helper)", () => {
  it("is deterministic for the same inputs", () => {
    const a = buildProductSlug("9128 7345 00", "Bushing", "Epiroc");
    const b = buildProductSlug("9128 7345 00", "Bushing", "Epiroc");
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it("embeds the code so distinct codes yield distinct slugs", () => {
    const s1 = buildProductSlug("9128 7345 00", "Bushing");
    const s2 = buildProductSlug("9106 1607 98", "Bushing");
    expect(s1).not.toBe(s2);
    expect(s1).toContain("9128");
    expect(s2).toContain("9106");
  });

  it("produces a non-empty slug even when the name is blank", () => {
    const slug = buildProductSlug("ABC-123", "");
    expect(slug.length).toBeGreaterThan(0);
  });
});

describe("createProduct slug enforcement", () => {
  it("always persists a non-empty slug matching the computed slug", async () => {
    const code = `${PREFIX}create_a`;
    const p = await makeProduct({ code, name: "Hydraulic Seal Kit" });
    expect(p.slug).toBeTruthy();
    expect(p.slug.length).toBeGreaterThan(0);
    expect(p.slug).toBe(buildProductSlug(code, "Hydraulic Seal Kit", ""));
  });

  it("appends a numeric suffix when the computed slug collides", async () => {
    // delkomCode is case-sensitive & unique in Postgres, but slugify lowercases,
    // so an upper/lower pair of codes produce the SAME base slug -> forces a
    // collision that ensureUniqueSlug must resolve.
    const base = `${PREFIX}COLLIDE`;
    const first = await makeProduct({ code: base, name: "Drifter Piston" });
    const second = await makeProduct({
      code: base.toLowerCase(),
      name: "Drifter Piston",
    });

    expect(first.slug).toBe(buildProductSlug(base, "Drifter Piston", ""));
    // Second must NOT reuse the first slug, and must be non-empty.
    expect(second.slug).not.toBe(first.slug);
    expect(second.slug.startsWith(first.slug)).toBe(true);
    expect(second.slug).toMatch(/-2$/);

    // Both slugs are genuinely unique in the table.
    const rows = await getDb()
      .select({ slug: products.slug })
      .from(products)
      .where(or(eq(products.id, first.id), eq(products.id, second.id)));
    const slugs = rows.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(2);
  });
});

describe("updateProduct slug enforcement", () => {
  it("regenerates a non-empty slug when slug inputs change", async () => {
    const code = `${PREFIX}update_a`;
    const p = await makeProduct({ code, name: "Old Name" });
    const updated = await storage.updateProduct(p.id, { name: "New Name" });
    expect(updated.slug).toBeTruthy();
    expect(updated.slug).toBe(buildProductSlug(code, "New Name", ""));
    expect(updated.slug).not.toBe(p.slug);
  });

  it("handles collisions on update without reusing another product's slug", async () => {
    const target = await makeProduct({
      code: `${PREFIX}UPDTARGET`,
      name: "Bushing",
    });
    const mover = await makeProduct({
      code: `${PREFIX}updmover`,
      name: "Sleeve",
    });

    // Rename mover so its computed slug base collides with target's code base.
    const updated = await storage.updateProduct(mover.id, {
      delkomCode: target.delkomCode.toLowerCase(),
      name: "Bushing",
    });

    expect(updated.slug).toBeTruthy();
    expect(updated.slug).not.toBe(target.slug);
    expect(updated.slug).toMatch(/-2$/);
  });

  it("keeps its own slug when updating to the same inputs (excludeId)", async () => {
    const code = `${PREFIX}update_self`;
    const p = await makeProduct({ code, name: "Self Stable" });
    const updated = await storage.updateProduct(p.id, { name: "Self Stable" });
    // ensureUniqueSlug must treat the product's own row as not-a-collision.
    expect(updated.slug).toBe(p.slug);
  });
});

describe("backfillProductSlugs", () => {
  it("heals an empty-string slug into a valid, computed slug", async () => {
    const code = `${PREFIX}backfill_a`;
    const p = await makeProduct({ code, name: "Filter Element" });
    await forceEmptySlug(p.id);

    const healed = await storage.getProduct(p.id);
    expect(healed?.slug).toBe("");

    await storage.backfillProductSlugs();

    const after = await storage.getProduct(p.id);
    expect(after?.slug).toBeTruthy();
    expect(after?.slug).toBe(buildProductSlug(code, "Filter Element", ""));
  });

  it("does not violate the unique constraint when a healed slug would collide", async () => {
    // existing keeps a real slug; empty's recomputed slug collides with it.
    const base = `${PREFIX}BFCOLLIDE`;
    const existing = await makeProduct({ code: base, name: "Valve Block" });
    const empty = await makeProduct({
      code: base.toLowerCase(),
      name: "Valve Block",
    });
    // empty already got "...-2" at create time; blank it so backfill must redo it.
    await forceEmptySlug(empty.id);

    await expect(storage.backfillProductSlugs()).resolves.toBeTypeOf("number");

    const after = await storage.getProduct(empty.id);
    expect(after?.slug).toBeTruthy();
    expect(after?.slug).not.toBe(existing.slug);
    expect(after?.slug).toMatch(/-2$/);
  });
});

describe("getProductBySlug defensive fallback", () => {
  it("resolves a product whose stored slug is empty by recomputing", async () => {
    const code = `${PREFIX}fallback_a`;
    const name = "Shock Absorber";
    const p = await makeProduct({ code, name });
    await forceEmptySlug(p.id);

    const computed = buildProductSlug(code, name, "");
    // The stored slug is now '' so the primary lookup misses; the fallback must
    // recompute slugs across products and match this one.
    const found = await storage.getProductBySlug(computed);
    expect(found).toBeDefined();
    expect(found?.id).toBe(p.id);
  });

  it("returns undefined for a slug that matches no product", async () => {
    const found = await storage.getProductBySlug(
      "__no-such-slug-zzz999__nonexistent"
    );
    expect(found).toBeUndefined();
  });
});
