import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  icon: text("icon").notNull().default("fas fa-cog"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  delkomCode: text("delkom_code").notNull().unique(),
  slug: text("slug").notNull().unique(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }).notNull(),
  discountPercentage: integer("discount_percentage").default(0),
  finalPrice: decimal("final_price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  imageUrls: text("image_urls").array(),
  categoryId: varchar("category_id").references(() => categories.id),
  brandCompatibility: text("brand_compatibility"),
  stockStatus: text("stock_status").notNull().default("in_stock"),
  isFeatured: boolean("is_featured").default(false),
  isDiscounted: boolean("is_discounted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  slug: true,
  createdAt: true,
  updatedAt: true,
  finalPrice: true,
  originalPrice: true,
  discountPercentage: true,
  isDiscounted: true,
});

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type ProductWithCategory = Product & { category: Category | null };
