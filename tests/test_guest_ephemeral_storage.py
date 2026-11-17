# Test Guest Ephemeral Storage Behavior
# Verifies that guest (unauthenticated) operations exist only in-memory until refresh,
# and permanent persistence is strictly reserved for authenticated users.

import subprocess
import os

print("=== Tempo Guest Ephemeral Storage & Refresh Isolation Test ===")

node_candidates = [
    r'C:\Users\aryan\AppData\Local\Author Software\nvm\installs\v26.12.1\node.exe',
    r'C:\Users\aryan\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe',
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

test_script = """
import assert from 'assert';

// Mock browser environment
const storage = {};
global.window = {
  localStorage: {
    getItem: (key) => storage[key] || null,
    setItem: (key, val) => { storage[key] = String(val); },
    removeItem: (key) => { delete storage[key]; },
    clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
  }
};
global.document = {
  getElementById: () => null
};

// Import state module
const { StateManager, STORAGE_KEY, PROJECTS_STORAGE_KEY } = await import('./js/state.js');

const state = new StateManager();

// 1. Initial Guest State
assert.strictEqual(state.currentUser, null, 'Initial user should be guest (null)');
assert.strictEqual(state.tasks.length, 6, 'Guest should have 6 initial tasks in memory');
assert.strictEqual(state.projects.length, 3, 'Guest should have 3 initial projects in memory');

// 2. Guest Operations (should work in memory)
const guestTask = state.addTask({ title: 'Temporary Guest Task', priority: 'high' });
assert.strictEqual(state.tasks.length, 7, 'Guest should now have 7 tasks in memory');
assert.strictEqual(state.tasks[0].title, 'Temporary Guest Task');

await state.addProject({ name: 'Guest Temporary Project', color: '#FA779C' });
assert.strictEqual(state.projects.length, 4, 'Guest should now have 4 projects in memory');

// 3. Verify LocalStorage has NOT stored guest data permanently
assert.strictEqual(storage['tempo_tasks_guest'], undefined, 'Guest tasks must NOT be saved in localStorage');
assert.strictEqual(storage['tempo_projects_guest'], undefined, 'Guest projects must NOT be saved in localStorage');
assert.strictEqual(storage[STORAGE_KEY], undefined, 'Legacy tasks key must NOT store guest tasks');
assert.strictEqual(storage[PROJECTS_STORAGE_KEY], undefined, 'Legacy projects key must NOT store guest projects');

console.log('  [PASS] Guest operations work in-memory and are NOT stored permanently in localStorage.');

// 4. Simulate Page Refresh / Reload in Guest Mode
const refreshedState = new StateManager();
assert.strictEqual(refreshedState.tasks.length, 6, 'After refresh, guest tasks must reset back to 6 initial tasks');
assert(!refreshedState.tasks.some(t => t.title === 'Temporary Guest Task'), 'Temporary guest task must NOT survive refresh');
assert.strictEqual(refreshedState.projects.length, 3, 'After refresh, guest projects must reset back to 3 default projects');
assert(!refreshedState.projects.some(p => p.name === 'Guest Temporary Project'), 'Temporary guest project must NOT survive refresh');

console.log('  [PASS] Page refresh resets guest account back to fresh initial state.');

// 5. Test Authenticated User (Permanent Storage MUST work)
const loggedInUser = { id: 42, username: 'testuser', email: 'test@example.com' };
refreshedState.switchUser(loggedInUser);

assert.strictEqual(refreshedState.currentUser.id, 42);
const authTask = refreshedState.addTask({ title: 'Permanent Logged-In Task', priority: 'medium' });
await refreshedState.addProject({ name: 'Permanent User Project', color: '#C6F55A' });

// Verify user-scoped localStorage HAS saved the data
assert(storage['tempo_tasks_user_42'] !== undefined, 'Logged in user tasks MUST be saved to localStorage');
assert(storage['tempo_projects_user_42'] !== undefined, 'Logged in user projects MUST be saved to localStorage');

const userTasksInStorage = JSON.parse(storage['tempo_tasks_user_42']);
assert(userTasksInStorage.some(t => t.title === 'Permanent Logged-In Task'), 'User task must be in permanent storage');

console.log('  [PASS] Authenticated user tasks and projects ARE permanently persisted in localStorage.');

// 6. Simulate Page Refresh for Authenticated User
const reloadedUserState = new StateManager();
reloadedUserState.switchUser(loggedInUser);

assert(reloadedUserState.tasks.some(t => t.title === 'Permanent Logged-In Task'), 'User task must survive page refresh');
assert(reloadedUserState.projects.some(p => p.name === 'Permanent User Project'), 'User project must survive page refresh');

console.log('  [PASS] Authenticated user tasks and projects survive page refresh as expected.');

// 7. User Logs Out -> Returns to Guest Mode
reloadedUserState.clearUserData();
assert.strictEqual(reloadedUserState.currentUser, null, 'User should be reset to null on logout');
assert.strictEqual(reloadedUserState.tasks.length, 6, 'Logout resets view back to clean initial guest tasks');
assert(!reloadedUserState.tasks.some(t => t.title === 'Permanent Logged-In Task'), 'Logged in user tasks must not leak to guest');

console.log('  [PASS] Logging out resets to clean guest state with zero data leakage.');

console.log('\\nALL GUEST EPHEMERAL STORAGE TESTS PASSED (100%)!');
"""

res = subprocess.run([node_bin, '--input-type=module', '-e', test_script], capture_output=True, text=True)
if res.returncode != 0:
    print("FAILED:")
    print(res.stderr)
    exit(1)
else:
    print(res.stdout)
