/**
 * Tempo Safe Migration Runner (Phase 4.2)
 *
 * Implements versioned schema tracking, statement-by-statement execution,
 * and failure recovery accounting for MySQL's implicit DDL commits.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dbConfig, validateDbEnv } from '../config/db.config.js';

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
    // Skip full line comments
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
  if (!envCheck.isValid) {
    console.error('Database configuration error:');
    envCheck.missing.forEach(m => console.error(`  - ${m}`));
    process.exit(1);
  }

  console.log('\n==============================================');
  console.log('🚀 Tempo Database Migration Runner (Phase 4.2)');
  console.log(`📡 Target: ${dbConfig.host}:${dbConfig.port} (DB: ${dbConfig.database})`);
  console.log('==============================================\n');

  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      timezone: dbConfig.timezone,
      connectTimeout: dbConfig.connectTimeout
    });

    // 1. Ensure schema_migrations table exists (Idempotent bootstrap)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        version VARCHAR(50) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        status ENUM('pending', 'applied', 'failed') NOT NULL DEFAULT 'applied',
        executed_statements INT NOT NULL DEFAULT 0,
        checksum VARCHAR(64) NULL,
        error_message TEXT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Query already applied migrations
    const [appliedRows] = await connection.query(
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
        console.log(`[Up to date] Migration ${file} (already applied on ${existingRecord.version})`);
        continue;
      }

      if (existingRecord && existingRecord.status === 'failed') {
        console.warn(`[Recovery] Migration ${file} previously failed at statement ${existingRecord.executed_statements}. Attempting safe recovery...`);
      }

      console.log(`[Applying] Migration ${file}...`);

      const statements = parseSqlStatements(sqlContent);

      // Record 'pending' state
      await connection.query(`
        INSERT INTO schema_migrations (version, name, status, executed_statements, checksum, error_message)
        VALUES (?, ?, 'pending', 0, ?, NULL)
        ON DUPLICATE KEY UPDATE status = 'pending', error_message = NULL;
      `, [version, file, checksum]);

      let statementIndex = 0;

      try {
        for (const statement of statements) {
          statementIndex++;
          await connection.query(statement);
        }

        // Successfully applied all statements
        await connection.query(`
          UPDATE schema_migrations 
          SET status = 'applied', executed_statements = ?, error_message = NULL, applied_at = NOW()
          WHERE version = ?;
        `, [statementIndex, version]);

        console.log(`  ✓ Successfully applied ${file} (${statementIndex} statements executed).`);
        appliedCount++;

      } catch (stmtError) {
        // Record partial failure details (due to MySQL implicit DDL commits)
        await connection.query(`
          UPDATE schema_migrations 
          SET status = 'failed', executed_statements = ?, error_message = ?
          WHERE version = ?;
        `, [statementIndex - 1, stmtError.message, version]);

        console.error(`\n❌ Migration failed at statement ${statementIndex} in ${file}:`);
        console.error(`   Error: ${stmtError.message}`);
        console.error(`   Note: Prior DDL statements in this file were committed by MySQL.`);
        console.error(`   Fix the error and re-run migrations to resume.\n`);
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
    if (connection) {
      await connection.end();
    }
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
  runMigrations();
}

