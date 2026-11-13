/**
 * Stats Repository (Phase 4.3)
 * Parameterized SQL queries for real-time overview metrics and completion rates.
 */

import { pool } from '../pool.js';

export const statsRepository = {
  /**
   * Retrieves aggregate overview statistics for a specific user
   * @param {number} userId
   * @returns {Promise<object>}
   */
  async getStats(userId) {
    const query = `
      SELECT 
        COUNT(*) AS total,
        COALESCE(SUM(CASE WHEN completed = 1 OR status = 'completed' THEN 1 ELSE 0 END), 0) AS completed,
        COALESCE(SUM(CASE WHEN completed = 0 AND status != 'completed' THEN 1 ELSE 0 END), 0) AS pending,
        COALESCE(SUM(CASE WHEN (completed = 0 AND status != 'completed') AND due_date < CURDATE() THEN 1 ELSE 0 END), 0) AS overdue
      FROM tasks
      WHERE user_id = ?
    `;

    const [rows] = await pool.query(query, [userId]);
    const row = rows[0] || {};

    const total = Number(row.total || 0);
    const completed = Number(row.completed || 0);
    const pending = Number(row.pending || 0);
    const overdue = Number(row.overdue || 0);
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate
    };
  }
};

