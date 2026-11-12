/**
 * TaskFlow Main Application Entry Point
 * Phase 1: Frontend Application Shell Initialization
 */

import { Sidebar } from './components/sidebar.js';
import { Header } from './components/header.js';

class TaskFlowApp {
  constructor() {
    this.sidebar = null;
    this.header = null;
  }

  init() {
    console.log('[TaskFlow] Initializing application shell...');

    // Initialize UI components
    this.sidebar = new Sidebar();
    this.sidebar.init();

    this.header = new Header();
    this.header.init();

    this.updateStatus();
    console.log('[TaskFlow] Application shell ready.');
  }

  updateStatus() {
    const statusText = document.getElementById('system-status-text');
    if (statusText) {
      statusText.textContent = 'App Shell Ready (Phase 1)';
    }
  }
}

// Bootstrap application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new TaskFlowApp();
  app.init();
});
