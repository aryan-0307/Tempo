/**
 * Tempo Main Application Entry Point (Phase 2)
 * Bootstraps the application shell, state store, UI components, and global keyboard shortcuts
 */

import { state } from './state.js';
import { Sidebar } from './components/sidebar.js';
import { Header } from './components/header.js';
import { Overview } from './components/overview.js';
import { Tasks } from './components/tasks.js';
import { Modal } from './components/modal.js';

class TempoApp {
  constructor() {
    this.state = state;
    this.sidebar = null;
    this.header = null;
    this.overview = null;
    this.tasks = null;
    this.modal = null;
  }

  init() {
    console.log('[Tempo] Initializing Phase 2 application modules...');

    // 1. Initialize Sidebar (branding, views, mobile drawer, counts)
    this.sidebar = new Sidebar(this.state);
    this.sidebar.init();

    // 2. Initialize Header (search, notifications, date/greeting)
    this.header = new Header(this.state);
    this.header.init();

    // 3. Initialize Dashboard Overview (stat cards)
    this.overview = new Overview(this.state);
    this.overview.init();

    // 4. Initialize Create/Edit Task Modal
    this.modal = new Modal(this.state);
    this.modal.init();

    // 5. Initialize Tasks Section (CRUD, sorting, filtering, drag-and-drop)
    this.tasks = new Tasks(this.state, this.modal);
    this.tasks.init();

    // 6. Global Keyboard Shortcuts
    this.bindGlobalShortcuts();

    // 7. Sync with Node.js/Express Backend if online
    this.state.syncWithBackend();

    this.updateStatus();
    console.log('[Tempo] Phase 3 Frontend-Backend integration active.');
  }

  bindGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' ||
        activeEl.isContentEditable
      );

      // Shortcut: 'N' or 'Alt+N' opens Create Task modal when not typing
      if ((e.key === 'n' || e.key === 'N') && !isInput && !e.ctrlKey && !e.metaKey) {
        if (!this.modal.isOpen()) {
          e.preventDefault();
          this.modal.open();
        }
      }
    });
  }

  updateStatus() {
    const statusText = document.getElementById('system-status-text');
    if (statusText) {
      statusText.textContent = 'Tempo Ready • LocalStorage & Reactive State Active';
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new TempoApp();
  app.init();
});
