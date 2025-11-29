# Overview

This project is a full-stack catalog website for industrial spare parts, specifically hydraulic rock drill and drill rig components. It enables users to browse, search, and filter parts from various industrial equipment brands (Atlas Copco - Epiroc, Sandvik, Furukawa). The application includes a "Request Quote" system and an administrative panel for managing products and categories. The technology stack comprises React with TypeScript for the frontend, Express.js with TypeScript for the backend, and PostgreSQL with Drizzle ORM for the database.

## Recent Updates (Nov 29, 2025)

**Server-Side Rendering for SEO (Soft 404 Fix):**
- Implemented server-side HTML generation for product pages (`/brand/:brand/:code` and `/product/:id`)
- Dynamic meta tags injected before serving HTML (title, description, canonical, Open Graph, Twitter)
- Added `<noscript>` fallback with visible product content for search engine crawlers
- JSON-LD Schema.org Product data generated server-side
- Fixes Google Search Console "Soft 404" error for SPA pages

**SEO Improvements (Nov 27, 2025):**
- Added `/robots.txt` endpoint with sitemap directive for search engine crawlers
- Enhanced `/sitemap.xml` with properly URL-encoded product links
- Implemented Schema.org Product JSON-LD structured data on all product pages
- Added comprehensive meta tags (title, description, og:title, og:description, og:image, og:type)
- Added canonical URLs matching sitemap structure for consistent indexing
- Installed `react-helmet` for dynamic document head management

**Performance Optimizations (Nov 13, 2025):**
- Implemented native lazy loading (`loading="lazy"`) for all images across the application
- Hero slider and product detail first images use eager loading for faster perceived performance
- Limited featured products API response to 12 items (was loading all products)
- Removed legacy `referenceCode` field from codebase (now uses `delkomCode` only)
- All optimizations maintain backward compatibility with no breaking changes

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend

The frontend is a React SPA built with TypeScript and Vite. It uses Wouter for lightweight routing and TanStack Query for server state management. UI components are built with Radix UI primitives and styled using shadcn/ui and Tailwind CSS, supporting dynamic theming. A key feature is a real-time autocomplete search bar with a responsive dropdown, filtering by product name and Delkom code, and featuring Framer Motion animations for smooth interactions. Images are optimized with native lazy loading for improved performance.

## Backend

The backend is an Express.js REST API with all endpoints prefixed by `/api`. It uses a data layer abstraction (`IStorage` interface implemented by `DatabaseStorage` with Drizzle ORM) to manage CRUD operations for products and categories. The server handles both API requests and serves the static frontend assets.

## Database Design

The system uses PostgreSQL with Drizzle ORM, connected via Neon's serverless driver. The schema includes `categories` (id, name, description, icon) and `products` (id, name, description, delkomCode, pricing, imageUrls, categoryId, brandCompatibility, stockStatus, feature flags). Products have a many-to-one relationship with categories. Zod schemas generated from Drizzle definitions are used for validation.

## API Design

The API provides RESTful endpoints for CRUD operations on `/api/products` and `/api/categories`, supporting query parameters for filtering products. It also includes endpoints for image upload, generating presigned URLs for direct object storage uploads, and associating images with products. Error handling returns standard HTTP status codes (400, 404, 500).

## Object Storage Integration

The project integrates with Replit Object Storage, utilizing Google Cloud Storage. An `ObjectStorageService` generates presigned URLs for uploads and normalizes public paths. The frontend `ObjectUploader` component, built with Uppy, handles file selection and direct uploads, with images then associated with products and served via a dedicated `/public-objects/` endpoint.

## Homepage Design

The homepage features a professional Embla carousel for a hero section with auto-play and navigation. It includes a "Company Production Info" section with text and thumbnail images, a "Quality Guarantee" section, and a "Need Help / Expert Consultation" section with contact options. A sticky "Request Form" with fields for Name, Corporate, Mail, Phone, and Message is also present. Products are listed grouped by category, each with an icon, description, up to 4 products, and a "View All" link.

## Product Detail Page

The product detail page (`/product/:id`) features a modern, animated design with Framer Motion transitions. It includes an Embla Carousel for image galleries (supporting multiple images and thumbnails), comprehensive product information (breadcrumbs, title, description, codes, brand compatibility, category, warranty, shipping info), and action buttons like "Request a Quote," "Save to Favorites," and "Share Product." A "Need Help" section provides contact information.

# External Dependencies

**Database Service:** Neon Serverless PostgreSQL (`@neondatabase/serverless`).

**UI Component Libraries:** Radix UI, shadcn/ui.

**Form Management:** React Hook Form, Zod, `@hookform/resolvers`.

**Data Fetching:** TanStack Query v5, native Fetch API.

**Build Tools:** Vite (frontend), esbuild (backend), tsx, PostCSS, Tailwind CSS.

**Development Tools (Replit-specific):** `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`.

**Utility Libraries:** `date-fns`, `clsx`, `tailwind-merge`, `nanoid`, `embla-carousel-react`, `framer-motion`.

**Object Storage & File Upload:** `@google-cloud/storage`, Uppy (`@uppy/core`, `@uppy/react`, `@uppy/dashboard`, `@uppy/aws-s3`).