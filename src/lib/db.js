import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL is missing. Database queries will fail.');
}

/**
 * Create a Neon SQL-over-HTTP query function.
 * This is the primary way to execute queries — ideal for serverless environments.
 * Each call uses Neon's HTTP-based SQL execution (no persistent connection needed).
 */
const sql = databaseUrl ? neon(databaseUrl) : null;

/**
 * Execute a parameterized SQL query.
 * Returns the array of row objects from the result.
 *
 * Usage:
 *   const rows = await query('SELECT * FROM buyers WHERE id = $1', [buyerId]);
 *
 * @param {string} text - SQL query with $1, $2, ... placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<Array<Object>>} - Array of row objects
 */
export async function query(text, params = []) {
  if (!sql) {
    throw new Error('Database not configured. Please set DATABASE_URL environment variable.');
  }
  return sql(text, params);
}

/**
 * Check if the database is configured.
 * @returns {boolean}
 */
export function isDbConfigured() {
  return !!sql;
}
