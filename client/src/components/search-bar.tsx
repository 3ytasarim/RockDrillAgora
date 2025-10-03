import { useState } from "react";
import { Search, Package, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

interface SearchBarProps {
  onSearch: (query: string, code: string) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCode, setSearchCode] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSearch = () => {
    if (searchQuery.trim() || searchCode.trim()) {
      onSearch(searchQuery.trim(), searchCode.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
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
      <div className="relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
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
            {/* Product Name Input */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur transition-all duration-300 ${focusedInput === 'name' ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className="relative flex items-center">
                <div className={`absolute left-4 transition-all duration-300 ${focusedInput === 'name' ? 'text-primary scale-110' : 'text-muted-foreground'}`}>
                  <Package size={20} />
                </div>
                <Input
                  type="text"
                  placeholder="Product Name (e.g., COP MD20 Piston)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 pr-4 py-6 bg-white/80 border-2 border-slate-200 rounded-xl focus:border-primary focus:bg-white transition-all duration-300 text-base font-medium hover:border-primary/50"
                  data-testid="search-input-name"
                />
              </div>
            </motion.div>

            {/* Product Code Input */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="relative group"
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-accent/20 to-primary/20 rounded-xl blur transition-all duration-300 ${focusedInput === 'code' ? 'opacity-100' : 'opacity-0'}`}></div>
              <div className="relative flex items-center">
                <div className={`absolute left-4 transition-all duration-300 ${focusedInput === 'code' ? 'text-accent scale-110' : 'text-muted-foreground'}`}>
                  <Hash size={20} />
                </div>
                <Input
                  type="text"
                  placeholder="Product Code (e.g., 3115600784)"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  onFocus={() => setFocusedInput('code')}
                  onBlur={() => setFocusedInput(null)}
                  onKeyPress={handleKeyPress}
                  className="pl-12 pr-4 py-6 bg-white/80 border-2 border-slate-200 rounded-xl focus:border-accent focus:bg-white transition-all duration-300 text-base font-medium hover:border-accent/50"
                  data-testid="search-input-code"
                />
              </div>
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
                Search using product name, reference number, or Delkom part number
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
