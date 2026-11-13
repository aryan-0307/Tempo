/**
 * Tempo Main Application Entry Point (Phase 2)
 * Bootstraps the application shell, state store, UI components, and global keyboard shortcuts
 */

import { state } from './state.js';
import { Sidebar } from './components/sidebar.js';
import { Header } from './components/header.js';
import { Overview } from './components/overview.js';
import { Tasks } from './components/tasks.js';
import { Modal, AuthModal } from './components/modal.js';
import { Settings } from './components/settings.js';
import { api } from './services/api.js';

class TempoApp {
  constructor() {
    this.state = state;
    this.sidebar = null;
    this.header = null;
    this.overview = null;
    this.tasks = null;
    this.modal = null;
    this.authModal = null;
    this.settings = null;
  }

  init() {
    console.log('[Tempo] Initializing Phase 2 application modules...');

    // 1. Initialize Modals
    this.modal = new Modal(this.state);
    this.modal.init();

    this.authModal = new AuthModal(this.state);
    this.authModal.init();

    // 2. Initialize Sidebar (branding, views, mobile drawer, counts, auth trigger)
    this.sidebar = new Sidebar(this.state, this.authModal);
    this.sidebar.init();

    // 3. Initialize Header (search, notifications, date/greeting)
    this.header = new Header(this.state);
    this.header.init();

    // 4. Initialize Dashboard Overview (stat cards)
    this.overview = new Overview(this.state);
    this.overview.init();

    // 5. Initialize Tasks Section (CRUD, sorting, filtering, drag-and-drop)
    this.tasks = new Tasks(this.state, this.modal);
    this.tasks.init();

    // 6. Initialize Settings & Theme Manager (10 Handcrafted Themes)
    this.settings = new Settings(this.state);
    this.settings.init();

    // 6. Global Keyboard Shortcuts
    this.bindGlobalShortcuts();

    // 7. Sync with Node.js/Express Backend if online
    this.state.syncWithBackend();

    // 8. Hydrate user profile from backend session if available
    api.getMe().then(user => {
      if (user && this.authModal) {
        this.authModal.updateSidebarUser(user);
      }
    }).catch(() => {});

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
