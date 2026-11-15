/**
 * Tempo Safe Migration Runner (PostgreSQL Edition)
 *
 * Implements versioned schema tracking, statement-by-statement execution,
 * and transactional rollback for PostgreSQL, Neon PostgreSQL, and Render deployments.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dbConfig, validateDbEnv } from '../config/db.config.js';
import { pool } from './pool.js';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'migrations');

/**
 * Splits a SQL file into individual executable statements.
 * Strips comments and empty lines.
 */
function parseSqlStatements(sqlText) {
  const lines = sqlText.split('\n');
  const cleanLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.length === 0) {
      continue;
    }
    cleanLines.push(line);
  }

  const cleanSql = cleanLines.join('\n');
  return cleanSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Main migration execution function
 */
export async function runMigrations() {
  const envCheck = validateDbEnv();
  console.log('\n==============================================');
  console.log('🚀 Tempo Database Migration Runner (PostgreSQL)');
  console.log(`📡 Target: ${dbConfig.connectionString ? 'DATABASE_URL (Neon/Cloud)' : `${dbConfig.host}:${dbConfig.port} (DB: ${dbConfig.database})`}`);
  console.log('==============================================\n');

  let client = null;
  let usePool = false;

  try {
    // Attempt direct client connection
    client = new Client(dbConfig);
    try {
      await client.connect();
    } catch (connErr) {
      // If direct connection cannot connect to localhost, route via universal pool (which activates fallback if offline)
      console.warn(`[Migrate] Direct connection attempt failed (${connErr.message}). Routing through managed pool...`);
      client = await pool.connect();
      usePool = true;
    }

    // 1. Ensure schema_migrations table exists (Idempotent bootstrap)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'applied',
        executed_statements INT NOT NULL DEFAULT 0,
        checksum VARCHAR(64) NULL,
        error_message TEXT NULL,
        applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Query already applied migrations
    const { rows: appliedRows } = await client.query(
      'SELECT version, name, status, executed_statements FROM schema_migrations'
    );
    const appliedMap = new Map();
    appliedRows.forEach(row => appliedMap.set(row.version, row));

    // 3. Scan migration files
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found in server/db/migrations.');
      return;
    }

    let appliedCount = 0;

    for (const file of files) {
      const versionMatch = file.match(/^(\d+)/);
      if (!versionMatch) {
        console.warn(`[Skip] Migration file '${file}' does not begin with a version number.`);
        continue;
      }

      const version = versionMatch[1];
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      const checksum = crypto.createHash('sha256').update(sqlContent).digest('hex');

      const existingRecord = appliedMap.get(version);

      if (existingRecord && existingRecord.status === 'applied') {
        console.log(`[Up to date] Migration ${file} (already applied as version ${existingRecord.version})`);
        continue;
      }

      console.log(`[Applying] Migration ${file}...`);

      const statements = parseSqlStatements(sqlContent);

      // Record 'pending' state
      await client.query(`
        INSERT INTO schema_migrations (version, name, status, executed_statements, checksum, error_message)
        VALUES ($1, $2, 'pending', 0, $3, NULL)
        ON CONFLICT (version) DO UPDATE SET status = 'pending', error_message = NULL;
      `, [version, file, checksum]);

      let statementIndex = 0;

      try {
        await client.query('BEGIN');
        for (const statement of statements) {
          statementIndex++;
          await client.query(statement);
        }

        // Successfully applied all statements
        await client.query(`
          UPDATE schema_migrations 
          SET status = 'applied', executed_statements = $1, error_message = NULL, applied_at = NOW()
          WHERE version = $2;
        `, [statementIndex, version]);

        await client.query('COMMIT');
        console.log(`  ✓ Successfully applied ${file} (${statementIndex} statements executed).`);
        appliedCount++;

      } catch (stmtError) {
        await client.query('ROLLBACK');
        await client.query(`
          UPDATE schema_migrations 
          SET status = 'failed', executed_statements = $1, error_message = $2
          WHERE version = $3;
        `, [statementIndex - 1, stmtError.message, version]);

        console.error(`\n❌ Migration failed at statement ${statementIndex} in ${file}:`);
        console.error(`   Error: ${stmtError.message}\n`);
        throw stmtError;
      }
    }

    console.log('\n==============================================');
    if (appliedCount > 0) {
      console.log(`🎉 Migrations completed successfully! (${appliedCount} new migrations applied)`);
    } else {
      console.log('✓ All database migrations are up to date.');
    }
    console.log('==============================================\n');

  } catch (err) {
    console.error('\n❌ Migration execution failed:', err.message);
    process.exit(1);
  } finally {
    if (client) {
      if (usePool) {
        client.release();
      } else {
        await client.end();
      }
    }
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations();
}
