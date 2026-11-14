/**
 * Modal Component Module (Phase 2)
 * Manages Create and Edit Task modal dialog opening, pre-filling, validation, and submission
 */

import { $, on } from '../utils/dom.js';
import { toast } from './toast.js';
import { api } from '../services/api.js';

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

/**
 * AuthModal Component Module (Phase 5 & 6 Frontend Integration)
 * Manages user authentication, registration, session inspection, and account switching.
 */
export class AuthModal {
  constructor(state) {
    this.state = state;
    this.modalEl = $('#auth-modal');
    this.modalCard = this.modalEl?.querySelector('.auth-modal-card');
    this.closeBtn = $('#auth-modal-close-btn');
    this.navContainer = $('.auth-nav-container');
    this.floatingBubble = $('#auth-floating-bubble');
    this.authCanvas = $('#auth-canvas');
    this.tabSignIn = $('#auth-tab-signin');
    this.tabRegister = $('#auth-tab-register');
    this.alertEl = $('#auth-alert');
    this.signInForm = $('#auth-signin-form');
    this.registerForm = $('#auth-register-form');
    this.profileView = $('#auth-profile-view');
    this.cancelSignInBtn = $('#auth-signin-cancel-btn');
    this.cancelRegBtn = $('#auth-register-cancel-btn');
    this.logoutBtn = $('#auth-logout-btn');
    this.switchAccountBtn = $('#auth-switch-account-btn');

    this.profileAvatar = $('#auth-profile-avatar');
    this.profileName = $('#auth-profile-name');
    this.profileEmail = $('#auth-profile-email');

    this.mode = 'signin';
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    if (this.closeBtn) on(this.closeBtn, 'click', () => this.close());
    if (this.cancelSignInBtn) on(this.cancelSignInBtn, 'click', () => this.close());
    if (this.cancelRegBtn) on(this.cancelRegBtn, 'click', () => this.close());

    if (this.tabSignIn) on(this.tabSignIn, 'click', () => this.setMode('signin', true));
    if (this.tabRegister) on(this.tabRegister, 'click', () => this.setMode('register', true));

    if (this.switchAccountBtn) on(this.switchAccountBtn, 'click', () => this.setMode('signin', true));
    if (this.logoutBtn) on(this.logoutBtn, 'click', () => this.handleLogout());

    if (this.modalEl) {
      on(this.modalEl, 'click', (e) => {
        if (e.target === this.modalEl) this.close();
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) this.close();
    });

    on(window, 'resize', () => {
      if (this.isOpen() && this.mode !== 'profile') {
        this.updateBubble(false);
      }
    });

    if (this.signInForm) {
      on(this.signInForm, 'submit', (e) => {
        e.preventDefault();
        this.handleSignIn();
      });
    }

    if (this.registerForm) {
      on(this.registerForm, 'submit', (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
  }

  isOpen() {
    return this.modalEl && !this.modalEl.hasAttribute('hidden');
  }

  open(targetMode = null) {
    if (!this.modalEl) return;
    this.clearAlert();
    this.modalEl.removeAttribute('hidden');

    const initialMode = targetMode || 'signin';
    this.setMode(initialMode, false);
    requestAnimationFrame(() => {
      this.updateBubble(false);
    });

    // Check backend session non-blockingly so dialog opens instantly
    api.getMe().then(user => {
      if (user && this.isOpen()) {
        this.renderProfile(user);
        this.setMode('profile', false);
      }
    }).catch(() => {});
  }

  close() {
    if (this.modalEl) {
      this.modalEl.setAttribute('hidden', '');
      this.clearAlert();
    }
  }

  showAlert(message) {
    if (this.alertEl) {
      this.alertEl.textContent = message;
      this.alertEl.removeAttribute('hidden');
    }
  }

  clearAlert() {
    if (this.alertEl) {
      this.alertEl.textContent = '';
      this.alertEl.setAttribute('hidden', '');
    }
  }

  updateBubble() {
    const activeTab = this.mode === 'register' ? this.tabRegister : this.tabSignIn;
    if (!this.floatingBubble || !activeTab) return;

    const x = activeTab.offsetLeft;
    const y = activeTab.offsetTop;

    if (activeTab.offsetWidth === 0) return;

    this.floatingBubble.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    this.floatingBubble.style.opacity = '1';
  }

  setMode(mode, animated = true) {
    this.mode = mode;
    this.clearAlert();

    const navContainer = this.navContainer || this.modalEl?.querySelector('.auth-nav-container') || this.modalEl?.querySelector('.auth-tabs');

    if (mode === 'profile') {
      if (navContainer) navContainer.setAttribute('hidden', '');
      this.signInForm?.setAttribute('hidden', '');
      this.registerForm?.setAttribute('hidden', '');
      this.profileView?.removeAttribute('hidden');
    } else {
      if (navContainer) navContainer.removeAttribute('hidden');
      this.profileView?.setAttribute('hidden', '');

      if (mode === 'signin') {
        this.tabSignIn?.classList.add('active');
        this.tabSignIn?.setAttribute('aria-selected', 'true');
        this.tabRegister?.classList.remove('active');
        this.tabRegister?.setAttribute('aria-selected', 'false');

        this.signInForm?.removeAttribute('hidden');
        this.registerForm?.setAttribute('hidden', '');

        setTimeout(() => {
          if (this.isOpen()) $('#auth-signin-email')?.focus({ preventScroll: true });
        }, 200);
      } else {
        this.tabRegister?.classList.add('active');
        this.tabRegister?.setAttribute('aria-selected', 'true');
        this.tabSignIn?.classList.remove('active');
        this.tabSignIn?.setAttribute('aria-selected', 'false');

        this.registerForm?.removeAttribute('hidden');
        this.signInForm?.setAttribute('hidden', '');

        setTimeout(() => {
          if (this.isOpen()) $('#auth-reg-name')?.focus({ preventScroll: true });
        }, 200);
      }

      this.updateBubble(animated);
    }
  }

  renderProfile(user) {
    if (this.profileName) this.profileName.textContent = user.fullName || user.username;
    if (this.profileEmail) this.profileEmail.textContent = user.email;
    if (this.profileAvatar) {
      const initials = (user.fullName || user.username || 'U')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      this.profileAvatar.textContent = initials;
    }
  }

  async handleSignIn() {
    const email = $('#auth-signin-email')?.value?.trim();
    const password = $('#auth-signin-password')?.value;

    if (!email || !password) {
      this.showAlert('Please provide both email and password.');
      return;
    }

    try {
      const data = await api.login({ email, password });
      toast.show(`Welcome back, ${data.user.fullName}!`);
      this.updateSidebarUser(data.user);
      if (this.state) {
        await this.state.syncWithBackend();
      }
      this.close();
    } catch (err) {
      this.showAlert(err.message || 'Login failed. Please check credentials.');
    }
  }

  async handleRegister() {
    const fullName = $('#auth-reg-name')?.value?.trim();
    const username = $('#auth-reg-username')?.value?.trim();
    const email = $('#auth-reg-email')?.value?.trim();
    const password = $('#auth-reg-password')?.value;

    if (!fullName || !username || !email || !password) {
      this.showAlert('All fields are required.');
      return;
    }

    try {
      const data = await api.register({ fullName, username, email, password });
      toast.show(`Account created! Welcome, ${data.user.fullName}!`);
      this.updateSidebarUser(data.user);
      if (this.state) {
        await this.state.syncWithBackend();
      }
      this.close();
    } catch (err) {
      this.showAlert(err.message || 'Registration failed.');
    }
  }

  async handleLogout() {
    try {
      await api.logout();
    } catch {}
    api.clearToken();
    toast.show('Signed out successfully.');
    this.updateSidebarUser({
      fullName: 'Alex Morgan',
      email: 'alex@tempo.dev'
    });
    if (this.state) {
      await this.state.syncWithBackend();
    }
    this.close();
  }

  updateSidebarUser(user) {
    const nameEl = $('#sidebar-user-name');
    const roleEl = $('#sidebar-user-role');
    const avatarEl = $('#sidebar-user-avatar');

    if (nameEl) nameEl.textContent = user.fullName || user.username || 'Tempo User';
    if (roleEl) roleEl.textContent = user.email || 'user@tempo.dev';
    if (avatarEl) {
      const initials = (user.fullName || user.username || 'TM')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      avatarEl.textContent = initials;
    }
  }
}

