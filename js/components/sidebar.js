/**
 * Sidebar Component Module
 * Manages sidebar toggling and navigation item active states
 */

import { $, $$, on } from '../utils/dom.js';

export class Sidebar {
  constructor() {
    this.sidebarEl = $('#app-sidebar');
    this.toggleBtn = $('#sidebar-toggle-btn');
    this.backdropEl = $('#sidebar-backdrop');
    this.navItems = $$('.nav-item');
    this.currentViewTitle = $('#current-view-title');
  }

  init() {
    this.bindEvents();
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
        this.setActiveItem(target);

        // On mobile, close sidebar after selecting an item
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

  setActiveItem(activeItem) {
    this.navItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');

    const viewName = activeItem.getAttribute('data-view');
    const labelSpan = activeItem.querySelector('.nav-label');
    if (labelSpan && this.currentViewTitle) {
      this.currentViewTitle.textContent = labelSpan.textContent;
    }
  }
}
