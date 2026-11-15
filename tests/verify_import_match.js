import fs from 'fs';
import { pool } from '../server/db/pool.js';

async function verify() {
  const backup = JSON.parse(fs.readFileSync('server/db/backups/mysql_data_export.json', 'utf8'));
  const backupTables = backup.tables;

  const { rows: users } = await pool.query('SELECT id, username, email FROM users ORDER BY id');
  const { rows: categories } = await pool.query('SELECT id, name, slug, color FROM categories ORDER BY id');
  const { rows: projects } = await pool.query('SELECT id, project_key, user_id, name, color FROM projects ORDER BY id');
  const { rows: tasks } = await pool.query('SELECT id, user_id, project_id, category_id, title, priority, status, completed, display_order FROM tasks ORDER BY display_order ASC');
  const { rows: migrations } = await pool.query('SELECT version, name, status FROM schema_migrations ORDER BY version');

  console.log('=== Verifying Import Counts & Integrity ===');
  console.log(`Users: PostgreSQL=${users.length}, Backup=${backupTables.users.length} -> ${users.length === backupTables.users.length ? 'MATCH' : 'MISMATCH'}`);
  console.log(`Categories: PostgreSQL=${categories.length}, Backup=${backupTables.categories.length} -> ${categories.length === backupTables.categories.length ? 'MATCH' : 'MISMATCH'}`);
  console.log(`Projects: PostgreSQL=${projects.length}, Backup=${backupTables.projects.length} -> ${projects.length === backupTables.projects.length ? 'MATCH' : 'MISMATCH'}`);
  console.log(`Tasks: PostgreSQL=${tasks.length}, Backup=${backupTables.tasks.length} -> ${tasks.length === backupTables.tasks.length ? 'MATCH' : 'MISMATCH'}`);
  console.log(`Migrations: PostgreSQL=${migrations.length}, Backup=${backupTables.schema_migrations.length} -> ${migrations.length >= backupTables.schema_migrations.length ? 'MATCH' : 'MISMATCH'}`);

  // Check relationship integrity
  const userIds = new Set(users.map(u => u.id));
  const projectIds = new Set(projects.map(p => p.id));
  const categoryIds = new Set(categories.map(c => c.id));

  let relationshipsValid = true;
  for (const t of tasks) {
    if (!userIds.has(t.user_id)) {
      console.error(`Task ${t.id} references invalid user_id ${t.user_id}`);
      relationshipsValid = false;
    }
    if (t.project_id && !projectIds.has(t.project_id)) {
      console.error(`Task ${t.id} references invalid project_id ${t.project_id}`);
      relationshipsValid = false;
    }
    if (t.category_id && !categoryIds.has(t.category_id)) {
      console.error(`Task ${t.id} references invalid category_id ${t.category_id}`);
      relationshipsValid = false;
    }
  }

  // Check display_order sequence
  const displayOrders = tasks.map(t => t.display_order);
  const isSorted = displayOrders.every((val, i, arr) => !i || arr[i - 1] <= val);

  console.log(`Relationships Integrity: ${relationshipsValid ? 'PERFECT' : 'FAILED'}`);
  console.log(`Display Order Sequence: [${displayOrders.join(', ')}] -> ${isSorted ? 'ORDER PRESERVED' : 'FAILED'}`);

  await pool.end();

  if (!relationshipsValid || !isSorted || tasks.length !== backupTables.tasks.length) {
    process.exit(1);
  }
}

verify().catch(err => {
  console.error(err);
  process.exit(1);
});
