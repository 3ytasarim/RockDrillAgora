import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Home, Cog, Mail, FileText, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "@assets/AgoraRockDrillLogo_1759477799213.png";
import RequestQuoteModal from "@/components/request-quote-modal";

export default function Header() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex gap-6">
            <span>
              <i className="fas fa-phone mr-2"></i>+90 312 385 60 03
            </span>
            <span className="hidden sm:inline">
              <i className="fas fa-envelope mr-2"></i>agora@agorarockdrill.com
            </span>
          </div>
          <div className="flex gap-4">
            <a href="https://www.instagram.com/agorarockdrill/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" data-testid="social-instagram">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.linkedin.com/company/agorarockdrill/" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" data-testid="social-linkedin">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="https://x.com/agorarockdrill" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" data-testid="social-twitter">
              <i className="fab fa-x-twitter"></i>
            </a>
            <a href="https://www.facebook.com/agorarockdrill" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" data-testid="social-facebook">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="https://www.youtube.com/@agorarockdrill" target="_blank" rel="noopener noreferrer" className="hover:scale-110 transition-transform" data-testid="social-youtube">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-background shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center" data-testid="logo">
              <img src={logoImage} alt="Agora Rock Drill" className="h-16 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" data-testid="nav-home" className={`flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors ${location === "/" ? "text-primary" : ""}`}>
                <Home size={16} />
                Home
              </Link>
              
              {/* Spare Parts Dropdown */}
              <div className="dropdown-wrapper relative group">
                <div className="relative pb-2">
                  <Link 
                    href="/spare-parts" 
                    data-testid="nav-spare-parts" 
                    className={`flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors ${location === "/spare-parts" ? "text-primary" : ""}`}
                  >
                    <Cog size={16} />
                    Spare Parts
                    <ChevronDown 
                      size={12} 
                      className="transition-transform duration-200 group-hover:rotate-180" 
                    />
                  </Link>
                  
                  {/* Hover Bridge - invisible area that keeps dropdown open */}
                  <div className="absolute inset-x-0 bottom-0 h-2" />
                </div>
                
                <div className="dropdown-menu absolute left-0 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 ease-in-out bg-white dark:bg-gray-900 shadow-2xl rounded-lg py-3 w-80 border border-border z-50 top-full">
                  <Link 
                    href="/spare-parts" 
                    data-testid="dropdown-all-parts" 
                    className="flex items-center px-5 py-3 hover:bg-primary/10 transition-all duration-150 font-semibold border-b border-border group/item"
                  >
                    <i className="fas fa-tools mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">All Spare Parts</span>
                  </Link>
                  
                  <div className="px-5 pt-3 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    By Brand
                  </div>
                  <Link 
                    href="/spare-parts?brand=Atlas Copco - Epiroc" 
                    data-testid="dropdown-brand-atlas-epiroc" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 group/item"
                  >
                    <i className="fas fa-industry mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Atlas Copco - Epiroc</span>
                  </Link>
                  <Link 
                    href="/spare-parts?brand=Sandvik" 
                    data-testid="dropdown-brand-sandvik" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 group/item"
                  >
                    <i className="fas fa-industry mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Sandvik</span>
                  </Link>
                  <Link 
                    href="/spare-parts?brand=Furukawa" 
                    data-testid="dropdown-brand-furukawa" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 border-b border-border group/item"
                  >
                    <i className="fas fa-industry mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Furukawa</span>
                  </Link>
                  
                  <div className="px-5 pt-3 pb-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    By Category
                  </div>
                  <Link 
                    href="/spare-parts?category=rock-drills" 
                    data-testid="dropdown-rock-drills" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 group/item"
                  >
                    <i className="fas fa-hammer mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Rock Drills (Drifters)</span>
                  </Link>
                  <Link 
                    href="/spare-parts?category=rotation-units" 
                    data-testid="dropdown-rotation-units" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 group/item"
                  >
                    <i className="fas fa-sync-alt mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Rotation Units (DHR)</span>
                  </Link>
                  <Link 
                    href="/spare-parts?category=seal-kits" 
                    data-testid="dropdown-seal-kits" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 group/item"
                  >
                    <i className="fas fa-shield-alt mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Seal Kits & Diaphragms</span>
                  </Link>
                  <Link 
                    href="/spare-parts?category=pumps-motors" 
                    data-testid="dropdown-pumps-motors" 
                    className="flex items-center px-5 py-2.5 hover:bg-primary/10 transition-all duration-150 pl-8 group/item"
                  >
                    <i className="fas fa-tachometer-alt mr-3 text-primary w-4 text-center"></i>
                    <span className="group-hover/item:translate-x-1 transition-transform duration-150">Pumps & Motors</span>
                  </Link>
                </div>
              </div>

              <Link href="/contact" data-testid="nav-contact" className={`flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors ${location === "/contact" ? "text-primary" : ""}`}>
                <Mail size={16} />
                Contact Us
              </Link>
              
              {/* Free Request Button */}
              <Button 
                onClick={() => setRequestModalOpen(true)}
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="nav-request"
              >
                <FileText size={16} className="mr-2" />
                Free Request
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-border bg-background">
              <div className="px-4 py-4 space-y-4">
                <Link href="/" data-testid="mobile-nav-home" className="block text-foreground hover:text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <Home size={16} className="inline mr-2" />
                  Home
                </Link>
                <Link href="/spare-parts" data-testid="mobile-nav-spare-parts" className="block text-foreground hover:text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <Cog size={16} className="inline mr-2" />
                  Spare Parts
                </Link>
                <Link href="/contact" data-testid="mobile-nav-contact" className="block text-foreground hover:text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <Mail size={16} className="inline mr-2" />
                  Contact Us
                </Link>
                <button 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setRequestModalOpen(true);
                  }}
                  className="block w-full text-left text-foreground hover:text-primary font-semibold" 
                  data-testid="mobile-nav-request"
                >
                  <FileText size={16} className="inline mr-2" />
                  Free Request
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Request Quote Modal */}
      <RequestQuoteModal 
        open={requestModalOpen} 
        onOpenChange={setRequestModalOpen}
      />
    </>
  );
}
