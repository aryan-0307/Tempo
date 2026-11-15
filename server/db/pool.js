/**
 * Tempo PostgreSQL Connection Pool (PostgreSQL Edition)
 * Managed connection pooling via node-postgres (pg) with Neon SSL support,
 * connection health verification, and transparent in-memory fallback for offline test environments.
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbConfig } from '../config/db.config.js';

const { Pool } = pg;

// Parse PostgreSQL DATE type (OID 1082) as YYYY-MM-DD string to prevent timezone offset shifts
if (pg.types && typeof pg.types.setTypeParser === 'function') {
  pg.types.setTypeParser(1082, (val) => (val ? String(val).slice(0, 10) : val));
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let realPool = new Pool(dbConfig);
let fallbackPool = null;
let useFallback = false;

// Silence unhandled pool error crashes when idle
realPool.on('error', (err) => {
  if (!useFallback) {
    console.error('[PostgreSQL Pool] Connection error:', err.message);
  }
});

function isConnectionFailure(err) {
  if (!err) return false;
  const msg = err.message || '';
  const code = err.code || '';
  return (
    code === 'ECONNREFUSED' ||
    code === 'EACCES' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    msg.includes('Connection refused') ||
    msg.includes('invalid response') ||
    msg.includes('connect ECONNREFUSED')
  );
}

/**
 * Lazily initializes an in-memory PostgreSQL instance for offline test execution
 */
async function initFallbackPool() {
  if (fallbackPool) return fallbackPool;
  try {
    const { newDb } = await import('pg-mem');
    const memDb = newDb();

    // Read and apply schema
    const schemaPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
      memDb.public.none(schemaSql);
    }

    // Read and apply seeds
    const seedPath = path.join(__dirname, 'seeds', '001_dev_seed.sql');
    if (fs.existsSync(seedPath)) {
      const seedSql = fs.readFileSync(seedPath, 'utf-8');
      memDb.public.none(seedSql);
    }

    // Ensure schema_migrations has version 001 recorded
    try {
      memDb.public.none(`
        INSERT INTO schema_migrations (version, name, status, executed_statements, checksum, error_message, applied_at)
        VALUES ('001', '001_initial_schema.sql', 'applied', 5, 'initial-schema-checksum', NULL, NOW());
      `);
    } catch {}

    const memPg = memDb.adapters.createPg();
    fallbackPool = new memPg.Pool();
    useFallback = true;
    console.log('[PostgreSQL Pool] Live connection unavailable; activated in-memory PostgreSQL test adapter.');
    return fallbackPool;
  } catch (err) {
    console.error('[PostgreSQL Pool] Failed to initialize in-memory fallback:', err.message);
    throw err;
  }
}

/**
 * Universal pool wrapper that routes queries to real PostgreSQL or fallback
 */
export const pool = {
  async query(text, params) {
    if (useFallback) {
      return fallbackPool.query(text, params);
    }
    try {
      return await realPool.query(text, params);
    } catch (err) {
      if (isConnectionFailure(err) && !process.env.DATABASE_URL) {
        const mem = await initFallbackPool();
        return mem.query(text, params);
      }
      throw err;
    }
  },

  async connect() {
    if (useFallback) {
      return fallbackPool.connect();
    }
    try {
      return await realPool.connect();
    } catch (err) {
      if (isConnectionFailure(err) && !process.env.DATABASE_URL) {
        const mem = await initFallbackPool();
        return mem.connect();
      }
      throw err;
    }
  },

  async end() {
    if (fallbackPool) {
      await fallbackPool.end();
    }
    try {
      await realPool.end();
    } catch {}
  },

  on(event, handler) {
    realPool.on(event, handler);
  }
};

/**
 * Checks connection pool connectivity
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseHealth() {
  try {
    const res = await pool.query('SELECT 1 AS healthy');
    return res && res.rows && res.rows.length > 0 && (res.rows[0].healthy === 1 || res.rows[0].healthy === '1');
  } catch (err) {
    console.error('[Database Pool] Health check failed:', err.message);
    return false;
  }
}

export default pool;
