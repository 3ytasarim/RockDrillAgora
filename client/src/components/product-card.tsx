import { ShoppingCart, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { ProductWithCategory } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithCategory;
  onAddToCart?: (productId: string) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <div className="product-card bg-card rounded-lg shadow-md overflow-hidden border border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1" data-testid={`product-card-${product.id}`}>
      <div className="relative">
        {product.isFeatured && (
          <span className="new-badge">
            Featured
          </span>
        )}
        <img 
          src={product.imageUrl || "/api/placeholder/300/300"} 
          alt={product.name} 
          className="w-full h-48 object-contain p-4 bg-white"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-foreground mb-2" data-testid={`product-name-${product.id}`}>
          {product.name}
        </h3>
        <div className="text-sm text-muted-foreground mb-3">
          <div>Product Number: <span className="font-semibold" data-testid={`product-number-${product.id}`}>{product.delkomCode}</span></div>
          <div>Ref No: <span className="font-semibold" data-testid={`ref-code-${product.id}`}>{product.referenceCode}</span></div>
          {product.brandCompatibility && (
            <div>Brand: <span className="font-semibold" data-testid={`brand-${product.id}`}>{product.brandCompatibility}</span></div>
          )}
        </div>
        <div className="space-y-2">
          <Button 
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart?.(product.id);
            }}
            data-testid={`add-to-cart-${product.id}`}
          >
            <ShoppingCart size={16} className="mr-2" />
            Request Quote
          </Button>
          <Link href={`/product/${product.id}`}>
            <Button 
              className="w-full bg-[#ed582e] hover:bg-[#d54d24] text-white font-semibold"
              data-testid={`go-to-product-${product.id}`}
            >
              <ArrowRight size={16} className="mr-2" />
              Go to Product
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
