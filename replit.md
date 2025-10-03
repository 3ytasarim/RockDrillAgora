# Overview

This is a full-stack catalog website for industrial spare parts, specifically hydraulic rock drill and drill rig components. The application allows users to browse, search, and filter spare parts for various industrial equipment brands (Atlas Copco, Epiroc, Jumbo, Furukawa, etc.). It features a "Request Quote" system (no e-commerce checkout) and includes an admin panel for managing products and categories.

The stack consists of:
- **Frontend**: React with TypeScript, Vite build tool, Wouter for routing, Framer Motion for animations
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives with shadcn/ui styling and Tailwind CSS
- **Brand Colors**: Orange #ed582e (hsl(13 84% 55%)) and Blue #1856a3 (hsl(213 74% 37%))

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**React SPA with TypeScript**
- The application uses React 18 with TypeScript for type safety and modern React patterns
- Vite serves as the build tool and development server, providing fast HMR and optimized production builds
- Component structure follows a modular pattern with separate directories for UI components, pages, and shared utilities

**Routing Strategy**
- Wouter is used instead of React Router for a lightweight client-side routing solution
- Routes are defined in `App.tsx` with main pages: Home, Spare Parts listing, Product Detail, and Admin panel
- Product detail route: `/product/:id` displays individual product information
- A catch-all NotFound component handles undefined routes

**State Management**
- TanStack Query (React Query) manages server state, caching, and data fetching
- Query keys follow a REST-like pattern (e.g., `["/api/products"]`)
- Local component state is managed with React hooks (useState, useEffect)

**UI Component System**
- shadcn/ui provides pre-built, customizable Radix UI components
- Tailwind CSS handles styling with a custom theme configuration
- CSS variables enable dynamic theming with support for light/dark modes
- Component aliases are configured in tsconfig.json for clean imports (`@/components`, `@/lib`, etc.)

## Backend Architecture

**Express.js REST API**
- The server follows a classic Express.js pattern with route handlers and middleware
- All API endpoints are prefixed with `/api` for clear separation from frontend routes
- Request/response logging middleware tracks API performance and captures JSON responses

**Data Layer Abstraction**
- `IStorage` interface defines the contract for data operations (CRUD for products and categories)
- `DatabaseStorage` class implements this interface using Drizzle ORM
- This abstraction allows for easy swapping of data storage implementations if needed

**Server-Side Rendering Integration**
- In development, Vite middleware is integrated directly into Express for HMR
- Production builds serve static files from the `dist/public` directory
- The server handles both API requests and serves the SPA

## Database Design

**PostgreSQL with Drizzle ORM**
- Database connection uses Neon's serverless PostgreSQL driver with WebSocket support
- Schema is defined in TypeScript using Drizzle's table definitions
- Two main entities: `categories` and `products`

**Schema Structure**
- **Categories Table**: id (UUID), name, description, icon (Font Awesome class), createdAt
- **Products Table**: id (UUID), name, description, delkomCode (unique), referenceCode, pricing fields (originalPrice, discountPercentage, finalPrice), imageUrl (single image, legacy), imageUrls (array for multiple images), categoryId (FK), brandCompatibility, stockStatus, feature flags (isFeatured, isDiscounted), timestamps

**Relationships**
- Products have a many-to-one relationship with categories
- Drizzle relations enable joined queries to fetch products with their category data
- The `ProductWithCategory` type represents the joined query result

**Validation**
- Zod schemas are generated from Drizzle table definitions using `drizzle-zod`
- Insert schemas omit auto-generated fields (id, timestamps)
- Form validation uses these schemas via `@hookform/resolvers/zod`

## API Design

**RESTful Endpoints**
- `GET /api/products` - List products with optional query filters (search, category, featured, discounted)
- `GET /api/products/:id` - Get single product with category
- `POST /api/products` - Create new product (validates against insertProductSchema)
- `PUT /api/products/:id` - Update existing product
- `DELETE /api/products/:id` - Delete product
- Similar CRUD endpoints exist for `/api/categories`

**Image Upload Endpoints**
- `POST /api/products/image-upload` - Generate presigned URL for product image upload (returns { uploadURL, publicPath })
- `PUT /api/products/:id/image` - Associate uploaded image with product (idempotent path normalization)
- `GET /public-objects/:filePath(*)` - Serve uploaded product images from object storage

**Query Parameters**
- Products can be filtered by: search term, category ID, featured status, discounted status
- The storage layer translates these filters into Drizzle ORM queries

**Error Handling**
- Validation errors return 400 with error details
- Not found resources return 404
- Server errors return 500 with generic error messages
- Client-side errors are caught by React Query and displayed via toast notifications

## Object Storage Integration

**Replit Object Storage**
- Uses Replit's built-in Google Cloud Storage integration
- Default bucket: `replit-objstore-49a775fc-ae30-4753-be2a-a4e4716732bf`
- Public directory for product images: `/replit-objstore-49a775fc-ae30-4753-be2a-a4e4716732bf/public`
- Environment variables: `PUBLIC_OBJECT_SEARCH_PATHS`, `PRIVATE_OBJECT_DIR`, `DEFAULT_OBJECT_STORAGE_BUCKET_ID`

**ObjectStorageService** (`server/objectStorage.ts`)
- Generates presigned URLs for direct browser-to-storage uploads
- Normalizes upload URLs to public paths for database storage
- Serves uploaded images via `/public-objects/` endpoint
- Handles path validation and idempotent updates

**ObjectUploader Component** (`client/src/components/ObjectUploader.tsx`)
- Reusable React component using Uppy for file uploads
- Features: modal UI, progress tracking, file type validation
- Uses useEffect pattern to properly manage Uppy lifecycle
- Cleanup with `cancelAll()` and `clear()` to prevent memory leaks
- Memoized handlers via useCallback to avoid stale closures

**Image Upload Flow**
1. User clicks "Browse Files" in product form
2. Frontend fetches presigned URL and public path from backend
3. Preview is set immediately using public path
4. User selects and uploads file directly to storage via presigned URL
5. On upload complete, upload URL is stored in component state
6. User submits product form → Product created in database
7. If image was uploaded, product is automatically updated with image path
8. Images are served from `/public-objects/product-images/` path

# External Dependencies

**Database Service**
- Neon Serverless PostgreSQL (`@neondatabase/serverless`)
- Connection pooling via Neon's Pool implementation
- WebSocket-based connection using `ws` package
- Connection string provided via `DATABASE_URL` environment variable

**UI Component Libraries**
- Radix UI primitives for accessible, unstyled components
- All major component types included: dialogs, dropdowns, forms, navigation, data display
- Components are wrapped with custom styling via class-variance-authority

**Form Management**
- React Hook Form for form state management
- Zod for schema validation
- `@hookform/resolvers` bridges the two libraries

**Data Fetching**
- TanStack Query v5 for server state management
- Custom query functions in `lib/queryClient.ts` handle authentication and error responses
- Fetch API used for HTTP requests

**Build Tools**
- Vite for frontend bundling and dev server
- esbuild for backend bundling (production)
- tsx for running TypeScript in development
- PostCSS with Tailwind CSS for styling

**Development Tools (Replit-specific)**
- `@replit/vite-plugin-runtime-error-modal` for error overlays
- `@replit/vite-plugin-cartographer` for code mapping
- `@replit/vite-plugin-dev-banner` for development indicators
- These plugins are conditionally loaded only in Replit environment

**Utility Libraries**
- `date-fns` for date manipulation
- `clsx` and `tailwind-merge` for conditional class names
- `nanoid` for generating unique IDs
- `embla-carousel-react` for carousel components
- `framer-motion` for scroll-based and interactive animations

**Object Storage & File Upload**
- `@google-cloud/storage` - Google Cloud Storage client for Replit object storage
- `@uppy/core`, `@uppy/react`, `@uppy/dashboard`, `@uppy/aws-s3` - File upload UI and S3-compatible upload handling
- Uppy CSS loaded via CDN in `index.css` to avoid build errors

## Homepage Design

**Hero Carousel Slider**
- Professional Embla carousel with 3 rock drill stock images
- Auto-play (5-second delay) with manual navigation controls
- Previous/Next buttons with backdrop blur and scale animations
- Pagination dots at bottom with active state indicator
- Responsive design with gradient backgrounds and overlay patterns
- Test IDs: `button-hero-prev`, `button-hero-next`, `button-hero-dot-{index}`
- Real content:
  - Slide 1: "AGORA ROCK DRILL" - 20 YEARS EXPERIENCE
  - Slide 2: "EXTENSIVE INVENTORY" - 700+ m² Warehouse
  - Slide 3: "GLOBAL DELIVERY" - DHL, FedEx, UPS

**Company Production Info Section**
- Modern split-screen card with rounded corners and shadow
- Left: Company mission text + 3 warehouse thumbnail images (local stock images)
- Right: Professional team collaboration image (local stock image)
- Framer Motion animations: fade-in on scroll, hover scale on thumbnails
- Text: "We produce professional solutions for spare parts, service and maintenance needs of rock drilling machines"
- Real company data: AGORA Rock Drill A.Ş., 20 years experience, 700+ m² warehouse in Ankara

**Quality Guarantee Section**
- White card with golden award badge icon (rotates on hover)
- 3 months warranty guarantee quote
- Clean typography with professional spacing
- Slide-in animation from left on scroll

**Need Help / Expert Consultation Section**
- Red accent bar for visual emphasis
- "NEED HELP?" heading with bold expert title
- Description of consultation services
- Contact buttons with animations:
  - "Send us a Mail" - email link with Mail icon (data-testid: `link-email-contact`)
  - "Write to Whatsapp" - WhatsApp link with icon (data-testid: `link-whatsapp-contact`)
- Scale animations on hover/tap

**Request Form**
- Yellow/amber gradient background (from-amber-400 to-amber-500)
- Sticky positioning for better UX
- Form fields: Name, Corporate, Mail, Phone, Message (all required)
- Dark "REQUEST A QUOTE" button with hover effects
- Lift animation on card hover, slide-in from right on scroll
- Uses shadcn Input and Textarea components

**Category-Based Product Listing**
- Products grouped by category instead of featured/discounted
- Each category section shows:
  - Font Awesome icon + category name
  - Category description
  - Up to 4 products in responsive grid
  - "View All" button linking to filtered spare parts page
- Font Awesome 6.5.1 loaded via CDN for category icons

## Product Detail Page

**Modern Animated Design**
- Professional, animated product detail page with Framer Motion transitions
- Gradient background (from-slate-50 to-slate-100)
- Route: `/product/:id` - Individual product view
- ProductCard components are clickable and navigate to detail page with hover animations

**Image Gallery Carousel**
- Embla Carousel with loop enabled for product image gallery
- Supports multiple product images via `imageUrls` array (fallback to single `imageUrl`)
- Previous/Next navigation buttons with hover scale animations
- Thumbnail gallery (grid layout) with active state indicators
- Clicking thumbnails navigates to specific image
- All images displayed with object-contain on gradient backgrounds
- Test IDs: `button-gallery-prev`, `button-gallery-next`, `button-thumbnail-{index}`

**Product Information Display**
- Breadcrumb navigation: Home > Spare Parts > Category > Product Name
- Product title (text-4xl/5xl), description, and featured badge
- Product details cards with icons:
  - Delkom Code (Package icon)
  - Reference Code (FileText icon)
  - Brand Compatibility (displayed as gradient pills/badges)
  - Category (Font Awesome icon + name, links to filtered spare parts)
- Feature cards:
  - 3 Months Warranty (Shield icon, green accent)
  - Worldwide Shipping (Truck icon, blue accent)

**Action Buttons**
- Main "REQUEST A QUOTE" button (gradient from-primary to-accent) - opens RequestQuoteModal
- Secondary action buttons:
  - Save to Favorites (Heart icon) - placeholder
  - Share Product (Share2 icon) - placeholder
- Test IDs: `request-quote-btn`, `button-save-favorite`, `button-share-product`

**Need Help Section**
- Blue gradient info card (from-blue-50 to-indigo-50)
- Company contact information: agora@agorarockdrill.com, +90 312 385 60 03
- Expert assistance messaging

**Animations**
- Page sections fade-in and slide from left/right on mount (staggered delays)
- Hover effects on all interactive elements (scale, shadow)
- Image carousel smooth transitions
- All animations use Framer Motion for performance