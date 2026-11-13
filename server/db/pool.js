/**
 * Tempo MySQL Connection Pool (Phase 4.3)
 * Provides managed connection pooling via mysql2/promise with connection health checking.
 */

import mysql from 'mysql2/promise';
import { dbConfig } from '../config/db.config.js';

// Create singleton connection pool
export const pool = mysql.createPool(dbConfig);

/**
 * Checks connection pool connectivity
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseHealth() {
  try {
    const [rows] = await pool.query('SELECT 1 AS healthy');
    return rows && rows.length > 0 && rows[0].healthy === 1;
  } catch (err) {
    console.error('[Database Pool] Health check failed:', err.message);
    return false;
  }
}

export default pool;

