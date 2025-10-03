import { useState } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string, code: string) => void;
  className?: string;
}

export default function SearchBar({ onSearch, className = "" }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCode, setSearchCode] = useState("");

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
    <div className={`bg-card rounded-lg shadow-xl p-8 ${className}`}>
      <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
        <Search className="inline mr-2 text-primary" />
        Search Spare Parts
      </h2>
      <div className="flex gap-4 flex-col md:flex-row">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by Product Name (e.g., COP MD20 Piston)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
            data-testid="search-input-name"
          />
        </div>
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by Product Code (e.g., 3115600784)"
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
            data-testid="search-input-code"
          />
        </div>
        <Button 
          onClick={handleSearch}
          className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold whitespace-nowrap"
          data-testid="search-button"
        >
          <Search size={16} className="mr-2" />
          Search
        </Button>
      </div>
      <div className="mt-4 text-sm text-muted-foreground text-center">
        <i className="fas fa-info-circle mr-1"></i>
        Search using product name, reference number, or Delkom part number
      </div>
    </div>
  );
}
