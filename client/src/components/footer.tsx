export default function Footer() {
  return (
    <footer className="bg-foreground text-background py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">
              <i className="fas fa-industry mr-2"></i>AGORA ROCK DRILL
            </h3>
            <p className="text-background/80 mb-4">
              Professional solutions for spare parts, service and maintenance needs of rock drilling machines. 20 years of experience with 700+ m² warehouse.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/agorarockdrill" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-facebook">
                <i className="fab fa-facebook"></i>
              </a>
              <a href="https://www.linkedin.com/company/agorarockdrill" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-linkedin">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="https://wa.me/905435755300" target="_blank" rel="noopener noreferrer" className="bg-background/10 hover:bg-accent w-10 h-10 rounded-full flex items-center justify-center transition-colors" data-testid="footer-whatsapp">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="/" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-home">Home</a></li>
              <li><a href="/spare-parts" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-spare-parts">Spare Parts</a></li>
              <li><a href="#about" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-about">About Us</a></li>
              <li><a href="#contact" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-contact">Contact</a></li>
              <li><a href="#" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-privacy">Privacy Policy</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Product Categories</h4>
            <ul className="space-y-2">
              <li><a href="/spare-parts?category=rock-drills" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-rock-drills">Rock Drills</a></li>
              <li><a href="/spare-parts?category=rotation-units" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-rotation">Rotation Units</a></li>
              <li><a href="/spare-parts?category=pumps-motors" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-pumps">Pumps & Motors</a></li>
              <li><a href="/spare-parts?category=seal-kits" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-seals">Seal Kits</a></li>
              <li><a href="/spare-parts?category=hydraulic" className="text-background/80 hover:text-accent transition-colors" data-testid="footer-category-hydraulic">Hydraulic Parts</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-4">Contact Info</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <i className="fas fa-phone mt-1"></i>
                <div className="text-background/80">
                  <div>+90 312 385 60 03</div>
                  <div>+90 543 575 53 00</div>
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

        <div className="border-t border-background/20 pt-6 text-center text-background/70">
          <p>&copy; 2025 Agora Rock Drill. All rights reserved. | Quality Guaranteed Spare Parts</p>
        </div>
      </div>
    </footer>
  );
}
