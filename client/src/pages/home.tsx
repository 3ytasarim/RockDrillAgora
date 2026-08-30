import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Hammer, CheckCircle, ArrowRight, Mail, ChevronLeft, ChevronRight, Cpu, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import SearchBar from "@/components/search-bar";
import ProductCard from "@/components/product-card";
import RequestQuoteModal from "@/components/request-quote-modal";
import type { ProductWithCategory, Category } from "@shared/schema";
import { BRANDS as HOME_BRANDS } from "@shared/catalog";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "framer-motion";

import atlasCopcoBrandLogo from "@assets/ref_atlas_copco_1759492041454.jpg";
import epirocBrandLogo from "@assets/ref_epiroc_1759492041454.jpg";
import sandvikBrandLogo from "@assets/sandvik-500x350-1_1759492041454.webp";
import furukawaBrandLogo from "@assets/frukawa_logo_1759492041453.png";

import slide1Image from "@assets/slide_1_1779833838588.jpeg";
import slide2Image from "@assets/slide_2_1779833838588.jpeg";
import slide3Image from "@assets/slide_3_1779833838588.jpeg";
import slide4Image from "@assets/slide_4_catalog_1779833838588.jpeg";
import brandSandvikImage from "@assets/brand_sandvik_1779833838588.jpeg";
import brandFurukawaImage from "@assets/brand_furukawa_1779833838588.jpeg";
import catDrifterImage from "@assets/cat_drifter_1779833838588.jpeg";
import catMachineImage from "@assets/cat_machine_1779833838588.jpeg";
import catOemImage from "@assets/cat_oem_1779833838588.jpeg";
import companyMainImage from "@assets/company_main_1779833838588.jpeg";
import companyThumb1Image from "@assets/company_thumb1_1779833838588.jpg";
import companyThumb2Image from "@assets/company_thumb2_1779833838588.jpg";
import companyThumb3Image from "@assets/company_thumb3_1779833838588.webp";
import aboutUsImage from "@assets/about_us_1779833838588.jpeg";

const heroSlides = [
  {
    firstLine: "AGORA",
    secondLine: "ROCK DRILL",
    badge: "OEM quality, Competitive Price, 100% Guarantee",
    highlight: "20 Years Experience",
    description: "We export spare parts for Epiroc, Atlas Copco and Sandvik rock drilling machines and underground trucks to over 55 countries with OEM and alternative options.",
    image: slide1Image,
    bgGradient: "from-slate-900 via-blue-900 to-slate-800",
    cta: "browse"
  },
  {
    firstLine: "STRONG STOCK",
    secondLine: "CAPACITY",
    badge: "Original Analysis & CNC Manufacturing",
    highlight: "Drifter and Machine Spare Parts",
    description: "We stock thousands of rock drill spare parts in our warehouses for the fastest shipping.",
    image: slide2Image,
    bgGradient: "from-slate-900 via-slate-800 to-blue-900",
    cta: "browse"
  },
  {
    firstLine: "PROFESSIONAL",
    secondLine: "SOLUTIONS",
    badge: "",
    highlight: "Strong and Professional Technical Team",
    description: "We provide repair and maintenance services for Epiroc and Sandvik rock drilling machines and we test the spare parts we produce under the most demanding conditions.",
    image: slide3Image,
    bgGradient: "from-blue-950 via-slate-900 to-slate-800",
    cta: "contact"
  },
  {
    firstLine: "AGORA ROCK DRILL",
    secondLine: "CATALOG",
    badge: "Download our complete product catalog",
    highlight: "",
    description: "View our full range of rock drilling spare parts including Epiroc, Atlas Copco, Sandvik and Furukawa components.",
    image: slide4Image,
    bgGradient: "from-slate-800 via-blue-950 to-slate-900",
    cta: "catalog"
  }
];

const bannerImages = [
  slide1Image, slide2Image, slide3Image, slide4Image,
  catDrifterImage, catMachineImage, catOemImage,
  companyMainImage, companyThumb1Image, companyThumb2Image, companyThumb3Image
];

export default function Home() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const handleRequestQuote = () => setQuoteModalOpen(true);
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    return () => { emblaApi.off('select', onSelect); };
  }, [emblaApi]);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories");
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: showcase = {}, isLoading: productsLoading } = useQuery<Record<string, ProductWithCategory[]>>({
    queryKey: ["/api/home-showcase"],
    queryFn: async () => {
      const response = await fetch("/api/home-showcase");
      if (!response.ok) throw new Error("Failed to fetch showcase");
      return response.json();
    },
    staleTime: 300000,
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
                            <span className="text-accent drop-shadow-lg">{slide.firstLine}</span>
                            <br />
                            <span className="text-white drop-shadow-lg">{slide.secondLine}</span>
                          </h1>
                          {slide.highlight && (
                            <h2 className="text-2xl md:text-4xl font-bold text-secondary drop-shadow-lg">
                              {slide.highlight}
                            </h2>
                          )}
                        </div>
                        {slide.badge && (
                          <div className="inline-block bg-accent/90 px-6 py-3 rounded-lg">
                            <p className="text-lg md:text-xl font-black tracking-wider">{slide.badge}</p>
                          </div>
                        )}
                        <p className="text-lg md:text-xl text-white/90 max-w-xl leading-relaxed">
                          {slide.description}
                        </p>
                        <div className="flex flex-wrap gap-4 pt-4">
                          {slide.cta === "catalog" ? (
                            <a href="/catalog.pdf" target="_blank" rel="noopener noreferrer">
                              <Button className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg font-bold shadow-2xl rounded-full group transition-all hover:scale-105" data-testid="view-catalog-btn">
                                View Catalog
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                              </Button>
                            </a>
                          ) : (
                            <Link href="/spare-parts">
                              <Button className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-lg font-bold shadow-2xl rounded-full group transition-all hover:scale-105" data-testid="browse-products-btn">
                                Browse Products
                                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                              </Button>
                            </Link>
                          )}
                          <Button
                            variant="outline"
                            className="border-3 border-white text-white hover:bg-white hover:text-primary px-8 py-6 text-lg font-bold rounded-full backdrop-blur-sm bg-white/10 transition-all hover:scale-105"
                            data-testid="contact-us-btn"
                            onClick={() => window.location.href = "/contact"}
                          >
                            Contact Us
                          </Button>
                        </div>
                      </div>
                      <div className="hidden md:block relative">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
                          <img
                            src={slide.image}
                            alt={`${slide.firstLine} ${slide.secondLine}`}
                            className="w-full h-[500px] object-cover"
                            loading={index === 0 ? "eager" : "lazy"}
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

        <button onClick={scrollPrev} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110" aria-label="Previous slide" data-testid="button-hero-prev">
          <ChevronLeft size={28} />
        </button>
        <button onClick={scrollNext} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white p-3 rounded-full transition-all hover:scale-110" aria-label="Next slide" data-testid="button-hero-next">
          <ChevronRight size={28} />
        </button>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {heroSlides.map((_, index) => (
            <button key={index} onClick={() => emblaApi?.scrollTo(index)} className={`h-2 rounded-full transition-all ${index === selectedIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`} aria-label={`Go to slide ${index + 1}`} data-testid={`button-hero-dot-${index}`} />
          ))}
        </div>
      </section>

      {/* Search Section */}
      <section className="bg-muted py-12 -mt-8 relative z-10">
        <div className="max-w-4xl mx-auto px-4">
          <SearchBar onSearch={handleSearch} />
        </div>
      </section>

      {/* Trusted Brands Grid */}
      <section className="py-12 bg-gradient-to-r from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Trusted Equipment Brands</h2>
            <p className="text-muted-foreground">We supply spare parts for all major rock drilling manufacturers</p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              { href: "/spare-parts?brand=Atlas Copco - Epiroc", src: atlasCopcoBrandLogo, alt: "Atlas Copco", testId: "brand-logo-atlas-copco", delay: 0.1 },
              { href: "/spare-parts?brand=Atlas Copco - Epiroc", src: epirocBrandLogo, alt: "Epiroc", testId: "brand-logo-epiroc", delay: 0.2 },
              { href: "/spare-parts?brand=Sandvik", src: sandvikBrandLogo, alt: "Sandvik", testId: "brand-logo-sandvik", delay: 0.3 },
              { href: "/spare-parts?brand=Furukawa", src: furukawaBrandLogo, alt: "Furukawa", testId: "brand-logo-furukawa", delay: 0.4 },
            ].map((brand, i) => (
              <Link key={i} href={brand.href}>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: brand.delay }} viewport={{ once: true }} whileHover={{ scale: 1.05, y: -5 }} className="bg-white p-10 rounded-2xl shadow-lg hover:shadow-xl transition-all h-48 flex items-center justify-center cursor-pointer">
                  <img src={brand.src} alt={brand.alt} className="max-h-32 max-w-full w-auto object-contain" data-testid={brand.testId} loading="lazy" />
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Product Brand */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Product Brand</h2>
            <p className="text-xl text-muted-foreground">Browse our extensive range of rock drill spare parts</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                img: slide4Image,
                alt: "Epiroc - Atlas Copco",
                title: "Epiroc - Atlas Copco",
                desc: "Epiroc and Atlas Copco drifters and machine parts, pumps, hydraulic valves, filters, cables, seal kits, and electrical products used in surface and underground rock drilling are available at AGORA Rock Drill.",
                href: "/spare-parts?brand=Atlas Copco - Epiroc",
                testId: "brand-card-atlas-epiroc",
                delay: 0
              },
              {
                img: brandSandvikImage,
                alt: "Sandvik",
                title: "Sandvik",
                desc: "Spare parts for all drifter models used by Sandvik, as well as underground and surface drilling rigs, pumps, cables, electrical units, and seal kits are available in our warehouses.",
                href: "/spare-parts?brand=Sandvik",
                testId: "brand-card-sandvik",
                delay: 0.1
              },
              {
                img: brandFurukawaImage,
                alt: "Furukawa",
                title: "Furukawa",
                desc: "All drifter models used by Furukawa, including drifter spare parts, pumps, cables, electrical units, and seal kits, are available in our warehouses.",
                href: "/spare-parts?brand=Furukawa",
                testId: "brand-card-furukawa",
                delay: 0.2
              }
            ].map((brand, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: brand.delay }} viewport={{ once: true }} whileHover={{ scale: 1.02, y: -5 }} className="bg-card rounded-lg shadow-lg overflow-hidden border border-border hover:shadow-2xl transition-all cursor-pointer" onClick={() => window.location.href = brand.href} data-testid={brand.testId}>
                <img src={brand.img} alt={brand.alt} className="w-full h-56 object-cover" loading="lazy" />
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">{brand.title}</h3>
                  <p className="text-muted-foreground mb-4">{brand.desc}</p>
                  <div className="flex items-center justify-end">
                    <span className="text-primary font-semibold">View Products →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Product Categories</h2>
            <p className="text-xl text-muted-foreground">Browse our extensive range of rock drill spare parts</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                img: catDrifterImage,
                icon: <Hammer className="text-primary" size={24} />,
                title: "Drifter Spare Parts",
                desc: "OEM quality spare parts for all rock drilling drifters from Epiroc, Atlas Copco, Sandvik and Furukawa brands.",
                testId: "category-card-drifter",
                delay: 0
              },
              {
                img: catMachineImage,
                icon: <Cpu className="text-primary" size={24} />,
                title: "Machine Spare Parts",
                desc: "Spare parts and components used in rock drilling drifters and underground truck machines from Epiroc, Atlas Copco, Sandvik, and Furukawa brands.",
                testId: "category-card-machine",
                delay: 0.1
              },
              {
                img: catOemImage,
                icon: <Layers className="text-primary" size={24} />,
                title: "OEM Parts",
                desc: "Rexroth, Parker Pump and Motor Valves, Haydaforce Valves, Donaldson Filters, Murr Cables, ABB Electrical Parts, SKF, NTN Timken Bearings.",
                testId: "category-card-oem",
                delay: 0.2
              }
            ].map((cat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: cat.delay }} viewport={{ once: true }} whileHover={{ scale: 1.02, y: -5 }} className="bg-card rounded-lg shadow-lg overflow-hidden border border-border hover:shadow-2xl transition-all cursor-pointer" onClick={() => window.location.href = "/spare-parts"} data-testid={cat.testId}>
                <img src={cat.img} alt={cat.title} className="w-full h-56 object-cover" loading="lazy" />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    {cat.icon}
                    <h3 className="text-2xl font-bold text-foreground">{cat.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{cat.desc}</p>
                  <div className="flex items-center justify-end">
                    <span className="text-primary font-semibold">View Products →</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Spare parts by brand — real, crawlable product links */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">Rock Drill Spare Parts by Brand</h2>
            <p className="text-muted-foreground max-w-3xl">
              Replacement parts for Atlas Copco / Epiroc, Sandvik and Furukawa hydraulic rock drills and drill rigs, listed by OEM part number.
            </p>
          </div>

          {productsLoading ? (
            <div className="space-y-12">
              {[1, 2, 3].map((catIndex) => (
                <div key={catIndex}>
                  <div className="bg-muted h-8 w-64 rounded mb-6 animate-pulse"></div>
                  <div className="grid md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-card rounded-lg p-6 animate-pulse">
                        <div className="bg-muted h-48 rounded mb-4"></div>
                        <div className="bg-muted h-4 rounded mb-2"></div>
                        <div className="bg-muted h-4 rounded mb-4 w-2/3"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-16">
              {HOME_BRANDS.map((brand) => {
                const items = showcase[brand.slug] || [];
                if (items.length === 0) return null;
                return (
                  <div key={brand.slug}>
                    <div className="flex justify-between items-center mb-8 gap-4">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">{brand.label} Spare Parts</h2>
                      <a href={`/spare-parts/${brand.slug}`} data-testid={`view-all-${brand.slug}`}>
                        <Button variant="outline" className="font-semibold whitespace-nowrap">
                          View All {brand.label} Parts <ChevronRight size={16} className="ml-2" />
                        </Button>
                      </a>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {items.map((product) => (
                        <ProductCard key={product.id} product={product} onAddToCart={handleRequestQuote} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <a href="/spare-parts">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 font-semibold" data-testid="view-all-products-btn">
                Browse the full spare parts catalogue →
              </Button>
            </a>
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
                  {[companyThumb1Image, companyThumb2Image, companyThumb3Image].map((img, i) => (
                    <motion.div key={i} whileHover={{ scale: 1.05 }} className="relative rounded-xl overflow-hidden shadow-lg border-4 border-white cursor-pointer">
                      <img src={img} alt={`Agora Rock Drill facility ${i + 1}`} className="w-full h-24 object-cover" loading="lazy" />
                    </motion.div>
                  ))}
                </motion.div>
              </div>

              <div className="relative h-full min-h-[400px] overflow-hidden bg-slate-200">
                <img src={companyMainImage} alt="AGORA Rock Drill - Ankara, Turkey" className="absolute inset-0 w-full h-full object-cover z-[5]" loading="lazy" />
                <motion.div initial={{ width: "50%" }} whileInView={{ width: "0%" }} transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }} viewport={{ once: true }} className="absolute inset-y-0 left-0 bg-primary z-10" />
                <motion.div initial={{ width: "50%" }} whileInView={{ width: "0%" }} transition={{ duration: 1, delay: 0.5, ease: "easeInOut" }} viewport={{ once: true }} className="absolute inset-y-0 right-0 bg-accent z-10" />
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* About Us Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }}>
              <h2 className="text-4xl font-bold text-foreground mb-6">We Are AGORA Rock Drill!</h2>
              <p className="text-lg text-muted-foreground mb-4 leading-relaxed">
                We produce professional solutions for spare parts, service and maintenance needs of rock drilling machines.
              </p>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                As AGORA Rock Drill A.Ş., we continue our work by bringing together our many years of experience in the field of rock drilling machinery and mining equipment.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "20 years of sectoral experience and corporate structure",
                  "Experts speaking English, Russian and Turkish",
                  "Extensive product knowledge and strong inventory",
                  "Reliable product with original and alternative parts",
                  "Export to dozens of countries"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-foreground">
                    <CheckCircle className="text-primary mt-0.5 flex-shrink-0" size={20} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <p className="text-muted-foreground leading-relaxed mb-8">
                Located in a confined area of more than 700 square meters in Ankara Ostim Alınteri Boulevard, our company provides professional solutions for Rock Drilling Spare Parts, Service and Maintenance needs with a team of experts working in many areas of the sector.
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-muted rounded-xl p-4">
                  <div className="text-3xl font-extrabold text-primary">15,000+</div>
                  <div className="text-sm text-muted-foreground mt-1">Products in Catalog</div>
                </div>
                <div className="text-center bg-muted rounded-xl p-4">
                  <div className="text-3xl font-extrabold text-primary">55+</div>
                  <div className="text-sm text-muted-foreground mt-1">Countries Served</div>
                </div>
                <div className="text-center bg-muted rounded-xl p-4">
                  <div className="text-3xl font-extrabold text-primary">20+</div>
                  <div className="text-sm text-muted-foreground mt-1">Years Experience</div>
                </div>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }} viewport={{ once: true }} className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img src={aboutUsImage} alt="AGORA Rock Drill Team and Facilities" className="w-full h-[520px] object-cover" loading="lazy" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why AGORA Rock Drill? */}
      <section className="py-16 bg-muted">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">Why AGORA Rock Drill?</h2>
            <p className="text-xl text-muted-foreground">AGORA Rock Drill A.Ş. is a Leading Trademark in Rock Drilling Industry</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { emoji: "🔧", title: "Strong Sectoral Knowledge", desc: "We produce solutions for spare parts, maintenance and repair needs of rock drilling machines." },
              { emoji: "🚚", title: "Fast and Reliable Delivery", desc: "As AGORA Rock Drill, we provide high speed delivery to dozens of countries in cooperation with leading logistics companies." },
              { emoji: "🏭", title: "Wide Inventory Advantage", desc: "We stock thousands of original and alternative spare parts in our warehouses." }
            ].map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }} className="bg-card border border-border rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow text-center" data-testid={`why-agora-card-${i}`}>
                <div className="text-4xl mb-4">{item.emoji}</div>
                <h3 className="text-xl font-bold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Guarantee & Request Form */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }} className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200 mb-8">
                <div className="flex items-center gap-4 mb-6">
                  <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.8 }} className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-full p-4 shadow-lg">
                    <i className="fas fa-award text-white text-3xl"></i>
                  </motion.div>
                  <h2 className="text-3xl font-bold text-foreground">Quality Guarantee</h2>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  "We give 3 months warranty against breakage except for user faults, on condition that the necessary overhaul is made"
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} viewport={{ once: true }}>
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
                  <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="mailto:agora@agorarockdrill.com" className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl px-6 py-3 hover:border-accent transition-colors shadow-sm" data-testid="link-email-contact">
                    <Mail className="text-accent" size={24} />
                    <span className="font-semibold text-foreground">Send us a Mail</span>
                  </motion.a>
                  <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href="https://wa.me/905521718672" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-white border-2 border-slate-200 rounded-xl px-6 py-3 hover:border-green-500 transition-colors shadow-sm" data-testid="link-whatsapp-contact">
                    <i className="fab fa-whatsapp text-green-500 text-2xl"></i>
                    <span className="font-semibold text-foreground">Write to Whatsapp</span>
                  </motion.a>
                </div>
              </motion.div>
            </motion.div>

            {/* Request Form */}
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }} className="sticky top-24">
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.3 }} className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl p-8 shadow-2xl">
                <h3 className="text-3xl font-black text-slate-900 mb-6 text-center">Request Form</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-slate-900 font-semibold mb-2">Name <span className="text-red-600">*</span></label>
                    <Input type="text" className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" data-testid="contact-name-input" />
                  </div>
                  <div>
                    <label className="block text-slate-900 font-semibold mb-2">Corporate <span className="text-red-600">*</span></label>
                    <Input type="text" className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" data-testid="contact-company-input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-900 font-semibold mb-2">Mail <span className="text-red-600">*</span></label>
                      <Input type="email" className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" data-testid="contact-email-input" />
                    </div>
                    <div>
                      <label className="block text-slate-900 font-semibold mb-2">Phone <span className="text-red-600">*</span></label>
                      <Input type="tel" className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900" data-testid="contact-phone-input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-900 font-semibold mb-2">Message <span className="text-red-600">*</span></label>
                    <Textarea rows={4} className="w-full bg-white border-0 rounded-lg py-3 px-4 text-foreground focus:ring-2 focus:ring-slate-900 resize-none" data-testid="contact-message-input" />
                  </div>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800 font-bold py-6 text-lg rounded-xl shadow-lg" data-testid="contact-submit-btn">
                      REQUEST A QUOTE
                    </Button>
                  </motion.div>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <RequestQuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
    </div>
  );
}
