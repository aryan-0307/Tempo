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
    if (this._closeTimeout) {
      clearTimeout(this._closeTimeout);
      this._closeTimeout = null;
    }

    this.modalEl.removeAttribute('hidden');
    requestAnimationFrame(() => {
      this.modalEl.classList.add('is-open');
    });

    if (taskToEdit) {
      this.editingTaskId = taskToEdit.id;
      if (this.modalTitleEl) this.modalTitleEl.textContent = 'Edit Task';
      if (this.modalSubmitBtn) this.modalSubmitBtn.textContent = 'Save Changes';

      this.updateProjectOptions(taskToEdit.project);
      if (this.titleInput) this.titleInput.value = taskToEdit.title;
      if (this.priorityInput) this.priorityInput.value = taskToEdit.priority;
      if (this.projectInput) this.projectInput.value = taskToEdit.project;
      if (this.dueDateInput) this.dueDateInput.value = taskToEdit.dueDate;
    } else {
      this.editingTaskId = null;
      if (this.modalTitleEl) this.modalTitleEl.textContent = 'Create New Task';
      if (this.modalSubmitBtn) this.modalSubmitBtn.textContent = 'Create Task';

      this.updateProjectOptions();
      if (this.form) this.form.reset();
      if (this.dueDateInput) {
        this.dueDateInput.value = this.state.getTodayString();
      }
    }

    if (this.titleInput) {
      requestAnimationFrame(() => {
        this.titleInput.focus();
        this.titleInput.select();
      });
    }
  }

  updateProjectOptions(selectedProject = null) {
    if (!this.projectInput || !this.state) return;
    const projects = this.state.getProjects ? this.state.getProjects() : [];
    if (!projects || projects.length === 0) return;
    const currentVal = selectedProject || this.projectInput.value || 'Work';
    this.projectInput.innerHTML = projects.map(p =>
      `<option value="${p.name}">${p.name}</option>`
    ).join('');
    this.projectInput.value = currentVal;
    if (!this.projectInput.value && projects.length > 0) {
      this.projectInput.value = projects[0].name;
    }
  }

  close() {
    if (!this.modalEl || !this.isOpen()) return;
    this.modalEl.classList.remove('is-open');
    this.editingTaskId = null;
    if (this._closeTimeout) clearTimeout(this._closeTimeout);
    this._closeTimeout = setTimeout(() => {
      if (!this.modalEl.classList.contains('is-open')) {
        this.modalEl.setAttribute('hidden', '');
        if (this.form) {
          this.form.reset();
        }
      }
    }, 200);
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
    this.bubbleTrack = this.modalEl?.querySelector('.auth-bubble-track');
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

    this.signInTogglePwd = $('#auth-signin-toggle-pwd');
    this.regTogglePwd = $('#auth-reg-toggle-pwd');
    this.signInPwdInput = $('#auth-signin-password');
    this.regPwdInput = $('#auth-reg-password');

    this.mode = 'signin';
    this._closeTimeout = null;
    this.cachedUser = null;
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

    // Instant password visibility toggles
    const setupPwdToggle = (btn, input) => {
      if (!btn || !input) return;
      on(btn, 'click', (e) => {
        e.preventDefault();
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        const showIcon = btn.querySelector('.eye-show');
        const hideIcon = btn.querySelector('.eye-hide');
        if (showIcon) showIcon.toggleAttribute('hidden', isPwd);
        if (hideIcon) hideIcon.toggleAttribute('hidden', !isPwd);
        btn.setAttribute('aria-label', isPwd ? 'Hide password' : 'Show password');
      });
    };
    setupPwdToggle(this.signInTogglePwd, this.signInPwdInput);
    setupPwdToggle(this.regTogglePwd, this.regPwdInput);

    // Instant clear alert on user input typing
    const inputIds = [
      '#auth-signin-email', '#auth-signin-password',
      '#auth-reg-name', '#auth-reg-username', '#auth-reg-email', '#auth-reg-password'
    ];
    inputIds.forEach(id => {
      const el = $(id);
      if (el) on(el, 'input', () => this.clearAlert());
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
    if (this._closeTimeout) {
      clearTimeout(this._closeTimeout);
      this._closeTimeout = null;
    }
    this.clearAlert();

    const hasToken = !!api.getToken();
    let initialMode = targetMode;
    if (!initialMode) {
      initialMode = (hasToken && this.cachedUser) ? 'profile' : 'signin';
    }

    this.modalEl.removeAttribute('hidden');
    this.setMode(initialMode, false);

    // Trigger smooth GPU-accelerated entrance transition
    requestAnimationFrame(() => {
      this.modalEl.classList.add('is-open');
    });

    // Check backend session non-blockingly and cache user
    if (hasToken) {
      api.getMe().then(user => {
        if (user && this.isOpen()) {
          this.cachedUser = user;
          this.renderProfile(user);
          if (!targetMode && this.mode !== 'signin' && this.mode !== 'register') {
            this.setMode('profile', false);
          }
        }
      }).catch(() => {});
    }
  }

  updateProjectOptions(selectedProject = null) {
    if (!this.projectInput || !this.state) return;
    const projects = this.state.getProjects ? this.state.getProjects() : [];
    if (!projects || projects.length === 0) return;
    const currentVal = selectedProject || this.projectInput.value || 'Work';
    this.projectInput.innerHTML = projects.map(p =>
      `<option value="${p.name}">${p.name}</option>`
    ).join('');
    this.projectInput.value = currentVal;
    if (!this.projectInput.value && projects.length > 0) {
      this.projectInput.value = projects[0].name;
    }
  }

  close() {
    if (!this.modalEl || !this.isOpen()) return;
    this.modalEl.classList.remove('is-open');
    this.clearAlert();
    if (this._closeTimeout) clearTimeout(this._closeTimeout);
    this._closeTimeout = setTimeout(() => {
      if (!this.modalEl.classList.contains('is-open')) {
        this.modalEl.setAttribute('hidden', '');
      }
    }, 200);
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
    if (this.bubbleTrack && this.mode) {
      this.bubbleTrack.setAttribute('data-mode', this.mode);
    }
  }

  setMode(mode, animated = true) {
    if (this.mode === mode && this.bubbleTrack?.getAttribute('data-mode') === mode) {
      return;
    }
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

      if (this.bubbleTrack) {
        this.bubbleTrack.setAttribute('data-mode', mode);
      }

      if (mode === 'signin') {
        this.tabSignIn?.classList.add('active');
        this.tabSignIn?.setAttribute('aria-selected', 'true');
        this.tabRegister?.classList.remove('active');
        this.tabRegister?.setAttribute('aria-selected', 'false');

        this.signInForm?.removeAttribute('hidden');
        this.registerForm?.setAttribute('hidden', '');

        // Immediate focus without artificial timeout
        requestAnimationFrame(() => {
          if (this.isOpen()) $('#auth-signin-email')?.focus({ preventScroll: true });
        });
      } else {
        this.tabRegister?.classList.add('active');
        this.tabRegister?.setAttribute('aria-selected', 'true');
        this.tabSignIn?.classList.remove('active');
        this.tabSignIn?.setAttribute('aria-selected', 'false');

        this.registerForm?.removeAttribute('hidden');
        this.signInForm?.setAttribute('hidden', '');

        // Immediate focus without artificial timeout
        requestAnimationFrame(() => {
          if (this.isOpen()) $('#auth-reg-name')?.focus({ preventScroll: true });
        });
      }
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
      this.cachedUser = data.user;
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
      this.cachedUser = data.user;
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
    this.cachedUser = null;
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

/**
 * ProjectModal Component
 * Manages Create Project modal dialog for both Desktop and Mobile viewports
 */
export class ProjectModal {
  constructor(state, onProjectCreated = null) {
    this.state = state;
    this.onProjectCreated = onProjectCreated;
    this.modalEl = $('#create-project-modal');
    this.form = $('#create-project-form');
    this.nameInput = $('#project-name-input');
    this.colorSelect = $('#project-color-select');
    this.colorPicker = $('#project-color-picker');
    this.colorPickerTrigger = $('#color-picker-trigger');
    this.colorPickerMenu = $('#color-picker-menu');
    this.colorPickerSelectedSwatch = $('#color-picker-selected-swatch');
    this.colorPickerSelectedText = $('#color-picker-selected-text');
    this.colorPickerItems = this.colorPickerMenu ? Array.from(this.colorPickerMenu.querySelectorAll('.color-picker-item')) : [];
    this.closeBtn = $('#project-modal-close-btn');
    this.cancelBtn = $('#project-modal-cancel-btn');
    this.openBtns = [
      $('#open-create-project-modal-btn'),
      $('#sidebar-add-project-btn')
    ].filter(Boolean);
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    this.openBtns.forEach(btn => {
      on(btn, 'click', () => this.open());
    });

    if (this.closeBtn) {
      on(this.closeBtn, 'click', () => this.close());
    }

    if (this.cancelBtn) {
      on(this.cancelBtn, 'click', () => this.close());
    }

    if (this.modalEl) {
      on(this.modalEl, 'click', (e) => {
        if (e.target === this.modalEl) {
          this.close();
        }
      });
    }

    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });

    // Custom Color Picker Interactions
    if (this.colorPickerTrigger) {
      on(this.colorPickerTrigger, 'click', (e) => {
        e.stopPropagation();
        this.toggleColorMenu();
      });

      on(this.colorPickerTrigger, 'keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.openColorMenu();
          const first = this.colorPickerItems.find(i => i.classList.contains('selected')) || this.colorPickerItems[0];
          first?.focus();
        }
      });
    }

    this.colorPickerItems.forEach(item => {
      on(item, 'click', (e) => {
        e.stopPropagation();
        this.selectColor(item);
      });

      on(item, 'keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.selectColor(item);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = item.nextElementSibling;
          if (next && next.classList.contains('color-picker-item')) next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = item.previousElementSibling;
          if (prev && prev.classList.contains('color-picker-item')) prev.focus();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.closeColorMenu();
          this.colorPickerTrigger?.focus();
        }
      });
    });

    // Close color menu on click outside
    on(document, 'click', (e) => {
      if (this.colorPicker && !this.colorPicker.contains(e.target)) {
        this.closeColorMenu();
      }
    });

    if (this.form) {
      on(this.form, 'submit', async (e) => {
        e.preventDefault();
        await this.handleSubmit();
      });
    }
  }

  toggleColorMenu() {
    if (!this.colorPickerMenu) return;
    const isHidden = this.colorPickerMenu.hasAttribute('hidden');
    if (isHidden) {
      this.openColorMenu();
    } else {
      this.closeColorMenu();
    }
  }

  openColorMenu() {
    if (!this.colorPickerMenu || !this.colorPickerTrigger) return;
    this.colorPickerMenu.removeAttribute('hidden');
    this.colorPickerTrigger.setAttribute('aria-expanded', 'true');
    this.colorPicker?.classList.add('is-open');
  }

  closeColorMenu() {
    if (!this.colorPickerMenu || !this.colorPickerTrigger) return;
    this.colorPickerMenu.setAttribute('hidden', '');
    this.colorPickerTrigger.setAttribute('aria-expanded', 'false');
    this.colorPicker?.classList.remove('is-open');
  }

  selectColor(item) {
    const color = item.dataset.color;
    const name = item.dataset.name;
    const swatch = item.dataset.swatch;

    if (this.colorSelect) {
      this.colorSelect.value = color;
    }

    if (this.colorPickerSelectedSwatch) {
      this.colorPickerSelectedSwatch.className = `color-swatch-box ${swatch}`;
    }

    if (this.colorPickerSelectedText) {
      this.colorPickerSelectedText.textContent = name;
    }

    this.colorPickerItems.forEach(i => {
      const isSel = i === item;
      i.classList.toggle('selected', isSel);
      i.setAttribute('aria-selected', isSel ? 'true' : 'false');
    });

    this.closeColorMenu();
    this.colorPickerTrigger?.focus();
  }

  resetColorPicker() {
    const defaultItem = this.colorPickerItems.find(i => i.dataset.color === '#C6F55A') || this.colorPickerItems[0];
    if (defaultItem) {
      this.selectColor(defaultItem);
    }
    this.closeColorMenu();
  }

  open() {
    if (!this.modalEl) return;
    this.modalEl.removeAttribute('hidden');
    requestAnimationFrame(() => {
      this.modalEl.classList.add('is-open');
    });
    if (this.nameInput) {
      this.nameInput.value = '';
      requestAnimationFrame(() => this.nameInput.focus());
    }
    this.resetColorPicker();
  }

  close() {
    if (!this.modalEl || !this.isOpen()) return;
    this.closeColorMenu();
    this.modalEl.classList.remove('is-open');
    setTimeout(() => {
      if (!this.modalEl.classList.contains('is-open')) {
        this.modalEl.setAttribute('hidden', '');
      }
    }, 220);
  }

  isOpen() {
    return this.modalEl && !this.modalEl.hasAttribute('hidden') && this.modalEl.classList.contains('is-open');
  }

  async handleSubmit() {
    const name = (this.nameInput?.value || '').trim();
    const color = this.colorSelect?.value || '#C6F55A';

    if (!name) {
      toast.show('Please enter a project name', 'error');
      return;
    }

    try {
      const newProj = await this.state.addProject({ name, color });
      if (newProj) {
        toast.show(`Project "${name}" created successfully!`, 'success');
        if (typeof this.onProjectCreated === 'function') {
          this.onProjectCreated(newProj);
        }
        this.close();
      }
    } catch (err) {
      toast.show(err.message || 'Failed to create project', 'error');
    }
  }
}

