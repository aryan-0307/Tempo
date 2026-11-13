/**
 * Modal Component Module (Phase 2)
 * Manages Create and Edit Task modal dialog opening, pre-filling, validation, and submission
 */

import { $, on } from '../utils/dom.js';
import { toast } from './toast.js';

export class Modal {
  constructor(state) {
    this.state = state;
    this.modalEl = $('#create-task-modal');
    this.modalTitleEl = $('#modal-title');
    this.modalSubmitBtn = $('#modal-submit-btn');
    this.openBtn = $('#open-create-task-modal-btn');
    this.emptyOpenBtn = $('#empty-state-create-btn');
    this.closeBtn = $('#modal-close-btn');
    this.cancelBtn = $('#modal-cancel-btn');
    this.form = $('#create-task-form');
    this.titleInput = $('#task-title-input');
    this.priorityInput = $('#task-priority-input');
    this.projectInput = $('#task-project-input');
    this.dueDateInput = $('#task-due-date-input');

    this.editingTaskId = null;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Open modal buttons (Create mode)
    if (this.openBtn) {
      on(this.openBtn, 'click', () => this.open());
    }
    if (this.emptyOpenBtn) {
      on(this.emptyOpenBtn, 'click', () => this.open());
    }

    // Close buttons
    if (this.closeBtn) {
      on(this.closeBtn, 'click', () => this.close());
    }
    if (this.cancelBtn) {
      on(this.cancelBtn, 'click', () => this.close());
    }

    // Close on backdrop click (click outside card)
    if (this.modalEl) {
      on(this.modalEl, 'click', (e) => {
        if (e.target === this.modalEl) {
          this.close();
        }
      });
    }

    // Close on Escape key
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Form submission
    if (this.form) {
      on(this.form, 'submit', (e) => {
        e.preventDefault();
        this.handleSubmit();
      });
    }
  }

  open(taskToEdit = null) {
    if (!this.modalEl) return;

    this.modalEl.removeAttribute('hidden');

    if (taskToEdit) {
      this.editingTaskId = taskToEdit.id;
      if (this.modalTitleEl) this.modalTitleEl.textContent = 'Edit Task';
      if (this.modalSubmitBtn) this.modalSubmitBtn.textContent = 'Save Changes';

      if (this.titleInput) this.titleInput.value = taskToEdit.title;
      if (this.priorityInput) this.priorityInput.value = taskToEdit.priority;
      if (this.projectInput) this.projectInput.value = taskToEdit.project;
      if (this.dueDateInput) this.dueDateInput.value = taskToEdit.dueDate;
    } else {
      this.editingTaskId = null;
      if (this.modalTitleEl) this.modalTitleEl.textContent = 'Create New Task';
      if (this.modalSubmitBtn) this.modalSubmitBtn.textContent = 'Create Task';

      if (this.form) this.form.reset();
      if (this.dueDateInput) {
        this.dueDateInput.value = this.state.getTodayString();
      }
    }

    if (this.titleInput) {
      setTimeout(() => {
        this.titleInput.focus();
        this.titleInput.select();
      }, 50);
    }
  }

  close() {
    if (this.modalEl) {
      this.modalEl.setAttribute('hidden', '');
      this.editingTaskId = null;
      if (this.form) {
        this.form.reset();
      }
    }
  }

  isOpen() {
    return this.modalEl && !this.modalEl.hasAttribute('hidden');
  }

  handleSubmit() {
    const title = this.titleInput?.value || '';
    if (!title.trim()) return;

    const priority = this.priorityInput?.value || 'medium';
    const project = this.projectInput?.value || 'Work';
    const dueDate = this.dueDateInput?.value || this.state.getTodayString();

    if (this.editingTaskId) {
      this.state.updateTask(this.editingTaskId, {
        title: title.trim(),
        priority,
        project,
        dueDate
      });
      toast.show('Task updated successfully');
    } else {
      this.state.addTask({
        title: title.trim(),
        priority,
        project,
        dueDate
      });
      toast.show('New task created');
    }

    this.close();
  }
}
