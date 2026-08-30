import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Helmet } from "react-helmet";
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { BRANDS, brandBySlug } from "@shared/catalog";
import NotFound from "@/pages/not-found";

const SITE = "https://agorarockdrill.shop";

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

const ITEMS_PER_PAGE = 48; // must match CATALOG_PAGE_SIZE in server/routes.ts

const AVAILABLE_BRANDS = [
  "Atlas Copco - Epiroc",
  "Sandvik",
  "Furukawa"
];

export default function SpareParts() {
  const params = useParams();
  const brandDef = params.brandSlug ? brandBySlug(params.brandSlug) : undefined;
  const unknownBrand = !!params.brandSlug && !brandDef;
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

  // Get search/brand/page params from URL - reacts to URL changes
  useEffect(() => {
    const search = urlParams.get("search") || urlParams.get("code");
    const brand = urlParams.get("brand");
    const pageParam = parseInt(urlParams.get("page") || "1") || 1;

    if (search) {
      setSearchQuery(search);
      setDebouncedSearch(search);
    } else {
      setSearchQuery("");
      setDebouncedSearch("");
    }
    // Brand comes from the clean /spare-parts/<slug> route when present,
    // otherwise from a legacy ?brand= query param.
    setBrandFilter(brandDef ? brandDef.name : brand || "");
    setCurrentPage(Math.max(1, pageParam));
  }, [urlParams, brandDef]);

  // Keep ?page= in the URL so pagination is shareable / crawlable.
  useEffect(() => {
    const base = brandDef ? `/spare-parts/${brandDef.slug}` : "/spare-parts";
    const qs = new URLSearchParams(window.location.search);
    if (currentPage > 1) qs.set("page", String(currentPage));
    else qs.delete("page");
    const next = qs.toString() ? `${base}?${qs}` : base;
    if (next !== window.location.pathname + window.location.search) {
      window.history.replaceState(null, "", next);
    }
  }, [currentPage, brandDef]);

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

  const canonicalPath = brandDef
    ? `/spare-parts/${brandDef.slug}${currentPage > 1 ? `?page=${currentPage}` : ""}`
    : `/spare-parts${currentPage > 1 ? `?page=${currentPage}` : ""}`;
  const pageSuffix = currentPage > 1 ? ` – Page ${currentPage}` : "";
  const metaTitle = brandDef
    ? `${brandDef.label} Spare Parts${pageSuffix} | Agora Rock Drill`
    : `Rock Drill Spare Parts Catalogue${pageSuffix} | Agora Rock Drill`;
  const metaDesc = brandDef
    ? `Spare parts compatible with ${brandDef.label} rock drilling equipment, listed by OEM part number. Request a quote from Agora Rock Drill.`
    : `Full catalogue of rock drill spare parts for Atlas Copco / Epiroc, Sandvik and Furukawa equipment, listed by OEM part number.`;
  const h1 = brandDef ? `${brandDef.label} Spare Parts` : "Rock Drill Spare Parts";
  const blurb = brandDef ? brandDef.blurb : "Browse our complete catalogue of rock drill spare parts, listed by OEM part number.";

  if (unknownBrand) return <NotFound />;

  return (
    <div>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`${SITE}${canonicalPath}`} />
        <meta name="robots" content="index, follow" />
        {currentPage > 1 && <link rel="prev" href={`${SITE}${(brandDef ? `/spare-parts/${brandDef.slug}` : "/spare-parts")}${currentPage - 1 > 1 ? `?page=${currentPage - 1}` : ""}`} />}
        {currentPage < totalPages && <link rel="next" href={`${SITE}${(brandDef ? `/spare-parts/${brandDef.slug}` : "/spare-parts")}?page=${currentPage + 1}`} />}
      </Helmet>
      <section className="industrial-gradient text-primary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4">
          <nav aria-label="Breadcrumb" className="text-sm text-primary-foreground/80 mb-3">
            <a href="/" className="hover:underline">Home</a>
            {brandDef && <> <span>›</span> <a href="/spare-parts" className="hover:underline">Spare Parts</a></>}
            <span> › </span>
            <span>{brandDef ? brandDef.label : "Spare Parts"}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{h1}</h1>
          <p className="text-lg text-primary-foreground/90 max-w-3xl">{blurb}</p>
          {!brandDef && (
            <div className="flex flex-wrap gap-3 mt-5">
              {BRANDS.map((b) => (
                <a key={b.slug} href={`/spare-parts/${b.slug}`} className="bg-white/10 hover:bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium transition-colors">
                  {b.label} parts
                </a>
              ))}
            </div>
          )}
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
