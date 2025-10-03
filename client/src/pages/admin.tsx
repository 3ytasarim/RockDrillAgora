import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, LogOut, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import ProductList from "@/components/admin/product-list";
import ProductForm from "@/components/admin/product-form";
import BulkImport from "@/components/admin/bulk-import";
import { queryClient } from "@/lib/queryClient";
import type { ProductWithCategory, Category } from "@shared/schema";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Icon is required"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

export default function Admin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("products");
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const categoryForm = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "fas fa-cog",
    },
  });

  useEffect(() => {
    const isAuthenticated = localStorage.getItem("adminAuthenticated");
    if (isAuthenticated !== "true") {
      setLocation("/agoraadminpanel");
    }
  }, [setLocation]);

  useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({
        name: editingCategory.name,
        description: editingCategory.description || "",
        icon: editingCategory.icon || "fas fa-cog",
      });
    } else {
      categoryForm.reset({
        name: "",
        description: "",
        icon: "fas fa-cog",
      });
    }
  }, [editingCategory, categoryForm]);

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
      toast({
        title: "Success",
        description: "Product deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteProduct = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };

  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setActiveTab("add-product");
  };

  const handleEditComplete = () => {
    setEditingProduct(null);
    setActiveTab("products");
  };

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create category");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category created successfully!",
      });
      categoryForm.reset();
      setCategoryDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CategoryFormData }) => {
      const response = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update category");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      toast({
        title: "Success",
        description: "Category updated successfully!",
      });
      categoryForm.reset();
      setEditingCategory(null);
      setCategoryDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete category');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({
        title: "Success",
        description: "Category deleted successfully!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCategorySubmit = (data: CategoryFormData) => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, data });
    } else {
      createCategoryMutation.mutate(data);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryDialogOpen(true);
  };

  const handleDeleteCategory = (categoryId: string) => {
    if (confirm('Are you sure you want to delete this category?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    categoryForm.reset();
    setCategoryDialogOpen(true);
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="products" data-testid="tab-products">
              <i className="fas fa-box mr-2"></i>Products
            </TabsTrigger>
            <TabsTrigger value="add-product" data-testid="tab-add-product">
              <i className="fas fa-plus mr-2"></i>Add Product
            </TabsTrigger>
            <TabsTrigger value="bulk-import" data-testid="tab-bulk-import">
              <i className="fas fa-file-excel mr-2"></i>Bulk Import
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
                onEdit={handleEditProduct}
                isDeleting={deleteProductMutation.isPending}
              />
            </div>
          </TabsContent>

          <TabsContent value="add-product" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>
              <ProductForm 
                categories={categories} 
                editProduct={editingProduct}
                onEditComplete={handleEditComplete}
              />
            </div>
          </TabsContent>

          <TabsContent value="bulk-import" className="space-y-6">
            <BulkImport />
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-foreground">Category Management</h2>
              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                    onClick={handleAddCategory}
                    data-testid="button-add-category"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                  </DialogHeader>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit(handleCategorySubmit)} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Pistons" {...field} data-testid="input-category-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter category description..." 
                                rows={3}
                                {...field} 
                                data-testid="input-category-description" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="icon"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon (Font Awesome Class) *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., fas fa-cog" {...field} data-testid="input-category-icon" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="submit"
                          disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          data-testid="button-save-category"
                        >
                          {(createCategoryMutation.isPending || updateCategoryMutation.isPending)
                            ? "Saving..."
                            : editingCategory
                            ? "Update Category"
                            : "Add Category"}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setCategoryDialogOpen(false);
                            setEditingCategory(null);
                            categoryForm.reset();
                          }}
                          data-testid="button-cancel-category"
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
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
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="text-primary hover:text-primary/80" 
                          title="Edit" 
                          data-testid={`edit-category-${category.id}`}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          disabled={deleteCategoryMutation.isPending}
                          className="text-destructive hover:text-destructive/80 disabled:opacity-50" 
                          title="Delete" 
                          data-testid={`delete-category-${category.id}`}
                        >
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
