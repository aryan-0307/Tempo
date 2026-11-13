# Tempo Phase 4.2 Migrations & Schema Verification Test

import os
import sys
import json
import subprocess

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Tempo Phase 4.2 Migrations & Schema Verification ===")

# --- 1. Verify Migration and Seed Files Existence ---
print("\n--- 1. Verifying Migration & Seed Files ---")
migration_file = os.path.join('server', 'db', 'migrations', '001_initial_schema.sql')
seed_file = os.path.join('server', 'db', 'seeds', '001_dev_seed.sql')
migrate_runner = os.path.join('server', 'db', 'migrate.js')
seed_runner = os.path.join('server', 'db', 'seed.js')

assert os.path.exists(migration_file), f"Missing: {migration_file}"
assert os.path.exists(seed_file), f"Missing: {seed_file}"
assert os.path.exists(migrate_runner), f"Missing: {migrate_runner}"
assert os.path.exists(seed_runner), f"Missing: {seed_runner}"
print("  [PASS] All migration and seed scripts exist.")

# --- 2. Query Live MySQL Database via Node.js ---
print("\n--- 2. Verifying Live MySQL Schema & Seed Records ---")
node_candidates = [
    r'C:\Users\aryan\AppData\Local\Author Software\nvm\installs\v26.12.1\node.exe',
    r'C:\Program Files\nodejs\node.exe',
    'node'
]
node_bin = None
for candidate in node_candidates:
    if os.path.exists(candidate):
        node_bin = candidate
        break

if not node_bin:
    node_bin = 'node'

inspect_script = """
import mysql from 'mysql2/promise';
import { dbConfig } from './server/config/db.config.js';

const conn = await mysql.createConnection(dbConfig);

// 1. Check migrations table
const [migrations] = await conn.query('SELECT version, name, status, executed_statements, checksum FROM schema_migrations');

// 2. Check table columns for tasks
const [taskCols] = await conn.query('DESCRIBE tasks');
const colNames = taskCols.map(c => c.Field);

// 3. Check record counts
const [users] = await conn.query('SELECT id, username, email FROM users');
const [projects] = await conn.query('SELECT id, name, project_key FROM projects WHERE user_id = 1');
const [categories] = await conn.query('SELECT id, name, slug FROM categories');
const [tasks] = await conn.query('SELECT id, title, priority, status, completed, display_order, due_date FROM tasks WHERE user_id = 1 ORDER BY display_order ASC');

await conn.end();

console.log(JSON.stringify({
  migrations,
  taskColumns: colNames,
  users,
  projects,
  categories,
  tasks
}));
"""

res = subprocess.run([node_bin, '--input-type=module', '-e', inspect_script], capture_output=True, text=True)
assert res.returncode == 0, f"Database query script failed:\n{res.stderr}"

db_data = json.loads(res.stdout.strip())

# Verify migration record
migrations = db_data['migrations']
assert len(migrations) >= 1, "schema_migrations table has no recorded migrations"
m001 = next((m for m in migrations if m['version'] == '001'), None)
assert m001 is not None, "Migration '001' not recorded in schema_migrations"
assert m001['status'] == 'applied', f"Migration 001 status is not 'applied': {m001['status']}"
assert m001['executed_statements'] == 5, f"Expected 5 executed statements, got {m001['executed_statements']}"
print("  [PASS] schema_migrations correctly recorded version '001' with status 'applied' and 5 statements.")

# Verify tasks table columns
task_cols = db_data['taskColumns']
required_cols = [
    'id', 'user_id', 'project_id', 'category_id', 'title', 'description',
    'priority', 'status', 'due_date', 'completed', 'display_order',
    'created_at', 'updated_at'
]
for col in required_cols:
    assert col in task_cols, f"Missing required column '{col}' in tasks table"
print(f"  [PASS] Tasks table schema verified with all {len(required_cols)} required columns.")

# Verify seed data
users = db_data['users']
assert len(users) >= 1, "Users table is empty"
assert users[0]['email'] == 'alex@tempo.dev', f"Expected alex@tempo.dev, got {users[0]['email']}"
print(f"  [PASS] Users verified: {users[0]['email']} (id: {users[0]['id']})")

projects = db_data['projects']
assert len(projects) == 3, f"Expected 3 projects, got {len(projects)}"
proj_names = [p['name'] for p in projects]
assert 'Work' in proj_names and 'Personal' in proj_names and 'Design System' in proj_names
print(f"  [PASS] Projects verified: {', '.join(proj_names)}")

categories = db_data['categories']
assert len(categories) == 3, f"Expected 3 categories, got {len(categories)}"
print("  [PASS] Categories verified (3 categories present).")

tasks = db_data['tasks']
assert len(tasks) == 6, f"Expected 6 tasks, got {len(tasks)}"
for t in tasks:
    # Verify canonical status mapping
    if t['completed'] == 1:
        assert t['status'] == 'completed', f"Task {t['id']} completed=1 but status is {t['status']}"
    else:
        assert t['status'] in ('todo', 'in_progress'), f"Task {t['id']} completed=0 but status is {t['status']}"
print("  [PASS] Tasks verified: 6 tasks present with consistent status and completed boolean mapping.")

print("\nALL PHASE 4.2 MIGRATION AND SCHEMA CHECKS PASSED (100%)!")

