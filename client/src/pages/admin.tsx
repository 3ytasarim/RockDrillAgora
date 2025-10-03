import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProductList from "@/components/admin/product-list";
import ProductForm from "@/components/admin/product-form";
import { queryClient } from "@/lib/queryClient";
import type { ProductWithCategory, Category } from "@shared/schema";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("products");

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      setLocation("/agoraadminpanel");
    }
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    setLocation("/agoraadminpanel");
  };

  const { data: products = [], isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete product');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">
              <Shield className="inline mr-2" size={32} />
              Admin Panel
            </h1>
            <p className="text-primary-foreground/90 mt-2">
              Manage products, categories, and website content
            </p>
          </div>
          <Button
            onClick={handleLogout}
            variant="secondary"
            className="flex items-center gap-2"
            data-testid="button-logout"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" data-testid="tab-products">
              <i className="fas fa-box mr-2"></i>Products
            </TabsTrigger>
            <TabsTrigger value="add-product" data-testid="tab-add-product">
              <i className="fas fa-plus mr-2"></i>Add Product
            </TabsTrigger>
            <TabsTrigger value="categories" data-testid="tab-categories">
              <i className="fas fa-folder mr-2"></i>Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Product Management</h2>
              <ProductList 
                products={products}
                isLoading={productsLoading}
                onDelete={handleDeleteProduct}
                isDeleting={deleteProductMutation.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="add-product" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">Add New Product</h2>
              <ProductForm categories={categories} />
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Category Management</h2>
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-md hover:bg-primary/90 transition-colors font-semibold">
                <i className="fas fa-plus mr-2"></i>Add Category
              </button>
            </div>

            {categoriesLoading ? (
              <div className="grid md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-muted rounded-lg p-6 animate-pulse">
                    <div className="bg-background h-12 w-12 rounded-full mb-4"></div>
                    <div className="bg-background h-4 rounded mb-2"></div>
                    <div className="bg-background h-3 rounded mb-4 w-2/3"></div>
                    <div className="bg-background h-3 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : categories.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div key={category.id} className="bg-muted rounded-lg p-6 border border-border" data-testid={`category-item-${category.id}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="bg-primary text-primary-foreground w-12 h-12 rounded-full flex items-center justify-center">
                        <i className={category.icon || "fas fa-cog"}></i>
                      </div>
                      <div className="flex gap-2">
                        <button className="text-primary hover:text-primary/80" title="Edit" data-testid={`edit-category-${category.id}`}>
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="text-destructive hover:text-destructive/80" title="Delete" data-testid={`delete-category-${category.id}`}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <h4 className="text-xl font-bold text-foreground mb-2">{category.name}</h4>
                    <p className="text-muted-foreground text-sm mb-3">{category.description || "No description"}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        <i className="fas fa-box mr-1"></i>
                        {products.filter(p => p.categoryId === category.id).length} Products
                      </span>
                      <span className="text-primary font-semibold cursor-pointer hover:underline">View Products</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl text-muted-foreground mb-4">
                  <i className="fas fa-folder-open"></i>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">No Categories Found</h3>
                <p className="text-muted-foreground">Create your first product category to get started.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
