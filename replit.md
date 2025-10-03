# Overview

This is a full-stack e-commerce application for industrial spare parts, specifically hydraulic rock drill and drill rig components. The application allows users to browse, search, and filter spare parts for various industrial equipment brands (Atlas Copco, Epiroc, Jumbo, Furukawa, etc.). It includes an admin panel for managing products and categories.

The stack consists of:
- **Frontend**: React with TypeScript, Vite build tool, Wouter for routing
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI primitives with shadcn/ui styling and Tailwind CSS

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
- Routes are defined in `App.tsx` with three main pages: Home, Spare Parts listing, and Admin panel
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
- **Products Table**: id (UUID), name, description, delkomCode (unique), referenceCode, pricing fields (originalPrice, discountPercentage, finalPrice), imageUrl, categoryId (FK), brandCompatibility, stockStatus, feature flags (isFeatured, isDiscounted), timestamps

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

**Object Storage & File Upload**
- `@google-cloud/storage` - Google Cloud Storage client for Replit object storage
- `@uppy/core`, `@uppy/react`, `@uppy/dashboard`, `@uppy/aws-s3` - File upload UI and S3-compatible upload handling
- Uppy CSS loaded via CDN in `index.css` to avoid build errors