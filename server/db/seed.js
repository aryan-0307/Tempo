/**
 * Tempo Development Database Seed Runner (PostgreSQL Edition)
 *
 * Populates initial sample data for users, categories, projects, and tasks.
 * Kept strictly separate from schema migrations.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dbConfig, validateDbEnv } from '../config/db.config.js';
import { pool } from './pool.js';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const seedsDir = path.join(__dirname, 'seeds');

/**
 * Splits SQL text into individual statements
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

export async function runSeeds() {
  const envCheck = validateDbEnv();
  console.log('\n==============================================');
  console.log('🌱 Tempo Database Seed Runner (PostgreSQL)');
  console.log(`📡 Target: ${dbConfig.connectionString ? 'DATABASE_URL (Neon/Cloud)' : `${dbConfig.host}:${dbConfig.port} (DB: ${dbConfig.database})`}`);
  console.log('==============================================\n');

  let client = null;
  let usePool = false;

  try {
    client = new Client(dbConfig);
    try {
      await client.connect();
    } catch (connErr) {
      console.warn(`[Seed] Direct connection attempt failed (${connErr.message}). Routing through managed pool...`);
      client = await pool.connect();
      usePool = true;
    }

    // 1. Check that tables exist
    const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['users', 'categories', 'projects', 'tasks'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.error(`Cannot run seeds. Missing required tables: ${missingTables.join(', ')}`);
      console.error('Please run database migrations first: npm run db:migrate\n');
      process.exit(1);
    }

    // 2. Scan and execute seed files
    const files = fs.readdirSync(seedsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No seed files found in server/db/seeds.');
      return;
    }

    for (const file of files) {
      console.log(`[Seeding] Executing ${file}...`);
      const filePath = path.join(seedsDir, file);
      const sqlContent = fs.readFileSync(filePath, 'utf-8');
      const statements = parseSqlStatements(sqlContent);

      for (const statement of statements) {
        await client.query(statement);
      }
      console.log(`  ✓ Finished ${file} (${statements.length} statements executed).`);
    }

    // 3. Summarize seeded data
    const { rows: userRows } = await client.query('SELECT COUNT(*) AS count FROM users');
    const { rows: catRows } = await client.query('SELECT COUNT(*) AS count FROM categories');
    const { rows: projRows } = await client.query('SELECT COUNT(*) AS count FROM projects');
    const { rows: taskRows } = await client.query('SELECT COUNT(*) AS count FROM tasks');

    console.log('\n----------------------------------------------');
    console.log('📊 Current Database Record Counts:');
    console.log(`   Users:      ${userRows[0].count}`);
    console.log(`   Categories: ${catRows[0].count}`);
    console.log(`   Projects:   ${projRows[0].count}`);
    console.log(`   Tasks:      ${taskRows[0].count}`);
    console.log('----------------------------------------------');
    console.log('🎉 Seed data populated successfully!\n');

  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
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
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeeds();
}
