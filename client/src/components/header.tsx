import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronDown, Home, Cog, Info, Mail, Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import logoImage from "@assets/AgoraRockDrillLogo_1759477799213.png";

export default function Header() {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Top Info Bar */}
      <div className="bg-primary text-primary-foreground py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex gap-6">
            <span>
              <i className="fas fa-phone mr-2"></i>+90 530 499 28 91
            </span>
            <span className="hidden sm:inline">
              <i className="fas fa-envelope mr-2"></i>info@agorarockdrill.com
            </span>
          </div>
          <div className="flex gap-4">
            <a href="#" className="hover:text-accent transition-colors" data-testid="social-facebook">
              <i className="fab fa-facebook"></i>
            </a>
            <a href="#" className="hover:text-accent transition-colors" data-testid="social-linkedin">
              <i className="fab fa-linkedin"></i>
            </a>
            <a href="#" className="hover:text-accent transition-colors" data-testid="social-whatsapp">
              <i className="fab fa-whatsapp"></i>
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
              <img src={logoImage} alt="Agora Rock Drill" className="h-12 w-auto" />
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="/" data-testid="nav-home" className={`flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors ${location === "/" ? "text-primary" : ""}`}>
                <Home size={16} />
                Home
              </Link>
              
              {/* Spare Parts Dropdown */}
              <div className="dropdown relative">
                <Link href="/spare-parts" data-testid="nav-spare-parts" className={`flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors ${location === "/spare-parts" ? "text-primary" : ""}`}>
                  <Cog size={16} />
                  Spare Parts
                  <ChevronDown size={12} />
                </Link>
                <div className="dropdown-menu absolute hidden bg-white shadow-lg rounded-md mt-2 py-2 w-64 border border-border">
                  <Link href="/spare-parts" data-testid="dropdown-all-parts" className="block px-4 py-2 hover:bg-muted transition-colors">
                    <i className="fas fa-tools mr-2 text-primary"></i>All Spare Parts
                  </Link>
                  <Link href="/spare-parts?category=rock-drills" data-testid="dropdown-rock-drills" className="block px-4 py-2 hover:bg-muted transition-colors">
                    <i className="fas fa-hammer mr-2 text-primary"></i>Rock Drills (Drifters)
                  </Link>
                  <Link href="/spare-parts?category=rotation-units" data-testid="dropdown-rotation-units" className="block px-4 py-2 hover:bg-muted transition-colors">
                    <i className="fas fa-sync-alt mr-2 text-primary"></i>Rotation Units (DHR)
                  </Link>
                  <Link href="/spare-parts?category=seal-kits" data-testid="dropdown-seal-kits" className="block px-4 py-2 hover:bg-muted transition-colors">
                    <i className="fas fa-shield-alt mr-2 text-primary"></i>Seal Kits & Diaphragms
                  </Link>
                  <Link href="/spare-parts?category=pumps-motors" data-testid="dropdown-pumps-motors" className="block px-4 py-2 hover:bg-muted transition-colors">
                    <i className="fas fa-tachometer-alt mr-2 text-primary"></i>Pumps & Motors
                  </Link>
                </div>
              </div>

              <a href="#about" className="flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors" data-testid="nav-about">
                <Info size={16} />
                About Us
              </a>
              
              <a href="#contact" className="flex items-center gap-1 text-foreground hover:text-primary font-semibold transition-colors" data-testid="nav-contact">
                <Mail size={16} />
                Contact
              </a>
              
              {/* Admin Panel Button */}
              <Link href="/admin" data-testid="nav-admin" asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
                  <Shield size={16} className="mr-1" />
                  Admin Panel
                </Button>
              </Link>
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
                <a href="#about" className="block text-foreground hover:text-primary font-semibold" data-testid="mobile-nav-about">
                  <Info size={16} className="inline mr-2" />
                  About Us
                </a>
                <a href="#contact" className="block text-foreground hover:text-primary font-semibold" data-testid="mobile-nav-contact">
                  <Mail size={16} className="inline mr-2" />
                  Contact
                </a>
                <Link href="/admin" data-testid="mobile-nav-admin" className="block text-foreground hover:text-primary font-semibold" onClick={() => setMobileMenuOpen(false)}>
                  <Shield size={16} className="inline mr-2" />
                  Admin Panel
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
