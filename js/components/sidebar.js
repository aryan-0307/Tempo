/**
 * Sidebar Component Module
 * Manages sidebar navigation, responsive mobile drawer, and badge counts
 */

import { $, $$, on } from '../utils/dom.js';

export class Sidebar {
  constructor(state, authModal = null) {
    this.state = state;
    this.authModal = authModal;
    this.sidebarEl = $('#app-sidebar');
    this.toggleBtn = $('#sidebar-toggle-btn');
    this.headerToggleBtn = $('#sidebar-header-toggle-btn');
    this.backdropEl = $('#sidebar-backdrop');
    this.navItems = $$('.sidebar-nav .nav-item');
    this.currentViewBadge = $('#current-view-badge');
    this.userProfileEl = $('#sidebar-user-profile');
    this.userMoreBtn = $('#sidebar-user-more-btn');

    // Count elements
    this.countDashboard = $('#count-dashboard');
    this.countMyTasks = $('#count-my-tasks');
    this.countUpcoming = $('#count-upcoming');
    this.countCompleted = $('#count-completed');
    this.countProjectWork = $('#count-project-work');
    this.countProjectPersonal = $('#count-project-personal');
    this.countProjectDesign = $('#count-project-design');
  }

  init() {
    this.bindEvents();
    if (this.state) {
      this.state.subscribe(() => {
        this.updateCounts();
        this.updateActiveNav();
      });
    }

    // Restore desktop collapsed state preference
    if (window.innerWidth > 768) {
      try {
        if (localStorage.getItem('tempo_sidebar_collapsed') === '1') {
          this.sidebarEl?.classList.add('collapsed');
        }
      } catch (e) {}
    }
  }

  bindEvents() {
    // Toggle sidebar on mobile topbar or desktop collapsed topbar
    if (this.toggleBtn) {
      on(this.toggleBtn, 'click', () => this.toggle());
    }

    // Toggle/resize sidebar from header toggle button
    if (this.headerToggleBtn) {
      on(this.headerToggleBtn, 'click', () => this.toggle());
    }

    // Responsive resize listener
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768) {
        this.sidebarEl?.classList.remove('collapsed');
      } else {
        this.sidebarEl?.classList.remove('open');
        this.backdropEl?.classList.remove('active');
        try {
          if (localStorage.getItem('tempo_sidebar_collapsed') === '1') {
            this.sidebarEl?.classList.add('collapsed');
          }
        } catch (e) {}
      }
    });

    // Close on backdrop click
    if (this.backdropEl) {
      on(this.backdropEl, 'click', () => this.close());
    }

    // Account & User profile click handling
    if (this.userProfileEl) {
      on(this.userProfileEl, 'click', () => {
        if (this.authModal) {
          this.authModal.open();
        }
      });
      on(this.userProfileEl, 'keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && this.authModal) {
          e.preventDefault();
          this.authModal.open();
        }
      });
    }

    if (this.userMoreBtn) {
      on(this.userMoreBtn, 'click', (e) => {
        e.stopPropagation();
        if (this.authModal) {
          this.authModal.open();
        }
      });
    }

    // Navigation item click handling
    this.navItems.forEach(item => {
      on(item, 'click', (e) => {
        const target = e.currentTarget;
        const view = target.getAttribute('data-view');
        this.setActiveItem(target, view);

        if (this.state && view) {
          this.state.setViewFilter(view);
        }

        // Immediately reset scroll to top on navigation change
        const mainContainer = document.getElementById('main-content') || document.querySelector('.app-main');
        if (mainContainer) {
          mainContainer.scrollTop = 0;
        }
        window.scrollTo(0, 0);

        if (view === 'settings') {
          const settingsSection = document.getElementById('settings-section');
          if (settingsSection && typeof settingsSection.scrollIntoView === 'function') {
            settingsSection.scrollIntoView({ behavior: 'instant', block: 'start' });
          }
        }

        // On mobile viewports, automatically close drawer after navigation
        if (window.innerWidth <= 768) {
          this.close();
        }
      });
    });

    // Close sidebar on ESC key
    on(document, 'keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  toggle() {
    if (!this.sidebarEl) return;
    if (window.innerWidth <= 768) {
      const isOpen = this.sidebarEl.classList.toggle('open');
      if (this.backdropEl) {
        this.backdropEl.classList.toggle('active', isOpen);
      }
    } else {
      const isCollapsed = this.sidebarEl.classList.toggle('collapsed');
      try {
        localStorage.setItem('tempo_sidebar_collapsed', isCollapsed ? '1' : '0');
      } catch (e) {}
    }
  }

  close() {
    if (this.sidebarEl) {
      this.sidebarEl.classList.remove('open');
    }
    if (this.backdropEl) {
      this.backdropEl.classList.remove('active');
    }
  }

  isOpen() {
    if (window.innerWidth <= 768) {
      return this.sidebarEl?.classList.contains('open') || false;
    }
    return !this.sidebarEl?.classList.contains('collapsed');
  }

  setActiveItem(activeItem, view) {
    this.navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');

    const labelSpan = activeItem.querySelector('.nav-label');
    if (labelSpan && this.currentViewBadge) {
      this.currentViewBadge.textContent = `${labelSpan.textContent} View`;
    }
  }

  updateActiveNav() {
    if (!this.state) return;
    const currentView = this.state.activeView;
    this.navItems.forEach(item => {
      const view = item.getAttribute('data-view');
      const isActive = view === currentView;
      item.classList.toggle('active', isActive);
      if (isActive) {
        const labelSpan = item.querySelector('.nav-label');
        if (labelSpan && this.currentViewBadge) {
          this.currentViewBadge.textContent = `${labelSpan.textContent} View`;
        }
      }
    });
  }

  updateCounts() {
    if (!this.state) return;
    const tasks = this.state.getTasks();
    const today = this.state.getTodayString();

    const total = tasks.length;
    const pending = tasks.filter(t => !t.completed).length;
    const upcoming = tasks.filter(t => !t.completed && t.dueDate > today).length;
    const completed = tasks.filter(t => t.completed).length;
    const work = tasks.filter(t => t.project === 'Work').length;
    const personal = tasks.filter(t => t.project === 'Personal').length;
    const design = tasks.filter(t => t.project === 'Design System').length;

    if (this.countDashboard) this.countDashboard.textContent = total;
    if (this.countMyTasks) this.countMyTasks.textContent = pending;
    if (this.countUpcoming) this.countUpcoming.textContent = upcoming;
    if (this.countCompleted) this.countCompleted.textContent = completed;
    if (this.countProjectWork) this.countProjectWork.textContent = work;
    if (this.countProjectPersonal) this.countProjectPersonal.textContent = personal;
    if (this.countProjectDesign) this.countProjectDesign.textContent = design;
  }
}
