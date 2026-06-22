import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Package, FileText, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import useEmblaCarousel from "embla-carousel-react";
import type { ProductWithCategory } from "@shared/schema";
import RequestQuoteModal from "@/components/request-quote-modal";
import { Helmet } from "react-helmet";
import { getCodeVariants, buildProductSlug, buildProductTitle } from "@shared/product-utils";

function ProductSchema({ product }: { product: ProductWithCategory }) {
  const baseUrl = "https://agorarockdrill.shop";
  const productImage = product.imageUrls?.[0] || product.imageUrl || `${baseUrl}/api/placeholder/600/600`;
  
  const canonicalUrl = `${baseUrl}/urun/${product.slug || buildProductSlug(product)}`;
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${baseUrl}${productImage}`;

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": product.description || `${product.name} - Rock drill spare part`,
    "sku": product.delkomCode,
    "mpn": product.delkomCode,
    "brand": {
      "@type": "Brand",
      "name": product.brandCompatibility || "Rock Drill Parts"
    },
    "image": fullImageUrl,
    "category": product.category?.name || "Spare Parts",
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "availability": product.stockStatus === "out_of_stock" 
        ? "https://schema.org/OutOfStock" 
        : "https://schema.org/InStock",
      "priceCurrency": "USD",
      "price": product.finalPrice || "0",
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "seller": {
        "@type": "Organization",
        "name": "Agora Rock Drill"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Spare Parts",
        "item": `${baseUrl}/spare-parts`
      },
      ...(product.category ? [{
        "@type": "ListItem",
        "position": 3,
        "name": product.category.name,
        "item": `${baseUrl}/spare-parts?category=${product.categoryId}`
      }, {
        "@type": "ListItem",
        "position": 4,
        "name": product.name,
        "item": canonicalUrl
      }] : [{
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": canonicalUrl
      }])
    ]
  };

  return (
    <Helmet>
      <title>{product.name} - {product.delkomCode} | Agora Rock Drill</title>
      <meta name="description" content={`${product.name} (${product.delkomCode}) - ${product.brandCompatibility || 'Rock drill'} spare part. ${product.description || 'High quality replacement part for rock drilling equipment.'}`} />
      <meta property="og:title" content={`${product.name} - ${product.delkomCode}`} />
      <meta property="og:description" content={product.description || `Rock drill spare part - ${product.delkomCode}`} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:type" content="product" />
      <meta property="og:url" content={canonicalUrl} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={canonicalUrl} />
      <script type="application/ld+json">
        {JSON.stringify(productSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(breadcrumbSchema)}
      </script>
    </Helmet>
  );
}

export default function ProductDetail() {
  const params = useParams();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);

  // Support URL formats: /urun/:slug (primary), /product/:id and /brand/:brand/:code
  const slug = params.slug;
  const productCode = params.code || params.id;
  const identifier = slug || productCode;
  const apiPath = slug ? "/api/products/by-slug" : "/api/products/by-code";

  // If no identifier, show 404
  if (!identifier) {
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

  const { data: product, isLoading, error } = useQuery<ProductWithCategory>({
    queryKey: [apiPath, identifier],
    queryFn: async () => {
      const response = await fetch(`${apiPath}/${encodeURIComponent(identifier)}`);
      if (!response.ok) throw new Error("Product not found");
      return response.json();
    },
    enabled: !!identifier,
  });

  const { data: relatedData } = useQuery<{ products: ProductWithCategory[] }>({
    queryKey: ["/api/products/paginated", product?.categoryId],
    queryFn: async () => {
      const res = await fetch(`/api/products/paginated?category=${product?.categoryId}&limit=5`);
      if (!res.ok) throw new Error("Failed to fetch related products");
      return res.json();
    },
    enabled: !!product?.categoryId,
  });

  const relatedProducts = relatedData?.products?.filter((p) => p.id !== product?.id).slice(0, 4) ?? [];

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
      <ProductSchema product={product} />
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
                          loading={index === 0 ? "eager" : "lazy"}
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
                      loading="lazy"
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
                <h1 className="text-2xl md:text-3xl font-black text-foreground mb-4 leading-tight">
                  {buildProductTitle(product)}
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
                <div className="bg-primary/10 p-2 rounded-lg flex-shrink-0">
                  <Package className="text-primary" size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground mb-2">Product Code</p>
                  {(() => {
                    const variants = getCodeVariants(product.delkomCode || '', product.brandCompatibility || '');
                    if (!variants) {
                      return (
                        <p className="font-bold text-lg font-mono tracking-wider text-foreground" data-testid="product-code-raw">
                          {product.delkomCode}
                        </p>
                      );
                    }
                    return (
                      <div className="space-y-1">
                        <p className="font-bold text-lg font-mono tracking-widest text-foreground" data-testid="product-code-spaced">
                          {variants.spaced}
                        </p>
                        <p className="font-semibold text-base font-mono text-muted-foreground tracking-wider" data-testid="product-code-joined">
                          {variants.joined}
                        </p>
                        <p className="font-semibold text-base font-mono text-muted-foreground tracking-wider" data-testid="product-code-dashed">
                          {variants.dashed}
                        </p>
                      </div>
                    );
                  })()}
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

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-white border-t py-16">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-2">Related Products</h2>
            <p className="text-muted-foreground mb-8">
              Other parts in the same category that may interest you
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((related) => {
                const relatedImage = related.imageUrls?.[0] || related.imageUrl || "/api/placeholder/300/300";
                const relatedUrl = `/urun/${related.slug || buildProductSlug(related)}`;
                return (
                  <Link key={related.id} href={relatedUrl} data-testid={`related-product-${related.id}`}>
                    <motion.div
                      whileHover={{ scale: 1.02, y: -4 }}
                      className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="aspect-square overflow-hidden bg-slate-50">
                        <img
                          src={relatedImage}
                          alt={related.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-foreground text-sm leading-tight mb-1 line-clamp-2">
                          {related.name}
                        </h3>
                        {related.delkomCode && (
                          <p className="text-xs text-muted-foreground font-mono mb-2">{related.delkomCode}</p>
                        )}
                        <span className="text-xs text-primary font-semibold">View Details →</span>
                      </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
            {product?.categoryId && (
              <div className="text-center mt-8">
                <Link href={`/spare-parts?category=${product.categoryId}`}>
                  <button className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary/90 transition-colors" data-testid="button-view-all-related">
                    View All in This Category →
                  </button>
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
