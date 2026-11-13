# Tempo Phase 4.1 Setup & Environment Verification Test

import os
import sys
import json
import socket
import subprocess

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Tempo Phase 4.1 Database Configuration & Setup Verification ===")

# --- 1. Verify .gitignore and .env.example ---
print("\n--- 1. Checking Environment Security Configuration ---")
assert os.path.exists('.gitignore'), ".gitignore file is missing"
with open('.gitignore', 'r', encoding='utf-8') as f:
    gitignore_content = f.read()
assert '.env' in gitignore_content, ".env is not excluded in .gitignore"
print("  [PASS] .gitignore exists and properly ignores .env")

assert os.path.exists('.env.example'), ".env.example template is missing"
with open('.env.example', 'r', encoding='utf-8') as f:
    example_content = f.read()
assert 'DB_HOST' in example_content, "DB_HOST missing in .env.example"
assert 'DB_PORT' in example_content, "DB_PORT missing in .env.example"
assert 'DB_NAME' in example_content, "DB_NAME missing in .env.example"
assert 'DB_USER' in example_content, "DB_USER missing in .env.example"
assert 'DB_PASSWORD=' in example_content, "DB_PASSWORD template missing in .env.example"
print("  [PASS] .env.example exists and documents all database settings safely")

# --- 2. Verify Package Dependencies ---
print("\n--- 2. Checking npm Dependencies (mysql2, dotenv) ---")
with open('package.json', 'r', encoding='utf-8') as f:
    pkg = json.load(f)

deps = pkg.get('dependencies', {})
assert 'mysql2' in deps, "'mysql2' package is missing from dependencies in package.json"
assert 'dotenv' in deps, "'dotenv' package is missing from dependencies in package.json"
print(f"  [PASS] Dependencies verified: mysql2 ({deps['mysql2']}), dotenv ({deps['dotenv']})")

# --- 3. Verify Database Config Module ---
print("\n--- 3. Checking server/config/db.config.js Module ---")
config_file = os.path.join('server', 'config', 'db.config.js')
assert os.path.exists(config_file), f"Missing database configuration module: {config_file}"

# Run Node.js evaluation of db.config.js
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

eval_script = """
import { dbConfig, validateDbEnv } from './server/config/db.config.js';
const validation = validateDbEnv();
console.log(JSON.stringify({ config: { ...dbConfig, password: '***' }, validation }));
"""

res = subprocess.run([node_bin, '--input-type=module', '-e', eval_script], capture_output=True, text=True)
assert res.returncode == 0, f"Failed to import server/config/db.config.js:\n{res.stderr}"
eval_result = json.loads(res.stdout.strip())
assert eval_result['validation']['isValid'] == True, f"Environment validation failed: {eval_result['validation']['missing']}"
print(f"  [PASS] db.config.js loaded successfully. Validated config: {eval_result['config']['host']}:{eval_result['config']['port']} (DB: {eval_result['config']['database']})")

# --- 4. Probe Local MySQL Server Connectivity ---
print("\n--- 4. Probing Local MySQL Server (Port 3306) ---")
host = '127.0.0.1'
port = 3306
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(2.0)
try:
    result = sock.connect_ex((host, port))
    if result == 0:
        print(f"  [ONLINE] Successfully connected to MySQL server at {host}:{port}!")
    else:
        print(f"  [NOTICE] Port {port} is closed / not listening. (Error code: {result})")
        print(f"           MySQL service is not running or on another port.")
finally:
    sock.close()

# Verify existing tests still pass
print("\n--- 5. Verifying Regression Resistance ---")
color_test = subprocess.run([sys.executable, 'tests/test_color_palette.py'], capture_output=True, text=True)
assert color_test.returncode == 0, f"Color palette test failed: {color_test.stderr}"
print("  [PASS] Palette integrity verified (0 deviations).")

shell_test = subprocess.run([sys.executable, 'tests/test_frontend_shell.py'], capture_output=True, text=True)
assert shell_test.returncode == 0, f"Frontend shell integrity test failed: {shell_test.stderr}"
print("  [PASS] Frontend shell integrity verified.")

print("\nALL PHASE 4.1 CONFIGURATION CHECKS PASSED!")
