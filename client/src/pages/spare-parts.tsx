import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";

// Custom hook to track URL search params changes
function useSearchParams() {
  const [searchParams, setSearchParams] = useState(() => new URLSearchParams(window.location.search));
  
  useEffect(() => {
    const handleUrlChange = () => {
      setSearchParams(new URLSearchParams(window.location.search));
    };
    
    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", handleUrlChange);
    
    // Create observer for pushState/replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleUrlChange();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleUrlChange();
    };
    
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, []);
  
  return searchParams;
}
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/product-card";
import RequestQuoteModal from "@/components/request-quote-modal";
import type { ProductWithCategory, Category } from "@shared/schema";

interface PaginatedResult {
  data: ProductWithCategory[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 24;

const AVAILABLE_BRANDS = [
  "Atlas Copco - Epiroc",
  "Sandvik",
  "Furukawa"
];

export default function SpareParts() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [brandFilter, setBrandFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const handleRequestQuote = () => {
    setQuoteModalOpen(true);
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use custom hook to track URL params
  const urlParams = useSearchParams();

  // Get search/brand params from URL - now properly reacts to URL changes
  useEffect(() => {
    const search = urlParams.get("search") || urlParams.get("code");
    const brand = urlParams.get("brand");
    
    if (search) {
      setSearchQuery(search);
      setDebouncedSearch(search);
    } else {
      setSearchQuery("");
      setDebouncedSearch("");
    }
    if (brand) {
      setBrandFilter(brand);
    } else {
      setBrandFilter("");
    }
    setCurrentPage(1);
  }, [urlParams]);

  // Fetch paginated products
  const { data: paginatedResult, isLoading } = useQuery<PaginatedResult>({
    queryKey: ["/api/products/paginated", debouncedSearch, brandFilter, selectedCategory, currentPage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (brandFilter) params.set("brand", brandFilter);
      if (selectedCategory) params.set("category", selectedCategory);
      params.set("page", currentPage.toString());
      params.set("limit", ITEMS_PER_PAGE.toString());
      
      const response = await fetch(`/api/products/paginated?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
    staleTime: 60000,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: 300000,
  });

  const products = paginatedResult?.data || [];
  const totalPages = paginatedResult?.totalPages || 1;
  const totalProducts = paginatedResult?.total || 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchQuery);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(prev => prev === categoryId ? "" : categoryId);
    setCurrentPage(1);
  };

  const handleBrandChange = (brand: string) => {
    setBrandFilter(prev => prev === brand ? "" : brand);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setBrandFilter("");
    setSearchQuery("");
    setDebouncedSearch("");
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div>
      <section className="industrial-gradient text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-bold mb-4">Rock Drill Spare Parts</h1>
          <p className="text-xl text-primary-foreground/90">Browse our complete catalog of high-quality spare parts</p>
        </div>
      </section>

      <section className="py-8 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <form onSubmit={handleSearch} className="flex gap-4 items-center">
            <div className="flex-1 flex gap-2">
              <Input
                type="text"
                placeholder="Search products by name or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
                data-testid="products-search-input"
              />
              <Button type="submit" data-testid="products-search-btn">
                <Search size={16} />
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="bg-card rounded-lg shadow-md p-6 border border-border sticky top-24">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  <Filter className="inline mr-2" size={20} />
                  Filters
                </h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Category</h4>
                  <div className="space-y-2">
                    {categories.length > 0 ? (
                      categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={selectedCategory === category.id}
                            onCheckedChange={() => handleCategoryChange(category.id)}
                          />
                          <label htmlFor={`category-${category.id}`} className="text-sm cursor-pointer">
                            {category.name}
                          </label>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No categories available</p>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-foreground mb-3">Brand Compatibility</h4>
                  <div className="space-y-2">
                    {AVAILABLE_BRANDS.map((brand) => (
                      <div key={brand} className="flex items-center space-x-2">
                        <Checkbox
                          id={`brand-${brand}`}
                          checked={brandFilter === brand}
                          onCheckedChange={() => handleBrandChange(brand)}
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
                  Reset Filters
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="flex justify-between items-center mb-6">
                <div className="text-muted-foreground">
                  Showing <span className="font-semibold text-foreground" data-testid="product-count">
                    {products.length}
                  </span> of <span className="font-semibold text-foreground">{totalProducts}</span> products
                  {totalPages > 1 && (
                    <span className="ml-2">(Page {currentPage} of {totalPages})</span>
                  )}
                </div>
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
              ) : products.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} onAddToCart={handleRequestQuote} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      
                      {getPageNumbers().map((page, idx) => (
                        typeof page === 'number' ? (
                          <Button 
                            key={idx}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => goToPage(page)}
                          >
                            {page}
                          </Button>
                        ) : (
                          <span key={idx} className="px-2 text-muted-foreground">...</span>
                        )
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl text-muted-foreground mb-4">
                    <Search size={64} className="mx-auto" />
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

      <RequestQuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
}
