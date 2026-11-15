/**
 * Tempo Database Configuration Module (PostgreSQL Edition)
 * Loads and validates environment variables for PostgreSQL connection pooling,
 * Neon cloud database compatibility (DATABASE_URL + SSL), and Render deployment.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import dns from 'dns';
import path from 'path';
import { fileURLToPath } from 'url';

// Resilient DNS resolution fallback for cloud environments where local ISP/OS DNS refuses external cloud hostnames
const originalDnsLookup = dns.lookup;
const dnsResolver = new dns.promises.Resolver();
try {
  dnsResolver.setServers(['1.1.1.1', '8.8.8.8', '1.0.0.1', '8.8.4.4']);
} catch {}

dns.lookup = function (hostname, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  originalDnsLookup(hostname, options, (err, address, family) => {
    if (!err && address) {
      return callback(null, address, family);
    }
    // Fallback to public DNS resolver for neon.tech or cloud endpoints if OS lookup failed
    dnsResolver.resolve4(hostname)
      .then((ips) => {
        if (options && options.all) {
          callback(null, ips.map((ip) => ({ address: ip, family: 4 })));
        } else {
          callback(null, ips[0], 4);
        }
      })
      .catch((resolveErr) => callback(err || resolveErr));
  });
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Load .env.local first (e.g. from neon deploy), then .env from project root
const envLocalPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config({ path: path.join(projectRoot, '.env') });

/**
 * Determines whether SSL should be enabled based on connection string or environment
 */
function isSslRequired(connectionString) {
  if (process.env.DB_SSL === 'true' || process.env.DB_SSL === '1') {
    return true;
  }
  if (connectionString) {
    return connectionString.includes('sslmode=require') ||
           connectionString.includes('neon.tech') ||
           connectionString.includes('render.com') ||
           connectionString.includes('ssl=true');
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * Validates required database configuration parameters.
 * Returns diagnostic details to assist local development and cloud deployment setup.
 */
export function validateDbEnv() {
  const missing = [];
  const warnings = [];

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const user = process.env.DB_USER || 'postgres';
  const database = process.env.DB_NAME || 'tempo_db';

  if (!databaseUrl && !process.env.DB_NAME) {
    warnings.push("Neither DATABASE_URL nor DB_NAME is set in .env; defaulting to database 'tempo_db'.");
  }

  if (!databaseUrl && (isNaN(port) || port <= 0 || port > 65535)) {
    missing.push(`Invalid DB_PORT: '${process.env.DB_PORT}'. Must be a valid port number (1-65535).`);
  }

  if (process.env.NODE_ENV === 'production' && !databaseUrl && !process.env.DB_PASSWORD) {
    warnings.push("DB_PASSWORD is empty in production mode. Set DATABASE_URL or DB_PASSWORD.");
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    summary: {
      type: databaseUrl ? 'connection-string (DATABASE_URL)' : 'discrete-parameters',
      host: databaseUrl ? '(parsed from DATABASE_URL)' : host,
      port: databaseUrl ? '(parsed from DATABASE_URL)' : port,
      user: databaseUrl ? '(parsed from DATABASE_URL)' : user,
      database: databaseUrl ? '(parsed from DATABASE_URL)' : database,
      ssl: isSslRequired(databaseUrl),
      environment: process.env.NODE_ENV || 'development'
    }
  };
}

/**
 * Builds the pg.Pool configuration object for node-postgres (pg).
 * Supports both DATABASE_URL (for Neon / Render) and discrete parameters.
 */
function createPoolConfig() {
  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  const sslNeeded = isSslRequired(databaseUrl);

  const baseConfig = {
    max: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10)
  };

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

  if (databaseUrl) {
    return {
      ...baseConfig,
      connectionString: databaseUrl,
      ssl: sslNeeded ? { rejectUnauthorized } : false
    };
  }

  return {
    ...baseConfig,
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'tempo_db',
    ssl: sslNeeded ? { rejectUnauthorized } : false
  };
}

export const dbConfig = createPoolConfig();
export default dbConfig;
