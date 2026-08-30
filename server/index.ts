import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Redirect replit.app domain to custom domain for SEO
app.use((req, res, next) => {
  const host = req.get('host') || '';
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  
  // If request is coming from replit.app, redirect to custom domain
  if (host.includes('replit.app')) {
    const newUrl = `https://agorarockdrill.shop${req.originalUrl}`;
    return res.redirect(301, newUrl);
  }
  
  next();
});

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    // Check for required environment variables
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set. Please configure it in deployment settings.");
    }

    if (!process.env.PUBLIC_OBJECT_SEARCH_PATHS) {
      console.warn("Warning: PUBLIC_OBJECT_SEARCH_PATHS environment variable is not set. Object storage features may not work properly.");
    }

    log("Initializing server...");
    const server = await registerRoutes(app);
    log("Routes registered successfully");

    // Ensure every product has a SEO slug (covers legacy rows imported directly)
    storage.backfillProductSlugs()
      .then((n: number) => { if (n > 0) log(`Backfilled slugs for ${n} product(s)`); })
      .catch((err: unknown) => console.error("Slug backfill failed:", err));

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      log("Setting up Vite in development mode...");
      await setupVite(app, server);
    } else {
      log("Serving static files in production mode...");
      serveStatic(app);
    }

    // ALWAYS serve the app on the port specified in the environment variable PORT
    // Other ports are firewalled. Default to 5000 if not specified.
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = parseInt(process.env.PORT || '5000', 10);
    
    log(`Starting server on port ${port}...`);
    
    server.listen(port, "0.0.0.0", () => {
      log(`✓ Server successfully started on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    server.on('error', (error: NodeJS.ErrnoException) => {
      console.error("Server error:", error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error("Failed to start server:");
    console.error(error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
})();
