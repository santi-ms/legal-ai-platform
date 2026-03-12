/**
 * Setup script for testing
 * Configures DATABASE_URL for SQLite if not set
 */

// Set DATABASE_URL to SQLite for testing if not already set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "file:./test.db";
  console.log("⚠️  DATABASE_URL not set, using SQLite for testing: file:./test.db");
}

// Import and run the actual test
import "./test-generation.js";

