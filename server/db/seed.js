/**
 * Tempo Development Database Seed Runner (Phase 4.2)
 *
 * Populates initial sample data for users, categories, projects, and tasks.
 * Kept strictly separate from schema migrations.
 */

import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import { dbConfig, validateDbEnv } from '../config/db.config.js';

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
  if (!envCheck.isValid) {
    console.error('Database configuration error:');
    envCheck.missing.forEach(m => console.error(`  - ${m}`));
    process.exit(1);
  }

  console.log('\n==============================================');
  console.log('🌱 Tempo Database Seed Runner (Phase 4.2)');
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

    // 1. Check that tables exist
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
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
        await connection.query(statement);
      }
      console.log(`  ✓ Finished ${file} (${statements.length} statements executed).`);
    }

    // 3. Summarize seeded data
    const [userRows] = await connection.query('SELECT COUNT(*) AS count FROM users');
    const [catRows] = await connection.query('SELECT COUNT(*) AS count FROM categories');
    const [projRows] = await connection.query('SELECT COUNT(*) AS count FROM projects');
    const [taskRows] = await connection.query('SELECT COUNT(*) AS count FROM tasks');

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
    if (connection) {
      await connection.end();
    }
  }
}

// Auto-run when executed directly via CLI
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeeds();
}

