/**
 * Tempo Main Application Entry Point (Phase 2)
 * Bootstraps the application shell, state store, UI components, and global keyboard shortcuts
 */

import { state } from './state.js';
import { Sidebar } from './components/sidebar.js';
import { Header } from './components/header.js';
import { Overview } from './components/overview.js';
import { Tasks } from './components/tasks.js';
import { Modal, AuthModal, ProjectModal } from './components/modal.js';
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

    this.projectModal = new ProjectModal(this.state, () => {
      if (this.modal) {
        this.modal.updateProjectOptions();
      }
    });
    this.projectModal.init();

    this.authModal = new AuthModal(this.state);
    this.authModal.init();

    // 2. Initialize Sidebar (branding, views, mobile drawer, counts, auth trigger)
    this.sidebar = new Sidebar(this.state, this.authModal);
    this.sidebar.init();

    // 2b. Initialize 3D Book Page Flip & Gust of Wind Transition on Site Load/Refresh
    this.initBookTransition();

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

    // 7. Hydrate user profile and session from backend if authenticated
    const token = api.getToken();
    if (token) {
      api.getMe().then(user => {
        if (user) {
          if (this.authModal) {
            this.authModal.cachedUser = user;
            this.authModal.updateSidebarUser(user);
          }
          this.state.switchUser(user);
          this.state.syncWithBackend();
        } else {
          api.clearToken();
          this.state.clearUserData();
          if (this.authModal) this.authModal.updateSidebarUser(null);
        }
      }).catch(() => {
        api.clearToken();
        this.state.clearUserData();
        if (this.authModal) this.authModal.updateSidebarUser(null);
      });
    } else {
      if (this.authModal) this.authModal.updateSidebarUser(null);
      this.state.switchUser(null);
    }

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

  initBookTransition() {
    const bookOverlay = document.getElementById('book-transition');
    const brandLinks = document.querySelectorAll('.brand-wrapper');

    if (!bookOverlay) {
      brandLinks.forEach(b => b.classList.add('floating'));
      return;
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      bookOverlay.style.display = 'none';
      brandLinks.forEach(b => b.classList.add('floating'));
      return;
    }

    // Trigger 3D Book Page Flip & Wind Gust Transition on site open / refresh
    requestAnimationFrame(() => {
      bookOverlay.classList.add('active');
      brandLinks.forEach(b => b.classList.add('book-entrance'));

      // Smooth scale-zoom & dissolve fade-out as pages fan out
      setTimeout(() => {
        bookOverlay.classList.add('fade-out');
      }, 850);

      // Transition completes: overlay completely hidden from layout & paint, logo enters continuous floating
      setTimeout(() => {
        bookOverlay.style.display = 'none';
        brandLinks.forEach(b => {
          b.classList.remove('book-entrance');
          b.classList.add('floating');
        });
      }, 1050);
    });

    // Interactive recoil on logo click
    brandLinks.forEach(brandLink => {
      brandLink.addEventListener('click', () => {
        brandLink.classList.remove('book-recoil');
        void brandLink.offsetWidth;
        brandLink.classList.add('book-recoil');
      });
    });
  }

  // Backwards compatibility alias
  initSpiderWebTransition() {
    this.initBookTransition();
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.tempoApp = new TempoApp();
  window.tempoApp.init();
});
