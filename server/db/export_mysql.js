/**
 * Tempo MySQL Data Export Utility
 * Safely extracts all existing records from the local MySQL database
 * and writes them to server/db/backups/mysql_data_export.json.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const backupDir = path.join(__dirname, 'backups');
const backupFile = path.join(backupDir, 'mysql_data_export.json');

export async function exportDataFromMysql() {
  console.log('\n==============================================');
  console.log('📦 Tempo Data Exporter: MySQL Backup');
  console.log('==============================================\n');

  let mysql;
  try {
    mysql = await import('mysql2/promise');
  } catch (err) {
    console.log('Notice: mysql2 package is not installed. Using existing saved backup file:');
    console.log(`  ${backupFile}`);
    return;
  }

  const host = process.env.MYSQL_DB_HOST || process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.MYSQL_DB_PORT || '3306', 10);
  const user = process.env.MYSQL_DB_USER || 'root';
  const password = process.env.MYSQL_DB_PASSWORD || process.env.DB_PASSWORD || '';
  const database = process.env.MYSQL_DB_NAME || 'tempo_db';

  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      database
    });

    console.log(`Connected to MySQL at ${host}:${port}/${database}...`);

    const [users] = await connection.query('SELECT * FROM users');
    const [categories] = await connection.query('SELECT * FROM categories');
    const [projects] = await connection.query('SELECT * FROM projects');
    const [tasks] = await connection.query('SELECT * FROM tasks');
    const [migrations] = await connection.query('SELECT * FROM schema_migrations');

    const exportData = {
      exportedAt: new Date().toISOString(),
      source: 'mysql',
      tables: {
        users,
        categories,
        projects,
        tasks,
        schema_migrations: migrations
      }
    };

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.writeFileSync(backupFile, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`✓ Data successfully exported to: ${backupFile}`);
    console.log(`  Users:      ${users.length}`);
    console.log(`  Categories: ${categories.length}`);
    console.log(`  Projects:   ${projects.length}`);
    console.log(`  Tasks:      ${tasks.length}`);
    console.log(`  Migrations: ${migrations.length}\n`);

  } catch (err) {
    console.error('MySQL export notice:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('export_mysql.js')) {
  exportDataFromMysql();
}
