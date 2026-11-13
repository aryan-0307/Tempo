/**
 * Tasks Component Module (Phase 2)
 * Full CRUD interactivity, Drag-and-Drop reordering, Sorting, Inline editing, and Undo deletion
 */

import { $, $$, on, escapeHtml, formatDisplayDate } from '../utils/dom.js';
import { toast } from './toast.js';

export class Tasks {
  constructor(state, modal) {
    this.state = state;
    this.modal = modal;
    this.listEl = $('#tasks-list');
    this.headingEl = $('#tasks-heading');
    this.countBadgeEl = $('#tasks-count-badge');
    this.emptyStateEl = $('#tasks-empty-state');
    this.emptyTitleEl = $('#empty-state-title');
    this.emptyDescEl = $('#empty-state-desc');
    this.filterTabs = $$('.filter-tab');
    this.sortSelect = $('#tasks-sort-select');

    this.draggedTaskId = null;
    this.activeInlineEditId = null;
  }

  init() {
    this.bindEvents();
    this.state.subscribe(() => this.render());
  }

  bindEvents() {
    // 1. Status Filter Tabs (All / Pending / Completed)
    this.filterTabs.forEach(tab => {
      on(tab, 'click', (e) => {
        const filter = e.currentTarget.getAttribute('data-filter');
        this.filterTabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        e.currentTarget.classList.add('active');
        e.currentTarget.setAttribute('aria-selected', 'true');
        this.state.setStatusFilter(filter);
      });
    });

    // 2. Sorting Select Dropdown
    if (this.sortSelect) {
      on(this.sortSelect, 'change', (e) => {
        this.state.setSort(e.target.value);
      });
    }

    // 3. Task List Delegated Actions (Checkbox Toggle, Delete, Edit, Inline Rename)
    if (this.listEl) {
      // Checkbox Toggle
      on(this.listEl, 'change', (e) => {
        const target = e.target;
        if (target && target.matches('.task-checkbox')) {
          const taskId = target.getAttribute('data-id');
          if (taskId) {
            const updated = this.state.toggleTask(taskId);
            if (updated) {
              const msg = updated.completed ? 'Task completed' : 'Task marked active';
              toast.show(msg);
            }
          }
        }
      });

      // Button Click Handlers (Delete & Edit)
      on(this.listEl, 'click', (e) => {
        // Delete button
        const deleteBtn = e.target.closest('.task-delete-btn');
        if (deleteBtn) {
          const taskId = deleteBtn.getAttribute('data-id');
          if (taskId) {
            const deleted = this.state.deleteTask(taskId);
            if (deleted) {
              toast.show(`Deleted "${deleted.title}"`, {
                label: 'Undo',
                onClick: () => {
                  this.state.restoreLastDeletedTask();
                  toast.show('Task restored');
                }
              });
            }
          }
          return;
        }

        // Edit button
        const editBtn = e.target.closest('.task-edit-btn');
        if (editBtn) {
          const taskId = editBtn.getAttribute('data-id');
          if (taskId) {
            const task = this.state.getTaskById(taskId);
            if (task && this.modal) {
              this.modal.open(task);
            }
          }
          return;
        }
      });

      // Double-click to trigger Inline Rename
      on(this.listEl, 'dblclick', (e) => {
        const titleSpan = e.target.closest('.task-title');
        if (titleSpan) {
          const taskItem = titleSpan.closest('.task-item');
          if (taskItem) {
            const taskId = taskItem.getAttribute('data-id');
            this.startInlineEdit(taskId, titleSpan);
          }
        }
      });

      // 4. HTML5 Drag-and-Drop Events
      on(this.listEl, 'dragstart', (e) => {
        const item = e.target.closest('.task-item');
        if (!item || this.activeInlineEditId) return;

        this.draggedTaskId = item.getAttribute('data-id');
        item.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.draggedTaskId);
      });

      on(this.listEl, 'dragover', (e) => {
        const item = e.target.closest('.task-item');
        if (!item || item.getAttribute('data-id') === this.draggedTaskId) return;

        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = item.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isUpperHalf = e.clientY < midpoint;

        $$('.task-item', this.listEl).forEach(el => {
          if (el !== item) {
            el.classList.remove('drag-over-top', 'drag-over-bottom');
          }
        });

        if (isUpperHalf) {
          item.classList.add('drag-over-top');
          item.classList.remove('drag-over-bottom');
        } else {
          item.classList.add('drag-over-bottom');
          item.classList.remove('drag-over-top');
        }
      });

      on(this.listEl, 'dragleave', (e) => {
        const item = e.target.closest('.task-item');
        if (item) {
          item.classList.remove('drag-over-top', 'drag-over-bottom');
        }
      });

      on(this.listEl, 'drop', (e) => {
        const targetItem = e.target.closest('.task-item');
        if (!targetItem) return;

        e.preventDefault();
        const targetId = targetItem.getAttribute('data-id');
        const sourceId = this.draggedTaskId || e.dataTransfer.getData('text/plain');

        const isUpperHalf = targetItem.classList.contains('drag-over-top');
        const position = isUpperHalf ? 'before' : 'after';

        targetItem.classList.remove('drag-over-top', 'drag-over-bottom');

        if (sourceId && targetId && sourceId !== targetId) {
          this.state.reorderTasks(sourceId, targetId, position);
          toast.show('Task order updated');
        }
      });

      on(this.listEl, 'dragend', () => {
        this.draggedTaskId = null;
        $$('.task-item', this.listEl).forEach(el => {
          el.classList.remove('is-dragging', 'drag-over-top', 'drag-over-bottom');
        });
      });
    }
  }

  startInlineEdit(taskId, titleElement) {
    if (this.activeInlineEditId) return;
    this.activeInlineEditId = taskId;

    const currentTitle = titleElement.textContent.trim();
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'task-title-inline-input';
    input.value = currentTitle;
    input.setAttribute('aria-label', 'Edit task title');

    titleElement.replaceWith(input);
    input.focus();
    input.select();

    const finishEdit = (save) => {
      if (!this.activeInlineEditId) return;
      this.activeInlineEditId = null;

      const newTitle = input.value.trim();
      if (save && newTitle && newTitle !== currentTitle) {
        this.state.updateTask(taskId, { title: newTitle });
        toast.show('Title updated');
      } else {
        this.render();
      }
    };

    on(input, 'keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEdit(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        finishEdit(false);
      }
    });

    on(input, 'blur', () => {
      finishEdit(true);
    });
  }

  getViewTitle(activeView) {
    switch (activeView) {
      case 'dashboard':
        return "Today's Tasks";
      case 'my-tasks':
        return "My Pending Tasks";
      case 'upcoming':
        return "Upcoming Tasks";
      case 'completed':
        return "Completed Tasks";
      case 'project-work':
        return "Work Projects";
      case 'project-personal':
        return "Personal Projects";
      case 'project-design':
        return "Design System Tasks";
      default:
        return "Tasks";
    }
  }

  render() {
    const tasks = this.state.getFilteredTasks();
    const today = this.state.getTodayString();

    // Section heading
    if (this.headingEl) {
      this.headingEl.textContent = this.getViewTitle(this.state.activeView);
    }

    // Tasks count badge
    if (this.countBadgeEl) {
      const label = tasks.length === 1 ? '1 task' : `${tasks.length} tasks`;
      this.countBadgeEl.textContent = label;
    }

    // Empty state handling
    if (tasks.length === 0) {
      if (this.listEl) this.listEl.innerHTML = '';
      if (this.emptyStateEl) {
        this.emptyStateEl.removeAttribute('hidden');
        if (this.state.searchQuery) {
          if (this.emptyTitleEl) this.emptyTitleEl.textContent = 'No matching tasks';
          if (this.emptyDescEl) {
            this.emptyDescEl.textContent = `No tasks matched your search "${this.state.searchQuery}". Try a different term.`;
          }
        } else {
          if (this.emptyTitleEl) this.emptyTitleEl.textContent = 'No tasks in this view';
          if (this.emptyDescEl) {
            this.emptyDescEl.textContent = "You're all caught up! Enjoy your day or create a new task above.";
          }
        }
      }
      return;
    }

    // Hide empty state if tasks exist
    if (this.emptyStateEl) {
      this.emptyStateEl.setAttribute('hidden', '');
    }

    // Render task items
    const html = tasks.map(task => {
      const isCompleted = task.completed;
      const isOverdue = !isCompleted && task.dueDate && task.dueDate < today;
      const displayDate = formatDisplayDate(task.dueDate);

      const projectClass = task.project === 'Personal' 
        ? 'dot-personal' 
        : task.project === 'Design System' 
          ? 'dot-design' 
          : 'dot-work';

      const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
      const priorityClass = `priority-${task.priority.toLowerCase()}`;

      return `
        <li class="task-item ${isCompleted ? 'completed' : ''}" data-id="${escapeHtml(task.id)}" draggable="true" role="listitem">
          <div class="task-item-left">
            <span class="task-drag-handle" title="Drag to reorder task" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="6" r="1.2" fill="currentColor"></circle>
                <circle cx="9" cy="12" r="1.2" fill="currentColor"></circle>
                <circle cx="9" cy="18" r="1.2" fill="currentColor"></circle>
                <circle cx="15" cy="6" r="1.2" fill="currentColor"></circle>
                <circle cx="15" cy="12" r="1.2" fill="currentColor"></circle>
                <circle cx="15" cy="18" r="1.2" fill="currentColor"></circle>
              </svg>
            </span>
            <label class="task-checkbox-label" aria-label="Mark task '${escapeHtml(task.title)}' as ${isCompleted ? 'pending' : 'completed'}">
              <input 
                type="checkbox" 
                class="task-checkbox" 
                data-id="${escapeHtml(task.id)}" 
                ${isCompleted ? 'checked' : ''}
              >
            </label>
            <div class="task-content">
              <span class="task-title" title="Double click to edit title">${escapeHtml(task.title)}</span>
              <div class="task-meta">
                <span class="priority-badge ${priorityClass}">${escapeHtml(priorityLabel)}</span>
                <span class="due-date-badge ${isOverdue ? 'is-overdue' : ''}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  <span>${isOverdue ? 'Overdue: ' : ''}${escapeHtml(displayDate)}</span>
                </span>
                <span class="project-tag">
                  <span class="project-dot ${projectClass}"></span>
                  <span>${escapeHtml(task.project)}</span>
                </span>
              </div>
            </div>
          </div>
          <div class="task-item-right">
            <button 
              type="button" 
              class="btn-icon task-edit-btn" 
              data-id="${escapeHtml(task.id)}" 
              aria-label="Edit task '${escapeHtml(task.title)}'"
              title="Edit task"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button 
              type="button" 
              class="btn-icon task-delete-btn" 
              data-id="${escapeHtml(task.id)}" 
              aria-label="Delete task '${escapeHtml(task.title)}'"
              title="Delete task"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </li>
      `;
    }).join('');

    if (this.listEl) {
      this.listEl.innerHTML = html;
    }
  }
}
