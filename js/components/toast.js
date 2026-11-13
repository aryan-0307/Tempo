/**
 * Tempo Toast Notification Module (Phase 2)
 * Lightweight accessible notifications with action triggers (e.g., Undo delete)
 */

import { $, on } from '../utils/dom.js';

class ToastManager {
  constructor() {
    this.container = null;
    this.timeoutId = null;
  }

  ensureContainer() {
    if (!this.container) {
      this.container = $('#toast-container');
      if (!this.container) {
        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        this.container.setAttribute('aria-live', 'polite');
        document.body.appendChild(this.container);
      }
    }
  }

  show(message, action = null) {
    this.ensureContainer();

    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.container.innerHTML = `
      <div class="toast-item">
        <span class="toast-message">${message}</span>
        ${action ? `<button type="button" class="toast-action-btn" id="toast-action-btn">${action.label}</button>` : ''}
      </div>
    `;

    this.container.classList.add('visible');

    if (action && action.onClick) {
      const btn = $('#toast-action-btn');
      if (btn) {
        on(btn, 'click', () => {
          action.onClick();
          this.hide();
        });
      }
    }

    const duration = action ? 5000 : 3500;
    this.timeoutId = setTimeout(() => {
      this.hide();
    }, duration);
  }

  hide() {
    if (this.container) {
      this.container.classList.remove('visible');
    }
  }
}

export const toast = new ToastManager();

