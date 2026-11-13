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

print("=== Tempo Phase 3 Backend REST API Test ===")

# 1. Identify Node.js binary
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
    # Try finding in PATH
    try:
        res = subprocess.run(['node', '-v'], capture_output=True, text=True)
        if res.returncode == 0:
            node_bin = 'node'
    except Exception:
        pass

assert node_bin, "Node.js executable could not be located"
print(f"  [OK] Using Node.js binary: {node_bin}")

# 2. Start Express server on test port 3847
TEST_PORT = 3847
env = os.environ.copy()
env['PORT'] = str(TEST_PORT)

server_process = subprocess.Popen(
    [node_bin, 'server/server.js'],
    cwd=project_root,
    env=env,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

BASE_URL = f"http://127.0.0.1:{TEST_PORT}/api"

def make_request(path, method='GET', body=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    data = None
    if body is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode('utf-8')
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        res_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(res_body)
        except Exception:
            return e.code, res_body

try:
    # Wait for server to boot
    print("\n--- 1. Booting Server & Testing Health Endpoint ---")
    booted = False
    for attempt in range(15):
        time.sleep(0.4)
        try:
            status, res = make_request('/health')
            if status == 200 and res.get('status') == 'ok':
                booted = True
                break
        except Exception:
            continue

    assert booted, "Server failed to respond on /api/health within 6 seconds"
    print(f"  [PASS] GET /api/health returned 200 OK: {res}")

    # 3. GET /api/tasks
    print("\n--- 2. Testing GET /api/tasks ---")
    status, res = make_request('/tasks')
    assert status == 200, f"Expected 200, got {status}"
    assert res.get('success') is True, "Expected success: true"
    assert len(res.get('data', [])) >= 6, "Expected at least 6 initial seed tasks"
    print(f"  [PASS] GET /api/tasks returned {res['count']} tasks.")

    # 4. GET /api/tasks with filters
    print("\n--- 3. Testing GET /api/tasks Query Parameters ---")
    status, res_pending = make_request('/tasks?status=pending')
    assert status == 200
    for t in res_pending['data']:
        assert t['completed'] is False, "Found completed task in pending filter"

    status, res_search = make_request('/tasks?search=roadmap')
    assert status == 200
    assert len(res_search['data']) >= 1, "Expected roadmap search to match at least 1 task"

    status, res_sort = make_request('/tasks?sort=title')
    assert status == 200
    titles = [t['title'].lower() for t in res_sort['data']]
    assert titles == sorted(titles), "Expected titles to be sorted alphabetically"
    print("  [PASS] Query parameters (status, search, sort) successfully filtered/sorted tasks.")

    # 5. POST /api/tasks (Create Task)
    print("\n--- 4. Testing POST /api/tasks (Create) ---")
    new_task_payload = {
        'title': 'Automated API Integration Test Task',
        'priority': 'high',
        'dueDate': '2026-11-20',
        'project': 'Work'
    }
    status, res_create = make_request('/tasks', method='POST', body=new_task_payload)
    assert status == 201, f"Expected 201 Created, got {status}: {res_create}"
    created_task = res_create['data']
    created_id = created_task['id']
    assert created_task['title'] == new_task_payload['title']
    assert created_task['priority'] == 'high'
    print(f"  [PASS] POST /api/tasks returned 201 Created with ID '{created_id}'.")

    # 6. POST Validation Failure (400 Bad Request)
    print("\n--- 5. Testing Request Validation (400 Bad Request) ---")
    status, res_bad = make_request('/tasks', method='POST', body={'title': ''})
    assert status == 400, f"Expected 400 Bad Request for empty title, got {status}"
    assert res_bad.get('success') is False

    status, res_bad_prio = make_request('/tasks', method='POST', body={'title': 'Valid', 'priority': 'super-critical'})
    assert status == 400, f"Expected 400 for invalid priority, got {status}"
    print("  [PASS] Server correctly returned 400 Bad Request for invalid payloads.")

    # 7. GET /api/tasks/:id
    print("\n--- 6. Testing GET /api/tasks/:id ---")
    status, res_get = make_request(f'/tasks/{created_id}')
    assert status == 200
    assert res_get['data']['id'] == created_id

    status, res_404 = make_request('/tasks/non-existent-task-9999')
    assert status == 404, f"Expected 404 Not Found, got {status}"
    print(f"  [PASS] GET /api/tasks/:id returned 200 for valid ID and 404 for unknown ID.")

    # 8. PUT /api/tasks/:id (Update Task)
    print("\n--- 7. Testing PUT /api/tasks/:id (Update) ---")
    update_payload = {
        'title': 'Renamed Automated Task',
        'priority': 'low'
    }
    status, res_update = make_request(f'/tasks/{created_id}', method='PUT', body=update_payload)
    assert status == 200
    assert res_update['data']['title'] == 'Renamed Automated Task'
    assert res_update['data']['priority'] == 'low'
    print(f"  [PASS] PUT /api/tasks/:id successfully updated task fields.")

    # 9. PATCH /api/tasks/:id/toggle (Toggle Completion)
    print("\n--- 8. Testing PATCH /api/tasks/:id/toggle ---")
    status, res_toggle = make_request(f'/tasks/{created_id}/toggle', method='PATCH')
    assert status == 200
    assert res_toggle['data']['completed'] is True, "Expected task to be completed"

    status, res_toggle2 = make_request(f'/tasks/{created_id}/toggle', method='PATCH')
    assert status == 200
    assert res_toggle2['data']['completed'] is False, "Expected task to toggle back to pending"
    print("  [PASS] PATCH /api/tasks/:id/toggle successfully toggles completion status.")

    # 10. POST /api/tasks/reorder
    print("\n--- 9. Testing POST /api/tasks/reorder ---")
    status, res_reorder = make_request('/tasks/reorder', method='POST', body={
        'sourceId': 'task-1',
        'targetId': 'task-3',
        'position': 'after'
    })
    assert status == 200
    print("  [PASS] POST /api/tasks/reorder successfully updated task ordering.")

    # 11. DELETE /api/tasks/:id
    print("\n--- 10. Testing DELETE /api/tasks/:id ---")
    status, res_delete = make_request(f'/tasks/{created_id}', method='DELETE')
    assert status == 200
    assert res_delete['data']['id'] == created_id

    # Verify subsequent GET returns 404
    status, _ = make_request(f'/tasks/{created_id}')
    assert status == 404
    print("  [PASS] DELETE /api/tasks/:id successfully removed task and verified 404.")

    # 12. GET /api/stats
    print("\n--- 11. Testing GET /api/stats ---")
    status, res_stats = make_request('/stats')
    assert status == 200
    stats = res_stats['data']
    assert 'total' in stats
    assert 'completed' in stats
    assert 'pending' in stats
    assert 'overdue' in stats
    assert 'completionRate' in stats
    print(f"  [PASS] GET /api/stats returned: {stats}")

    # 13. GET /api/projects
    print("\n--- 12. Testing GET /api/projects ---")
    status, res_projects = make_request('/projects')
    assert status == 200
    projects = res_projects['data']
    assert len(projects) == 3
    for p in projects:
        assert 'taskCount' in p
        assert 'pendingCount' in p
    print(f"  [PASS] GET /api/projects returned {len(projects)} projects with task counts.")

    print("\nALL PHASE 3 BACKEND REST API CHECKS PASSED (100%)!")

finally:
    # Shutdown server
    server_process.terminate()
    try:
        server_process.wait(timeout=3)
    except subprocess.TimeoutExpired:
        server_process.kill()
    print("  [OK] Test server stopped cleanly.")

