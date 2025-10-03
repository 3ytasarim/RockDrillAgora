import { queryClient } from "./queryClient";

export const api = {
  // Products
  getProducts: async (params?: {
    search?: string;
    category?: string;
    featured?: boolean;
    discounted?: boolean;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.category) searchParams.set("category", params.category);
    if (params?.featured) searchParams.set("featured", "true");
    if (params?.discounted) searchParams.set("discounted", "true");

    const response = await fetch(`/api/products?${searchParams.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  getProduct: async (id: string) => {
    const response = await fetch(`/api/products/${id}`);
    if (!response.ok) throw new Error("Failed to fetch product");
    return response.json();
  },

  createProduct: async (product: any) => {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create product");
    }
    return response.json();
  },

  updateProduct: async (id: string, product: any) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update product");
    }
    return response.json();
  },

  deleteProduct: async (id: string) => {
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete product");
  },

  // Categories
  getCategories: async () => {
    const response = await fetch("/api/categories");
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  },

  getCategory: async (id: string) => {
    const response = await fetch(`/api/categories/${id}`);
    if (!response.ok) throw new Error("Failed to fetch category");
    return response.json();
  },

  createCategory: async (category: any) => {
    const response = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create category");
    }
    return response.json();
  },

  updateCategory: async (id: string, category: any) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update category");
    }
    return response.json();
  },

  deleteCategory: async (id: string) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete category");
  },
};

// Invalidation helpers
export const invalidateProducts = () => {
  queryClient.invalidateQueries({ queryKey: ["/api/products"] });
};

export const invalidateCategories = () => {
  queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
};
