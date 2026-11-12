/**
 * Header Component Module
 * Manages search focus shortcuts and global header controls
 */

import { $, on } from '../utils/dom.js';

export class Header {
  constructor() {
    this.searchInput = $('#global-search-input');
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Keyboard shortcut (Ctrl+K or Cmd+K) to focus search
    on(window, 'keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (this.searchInput) {
          this.searchInput.focus();
        }
      }
    });
  }
}
