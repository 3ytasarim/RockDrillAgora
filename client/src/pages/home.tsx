import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hammer, RotateCcw, Gauge, CheckCircle, Star, ChevronLeft, ChevronRight, ArrowRight, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SearchBar from "@/components/search-bar";
import CategoryCard from "@/components/category-card";
import ProductCard from "@/components/product-card";
import type { ProductWithCategory, Category } from "@shared/schema";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";
import rockDrillImage1 from "@assets/stock_images/hydraulic_rock_drill_f13a1ccf.jpg";
import rockDrillImage2 from "@assets/stock_images/hydraulic_rock_drill_a3d8bb85.jpg";
import rockDrillImage3 from "@assets/stock_images/hydraulic_rock_drill_2c311439.jpg";
import warehouseImage1 from "@assets/stock_images/warehouse_industrial_c96b9e5d.jpg";
import warehouseImage2 from "@assets/stock_images/warehouse_industrial_5bd1059d.jpg";
import warehouseImage3 from "@assets/stock_images/warehouse_industrial_5ad4d018.jpg";
import teamCollaborationImage from "@assets/stock_images/professional_busines_a4681059.jpg";

const heroSlides = [
  {
    title: "AGORA ROCK DRILL",
    subtitle: "Professional Spare Parts Solutions",
    highlight: "20 YEARS EXPERIENCE",
    description: "Original and alternative spare parts for Atlas Copco, Epiroc, Sandvik, Furukawa, Ingersoll Rand, Everdigm and more.",
    image: rockDrillImage1,
    bgGradient: "from-slate-900 via-blue-900 to-slate-800"
  },
  {
    title: "EXTENSIVE INVENTORY",
    subtitle: "700+ m² Warehouse",
    highlight: "THOUSANDS OF PARTS",
    description: "Wide inventory advantage with original and alternative spare parts stocked in our large warehouse in Ankara, Turkey.",
    image: rockDrillImage2,
    bgGradient: "from-slate-900 via-slate-800 to-blue-900"
  },
  {
    title: "GLOBAL DELIVERY",
    subtitle: "Fast & Reliable Shipping",
    highlight: "DOZENS OF COUNTRIES",
    description: "High speed delivery worldwide through DHL, FedEx and UPS. Expert teams speaking English, Russian and Turkish.",
    image: rockDrillImage3,
    bgGradient: "from-blue-950 via-slate-900 to-slate-800"
  }
];

export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: allProducts = [], isLoading: productsLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Failed to fetch products");
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
      {/* Hero Slider */}
      <section className="relative overflow-hidden">
        <div ref={emblaRef} className="overflow-hidden">
          <div className="flex">
            {heroSlides.map((slide, index) => (
              <div key={index} className="flex-[0_0_100%] min-w-0">
                <div className={`relative bg-gradient-to-br ${slide.bgGradient} text-white overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/40"></div>
                  
                  <div className="max-w-7xl mx-auto px-4 py-24 md:py-32 relative z-10">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-none">
                            <span className="text-accent drop-shadow-lg">{slide.title.split(' ')[0]}</span>
                            <br />
                            <span className="text-white drop-shadow-lg">{slide.title.split(' ').slice(1).join(' ')}</span>
                          </h1>
                          <h2 className="text-3xl md:text-5xl font-bold text-secondary drop-shadow-lg">
                            {slide.subtitle}
                          </h2>
                        </div>
                        
                        <div className="inline-block bg-accent/90 px-6 py-3 rounded-lg">
                          <p className="text-xl md:text-2xl font-black tracking-wider">
                            {slide.highlight}
                          </p>
                        </div>
                        
                        <p className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed">
                          {slide.description}
                        </p>
                        
                        <div className="flex flex-wrap gap-4 pt-4">
                          <Link href="/spare-parts">
                            <Button 
                              className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg font-bold shadow-2xl rounded-full group transition-all hover:scale-105" 
                              data-testid="browse-products-btn"
                            >
                              Browse Products
                              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            className="border-3 border-white text-white hover:bg-white hover:text-primary px-8 py-6 text-lg font-bold rounded-full backdrop-blur-sm bg-white/10 transition-all hover:scale-105"
                            data-testid="contact-us-btn"
                          >
                            Contact Us
                          </Button>
                        </div>
                      </div>
                      
                      <div className="hidden md:block relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                          <div className="absolute inset-0 bg-gradient-to-tr from-accent/20 to-primary/20 z-10"></div>
                          <img 
                            src={slide.image}
                            alt={slide.title}
                            className="w-full h-[500px] object-cover"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          onClick={scrollPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110"
          aria-label="Previous slide"
          data-testid="button-hero-prev"
        >
          <ChevronLeft size={28} />
        </button>
        <button 
          onClick={scrollNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110"
          aria-label="Next slide"
          data-testid="button-hero-next"
        >
          <ChevronRight size={28} />
        </button>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2 rounded-full transition-all ${
                index === selectedIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
              data-testid={`button-hero-dot-${index}`}
            />
          ))}
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

      {/* Products by Category */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          {productsLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map(catIndex => (
                <div key={catIndex}>
                  <div className="bg-muted h-8 w-64 rounded mb-6 animate-pulse"></div>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {categories.map((category) => {
                const categoryProducts = allProducts.filter(p => p.categoryId === category.id).slice(0, 4);
                
                if (categoryProducts.length === 0) return null;
                
                return (
                  <div key={category.id}>
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-3xl font-bold text-foreground mb-2">
                          <i className={`${category.icon} text-primary mr-3`}></i>
                          {category.name}
                        </h2>
                        {category.description && (
                          <p className="text-muted-foreground">{category.description}</p>
                        )}
                      </div>
                      <Link href={`/spare-parts?category=${category.id}`}>
                        <Button variant="outline" className="font-semibold">
                          View All <ChevronRight size={16} className="ml-2" />
                        </Button>
                      </Link>
                    </div>
                    
                    <div className="grid md:grid-cols-4 gap-6">
                      {categoryProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                );
              })}
              
              {allProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">No products available at the moment.</p>
                </div>
              )}
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

      {/* Company Production Info */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="py-16 bg-gradient-to-br from-slate-50 to-slate-100"
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-8 md:p-12 flex flex-col justify-center">
                <motion.h2 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  viewport={{ once: true }}
                  className="text-3xl md:text-4xl font-bold text-foreground mb-6 leading-tight"
                >
                  We produce professional solutions for spare parts, service and maintenance needs of rock drilling machines
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="text-lg text-muted-foreground mb-8"
                >
                  As AGORA Rock Drill A.Ş., we continue our work with 20 years of experience in the sector of rock drilling machinery and mining equipment. We stock thousands of original and alternative spare parts in our 700+ m² warehouse and deliver to dozens of countries through DHL, FedEx and UPS.
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  viewport={{ once: true }}
                  className="grid grid-cols-3 gap-4"
                >
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white cursor-pointer"
                  >
                    <img 
                      src={warehouseImage1} 
                      alt="Warehouse storage" 
                      className="w-full h-24 object-cover"
                    />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white cursor-pointer"
                  >
                    <img 
                      src={warehouseImage2} 
                      alt="Industrial warehouse" 
                      className="w-full h-24 object-cover"
                    />
                  </motion.div>
                  <motion.div 
                    whileHover={{ scale: 1.05 }}
                    className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white cursor-pointer"
                  >
                    <img 
                      src={warehouseImage3} 
                      alt="Parts storage" 
                      className="w-full h-24 object-cover"
                    />
                  </motion.div>
                </motion.div>
              </div>
              <div className="relative h-full min-h-[400px]">
                <motion.img 
                  initial={{ opacity: 0, scale: 1.1 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                  viewport={{ once: true }}
                  src={teamCollaborationImage} 
                  alt="Professional team collaboration" 
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20"></div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Quality Guarantee & Request Form */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Quality Guarantee */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <motion.div 
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                    className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-4 shadow-lg"
                  >
                    <i className="fas fa-award text-white text-3xl"></i>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-foreground">Quality Guarantee</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  "We give 3 months warranty against breakage except for user faults, on condition that the necessary overhaul is made"
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-1 h-12 bg-accent rounded-full"></div>
                    <h3 className="text-2xl font-bold text-foreground">NEED HELP?</h3>
                  </div>
                  <h4 className="text-3xl font-black text-foreground mb-4">You need experienced Spare Parts Expert</h4>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">
                    You can get help from our experienced sales consultants for all the questions you want to ask, such as the parts and parts lists you want, spare parts you cannot find. To do this, simply fill out the contact form. Our experts will get back to you as soon as possible.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4">
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="mailto:agora@agorarockdrill.com"
                    className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl px-6 py-3 hover:border-accent transition-colors shadow-sm"
                    data-testid="link-email-contact"
                  >
                    <Mail className="text-accent" size={24} />
                    <span className="font-semibold text-foreground">Send us a Mail</span>
                  </motion.a>
                  <motion.a
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    href="https://wa.me/905435755300"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl px-6 py-3 hover:border-green-500 transition-colors shadow-sm"
                    data-testid="link-whatsapp-contact"
                  >
                    <i className="fab fa-whatsapp text-green-500 text-2xl"></i>
                    <span className="font-semibold text-foreground">Write to Whatsapp</span>
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>

            {/* Request Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="sticky top-24"
            >
              <motion.div 
                whileHover={{ y: -5 }}
                transition={{ duration: 0.3 }}
                className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 shadow-2xl"
              >
                <h3 className="text-3xl font-black text-slate-900 mb-6 text-center">Request Form</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-slate-900 font-semibold mb-2">
                      Name <span className="text-red-600">*</span>
                    </label>
                    <Input 
                      type="text" 
                      className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" 
                      data-testid="contact-name-input"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-900 font-semibold mb-2">
                      Corporate <span className="text-red-600">*</span>
                    </label>
                    <Input 
                      type="text" 
                      className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" 
                      data-testid="contact-company-input"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-900 font-semibold mb-2">
                        Mail <span className="text-red-600">*</span>
                      </label>
                      <Input 
                        type="email" 
                        className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" 
                        data-testid="contact-email-input"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-900 font-semibold mb-2">
                        Phone <span className="text-red-600">*</span>
                      </label>
                      <Input 
                        type="tel" 
                        className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" 
                        data-testid="contact-phone-input"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-900 font-semibold mb-2">
                      Message <span className="text-red-600">*</span>
                    </label>
                    <Textarea 
                      rows={4} 
                      className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900 resize-none" 
                      data-testid="contact-message-input"
                    />
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-6 text-lg rounded-xl shadow-lg"
                      data-testid="contact-submit-btn"
                    >
                      REQUEST A QUOTE
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
