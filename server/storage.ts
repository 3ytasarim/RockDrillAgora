import { products, categories, type Product, type InsertProduct, type Category, type InsertCategory, type ProductWithCategory } from "@shared/schema";
import { db } from "./db";
import { eq, like, or, desc, asc } from "drizzle-orm";

export interface IStorage {
  // Products
  getProduct(id: string): Promise<ProductWithCategory | undefined>;
  getProductByCode(code: string): Promise<ProductWithCategory | undefined>;
  getAllProducts(): Promise<ProductWithCategory[]>;
  searchProducts(query: string): Promise<ProductWithCategory[]>;
  getProductsByCategory(categoryId: string): Promise<ProductWithCategory[]>;
  getFeaturedProducts(): Promise<ProductWithCategory[]>;
  getDiscountedProducts(): Promise<ProductWithCategory[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  
  // Categories
  getCategory(id: string): Promise<Category | undefined>;
  getAllCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProduct(id: string): Promise<ProductWithCategory | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.id, id));
    
    if (!product) return undefined;
    
    return {
      ...product.products,
      category: product.categories,
    };
  }

  async getProductByCode(code: string): Promise<ProductWithCategory | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.delkomCode, code));
    
    if (!product) return undefined;
    
    return {
      ...product.products,
      category: product.categories,
    };
  }

  async getAllProducts(): Promise<ProductWithCategory[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async searchProducts(query: string): Promise<ProductWithCategory[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        or(
          like(products.name, `%${query}%`),
          like(products.delkomCode, `%${query}%`)
        )
      )
      .orderBy(desc(products.createdAt));
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async getProductsByCategory(categoryId: string): Promise<ProductWithCategory[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.categoryId, categoryId))
      .orderBy(desc(products.createdAt));
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async getFeaturedProducts(): Promise<ProductWithCategory[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isFeatured, true))
      .orderBy(desc(products.createdAt))
      .limit(8);
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async getDiscountedProducts(): Promise<ProductWithCategory[]> {
    const results = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isDiscounted, true))
      .orderBy(desc(products.discountPercentage))
      .limit(8);
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values({
        ...product,
        originalPrice: "0.00",
        finalPrice: "0.00",
        discountPercentage: 0,
        isDiscounted: false,
      })
      .returning();
    
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({
        ...product,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await db.delete(products).where(eq(products.id, id));
  }

  // Categories
  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const productsInCategory = await db
      .select()
      .from(products)
      .where(eq(products.categoryId, id));
    
    if (productsInCategory.length > 0) {
      throw new Error(
        `Cannot delete category. It has ${productsInCategory.length} product(s) assigned to it. Please reassign or delete the products first.`
      );
    }
    
    await db.delete(categories).where(eq(categories.id, id));
  }
}

export const storage = new DatabaseStorage();
