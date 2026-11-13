/**
 * Header Component Module
 * Manages search bar live filtering, notifications popover, and dynamic date/greeting
 */

import { $, on } from '../utils/dom.js';

export class Header {
  constructor(state) {
    this.state = state;
    this.searchInput = $('#global-search-input');
    this.notificationsBtn = $('#notifications-btn');
    this.notificationsDropdown = $('#notifications-dropdown');
    this.welcomeMessageEl = $('#welcome-message');
    this.currentDateEl = $('#current-date-display');
  }

  init() {
    this.bindEvents();
    this.updateGreetingAndDate();
  }

  bindEvents() {
    // Keyboard shortcut (Ctrl+K or Cmd+K) to focus search
    on(window, 'keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.searchInput) {
          this.searchInput.focus();
          this.searchInput.select();
        }
      }
    });

    // Real-time search input filtering
    if (this.searchInput) {
      let debounceTimeout = null;
      on(this.searchInput, 'input', (e) => {
        clearTimeout(debounceTimeout);
        debounceTimeout = setTimeout(() => {
          if (this.state) {
            this.state.setSearchQuery(e.target.value);
          }
        }, 100);
      });

      // Clear search on Escape
      on(this.searchInput, 'keydown', (e) => {
        if (e.key === 'Escape') {
          this.searchInput.value = '';
          if (this.state) {
            this.state.setSearchQuery('');
          }
          this.searchInput.blur();
        }
      });
    }

    // Notifications toggle
    if (this.notificationsBtn && this.notificationsDropdown) {
      on(this.notificationsBtn, 'click', (e) => {
        e.stopPropagation();
        this.toggleNotifications();
      });

      // Close notifications on click outside
      on(document, 'click', (e) => {
        if (this.notificationsDropdown && !this.notificationsDropdown.hasAttribute('hidden')) {
          if (!this.notificationsDropdown.contains(e.target) && e.target !== this.notificationsBtn) {
            this.closeNotifications();
          }
        }
      });

      // Close notifications on Escape
      on(document, 'keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeNotifications();
        }
      });
    }
  }

  toggleNotifications() {
    if (!this.notificationsDropdown) return;
    const isHidden = this.notificationsDropdown.hasAttribute('hidden');
    if (isHidden) {
      this.notificationsDropdown.removeAttribute('hidden');
      this.notificationsBtn?.setAttribute('aria-expanded', 'true');
    } else {
      this.closeNotifications();
    }
  }

  closeNotifications() {
    if (this.notificationsDropdown) {
      this.notificationsDropdown.setAttribute('hidden', '');
      this.notificationsBtn?.setAttribute('aria-expanded', 'false');
    }
  }

  updateGreetingAndDate() {
    const now = new Date();
    const hour = now.getHours();

    // Determine greeting
    let greeting = 'Good morning, Alex 👋';
    if (hour >= 12 && hour < 17) {
      greeting = 'Good afternoon, Alex 👋';
    } else if (hour >= 17) {
      greeting = 'Good evening, Alex 👋';
    }

    if (this.welcomeMessageEl) {
      this.welcomeMessageEl.textContent = greeting;
    }

    // Format localized date
    if (this.currentDateEl) {
      const formatted = new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }).format(now);

      this.currentDateEl.textContent = formatted;
    }
  }
}
