/**
 * Dashboard Overview Component
 * Renders real-time statistics for total, completed, pending, and overdue tasks
 */

import { $ } from '../utils/dom.js';

export class Overview {
  constructor(state) {
    this.state = state;
    this.totalEl = $('#stat-total-tasks');
    this.completedEl = $('#stat-completed-tasks');
    this.pendingEl = $('#stat-pending-tasks');
    this.overdueEl = $('#stat-overdue-tasks');
    this.completedRateEl = $('#stat-completed-rate');
  }

  init() {
    this.state.subscribe(() => this.render());
  }

  render() {
    const stats = this.state.getStats();

    if (this.totalEl) this.totalEl.textContent = stats.total;
    if (this.completedEl) this.completedEl.textContent = stats.completed;
    if (this.pendingEl) this.pendingEl.textContent = stats.pending;
    if (this.overdueEl) this.overdueEl.textContent = stats.overdue;
    if (this.completedRateEl) {
      this.completedRateEl.textContent = `${stats.completionRate}% completion rate`;
    }
  }
}

