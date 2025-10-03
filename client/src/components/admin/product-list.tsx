import { useState } from "react";
import { Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ProductWithCategory } from "@shared/schema";

interface ProductListProps {
  products: ProductWithCategory[];
  isLoading: boolean;
  onDelete: (productId: string) => void;
  isDeleting: boolean;
}

export default function ProductList({ products, isLoading, onDelete, isDeleting }: ProductListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.delkomCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.brandCompatibility && product.brandCompatibility.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="bg-muted h-16 w-16 rounded"></div>
              <div className="flex-1">
                <div className="bg-muted h-4 rounded mb-2"></div>
                <div className="bg-muted h-3 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="admin-search-input"
          />
        </div>
      </div>

      {filteredProducts.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-foreground font-semibold">Image</th>
                <th className="px-4 py-3 text-left text-foreground font-semibold">Product Name</th>
                <th className="px-4 py-3 text-left text-foreground font-semibold">Product Number</th>
                <th className="px-4 py-3 text-left text-foreground font-semibold">Brand</th>
                <th className="px-4 py-3 text-left text-foreground font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/50" data-testid={`product-row-${product.id}`}>
                  <td className="px-4 py-3">
                    <img 
                      src={product.imageUrl || "/api/placeholder/64/64"} 
                      alt={product.name}
                      className="w-16 h-16 object-contain rounded"
                      loading="lazy"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-foreground">{product.name}</div>
                    {product.category && (
                      <div className="text-sm text-muted-foreground">{product.category.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono">{product.delkomCode}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {product.brandCompatibility || <span className="text-muted-foreground/50">-</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-primary hover:text-primary/80"
                        data-testid={`edit-product-${product.id}`}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => onDelete(product.id)}
                        disabled={isDeleting}
                        data-testid={`delete-product-${product.id}`}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-6xl text-muted-foreground mb-4">
            <i className="fas fa-box-open"></i>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-2">No Products Found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? "Try adjusting your search criteria." : "Add your first product to get started."}
          </p>
        </div>
      )}
    </div>
  );
}
