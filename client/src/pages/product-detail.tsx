import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Package, FileText, Truck, Shield, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useEmblaCarousel from "embla-carousel-react";
import type { ProductWithCategory } from "@shared/schema";
import RequestQuoteModal from "@/components/request-quote-modal";

export default function ProductDetail() {
  const { id } = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  const { data: product, isLoading } = useQuery<ProductWithCategory>({
    queryKey: ["/api/products", id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!id,
  });

  // Use product imageUrls array, fallback to imageUrl or placeholder
  const productImages = product ? (
    product.imageUrls && product.imageUrls.length > 0
      ? product.imageUrls
      : product.imageUrl
        ? [product.imageUrl]
        : ["/api/placeholder/600/600"]
  ) : [];

  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setSelectedImageIndex(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on('select', onSelect);
    onSelect();
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  const scrollPrev = () => emblaApi?.scrollPrev();
  const scrollNext = () => emblaApi?.scrollNext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-64 mb-8"></div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="bg-slate-200 rounded-2xl h-96"></div>
              <div className="space-y-4">
                <div className="h-12 bg-slate-200 rounded"></div>
                <div className="h-24 bg-slate-200 rounded"></div>
                <div className="h-32 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Product Not Found</h2>
          <Link href="/spare-parts">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <RequestQuoteModal open={quoteModalOpen} onOpenChange={setQuoteModalOpen} />
      
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight size={16} />
            <Link href="/spare-parts" className="hover:text-primary transition-colors">Spare Parts</Link>
            <ChevronRight size={16} />
            <Link href={`/spare-parts?category=${product.categoryId}`} className="hover:text-primary transition-colors">
              {product.category?.name}
            </Link>
            <ChevronRight size={16} />
            <span className="text-foreground font-medium truncate max-w-xs">{product.name}</span>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden p-8 sticky top-24">
              {/* Main Image Carousel */}
              <div className="relative mb-6">
                <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
                  <div className="flex">
                    {productImages.map((image, index) => (
                      <motion.div
                        key={index}
                        className="flex-[0_0_100%] min-w-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      >
                        <img
                          src={image}
                          alt={`${product.name} - Image ${index + 1}`}
                          className="w-full h-96 object-cover bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl"
                        />
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Navigation Buttons */}
                <button
                  onClick={scrollPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all hover:scale-110"
                  data-testid="button-gallery-prev"
                >
                  <ChevronLeft size={24} className="text-primary" />
                </button>
                <button
                  onClick={scrollNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white backdrop-blur-sm p-3 rounded-full shadow-lg transition-all hover:scale-110"
                  data-testid="button-gallery-next"
                >
                  <ChevronRight size={24} className="text-primary" />
                </button>
              </div>

              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-3">
                {productImages.map((image, index) => (
                  <motion.button
                    key={index}
                    onClick={() => emblaApi?.scrollTo(index)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary shadow-lg'
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    data-testid={`button-thumbnail-${index}`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-20 object-cover bg-slate-50"
                    />
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Product Title */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {product.isFeatured && (
                  <span className="inline-block bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-semibold mb-3">
                    Featured Product
                  </span>
                )}
                <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 leading-tight">
                  {product.name}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {product.description || "High-quality rock drill spare part"}
                </p>
              </motion.div>
            </div>

            <Separator />

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-lg space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Package className="text-primary" size={20} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Production Code</p>
                  <p className="font-bold text-lg">{product.delkomCode}</p>
                </div>
              </div>

              {product.brandCompatibility && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Brand Compatibility</p>
                  <div className="flex flex-wrap gap-2">
                    {product.brandCompatibility.split(',').map((brand, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-primary/10 to-accent/10 text-foreground px-4 py-2 rounded-full text-sm font-semibold"
                      >
                        {brand.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {product.category && (
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Category</p>
                  <Link href={`/spare-parts?category=${product.categoryId}`}>
                    <span className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2 rounded-lg font-semibold text-foreground">
                      <i className={`${product.category.icon} text-primary`}></i>
                      {product.category.name}
                    </span>
                  </Link>
                </div>
              )}
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <Shield className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty</p>
                    <p className="font-semibold">3 Months</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Truck className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Shipping</p>
                    <p className="font-semibold">Worldwide</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-3"
            >
              <Button
                onClick={() => setQuoteModalOpen(true)}
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-bold py-6 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02]"
                data-testid="request-quote-btn"
              >
                REQUEST A QUOTE
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-2 hover:bg-slate-50 py-6 rounded-xl font-semibold"
                  data-testid="button-save-favorite"
                >
                  <Heart size={20} className="mr-2" />
                  Save to Favorites
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-2 hover:bg-slate-50 py-6 rounded-xl font-semibold"
                  data-testid="button-share-product"
                >
                  <Share2 size={20} className="mr-2" />
                  Share Product
                </Button>
              </div>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-3 text-foreground">Need Help?</h3>
              <p className="text-muted-foreground mb-4">
                Our expert team is ready to assist you with technical specifications, compatibility questions, or bulk orders.
              </p>
              <div className="flex gap-3">
                <a href="mailto:agora@agorarockdrill.com" className="text-primary hover:underline font-semibold">
                  agora@agorarockdrill.com
                </a>
                <span className="text-muted-foreground">|</span>
                <a href="tel:+903123856003" className="text-primary hover:underline font-semibold">
                  +90 312 385 60 03
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
