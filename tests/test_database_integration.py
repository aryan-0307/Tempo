# Tempo Phase 4 Database Integration Test
# Validates Express REST API operating against live PostgreSQL database

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

print("=== Tempo Phase 4 PostgreSQL Database Integration Test ===")

TEST_PORT = 3838
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

# 1. Boot Server on TEST_PORT
env = os.environ.copy()
env['PORT'] = str(TEST_PORT)
env['NODE_ENV'] = 'test'

server_proc = subprocess.Popen(
    [node_bin, 'server/server.js'],
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

def make_request(path, method='GET', data=None):
    url = f"{BASE_URL}{path}"
    headers = {'Content-Type': 'application/json'}
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
    # Wait for server to boot
    time.sleep(2.0)

    # 1. Health check & DB connection
    print("\n--- 1. Testing GET /api/health ---")
    status, body = make_request('/api/health')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('status') == 'ok', "Server status not ok"
    assert body.get('database') == 'connected', f"Expected database 'connected', got {body.get('database')}"
    print(f"  [PASS] GET /api/health returned 200 OK with database: connected")

    # 2. Get Tasks from PostgreSQL
    print("\n--- 2. Testing GET /api/tasks ---")
    status, body = make_request('/api/tasks')
    assert status == 200, f"Expected 200, got {status}"
    assert body.get('success') is True, "Expected success: true"
    tasks = body.get('data', [])
    assert len(tasks) >= 6, f"Expected at least 6 tasks from seed data, got {len(tasks)}"
    print(f"  [PASS] GET /api/tasks returned {len(tasks)} tasks from PostgreSQL.")

    # 3. Create Task with Description in PostgreSQL
    print("\n--- 3. Testing POST /api/tasks (Create in PostgreSQL) ---")
    new_task_payload = {
        'title': 'Automated PostgreSQL Integration Test Task',
        'description': 'Testing full persistence, description storage, and status mapping.',
        'priority': 'high',
        'dueDate': '2026-11-20',
        'project': 'Work'
    }
    status, body = make_request('/api/tasks', method='POST', data=new_task_payload)
    assert status == 201, f"Expected 201 Created, got {status}"
    created_task = body.get('data')
    assert created_task is not None, "Missing created task data"
    test_task_id = created_task['id']
    assert created_task['title'] == new_task_payload['title']
    assert created_task['description'] == new_task_payload['description']
    assert created_task['priority'] == 'high'
    assert created_task['dueDate'] == '2026-11-20'
    assert created_task['project'] == 'Work'
    assert created_task['completed'] is False
    assert created_task['status'] == 'todo'
    print(f"  [PASS] POST /api/tasks created task '{test_task_id}' with description and status: todo.")

    # 4. Verify Task Lookup
    print("\n--- 4. Testing GET /api/tasks/:id ---")
    status, body = make_request(f'/api/tasks/{test_task_id}')
    assert status == 200
    fetched_task = body.get('data')
    assert fetched_task['id'] == test_task_id
    assert fetched_task['description'] == new_task_payload['description']
    print(f"  [PASS] GET /api/tasks/{test_task_id} successfully retrieved persisted task.")

    # 5. Update Task
    print("\n--- 5. Testing PUT /api/tasks/:id ---")
    update_payload = {
        'title': 'Automated Task (Updated Title)',
        'priority': 'medium'
    }
    status, body = make_request(f'/api/tasks/{test_task_id}', method='PUT', data=update_payload)
    assert status == 200
    assert body['data']['title'] == update_payload['title']
    assert body['data']['priority'] == 'medium'
    print("  [PASS] PUT /api/tasks/:id successfully updated task fields in PostgreSQL.")

    # 6. Toggle Task Completion
    print("\n--- 6. Testing PATCH /api/tasks/:id/toggle ---")
    status, body = make_request(f'/api/tasks/{test_task_id}/toggle', method='PATCH')
    assert status == 200
    toggled = body.get('data')
    assert toggled['completed'] is True, "Expected completed to be True"
    assert toggled['status'] == 'completed', f"Expected status 'completed', got {toggled['status']}"
    print("  [PASS] PATCH /api/tasks/:id/toggle toggled completed to true and status to completed.")

    # 7. Transactional Reordering
    print("\n--- 7. Testing POST /api/tasks/reorder (Transactional) ---")
    reorder_payload = {
        'sourceId': test_task_id,
        'targetId': 'task-1',
        'position': 'before'
    }
    status, body = make_request('/api/tasks/reorder', method='POST', data=reorder_payload)
    assert status == 200
    reordered_tasks = body.get('data', [])
    source_idx = next(i for i, t in enumerate(reordered_tasks) if t['id'] == test_task_id)
    target_idx = next(i for i, t in enumerate(reordered_tasks) if t['id'] == 'task-1')
    assert source_idx == target_idx - 1, f"Expected {test_task_id} before task-1: {source_idx} vs {target_idx}"
    print(f"  [PASS] POST /api/tasks/reorder successfully moved {test_task_id} before task-1 ({source_idx} < {target_idx}).")

    # 8. Delete Task
    print("\n--- 8. Testing DELETE /api/tasks/:id ---")
    status, body = make_request(f'/api/tasks/{test_task_id}', method='DELETE')
    assert status == 200
    # Verify deletion
    status, _ = make_request(f'/api/tasks/{test_task_id}')
    assert status == 404, f"Expected 404 after deletion, got {status}"
    print(f"  [PASS] DELETE /api/tasks/{test_task_id} removed task and verified 404.")

    # 9. Projects API
    print("\n--- 9. Testing GET /api/projects ---")
    status, body = make_request('/api/projects')
    assert status == 200
    projects = body.get('data', [])
    assert len(projects) == 3, f"Expected 3 projects, got {len(projects)}"
    for p in projects:
        assert 'taskCount' in p and isinstance(p['taskCount'], (int, float))
        assert 'pendingCount' in p and isinstance(p['pendingCount'], (int, float))
    print(f"  [PASS] GET /api/projects returned 3 projects with numeric counts.")

    # 10. Stats API
    print("\n--- 10. Testing GET /api/stats ---")
    status, body = make_request('/api/stats')
    assert status == 200
    stats = body.get('data', {})
    for key in ['total', 'completed', 'pending', 'overdue', 'completionRate']:
        assert key in stats and isinstance(stats[key], (int, float)), f"Missing or invalid {key}"
    print(f"  [PASS] GET /api/stats returned aggregate metrics: {stats}")

    print("\nALL PHASE 4 DATABASE INTEGRATION TESTS PASSED (100%)!")

finally:
    if server_proc.poll() is None:
        server_proc.terminate()
        try:
            server_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server_proc.kill()
    print("  [OK] Test server stopped cleanly.")
