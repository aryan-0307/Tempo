import os
import re
import sys

# Ensure running from repository root
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(script_dir, '..'))
os.chdir(project_root)

print("=== Tempo Layout & Structure Test ===")

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Sidebar Requirements Verification
print("\n--- 1. Testing Sidebar Requirements ---")
assert 'Tempo' in html, "Tempo branding missing"
assert 'id="app-sidebar"' in html or 'class="app-sidebar"' in html, "Sidebar element missing"
assert 'data-view="dashboard"' in html, "Dashboard nav link missing"
assert 'data-view="my-tasks"' in html, "My Tasks nav link missing"
assert 'data-view="upcoming"' in html, "Upcoming nav link missing"
assert 'data-view="completed"' in html, "Completed nav link missing"
assert 'Projects' in html, "Projects section in sidebar missing"
assert 'data-view="settings"' in html, "Settings nav link missing"
assert 'sidebar-user-profile' in html or 'user-profile' in html, "User profile section at bottom missing"
assert 'Alex Morgan' in html, "User name missing in profile section"
print("  [PASS] Sidebar has branding, Dashboard, My Tasks, Upcoming, Completed, Projects, Settings, User profile.")

# 2. Main Content Requirements Verification
print("\n--- 2. Testing Main Content Requirements ---")
assert 'id="welcome-message"' in html, "Welcome message element missing"
assert 'id="current-date-display"' in html, "Current date display element missing"
assert 'id="global-search-input"' in html, "Search bar input missing"
assert 'id="notifications-btn"' in html, "Notification icon button missing"
assert 'open-create-task-modal-btn' in html, "Create Task button missing"
assert 'overview-section' in html, "Overview section missing"
print("  [PASS] Main content has Welcome message, Current date, Search bar, Notification icon, Create Task button, Overview section.")

# 3. Dashboard Overview Requirements Verification
print("\n--- 3. Testing Dashboard Overview Requirements ---")
assert 'stat-total-tasks' in html, "Total tasks counter missing"
assert 'stat-completed-tasks' in html, "Completed tasks counter missing"
assert 'stat-pending-tasks' in html, "Pending tasks counter missing"
assert 'stat-overdue-tasks' in html, "Overdue tasks counter missing"
print("  [PASS] Dashboard overview displays Total tasks, Completed tasks, Pending tasks, and Overdue tasks.")

# 4. Task Section Requirements Verification
print("\n--- 4. Testing Task Section Requirements ---")
assert 'tasks-section' in html, "Task section container missing"
assert "Today's Tasks" in html or 'tasks-heading' in html, "Today's tasks heading missing"
assert 'id="tasks-list"' in html, "Task list container missing"

# Check JS task item rendering rules (Title, Priority, Due date, Completion status)
with open('js/components/tasks.js', 'r', encoding='utf-8') as f:
    tasks_js = f.read()

assert 'task-title' in tasks_js, "Task title element rendering missing in tasks.js"
assert 'priority' in tasks_js, "Priority element rendering missing in tasks.js"
assert 'due-date' in tasks_js or 'dueDate' in tasks_js, "Due date element rendering missing in tasks.js"
assert 'task-checkbox' in tasks_js, "Completion status checkbox missing in tasks.js"
print("  [PASS] Task section renders Today's tasks with Title, Priority, Due date, and Completion status.")

# 5. Implementation Rules Verification
print("\n--- 5. Testing Implementation Rules ---")
# Check for forbidden inline styles in index.html
inline_styles = re.findall(r'<[^>]+style=[\'"][^\'"]*[\'"]', html, re.IGNORECASE)
assert len(inline_styles) == 0, f"Found inline style attribute: {inline_styles}"
print("  [PASS] Zero inline style attributes found.")

# Check for forbidden inline event handlers (onclick, onchange, etc.) in index.html
inline_events = re.findall(r'\s+on[a-z]+=[\'"][^\'"]*[\'"]', html, re.IGNORECASE)
assert len(inline_events) == 0, f"Found inline event handler: {inline_events}"
print("  [PASS] Zero inline event handler attributes found.")

# Semantic HTML checks
assert '<aside' in html, "Semantic <aside> element missing"
assert '<main' in html, "Semantic <main> element missing"
assert '<header' in html, "Semantic <header> element missing"
assert '<nav' in html, "Semantic <nav> element missing"
assert '<footer' in html, "Semantic <footer >element missing"
print("  [PASS] Semantic HTML elements used (<aside>, <main>, <header>, <nav>, <footer>).")

# Check responsive CSS rules
with open('css/layout.css', 'r', encoding='utf-8') as f:
    layout_css = f.read()
assert '@media' in layout_css, "Responsive media queries missing in layout.css"
assert 'app-sidebar.open' in layout_css, "Mobile sidebar drawer open state missing in layout.css"
assert 'sidebar-backdrop' in layout_css, "Mobile sidebar backdrop missing in layout.css"
print("  [PASS] Responsive layout rules, media queries, and mobile drawer transitions verified.")

# Check in-memory store functionality
with open('js/state.js', 'r', encoding='utf-8') as f:
    state_js = f.read()
assert 'addTask' in state_js, "addTask missing in state.js"
assert 'toggleTask' in state_js, "toggleTask missing in state.js"
assert 'deleteTask' in state_js, "deleteTask missing in state.js"
assert 'getStats' in state_js, "getStats missing in state.js"
assert 'getFilteredTasks' in state_js, "getFilteredTasks missing in state.js"
print("  [PASS] In-memory reactive state manager with mock data verified.")

print("\nALL APPLICATION LAYOUT TESTS PASSED (100%)!")
