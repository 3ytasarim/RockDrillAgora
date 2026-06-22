import { products, categories, type Product, type InsertProduct, type Category, type InsertCategory, type ProductWithCategory } from "@shared/schema";
import { getDb } from "./db";
import { eq, like, or, desc, asc, sql, ilike } from "drizzle-orm";
import { buildProductSlug } from "@shared/product-utils";

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProductFilters {
  search?: string;
  brand?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}

export interface IStorage {
  // Products
  getProduct(id: string): Promise<ProductWithCategory | undefined>;
  getProductByCode(code: string): Promise<ProductWithCategory | undefined>;
  getProductBySlug(slug: string): Promise<ProductWithCategory | undefined>;
  getAllProducts(): Promise<ProductWithCategory[]>;
  getProductsPaginated(filters: ProductFilters): Promise<PaginatedResult<ProductWithCategory>>;
  searchProducts(query: string): Promise<ProductWithCategory[]>;
  getProductsByCategory(categoryId: string): Promise<ProductWithCategory[]>;
  getFeaturedProducts(limit?: number): Promise<ProductWithCategory[]>;
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
  private get db() {
    return getDb();
  }

  // Products
  async getProduct(id: string): Promise<ProductWithCategory | undefined> {
    const [product] = await this.db
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
    // First try exact match
    let [product] = await this.db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.delkomCode, code));
    
    // If not found, try matching by removing all spaces from both sides
    if (!product) {
      const allProducts = await this.db
        .select()
        .from(products)
        .leftJoin(categories, eq(products.categoryId, categories.id));
      
      // Compare codes with spaces removed
      const normalizedInputCode = code.replace(/\s+/g, '');
      const matchedProduct = allProducts.find(p => 
        p.products.delkomCode.replace(/\s+/g, '') === normalizedInputCode
      );
      
      if (matchedProduct) {
        product = matchedProduct;
      }
    }
    
    if (!product) return undefined;
    
    return {
      ...product.products,
      category: product.categories,
    };
  }

  async getProductBySlug(slug: string): Promise<ProductWithCategory | undefined> {
    const [product] = await this.db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.slug, slug));

    if (!product) return undefined;

    return {
      ...product.products,
      category: product.categories,
    };
  }

  async getAllProducts(): Promise<ProductWithCategory[]> {
    const results = await this.db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .orderBy(desc(products.createdAt));
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async getProductsPaginated(filters: ProductFilters): Promise<PaginatedResult<ProductWithCategory>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 24, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Build where conditions
    const conditions: any[] = [];
    
    if (filters.search) {
      conditions.push(
        or(
          ilike(products.name, `%${filters.search}%`),
          ilike(products.delkomCode, `%${filters.search}%`)
        )
      );
    }
    
    if (filters.brand) {
      conditions.push(ilike(products.brandCompatibility, `%${filters.brand}%`));
    }
    
    if (filters.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }

    // Get total count
    const countQuery = this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products);
    
    if (conditions.length > 0) {
      const whereClause = conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions.slice(1).reduce((acc, c) => sql`${acc} AND ${c}`, sql`TRUE`)}`;
      // For count, we need to apply conditions differently
    }
    
    // Simple approach: apply conditions one by one
    let baseQuery = this.db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
    
    // Apply filters using raw SQL for flexibility
    let whereSQL = sql`TRUE`;
    if (filters.search) {
      whereSQL = sql`${whereSQL} AND (${products.name} ILIKE ${`%${filters.search}%`} OR ${products.delkomCode} ILIKE ${`%${filters.search}%`})`;
    }
    if (filters.brand) {
      whereSQL = sql`${whereSQL} AND ${products.brandCompatibility} ILIKE ${`%${filters.brand}%`}`;
    }
    if (filters.categoryId) {
      whereSQL = sql`${whereSQL} AND ${products.categoryId} = ${filters.categoryId}`;
    }

    // Get total count with filters
    const [countResult] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .where(whereSQL);
    
    const total = countResult?.count || 0;

    // Brand priority ordering: Atlas Copco/Epiroc first, Sandvik second, Furukawa last
    const brandPriority = sql`CASE 
      WHEN ${products.brandCompatibility} ILIKE '%Atlas Copco%' OR ${products.brandCompatibility} ILIKE '%Epiroc%' THEN 1
      WHEN ${products.brandCompatibility} ILIKE '%Sandvik%' THEN 2
      WHEN ${products.brandCompatibility} ILIKE '%Furukawa%' THEN 3
      ELSE 4
    END`;

    // Get paginated results
    const results = await this.db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(whereSQL)
      .orderBy(asc(brandPriority), desc(products.isFeatured), desc(products.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: results.map(result => ({
        ...result.products,
        category: result.categories,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async searchProducts(query: string): Promise<ProductWithCategory[]> {
    const results = await this.db
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
    const results = await this.db
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

  async getFeaturedProducts(limit: number = 12): Promise<ProductWithCategory[]> {
    const results = await this.db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(eq(products.isFeatured, true))
      .orderBy(desc(products.createdAt))
      .limit(limit);
    
    return results.map(result => ({
      ...result.products,
      category: result.categories,
    }));
  }

  async getDiscountedProducts(): Promise<ProductWithCategory[]> {
    const results = await this.db
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

  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    const safeBase = baseSlug || "urun";
    let candidate = safeBase;
    let suffix = 2;
    // Loop until we find a slug not used by another product.
    while (true) {
      const [existing] = await this.db
        .select({ id: products.id })
        .from(products)
        .where(eq(products.slug, candidate));
      if (!existing || existing.id === excludeId) return candidate;
      candidate = `${safeBase}-${suffix}`;
      suffix += 1;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const slug = await this.ensureUniqueSlug(buildProductSlug(product));
    const [newProduct] = await this.db
      .insert(products)
      .values({
        ...product,
        slug,
        originalPrice: "0.00",
        finalPrice: "0.00",
        discountPercentage: 0,
        isDiscounted: false,
      })
      .returning();
    
    return newProduct;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product> {
    const [existing] = await this.db.select().from(products).where(eq(products.id, id));
    const merged = { ...existing, ...product };
    const slug = await this.ensureUniqueSlug(buildProductSlug(merged), id);

    const [updatedProduct] = await this.db
      .update(products)
      .set({
        ...product,
        slug,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning();
    
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // Categories
  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await this.db.select().from(categories).where(eq(categories.id, id));
    return category || undefined;
  }

  async getAllCategories(): Promise<Category[]> {
    return await this.db.select().from(categories).orderBy(asc(categories.name));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await this.db
      .insert(categories)
      .values(category)
      .returning();
    
    return newCategory;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await this.db
      .update(categories)
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    const productsInCategory = await this.db
      .select()
      .from(products)
      .where(eq(products.categoryId, id));
    
    if (productsInCategory.length > 0) {
      throw new Error(
        `Cannot delete category. It has ${productsInCategory.length} product(s) assigned to it. Please reassign or delete the products first.`
      );
    }
    
    await this.db.delete(categories).where(eq(categories.id, id));
  }
}

export const storage = new DatabaseStorage();
