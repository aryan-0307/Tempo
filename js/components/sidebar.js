/**
 * Sidebar Component Module
 * Manages sidebar navigation, responsive mobile drawer, and badge counts
 */

import { $, $$, on } from '../utils/dom.js';

export class Sidebar {
  constructor(state) {
    this.state = state;
    this.sidebarEl = $('#app-sidebar');
    this.toggleBtn = $('#sidebar-toggle-btn');
    this.backdropEl = $('#sidebar-backdrop');
    this.navItems = $$('.sidebar-nav .nav-item');
    this.currentViewBadge = $('#current-view-badge');

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
      this.state.subscribe(() => this.updateCounts());
    }
  }

  bindEvents() {
    // Toggle sidebar on mobile
    if (this.toggleBtn) {
      on(this.toggleBtn, 'click', () => this.toggle());
    }

    // Close on backdrop click
    if (this.backdropEl) {
      on(this.backdropEl, 'click', () => this.close());
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
    if (this.sidebarEl) {
      const isOpen = this.sidebarEl.classList.toggle('open');
      if (this.backdropEl) {
        this.backdropEl.classList.toggle('active', isOpen);
      }
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
    return this.sidebarEl?.classList.contains('open') || false;
  }

  setActiveItem(activeItem, view) {
    this.navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');

    const labelSpan = activeItem.querySelector('.nav-label');
    if (labelSpan && this.currentViewBadge) {
      this.currentViewBadge.textContent = `${labelSpan.textContent} View`;
    }
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
