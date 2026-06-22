import { useState, useEffect, useRef } from "react";
import { Search, Package, Hash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { ProductWithCategory } from "@shared/schema";
import { buildProductSlug } from "@shared/product-utils";
import { Link } from "wouter";

interface SearchBarProps {
  onSearch: (query: string, code: string) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const codeDropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const { data: allProducts = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
    enabled: searchQuery.length > 0 || searchCode.length > 0,
  });

  const filteredProducts = allProducts
    .filter(product => {
      const query = searchQuery.toLowerCase();
      return (
        product.name.toLowerCase().includes(query) ||
        (product.delkomCode?.toLowerCase().includes(query) ?? false)
      );
    })
    .slice(0, 5);

  const filteredCodeProducts = allProducts
    .filter(product => {
      const query = searchCode.toLowerCase();
      return (
        (product.delkomCode?.toLowerCase().includes(query) ?? false)
      );
    })
    .slice(0, 5);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setFocusedInput(null);
      }
      if (codeDropdownRef.current && !codeDropdownRef.current.contains(event.target as Node) &&
          codeInputRef.current && !codeInputRef.current.contains(event.target as Node)) {
        setShowCodeDropdown(false);
        setFocusedInput(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.length > 0 && focusedInput === 'name') {
      setShowDropdown(true);
    } else if (searchQuery.length === 0) {
      setShowDropdown(false);
    }
  }, [searchQuery, focusedInput]);

  useEffect(() => {
    if (searchCode.length > 0 && focusedInput === 'code') {
      setShowCodeDropdown(true);
    } else if (searchCode.length === 0) {
      setShowCodeDropdown(false);
    }
  }, [searchCode, focusedInput]);

  const handleSearch = () => {
    if (searchQuery.trim() || searchCode.trim()) {
      onSearch(searchQuery.trim(), searchCode.trim());
      setShowDropdown(false);
      setShowCodeDropdown(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setShowCodeDropdown(false);
    }
  };

  const handleProductClick = (productName: string) => {
    setSearchQuery(productName);
    setTimeout(() => setShowDropdown(false), 50);
  };

  const handleCodeProductClick = (productCode: string) => {
    setSearchCode(productCode);
    setTimeout(() => setShowCodeDropdown(false), 50);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  const handleClearCode = () => {
    setSearchCode("");
    setShowCodeDropdown(false);
    codeInputRef.current?.focus();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative ${className}`}
    >
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/10 to-primary/5 rounded-3xl blur-xl"></div>
      
      {/* Main container */}
      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-visible">
        {/* Decorative gradient bar */}
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary"></div>
        
        <div className="p-8 md:p-10">
          {/* Title with animation */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center gap-3 mb-3">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="bg-gradient-to-br from-primary to-accent p-3 rounded-2xl shadow-lg"
              >
                <Search className="text-white" size={28} />
              </motion.div>
              <h2 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Search Spare Parts
              </h2>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Find original and alternative spare parts for your rock drilling equipment
            </p>
          </motion.div>

          {/* Search inputs */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {/* Product Code Input with Autocomplete */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl blur transition-all duration-300 ${focusedInput === 'code' ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className="relative flex items-center">
                <div className={`absolute left-4 transition-all duration-300 z-10 ${focusedInput === 'code' ? 'text-accent scale-110' : 'text-muted-foreground'}`}>
                  <Hash size={20} />
                </div>
                <Input
                  ref={codeInputRef}
                  type="text"
                  placeholder="Product Code (e.g., 3115600784)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onFocus={() => setFocusedInput('code')}
                  onKeyDown={handleKeyPress}
                  className="pl-12 pr-12 py-6 bg-white/80 border-2 border-slate-200 rounded-xl focus:border-accent focus:bg-white transition-all duration-300 text-base font-medium hover:border-accent/50"
                  data-testid="search-input-code"
                  autoComplete="off"
                />
                {searchCode && (
                  <button
                    onClick={handleClearCode}
                    className="absolute right-4 text-muted-foreground hover:text-accent transition-colors z-10"
                    data-testid="clear-code-btn"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown for Code */}
              <AnimatePresence>
                {showCodeDropdown && (
                  <motion.div
                    ref={codeDropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-slate-200 z-50 overflow-hidden"
                    data-testid="autocomplete-code-dropdown"
                  >
                    {filteredCodeProducts.length > 0 ? (
                      <>
                        <div className="max-h-[400px] overflow-y-auto">
                          {filteredCodeProducts.map((product) => (
                            <div
                              key={product.id}
                              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                              data-testid={`code-suggestion-${product.id}`}
                            >
                              {/* Product Image */}
                              <button
                                onClick={() => handleCodeProductClick(product.delkomCode || "")}
                                className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                  <img
                                    src={product.imageUrls[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={24} className="text-slate-400" />
                                  </div>
                                )}
                              </button>
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => handleCodeProductClick(product.delkomCode || "")}
                                  className="text-left w-full mb-2"
                                >
                                  <h4 className="font-bold text-slate-900 truncate hover:text-accent transition-colors">
                                    {product.name}
                                  </h4>
                                  <p className="text-sm text-slate-600">
                                    {product.delkomCode && (
                                      <span className="inline-block">
                                        SKU: {product.delkomCode}
                                      </span>
                                    )}
                                  </p>
                                </button>
                                
                                {/* Go to Product Button */}
                                <Link href={`/urun/${product.slug || buildProductSlug(product)}`}>
                                  <div
                                    className="inline-block bg-[#ed582e] hover:bg-[#d54d24] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                                    data-testid={`go-to-product-code-${product.id}`}
                                  >
                                    Go to Product
                                  </div>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* See All Products Link */}
                        <Link href={`/spare-parts?code=${encodeURIComponent(searchCode)}`}>
                          <div 
                            className="p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-t-2 border-slate-200 text-center"
                            data-testid="see-all-code-products-link"
                          >
                            <p className="text-sm text-slate-600 font-medium">
                              SEE ALL PRODUCTS... ({allProducts.length})
                            </p>
                          </div>
                        </Link>
                      </>
                    ) : (
                      <div className="p-8 text-center" data-testid="no-code-results-message">
                        <Hash size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-600 font-medium">No products found</p>
                        <p className="text-sm text-slate-400 mt-1">Try a different part number</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Product Name Input with Autocomplete */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur transition-all duration-300 ${focusedInput === 'name' ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className="relative flex items-center">
                <div className={`absolute left-4 transition-all duration-300 z-10 ${focusedInput === 'name' ? 'text-primary scale-110' : 'text-muted-foreground'}`}>
                  <Package size={20} />
                </div>
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Product Name (e.g., COP MD20 Piston)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setFocusedInput('name')}
                  onKeyDown={handleKeyPress}
                  className="pl-12 pr-12 py-6 bg-white/80 border-2 border-slate-200 rounded-xl focus:border-primary focus:bg-white transition-all duration-300 text-base font-medium hover:border-primary/50"
                  data-testid="search-input-name"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-4 text-muted-foreground hover:text-primary transition-colors z-10"
                    data-testid="clear-search-btn"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    ref={dropdownRef}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border-2 border-slate-200 z-50 overflow-hidden"
                    data-testid="autocomplete-dropdown"
                  >
                    {filteredProducts.length > 0 ? (
                      <>
                        <div className="max-h-[400px] overflow-y-auto">
                          {filteredProducts.map((product) => (
                            <div
                              key={product.id}
                              className="w-full flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                              data-testid={`product-suggestion-${product.id}`}
                            >
                              {/* Product Image */}
                              <button
                                onClick={() => handleProductClick(product.name)}
                                className="flex-shrink-0 w-16 h-16 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 cursor-pointer hover:opacity-80 transition-opacity"
                              >
                                {product.imageUrls && product.imageUrls.length > 0 ? (
                                  <img
                                    src={product.imageUrls[0]}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : product.imageUrl ? (
                                  <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={24} className="text-slate-400" />
                                  </div>
                                )}
                              </button>
                              
                              {/* Product Info */}
                              <div className="flex-1 min-w-0">
                                <button
                                  onClick={() => handleProductClick(product.name)}
                                  className="text-left w-full mb-2"
                                >
                                  <h4 className="font-bold text-slate-900 truncate hover:text-primary transition-colors">
                                    {product.name}
                                  </h4>
                                  <p className="text-sm text-slate-600">
                                    {product.delkomCode && (
                                      <span className="inline-block">
                                        SKU: {product.delkomCode}
                                      </span>
                                    )}
                                  </p>
                                </button>
                                
                                {/* Go to Product Button */}
                                <Link href={`/urun/${product.slug || buildProductSlug(product)}`}>
                                  <div
                                    className="inline-block bg-[#ed582e] hover:bg-[#d54d24] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors cursor-pointer"
                                    data-testid={`go-to-product-${product.id}`}
                                  >
                                    Go to Product
                                  </div>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* See All Products Link */}
                        <Link href={`/spare-parts?search=${encodeURIComponent(searchQuery)}`}>
                          <div 
                            className="p-4 bg-slate-50 hover:bg-slate-100 transition-colors border-t-2 border-slate-200 text-center"
                            data-testid="see-all-products-link"
                          >
                            <p className="text-sm text-slate-600 font-medium">
                              SEE ALL PRODUCTS... ({allProducts.length})
                            </p>
                          </div>
                        </Link>
                      </>
                    ) : (
                      <div className="p-8 text-center" data-testid="no-results-message">
                        <Package size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-slate-600 font-medium">No products found</p>
                        <p className="text-sm text-slate-400 mt-1">Try a different search term</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Search Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleSearch}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold px-12 py-6 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                data-testid="search-button"
              >
                <Search size={20} className="mr-3 group-hover:rotate-12 transition-transform duration-300" />
                Search Products
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="ml-2"
                >
                  →
                </motion.div>
              </Button>
            </motion.div>
          </motion.div>

          {/* Info text */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-blue-50 px-6 py-3 rounded-full border border-blue-100">
              <i className="fas fa-info-circle text-blue-500"></i>
              <p className="text-sm text-blue-700 font-medium">
                Search using product name, reference number, or product number
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
