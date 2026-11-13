/**
 * Tempo Database Configuration Module (Phase 4.1)
 * Loads and validates environment variables for MySQL connection pooling and UTC serialization.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

// Load .env from project root if present
dotenv.config({ path: path.join(projectRoot, '.env') });

/**
 * Validates required database configuration parameters.
 * Returns diagnostic details to assist local development setup.
 */
export function validateDbEnv() {
  const missing = [];
  const warnings = [];

  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const database = process.env.DB_NAME || 'tempo_db';

  if (!process.env.DB_NAME) {
    warnings.push("DB_NAME not explicitly set in .env; using default 'tempo_db'.");
  }

  if (isNaN(port) || port <= 0 || port > 65535) {
    missing.push(`Invalid DB_PORT: '${process.env.DB_PORT}'. Must be a valid port number (1-65535).`);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.DB_PASSWORD) {
    warnings.push("DB_PASSWORD is empty in production mode. A secure password is strongly advised.");
  }

  return {
    isValid: missing.length === 0,
    missing,
    warnings,
    summary: {
      host,
      port,
      user,
      database,
      environment: process.env.NODE_ENV || 'development'
    }
  };
}

/**
 * Connection pool configuration object for mysql2/promise
 */
export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tempo_db',
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS !== 'false',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0', 10),
  connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
  // Force UTC timezone handling for consistent date and time serialization
  timezone: process.env.DB_TIMEZONE || 'Z',
  // Return DATE and DATETIME as exact ISO-compliant strings without timezone shifts
  dateStrings: ['DATE'],
  multipleStatements: false // Security hardening: prevent multiple statement injection
};

