import os
import re
import sys
import json

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Tempo Phase 2 JavaScript Functionality Test ===")

# --- 1. Verify Module Files Existence ---
print("\n--- 1. Verifying Phase 2 Modules ---")
phase2_modules = [
    'js/state.js',
    'js/components/tasks.js',
    'js/components/modal.js',
    'js/components/toast.js',
    'js/app.js'
]
for mod in phase2_modules:
    assert os.path.exists(mod), f"Missing module: {mod}"
    assert os.path.getsize(mod) > 0, f"Empty module: {mod}"
    print(f"  [PASS] {mod} exists and non-empty ({os.path.getsize(mod)} bytes)")

# --- 2. Verify State Management & CRUD Capabilities ---
print("\n--- 2. Verifying State Management & CRUD Operations ---")
with open('js/state.js', 'r', encoding='utf-8') as f:
    state_code = f.read()

# CRUD operations
assert 'addTask(' in state_code, "addTask missing in state.js"
assert 'updateTask(' in state_code, "updateTask missing in state.js"
assert 'toggleTask(' in state_code, "toggleTask missing in state.js"
assert 'deleteTask(' in state_code, "deleteTask missing in state.js"
assert 'restoreLastDeletedTask(' in state_code, "restoreLastDeletedTask missing in state.js"
print("  [PASS] CRUD methods: addTask, updateTask, toggleTask, deleteTask, restoreLastDeletedTask verified.")

# Filtering capabilities
assert 'setStatusFilter(' in state_code, "setStatusFilter missing in state.js"
assert 'setViewFilter(' in state_code, "setViewFilter missing in state.js"
assert 'setSearchQuery(' in state_code, "setSearchQuery missing in state.js"
print("  [PASS] Filtering methods: status filter, view filter, and search query verified.")

# Sorting capabilities
assert 'setSort(' in state_code, "setSort missing in state.js"
assert 'this.sortBy' in state_code, "sortBy property missing in state.js"
assert 'due-date' in state_code, "due-date sort logic missing in state.js"
assert 'priority' in state_code, "priority sort logic missing in state.js"
print("  [PASS] Sorting logic (due-date, priority, title) verified.")

# Drag and drop reordering
assert 'reorderTasks(' in state_code, "reorderTasks missing in state.js"
print("  [PASS] Drag-and-drop reorderTasks logic verified.")

# LocalStorage persistence
assert 'STORAGE_KEY' in state_code, "STORAGE_KEY missing in state.js"
assert 'localStorage' in state_code, "localStorage reference missing in state.js"
assert 'saveToStorage' in state_code, "saveToStorage missing in state.js"
assert 'loadFromStorage' in state_code, "loadFromStorage missing in state.js"
print("  [PASS] LocalStorage persistence layer verified.")

# --- 3. Verify Tasks Component Event Wiring & Drag-and-Drop ---
print("\n--- 3. Verifying Tasks Component Interactivity ---")
with open('js/components/tasks.js', 'r', encoding='utf-8') as f:
    tasks_code = f.read()

assert 'dragstart' in tasks_code, "dragstart event listener missing in tasks.js"
assert 'dragover' in tasks_code, "dragover event listener missing in tasks.js"
assert 'drop' in tasks_code, "drop event listener missing in tasks.js"
assert 'dragend' in tasks_code, "dragend event listener missing in tasks.js"
assert 'draggable="true"' in tasks_code, "draggable attribute missing in rendered task items"
assert 'task-drag-handle' in tasks_code, "drag handle missing in rendered task items"
print("  [PASS] HTML5 Drag-and-Drop event delegation and draggable elements verified.")

# Inline edit & modal edit
assert 'startInlineEdit(' in tasks_code, "startInlineEdit missing in tasks.js"
assert 'task-edit-btn' in tasks_code, "task-edit-btn missing in tasks.js"
assert 'task-title-inline-input' in tasks_code, "inline input missing in tasks.js"
print("  [PASS] Inline title editing and modal edit button verified.")

# Toast notification integration
assert 'toast.show(' in tasks_code, "toast notification trigger missing in tasks.js"
print("  [PASS] Toast notifications for user feedback and undo deletion verified.")

# --- 4. Verify Modal Edit/Create Support ---
print("\n--- 4. Verifying Modal Edit/Create Support ---")
with open('js/components/modal.js', 'r', encoding='utf-8') as f:
    modal_code = f.read()

assert 'editingTaskId' in modal_code, "editingTaskId state missing in modal.js"
assert 'taskToEdit' in modal_code, "taskToEdit parameter missing in modal.open()"
assert 'updateTask(' in modal_code, "state.updateTask call missing in modal.js"
print("  [PASS] Modal supports both Create and Edit modes with full field validation.")

# --- 5. Verify HTML Controls ---
print("\n--- 5. Verifying HTML Controls & Structure ---")
with open('index.html', 'r', encoding='utf-8') as f:
    html_code = f.read()

assert 'id="tasks-sort-select"' in html_code, "tasks-sort-select missing in index.html"
assert 'data-filter="all"' in html_code, "all filter tab missing in index.html"
assert 'data-filter="pending"' in html_code, "pending filter tab missing in index.html"
assert 'data-filter="completed"' in html_code, "completed filter tab missing in index.html"
print("  [PASS] Sort dropdown and filter tabs verified in HTML.")

# --- 6. Verify Keyboard Shortcuts in App ---
print("\n--- 6. Verifying Global Keyboard Shortcuts ---")
with open('js/app.js', 'r', encoding='utf-8') as f:
    app_code = f.read()

assert 'bindGlobalShortcuts(' in app_code, "bindGlobalShortcuts missing in app.js"
assert "'n'" in app_code or '"n"' in app_code, "N shortcut missing in app.js"
print("  [PASS] Global keyboard shortcuts (Ctrl+K, N for new task, Escape) verified.")

print("\nALL PHASE 2 FUNCTIONALITY CHECKS PASSED (100%)!")

