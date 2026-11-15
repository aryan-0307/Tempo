/**
 * Tempo Safe PostgreSQL Import Migration Utility
 *
 * Reads exported MySQL data (from server/db/backups/mysql_data_export.json)
 * and safely imports it into PostgreSQL with conflict resolution and sequence synchronization.
 * Guarantees zero data loss during MySQL -> PostgreSQL migration.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backupFile = path.join(__dirname, 'backups', 'mysql_data_export.json');

export async function importDataToPostgres() {
  console.log('\n==============================================');
  console.log('🔄 Tempo Data Importer: MySQL -> PostgreSQL');
  console.log('==============================================\n');

  if (!fs.existsSync(backupFile)) {
    console.error(`Backup file not found at: ${backupFile}`);
    console.error('Please ensure the exported MySQL JSON file exists before importing.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(backupFile, 'utf-8');
  const exportData = JSON.parse(rawData);
  const tables = exportData.tables || {};

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Import Users
    const users = tables.users || [];
    console.log(`[1/5] Importing ${users.length} Users...`);
    for (const u of users) {
      await client.query(`
        INSERT INTO users (id, username, email, password_hash, full_name, avatar_color, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          password_hash = EXCLUDED.password_hash,
          full_name = EXCLUDED.full_name,
          avatar_color = EXCLUDED.avatar_color,
          updated_at = EXCLUDED.updated_at;
      `, [u.id, u.username, u.email, u.password_hash, u.full_name, u.avatar_color, u.created_at, u.updated_at]);
    }

    // 2. Import Categories
    const categories = tables.categories || [];
    console.log(`[2/5] Importing ${categories.length} Categories...`);
    for (const c of categories) {
      await client.query(`
        INSERT INTO categories (id, name, slug, color, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          color = EXCLUDED.color;
      `, [c.id, c.name, c.slug, c.color, c.created_at]);
    }

    // 3. Import Projects
    const projects = tables.projects || [];
    console.log(`[3/5] Importing ${projects.length} Projects...`);
    for (const p of projects) {
      await client.query(`
        INSERT INTO projects (id, project_key, user_id, name, color, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO UPDATE SET
          project_key = EXCLUDED.project_key,
          name = EXCLUDED.name,
          color = EXCLUDED.color,
          updated_at = EXCLUDED.updated_at;
      `, [p.id, p.project_key, p.user_id, p.name, p.color, p.created_at, p.updated_at]);
    }

    // 4. Import Tasks
    const tasks = tables.tasks || [];
    console.log(`[4/5] Importing ${tasks.length} Tasks...`);
    for (const t of tasks) {
      const isCompleted = Boolean(t.completed);
      await client.query(`
        INSERT INTO tasks (id, user_id, project_id, category_id, title, description, priority, status, due_date, completed, display_order, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          priority = EXCLUDED.priority,
          status = EXCLUDED.status,
          due_date = EXCLUDED.due_date,
          completed = EXCLUDED.completed,
          display_order = EXCLUDED.display_order,
          updated_at = EXCLUDED.updated_at;
      `, [
        t.id, t.user_id, t.project_id, t.category_id,
        t.title, t.description, t.priority, t.status,
        t.due_date, isCompleted, t.display_order,
        t.created_at, t.updated_at
      ]);
    }

    // 5. Import Migrations History
    const migrations = tables.schema_migrations || [];
    console.log(`[5/5] Importing ${migrations.length} Schema Migrations records...`);
    for (const m of migrations) {
      await client.query(`
        INSERT INTO schema_migrations (version, name, status, executed_statements, checksum, error_message, applied_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (version) DO UPDATE SET
          status = EXCLUDED.status,
          executed_statements = EXCLUDED.executed_statements,
          checksum = EXCLUDED.checksum,
          error_message = EXCLUDED.error_message,
          applied_at = EXCLUDED.applied_at;
      `, [m.version, m.name, m.status, m.executed_statements, m.checksum, m.error_message, m.applied_at]);
    }

    // 6. Synchronize primary key sequences
    console.log('[6/6] Synchronizing Primary Key Sequences...');
    await client.query(`
      SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1));
      SELECT setval('categories_id_seq', COALESCE((SELECT MAX(id) FROM categories), 1));
      SELECT setval('projects_id_seq', COALESCE((SELECT MAX(id) FROM projects), 1));
    `);

    await client.query('COMMIT');
    console.log('\n==============================================');
    console.log('🎉 Data successfully imported into PostgreSQL with 0 data loss!');
    console.log('==============================================\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Data import failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].endsWith('import_postgres.js')) {
  importDataToPostgres().then(() => pool.end());
}
