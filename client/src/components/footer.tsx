import logoImage from "@assets/AgoraRockDrillLogo_1759477799213.png";
import { FOOTER_PAGES } from "@shared/sitemap-pages";

const navKey = (url: string) => (url === "/" ? "home" : url.replace(/^\//, ""));

export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="mb-6">
              <img src={logoImage} alt="Agora Rock Drill" className="h-20 w-auto brightness-0 invert mb-3" data-testid="footer-logo" />
              <p className="text-background/80 text-base leading-relaxed">
                Professional solutions for spare parts, service and maintenance needs of rock drilling machines. 20 years of experience with 700+ m² warehouse.
              </p>
            </div>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/agorarockdrill/" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-instagram">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="https://www.linkedin.com/company/agorarockdrill/" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-linkedin">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="https://x.com/agorarockdrill" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-twitter">
                <i className="fab fa-x-twitter"></i>
              </a>
              <a href="https://www.facebook.com/agorarockdrill" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-facebook">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://www.youtube.com/@agorarockdrill" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-youtube">
                <i className="fab fa-youtube"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {FOOTER_PAGES.map((page) => (
                <li key={page.url}>
                  <a
                    href={page.url}
                    className="text-background/80 hover:text-accent transition-colors"
                    data-testid={`footer-${navKey(page.url)}`}
                  >
                    {page.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Product Categories</h4>
            <ul className="space-y-2">
              <li><a href="/spare-parts" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-drifter">Drifter Spare Parts</a></li>
              <li><a href="/spare-parts" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-machine">Machine Spare Parts</a></li>
              <li><a href="/spare-parts" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-pumps">Pump Motor Valves Bearings</a></li>
              <li><a href="/spare-parts" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-seals">Seal Kits Electrical Parts Filters</a></li>
              <li><a href="/spare-parts" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-hydraulic">Hydraulic Parts</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <i className="fas fa-phone mt-1"></i>
                <div className="text-background/80">
                  <div>+90 312 385 60 03</div>
                  <div>+90 552 171 86 72</div>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-envelope mt-1"></i>
                <span className="text-background/80">agora@agorarockdrill.com</span>
              </li>
              <li className="flex items-start gap-2">
                <i className="fas fa-map-marker-alt mt-1"></i>
                <span className="text-background/80">Ostim, Ankara, Turkey</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-6 space-y-3">
          <p className="text-center text-background/70">
            &copy; 2025 Agora Rock Drill. All rights reserved. | Quality Guaranteed Spare Parts
          </p>
          <p className="text-center text-background/60 text-sm max-w-4xl mx-auto">
            Sandvik, Furukawa, Epiroc, Atlas Copco are registered trademarks of equipment manufacturers. AGORA Rock Drill A.Ş. does not represent any of these trademarks.
          </p>
          <div className="text-center pt-2 md:pt-4">
            <a 
              href="https://www.3ytasarim.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-block text-base hover:scale-105 transition-transform duration-300"
              data-testid="footer-designer-link"
            >
              <span className="text-background/70">Design By | </span>
              <span className="text-red-500 font-semibold animate-pulse">3Y Tasarım Web & Yazılım Ajansı</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
