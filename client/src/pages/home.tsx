import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hammer, RotateCcw, Gauge, CheckCircle, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchBar from "@/components/search-bar";
import CategoryCard from "@/components/category-card";
import ProductCard from "@/components/product-card";
import type { ProductWithCategory } from "@shared/schema";

export default function Home() {
  const { data: featuredProducts = [], isLoading: featuredLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products", "featured"],
    queryFn: async () => {
      const response = await fetch("/api/products?featured=true");
      if (!response.ok) throw new Error("Failed to fetch featured products");
      return response.json();
    },
  });

  const { data: discountedProducts = [], isLoading: discountedLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products", "discounted"],
    queryFn: async () => {
      const response = await fetch("/api/products?discounted=true");
      if (!response.ok) throw new Error("Failed to fetch discounted products");
      return response.json();
    },
  });

  const handleSearch = (query: string, code: string) => {
    const searchParams = new URLSearchParams();
    if (query) searchParams.set("search", query);
    if (code) searchParams.set("code", code);
    window.location.href = `/spare-parts?${searchParams.toString()}`;
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="relative industrial-gradient text-primary-foreground py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Hydraulic Rock Drill, Drill Rig & Drifter Spare Parts
              </h1>
              <p className="text-xl mb-8 text-primary-foreground/90">
                High quality alternative spare parts for Atlas Copco, Epiroc, Jumbo, Furukawa, Montabert, CAT, and Junjin. 
                Exported to over 100 countries worldwide.
              </p>
              <div className="flex gap-4">
                <Link href="/spare-parts">
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90 px-8 py-3 text-lg font-semibold" data-testid="browse-products-btn">
                    <i className="fas fa-shopping-cart mr-2"></i>Browse Products
                  </Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary px-8 py-3 text-lg font-semibold"
                  data-testid="contact-us-btn"
                >
                  <i className="fas fa-phone mr-2"></i>Contact Us
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
                alt="Rock drilling equipment in mining operation" 
                className="rounded-lg shadow-2xl"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-muted py-12 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Product Categories</h2>
            <p className="text-xl text-muted-foreground">Browse our extensive range of rock drill spare parts</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <CategoryCard
              title="Rock Drills (Drifters)"
              description="Complete range of rock drill spare parts including pistons, drivers, guides, and cylinders for all major brands."
              icon={Hammer}
              productCount={500}
              imageUrl="https://pixabay.com/get/g9df71494c156e3b4ab83b386da99617a211d31c5d26ab3d2f56d72900892766446c452c699ed382528082ab3746641a770c46ff7124022455789a8013a492cb7_1280.jpg"
              onClick={() => window.location.href = "/spare-parts?category=rock-drills"}
            />
            
            <CategoryCard
              title="Rotation Units (DHR)"
              description="DHR series rotation units, bushings, couplings, and complete assemblies for optimal drilling performance."
              icon={RotateCcw}
              productCount={350}
              imageUrl="https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
              onClick={() => window.location.href = "/spare-parts?category=rotation-units"}
            />
            
            <CategoryCard
              title="Pumps & Motors"
              description="Hydraulic pumps, motors, seal kits, diaphragms, and repair kits for all drill rig models."
              icon={Gauge}
              productCount={400}
              imageUrl="https://images.unsplash.com/photo-1621905251918-48416bd8575a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500"
              onClick={() => window.location.href = "/spare-parts?category=pumps-motors"}
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              <Star className="inline text-accent mr-2" />
              Best Seller Discounted Products
            </h2>
            <p className="text-xl text-muted-foreground">Top quality spare parts at unbeatable prices</p>
          </div>

          {discountedLoading ? (
            <div className="grid md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                  <div className="bg-muted h-48 rounded mb-4"></div>
                  <div className="bg-muted h-4 rounded mb-2"></div>
                  <div className="bg-muted h-4 rounded mb-4 w-2/3"></div>
                  <div className="bg-muted h-8 rounded"></div>
                </div>
              ))}
            </div>
          ) : discountedProducts.length > 0 ? (
            <div className="grid md:grid-cols-4 gap-6">
              {discountedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No discounted products available at the moment.</p>
            </div>
          )}

          <div className="text-center mt-8">
            <Link href="/spare-parts">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 font-semibold" data-testid="view-all-products-btn">
                View All Products <i className="fas fa-arrow-right ml-2"></i>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Quality Guarantee */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-foreground mb-6">
                <i className="fas fa-shield-check text-accent mr-2"></i>Quality Guarantee
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Our store produces high quality alternative spare parts for drill rigs, rock drilling machines and drifters 
                produced by the world's leading companies such as Atlas Copco, Epiroc, Jumbo, Furukawa, Montabert, CAT, Junjin.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-accent text-xl mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-foreground">3 Months Warranty</h4>
                    <p className="text-muted-foreground">Against breakage except for user faults, on condition that the necessary overhaul is made</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-accent text-xl mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-foreground">OEM Quality Materials</h4>
                    <p className="text-muted-foreground">Made of high durable materials, many products are OEM quality</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-accent text-xl mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-foreground">Global Export</h4>
                    <p className="text-muted-foreground">Exported to more than 100 countries with international certifications</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="text-accent text-xl mt-1" size={20} />
                  <div>
                    <h4 className="font-semibold text-foreground">Dedicated Support</h4>
                    <p className="text-muted-foreground">Customer-specific representative assigned for all sales processes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://rockdrill.shop/wp-content/uploads/2025/01/Best-rock-drill-spare-parts-3.webp" 
                alt="Quality rock drill spare parts" 
                className="rounded-lg shadow-lg"
                loading="lazy"
              />
              <img 
                src="https://rockdrill.shop/wp-content/uploads/2025/01/Best-rock-drill-spare-parts-1.webp" 
                alt="Rock drill spare parts warehouse" 
                className="rounded-lg shadow-lg mt-8"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Need Help? Contact Our Experts</h2>
            <p className="text-xl text-primary-foreground/90">Get assistance from our experienced sales consultants</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-primary-foreground text-foreground rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Quick Contact</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <i className="fas fa-envelope text-primary text-xl"></i>
                  <div>
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-semibold">info@agorarockdrill.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fas fa-phone text-primary text-xl"></i>
                  <div>
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-semibold">+90 530 499 28 91</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <i className="fab fa-whatsapp text-primary text-xl"></i>
                  <div>
                    <div className="text-sm text-muted-foreground">WhatsApp</div>
                    <div className="font-semibold">Chat with us instantly</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary-foreground text-foreground rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-4">Request a Quote</h3>
              <form className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  className="w-full px-4 py-2 rounded-md border border-input" 
                  data-testid="contact-name-input"
                />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  className="w-full px-4 py-2 rounded-md border border-input" 
                  data-testid="contact-email-input"
                />
                <input 
                  type="tel" 
                  placeholder="Phone Number" 
                  className="w-full px-4 py-2 rounded-md border border-input" 
                  data-testid="contact-phone-input"
                />
                <textarea 
                  placeholder="Your Message" 
                  rows={3} 
                  className="w-full px-4 py-2 rounded-md border border-input" 
                  data-testid="contact-message-input"
                ></textarea>
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold"
                  data-testid="contact-submit-btn"
                >
                  <i className="fas fa-paper-plane mr-2"></i>Send Request
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
