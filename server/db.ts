import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Defer database connection initialization to allow proper error handling
function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set.");
    console.error("Please configure DATABASE_URL in your deployment settings.");
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  console.log("Initializing database connection...");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool, schema });
  console.log("Database connection initialized successfully");
  return { pool, db };
}

// Initialize only if DATABASE_URL is available
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (process.env.DATABASE_URL) {
  try {
    const initialized = initializeDatabase();
    pool = initialized.pool;
    db = initialized.db;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    // Don't throw here - let the server startup handle it
  }
} else {
  console.warn("DATABASE_URL not found - database will not be available");
}

// Export with runtime checks
export { pool };
export const getDb = () => {
  if (!db) {
    throw new Error("Database not initialized. DATABASE_URL may be missing.");
  }
  return db;
};

// For backwards compatibility, export db directly but it may be null
export { db };