import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/product-card";
import type { ProductWithCategory, Category } from "@shared/schema";

export default function SpareParts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string[]>([]);
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("featured");

  // Get search params from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = params.get("search") || params.get("code");
    if (search) {
      setSearchQuery(search);
    }
  }, []);

  const { data: products = [], isLoading, refetch } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products", "search", searchQuery, selectedCategories, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      
      const response = await fetch(`/api/products?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const handleSearch = () => {
    refetch();
  };

  const filteredProducts = products.filter(product => {
    // Category filter
    if (selectedCategories.length > 0 && !selectedCategories.includes(product.categoryId || "")) {
      return false;
    }

    // Price filter
    if (priceRange.length > 0) {
      const price = parseFloat(product.finalPrice);
      const inRange = priceRange.some(range => {
        switch (range) {
          case "under-500":
            return price < 500;
          case "500-1000":
            return price >= 500 && price <= 1000;
          case "1000-2500":
            return price >= 1000 && price <= 2500;
          case "over-2500":
            return price > 2500;
          default:
            return true;
        }
      });
      if (!inRange) return false;
    }

    // Brand filter
    if (brandFilter.length > 0 && product.brandCompatibility) {
      const hasMatchingBrand = brandFilter.some(brand => 
        product.brandCompatibility?.toLowerCase().includes(brand.toLowerCase())
      );
      if (!hasMatchingBrand) return false;
    }

    return true;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.finalPrice) - parseFloat(b.finalPrice);
      case "price-high":
        return parseFloat(b.finalPrice) - parseFloat(a.finalPrice);
      case "newest":
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case "best-selling":
        return (b.isDiscounted ? 1 : 0) - (a.isDiscounted ? 1 : 0);
      default:
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
    }
  });

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setSelectedCategories(prev => 
      checked 
        ? [...prev, categoryId]
        : prev.filter(id => id !== categoryId)
    );
  };

  const handlePriceRangeChange = (range: string, checked: boolean) => {
    setPriceRange(prev => 
      checked 
        ? [...prev, range]
        : prev.filter(r => r !== range)
    );
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    setBrandFilter(prev => 
      checked 
        ? [...prev, brand]
        : prev.filter(b => b !== brand)
    );
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setPriceRange([]);
    setBrandFilter([]);
    setSearchQuery("");
  };

  return (
    <div>
      {/* Header */}
      <section className="industrial-gradient text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Rock Drill Spare Parts</h1>
          <p className="text-xl text-primary-foreground/90">Browse our complete catalog of high-quality spare parts</p>
        </div>
      </section>

      {/* Search Bar */}
      <section className="py-8 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="products-search-input"
              />
              <Button onClick={handleSearch} data-testid="products-search-btn">
                <Search size={16} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="md:col-span-1">
              <div className="bg-card rounded-lg shadow-md p-6 border border-border sticky top-24">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  <Filter className="inline mr-2" size={20} />
                  Filters
                </h3>
                
                {/* Category Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`category-${category.id}`}
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                        />
                        <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Price Range</h4>
                  <div className="space-y-2">
                    {[
                      { id: "under-500", label: "Under €500" },
                      { id: "500-1000", label: "€500 - €1,000" },
                      { id: "1000-2500", label: "€1,000 - €2,500" },
                      { id: "over-2500", label: "Over €2,500" }
                    ].map((range) => (
                      <div key={range.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`price-${range.id}`}
                          checked={priceRange.includes(range.id)}
                          onCheckedChange={(checked) => handlePriceRangeChange(range.id, checked as boolean)}
                        />
                        <label htmlFor={`price-${range.id}`} className="text-sm cursor-pointer">
                          {range.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Brand Compatibility</h4>
                  <div className="space-y-2">
                    {["Atlas Copco", "Epiroc", "Furukawa", "Montabert", "CAT", "Junjin"].map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={brandFilter.includes(brand)}
                          onCheckedChange={(checked) => handleBrandChange(brand, checked as boolean)}
                        />
                        <label htmlFor={`brand-${brand}`} className="text-sm cursor-pointer">
                          {brand}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={resetFilters}
                  variant="destructive"
                  className="w-full"
                  data-testid="reset-filters-btn"
                >
                  <i className="fas fa-redo mr-2"></i>Reset Filters
                </Button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <div className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground" data-testid="product-count">{sortedProducts.length}</span> products
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48" data-testid="sort-select">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="featured">Sort by: Featured</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="best-selling">Best Selling</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="grid md:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                      <div className="bg-muted h-48 rounded mb-4"></div>
                      <div className="bg-muted h-4 rounded mb-2"></div>
                      <div className="bg-muted h-4 rounded mb-4 w-2/3"></div>
                      <div className="bg-muted h-8 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : sortedProducts.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    {sortedProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination placeholder */}
                  <div className="flex justify-center items-center gap-2 mt-8">
                    <Button variant="outline" size="sm">
                      <i className="fas fa-chevron-left"></i>
                    </Button>
                    <Button size="sm">1</Button>
                    <Button variant="outline" size="sm">2</Button>
                    <Button variant="outline" size="sm">3</Button>
                    <Button variant="outline" size="sm">
                      <i className="fas fa-chevron-right"></i>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl text-muted-foreground mb-4">
                    <i className="fas fa-search"></i>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">No Products Found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your search criteria or browse all products.
                  </p>
                  <Button onClick={resetFilters} data-testid="clear-filters-btn">
                    Clear All Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
