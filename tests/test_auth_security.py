# Tempo Phase 5 Authentication & Security Integration Test
# Validates user registration, password hashing (bcrypt), JWT tokens, and multi-tenant data isolation.

import os
import sys
import time
import json
import urllib.request
import urllib.error
import subprocess

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Tempo Phase 5 Authentication & Security Test ===")

TEST_PORT = 3939
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

# Locate Node.js binary
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

assert node_bin, "Node.js executable could not be located"
print(f"  [OK] Using Node.js binary: {node_bin}")

# 1. Boot Server on TEST_PORT with JWT settings
env = os.environ.copy()
env['PORT'] = str(TEST_PORT)
env['NODE_ENV'] = 'test'
env['JWT_SECRET'] = 'test_secret_tempo_auth_key_2026'

server_proc = subprocess.Popen(
    [node_bin, 'server/server.js'],
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

def make_request(path, method='GET', data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=5) as res:
            res_body = res.read().decode('utf-8')
            return res.status, json.loads(res_body) if res_body else {}
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        return e.code, json.loads(res_body) if res_body else {}

try:
    time.sleep(2.0)

    # 1. Test Server Boot & Health
    print("\n--- 1. Testing Server Boot & Health ---")
    status, body = make_request('/api/health')
    assert status == 200
    assert body.get('database') == 'connected'
    print("  [PASS] Server is running with MySQL connected.")

    # 2. Test User Registration
    print("\n--- 2. Testing POST /api/auth/register ---")
    user_a_email = f"usera_{int(time.time())}@tempo.dev"
    user_a_payload = {
        'username': f"usera_{int(time.time())}",
        'email': user_a_email,
        'password': 'SecurePassword123!',
        'fullName': 'Alice Walker'
    }
    status, body = make_request('/api/auth/register', method='POST', data=user_a_payload)
    assert status == 201, f"Expected 201 Created, got {status}: {body}"
    assert body.get('success') is True
    user_a = body['data']['user']
    token_a = body['data']['token']
    assert user_a['email'] == user_a_email
    assert 'password_hash' not in user_a, "Password hash must not be exposed!"
    assert token_a and len(token_a) > 20
    print(f"  [PASS] User A registered successfully: {user_a['email']} (token issued).")

    # 3. Test Duplicate Registration (409 Conflict)
    print("\n--- 3. Testing Duplicate Registration Validation ---")
    status, body = make_request('/api/auth/register', method='POST', data=user_a_payload)
    assert status == 409, f"Expected 409 Conflict for duplicate email, got {status}"
    print("  [PASS] Duplicate registration correctly rejected with 409 Conflict.")

    # 4. Test Password Length Validation (400 Bad Request)
    print("\n--- 4. Testing Password Length Validation ---")
    invalid_pw_payload = {
        'username': f"short_{int(time.time())}",
        'email': f"short_{int(time.time())}@tempo.dev",
        'password': 'short', # Less than 8 characters
        'fullName': 'Short Password'
    }
    status, body = make_request('/api/auth/register', method='POST', data=invalid_pw_payload)
    assert status == 400, f"Expected 400 for short password, got {status}"
    print("  [PASS] Short password (< 8 chars) correctly rejected with 400 Bad Request.")

    # 5. Test Login with User A
    print("\n--- 5. Testing POST /api/auth/login ---")
    login_payload = {
        'email': user_a_email,
        'password': 'SecurePassword123!'
    }
    status, body = make_request('/api/auth/login', method='POST', data=login_payload)
    assert status == 200, f"Expected 200 OK, got {status}"
    assert body.get('success') is True
    assert body['data']['token'], "Missing JWT token on login"
    print("  [PASS] Login successful with bcrypt credential verification.")

    # 6. Test Login with Demo User (Alex Morgan)
    print("\n--- 6. Testing Demo User Login (alex@tempo.dev) ---")
    demo_login_payload = {
        'email': 'alex@tempo.dev',
        'password': 'Password123!'
    }
    status, body = make_request('/api/auth/login', method='POST', data=demo_login_payload)
    assert status == 200, f"Expected 200 OK for demo user, got {status}"
    token_alex = body['data']['token']
    assert token_alex is not None
    print("  [PASS] Demo user (alex@tempo.dev) successfully authenticated.")

    # 7. Test Login with Wrong Password (401 Unauthorized)
    print("\n--- 7. Testing Invalid Password Login ---")
    wrong_pw_payload = {
        'email': user_a_email,
        'password': 'WrongPassword999!'
    }
    status, body = make_request('/api/auth/login', method='POST', data=wrong_pw_payload)
    assert status == 401, f"Expected 401 for wrong password, got {status}"
    print("  [PASS] Invalid password rejected with 401 Unauthorized.")

    # 8. Test Protected Profile GET /api/auth/me
    print("\n--- 8. Testing Protected GET /api/auth/me ---")
    # With valid token
    status, body = make_request('/api/auth/me', token=token_a)
    assert status == 200, f"Expected 200 OK with token, got {status}"
    assert body['data']['email'] == user_a_email
    # Without token
    status, body = make_request('/api/auth/me')
    assert status == 401, f"Expected 401 without token, got {status}"
    # With forged / invalid token
    status, body = make_request('/api/auth/me', token='invalid.forged.jwt.token')
    assert status == 401, f"Expected 401 for invalid token, got {status}"
    print("  [PASS] GET /api/auth/me strictly enforced Bearer token verification.")

    # 9. Test Multi-Tenant Data Isolation Between Users
    print("\n--- 9. Testing Cross-User Data Isolation ---")
    # Register User B
    user_b_email = f"userb_{int(time.time())}@tempo.dev"
    user_b_payload = {
        'username': f"userb_{int(time.time())}",
        'email': user_b_email,
        'password': 'SecurePassword456!',
        'fullName': 'Bob Builder'
    }
    status, body = make_request('/api/auth/register', method='POST', data=user_b_payload)
    assert status == 201
    token_b = body['data']['token']

    # User A creates a private task
    task_a_payload = {
        'title': 'Confidential Task Owned by Alice',
        'priority': 'high',
        'dueDate': '2026-12-01',
        'project': 'Work'
    }
    status, body = make_request('/api/tasks', method='POST', data=task_a_payload, token=token_a)
    assert status == 201
    task_a_id = body['data']['id']
    print(f"  [User A] Created task '{task_a_id}'.")

    # User B queries tasks
    status, body = make_request('/api/tasks', token=token_b)
    assert status == 200
    user_b_tasks = body.get('data', [])
    user_b_task_ids = [t['id'] for t in user_b_tasks]
    assert task_a_id not in user_b_task_ids, "CRITICAL: User B saw User A's private task!"
    print(f"  [PASS] User B cannot see User A's task in task list (Zero cross-user leakage).")

    # User B attempts to access User A's task directly by ID
    status, body = make_request(f'/api/tasks/{task_a_id}', token=token_b)
    assert status == 404, f"Expected 404 for foreign task ID, got {status}"
    print(f"  [PASS] User B direct access to User A's task rejected with 404 Not Found.")

    # User B attempts to delete User A's task
    status, body = make_request(f'/api/tasks/{task_a_id}', method='DELETE', token=token_b)
    assert status == 404, f"Expected 404 for foreign task deletion, got {status}"
    print(f"  [PASS] User B deletion of User A's task rejected with 404 Not Found.")

    # Clean up User A's task with User A's token
    status, _ = make_request(f'/api/tasks/{task_a_id}', method='DELETE', token=token_a)
    assert status == 200
    print(f"  [PASS] User A successfully deleted their own task.")

    # 10. Test Logout Endpoint
    print("\n--- 10. Testing POST /api/auth/logout ---")
    status, body = make_request('/api/auth/logout', method='POST', token=token_a)
    assert status == 200
    assert body.get('success') is True
    print("  [PASS] POST /api/auth/logout returned 200 OK.")

    print("\nALL PHASE 5 AUTHENTICATION & SECURITY CHECKS PASSED (100%)!")

finally:
    if server_proc.poll() is None:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server_proc.kill()
    print("  [OK] Test server stopped cleanly.")

