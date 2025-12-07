import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { ObjectStorageService } from "./objectStorage";
import multer from "multer";
import * as XLSX from "xlsx";
import fs from "fs";
import path from "path";

const upload = multer({ storage: multer.memoryStorage() });

// Helper function to create URL-friendly slug
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}

// Helper function to generate dynamic HTML with SEO meta tags
function generateProductHtml(
  templateHtml: string,
  product: {
    name: string;
    description?: string | null;
    delkomCode?: string | null;
    brandCompatibility?: string | null;
    imageUrls?: string[] | null;
    imageUrl?: string | null;
    finalPrice?: string | null;
    originalPrice?: string | null;
    stockStatus?: string | null;
  }
): string {
  const baseUrl = "https://agorarockdrill.shop";
  
  // Create SEO-friendly title
  const title = `${product.name}${product.delkomCode ? ` - ${product.delkomCode}` : ''} | Agora Rock Drill`;
  
  // Create description
  const description = product.description 
    ? product.description.slice(0, 160) 
    : `${product.name} - High quality rock drill spare part${product.brandCompatibility ? ` compatible with ${product.brandCompatibility}` : ''}. Professional spare parts from Agora Rock Drill.`;
  
  // Get product image
  const productImage = product.imageUrls?.[0] || product.imageUrl || `${baseUrl}/og-image.jpg`;
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${baseUrl}${productImage}`;
  
  // Create canonical URL
  let brandSlug = 'spare-parts';
  if (product.brandCompatibility) {
    const firstBrand = product.brandCompatibility.split(',')[0].trim();
    brandSlug = createSlug(firstBrand);
  }
  const canonicalUrl = `${baseUrl}/brand/${brandSlug}/${encodeURIComponent(product.delkomCode || '')}`;
  
  // Determine availability based on stock status
  const availabilityUrl = product.stockStatus === 'out_of_stock' 
    ? "https://schema.org/OutOfStock" 
    : "https://schema.org/InStock";
  
  // Create JSON-LD structured data (no price - B2B "Request a Quote" model)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": description,
    "sku": product.delkomCode || "",
    "mpn": product.delkomCode || "",
    "image": fullImageUrl,
    "brand": {
      "@type": "Brand",
      "name": product.brandCompatibility || "Agora Rock Drill"
    },
    "manufacturer": {
      "@type": "Organization",
      "name": "Agora Rock Drill"
    },
    "offers": {
      "@type": "Offer",
      "url": canonicalUrl,
      "availability": availabilityUrl,
      "seller": {
        "@type": "Organization",
        "name": "Agora Rock Drill"
      }
    }
  };
  
  // Create visible SSR content for Googlebot (inside #root, will be replaced by React)
  const ssrContent = `
    <div id="ssr-product-content" style="padding: 40px 20px; max-width: 1200px; margin: 0 auto; font-family: system-ui, -apple-system, sans-serif;">
      <nav style="margin-bottom: 20px; font-size: 14px; color: #666;">
        <a href="${baseUrl}" style="color: #2563eb; text-decoration: none;">Home</a> &gt; 
        <a href="${baseUrl}/spare-parts" style="color: #2563eb; text-decoration: none;">Spare Parts</a> &gt; 
        <span>${product.name}</span>
      </nav>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start;">
        <div>
          <img src="${fullImageUrl}" alt="${product.name}" style="width: 100%; max-width: 500px; height: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        </div>
        <div>
          <h1 style="font-size: 32px; font-weight: 700; margin: 0 0 16px 0; color: #1a1a1a;">${product.name}</h1>
          <p style="font-size: 18px; color: #4a5568; margin-bottom: 24px;">${description}</p>
          <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 12px 0;"><strong style="color: #2d3748;">Product Code:</strong> <span style="color: #1a1a1a; font-family: monospace; font-size: 16px;">${product.delkomCode || 'N/A'}</span></p>
            <p style="margin: 0;"><strong style="color: #2d3748;">Brand Compatibility:</strong> <span style="color: #1a1a1a;">${product.brandCompatibility || 'Universal'}</span></p>
          </div>
          <div style="display: flex; gap: 12px; margin-bottom: 24px;">
            <span style="background: #e6fffa; color: #047857; padding: 8px 16px; border-radius: 6px; font-size: 14px;">✓ In Stock</span>
            <span style="background: #eff6ff; color: #1d4ed8; padding: 8px 16px; border-radius: 6px; font-size: 14px;">Worldwide Shipping</span>
          </div>
          <a href="${baseUrl}/contact" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Request a Quote</a>
        </div>
      </div>
      <div style="margin-top: 48px; padding-top: 32px; border-top: 1px solid #e2e8f0;">
        <h2 style="font-size: 24px; margin-bottom: 16px; color: #1a1a1a;">About This Product</h2>
        <p style="color: #4a5568; line-height: 1.7;">${product.name} is a high-quality rock drill spare part available from Agora Rock Drill. ${product.brandCompatibility ? `Compatible with ${product.brandCompatibility} equipment.` : ''} We offer professional spare parts for hydraulic rock drills and drill rigs with worldwide shipping and quality guarantee.</p>
      </div>
    </div>
  `;
  
  // Replace meta tags in template
  let html = templateHtml;
  
  // Replace title
  html = html.replace(
    /<title>.*?<\/title>/,
    `<title>${title}</title>`
  );
  
  // Replace meta title
  html = html.replace(
    /<meta name="title" content=".*?" \/>/,
    `<meta name="title" content="${title}" />`
  );
  
  // Replace meta description
  html = html.replace(
    /<meta name="description" content=".*?" \/>/,
    `<meta name="description" content="${description}" />`
  );
  
  // Replace canonical URL
  html = html.replace(
    /<link rel="canonical" href=".*?" \/>/,
    `<link rel="canonical" href="${canonicalUrl}" />`
  );
  
  // Replace OG tags
  html = html.replace(
    /<meta property="og:title" content=".*?" \/>/,
    `<meta property="og:title" content="${title}" />`
  );
  html = html.replace(
    /<meta property="og:description" content=".*?" \/>/,
    `<meta property="og:description" content="${description}" />`
  );
  html = html.replace(
    /<meta property="og:url" content=".*?" \/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:image" content=".*?" \/>/,
    `<meta property="og:image" content="${fullImageUrl}" />`
  );
  html = html.replace(
    /<meta property="og:type" content=".*?" \/>/,
    `<meta property="og:type" content="product" />`
  );
  
  // Replace Twitter tags
  html = html.replace(
    /<meta name="twitter:title" content=".*?" \/>/,
    `<meta name="twitter:title" content="${title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description" content=".*?" \/>/,
    `<meta name="twitter:description" content="${description}" />`
  );
  html = html.replace(
    /<meta name="twitter:url" content=".*?" \/>/,
    `<meta name="twitter:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta name="twitter:image" content=".*?" \/>/,
    `<meta name="twitter:image" content="${fullImageUrl}" />`
  );
  
  // Add JSON-LD structured data before </head>
  html = html.replace(
    '</head>',
    `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>\n</head>`
  );
  
  // Add SSR content inside <div id="root"> - React will hydrate over this
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root">${ssrContent}</div>`
  );
  
  return html;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Products API
  app.get("/api/products", async (req, res) => {
    try {
      const { search, category, featured, discounted } = req.query;
      
      let products;
      if (search) {
        products = await storage.searchProducts(search as string);
      } else if (category) {
        products = await storage.getProductsByCategory(category as string);
      } else if (featured === 'true') {
        const allFeatured = await storage.getFeaturedProducts();
        // Limit featured products to 12 for performance
        products = allFeatured.slice(0, 12);
      } else if (discounted === 'true') {
        products = await storage.getDiscountedProducts();
      } else {
        products = await storage.getAllProducts();
      }
      
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const product = await storage.getProduct(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/by-code/:code", async (req, res) => {
    try {
      const product = await storage.getProductByCode(req.params.code);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product by code:', error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.parse(req.body);
      
      if (validatedProduct.categoryId === "") {
        validatedProduct.categoryId = undefined;
      }
      if (validatedProduct.brandCompatibility === "") {
        validatedProduct.brandCompatibility = undefined;
      }
      
      const product = await storage.createProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error('Error creating product:', error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      const validatedProduct = insertProductSchema.partial().parse(req.body);
      
      if (validatedProduct.categoryId === "") {
        validatedProduct.categoryId = undefined;
      }
      if (validatedProduct.brandCompatibility === "") {
        validatedProduct.brandCompatibility = undefined;
      }
      
      const product = await storage.updateProduct(req.params.id, validatedProduct);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid product data", details: error.errors });
      }
      console.error('Error updating product:', error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await storage.deleteProduct(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Bulk Import Products
  app.post("/api/products/bulk-import", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet);

      const results = {
        success: [] as any[],
        errors: [] as any[],
      };

      for (const row of data) {
        try {
          const productData: any = {
            name: (row as any)['Product Name'] || (row as any)['name'] || '',
            delkomCode: (row as any)['Product Number'] || (row as any)['productNumber'] || '',
            brandCompatibility: (row as any)['Brand'] || (row as any)['brand'] || '',
            stockStatus: 'in_stock',
          };

          if (!productData.name || !productData.delkomCode) {
            results.errors.push({
              row,
              error: 'Missing required fields: Product Name or Product Number'
            });
            continue;
          }

          const validatedProduct = insertProductSchema.parse(productData);
          const product = await storage.createProduct(validatedProduct);
          results.success.push(product);
        } catch (error) {
          results.errors.push({
            row,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.json({
        message: `Import completed: ${results.success.length} products added, ${results.errors.length} errors`,
        success: results.success.length,
        errors: results.errors.length,
        errorDetails: results.errors,
      });
    } catch (error) {
      console.error('Error importing products:', error);
      res.status(500).json({ error: "Failed to import products" });
    }
  });

  // Categories API
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error('Error fetching category:', error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(validatedCategory);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      console.error('Error creating category:', error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/categories/:id", async (req, res) => {
    try {
      const validatedCategory = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, validatedCategory);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      console.error('Error updating category:', error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      await storage.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Object Storage - Product Images
  app.post("/api/products/image-upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getProductImageUploadURL();
      const publicPath = objectStorageService.normalizeProductImagePath(uploadURL);
      res.json({ uploadURL, publicPath: `/public-objects/${publicPath}` });
    } catch (error) {
      console.error('Error generating upload URL:', error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.put("/api/products/:id/image", async (req, res) => {
    try {
      if (!req.body.imageURL) {
        return res.status(400).json({ error: "imageURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      let imagePath = objectStorageService.normalizeProductImagePath(req.body.imageURL);
      
      if (!imagePath.startsWith("/public-objects/")) {
        imagePath = `/public-objects/${imagePath}`;
      }
      
      await storage.updateProduct(req.params.id, { imageUrl: imagePath });
      
      res.json({ imagePath });
    } catch (error) {
      console.error('Error updating product image:', error);
      res.status(500).json({ error: "Failed to update product image" });
    }
  });

  app.put("/api/products/:id/images", async (req, res) => {
    try {
      if (!req.body.imageURLs || !Array.isArray(req.body.imageURLs)) {
        return res.status(400).json({ error: "imageURLs array is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const imagePaths = req.body.imageURLs.map((imageURL: string) => {
        let imagePath = objectStorageService.normalizeProductImagePath(imageURL);
        if (!imagePath.startsWith("/public-objects/")) {
          imagePath = `/public-objects/${imagePath}`;
        }
        return imagePath;
      });
      
      await storage.updateProduct(req.params.id, { imageUrls: imagePaths });
      
      res.json({ imagePaths });
    } catch (error) {
      console.error('Error updating product images:', error);
      res.status(500).json({ error: "Failed to update product images" });
    }
  });

  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      
      // Check if client accepts WebP and file is an image
      const acceptsWebP = req.headers.accept?.includes('image/webp');
      const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filePath);
      
      if (acceptsWebP && isImage) {
        // Convert to WebP for better performance
        try {
          const sharp = (await import('sharp')).default;
          const chunks: Buffer[] = [];
          const stream = await objectStorageService.getObjectStream(file);
          
          stream.on('data', (chunk: Buffer) => chunks.push(chunk));
          stream.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const webpBuffer = await sharp(buffer)
                .webp({ quality: 80 })
                .toBuffer();
              
              res.set('Content-Type', 'image/webp');
              res.set('Cache-Control', 'public, max-age=31536000, immutable');
              res.send(webpBuffer);
            } catch (conversionError) {
              console.error('WebP conversion failed, serving original:', conversionError);
              objectStorageService.downloadObject(file, res);
            }
          });
          stream.on('error', () => {
            objectStorageService.downloadObject(file, res);
          });
        } catch (sharpError) {
          console.error('Sharp import failed:', sharpError);
          objectStorageService.downloadObject(file, res);
        }
      } else {
        // Serve original with caching
        res.set('Cache-Control', 'public, max-age=31536000, immutable');
        objectStorageService.downloadObject(file, res);
      }
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // SEO: Dynamic HTML for product pages (Server-Side Rendering for meta tags)
  // This route intercepts product page requests and injects SEO meta tags before serving
  app.get("/brand/:brand/:code", async (req, res, next) => {
    try {
      const productCode = decodeURIComponent(req.params.code);
      const product = await storage.getProductByCode(productCode);
      
      if (!product) {
        // If product not found, let the SPA handle 404
        return next();
      }
      
      // Determine which HTML template to use based on environment
      let templatePath: string;
      const isProduction = process.env.NODE_ENV === 'production' || 
                          (req.app.get("env") !== "development");
      
      if (isProduction) {
        // Production: use built index.html
        templatePath = path.resolve(import.meta.dirname, "public", "index.html");
      } else {
        // Development: use source index.html
        templatePath = path.resolve(import.meta.dirname, "..", "client", "index.html");
      }
      
      // Check if template exists
      if (!fs.existsSync(templatePath)) {
        console.log(`Template not found at ${templatePath}, falling back to SPA`);
        return next();
      }
      
      // Read template and generate dynamic HTML
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const dynamicHtml = generateProductHtml(template, product);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(dynamicHtml);
    } catch (error) {
      console.error("Error generating dynamic product page:", error);
      next();
    }
  });

  // SEO: Dynamic HTML for product pages accessed by ID or product code
  app.get("/product/:idOrCode", async (req, res, next) => {
    try {
      const idOrCode = decodeURIComponent(req.params.idOrCode);
      
      // Try to find product by code first (most common for production URLs)
      let product = await storage.getProductByCode(idOrCode);
      
      // If not found by code, try by UUID
      if (!product) {
        product = await storage.getProduct(idOrCode);
      }
      
      if (!product) {
        return next();
      }
      
      // Determine which HTML template to use
      let templatePath: string;
      const isProduction = process.env.NODE_ENV === 'production' || 
                          (req.app.get("env") !== "development");
      
      if (isProduction) {
        templatePath = path.resolve(import.meta.dirname, "public", "index.html");
      } else {
        templatePath = path.resolve(import.meta.dirname, "..", "client", "index.html");
      }
      
      if (!fs.existsSync(templatePath)) {
        return next();
      }
      
      const template = await fs.promises.readFile(templatePath, "utf-8");
      const dynamicHtml = generateProductHtml(template, product);
      
      res.status(200).set({ "Content-Type": "text/html" }).end(dynamicHtml);
    } catch (error) {
      console.error("Error generating dynamic product page:", error);
      next();
    }
  });

  // robots.txt
  app.get("/robots.txt", (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Allow: /api/products
Allow: /api/products/
Allow: /api/categories
Allow: /api/categories/
Disallow: /admin
Disallow: /api/upload
Disallow: /api/presigned-url

Sitemap: https://agorarockdrill.shop/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Sitemap.xml
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      const baseUrl = "https://agorarockdrill.shop";
      
      // Helper function to create URL-friendly slug
      const createSlug = (text: string): string => {
        return text
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]+/g, '')
          .replace(/--+/g, '-')
          .trim();
      };

      // Helper function to encode URL path properly
      const encodeUrlPath = (path: string): string => {
        return path.split('/').map(segment => encodeURIComponent(segment)).join('/');
      };

      // Start XML
      let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
      xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

      // Add static pages
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/spare-parts', priority: '0.9', changefreq: 'daily' },
        { url: '/contact', priority: '0.8', changefreq: 'monthly' },
      ];

      staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${page.url}</loc>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
      });

      // Add product pages with properly encoded URLs
      products.forEach(product => {
        if (!product.delkomCode) return; // Skip products without delkomCode
        
        // Extract brand from brandCompatibility (e.g., "Atlas Copco - Epiroc" -> "atlas-copco-epiroc")
        let brandSlug = 'spare-parts';
        if (product.brandCompatibility) {
          // Take first brand if multiple brands exist
          const firstBrand = product.brandCompatibility.split(',')[0].trim();
          brandSlug = createSlug(firstBrand);
        }
        
        // Create URL with encoded product code (handles spaces and special chars)
        const encodedCode = encodeURIComponent(product.delkomCode);
        const productUrl = `/brand/${brandSlug}/${encodedCode}`;
        
        // Safely handle date conversion
        let lastModDate = new Date().toISOString().split('T')[0];
        if (product.updatedAt) {
          try {
            const dateObj = product.updatedAt instanceof Date 
              ? product.updatedAt 
              : new Date(product.updatedAt);
            lastModDate = dateObj.toISOString().split('T')[0];
          } catch (e) {
            // Use current date as fallback
          }
        }
        
        xml += '  <url>\n';
        xml += `    <loc>${baseUrl}${productUrl}</loc>\n`;
        xml += `    <lastmod>${lastModDate}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.7</priority>\n`;
        xml += '  </url>\n';
      });

      // Close XML
      xml += '</urlset>';

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).json({ error: "Failed to generate sitemap" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
