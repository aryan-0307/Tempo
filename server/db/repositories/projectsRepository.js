/**
 * Projects Repository (Phase 4.3)
 * Parameterized SQL queries for Project entities and aggregate task metrics.
 */

import { pool } from '../pool.js';

export const projectsRepository = {
  /**
   * Retrieves all projects for a specific user with live task counts
   * @param {number} userId
   * @returns {Promise<Array>}
   */
  async findAll(userId) {
    const query = `
      SELECT 
        p.project_key AS id, 
        p.name, 
        p.color, 
        COUNT(t.id) AS taskCount, 
        COALESCE(SUM(CASE WHEN t.completed = 0 AND t.status != 'completed' THEN 1 ELSE 0 END), 0) AS pendingCount
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id AND t.user_id = p.user_id
      WHERE p.user_id = ?
      GROUP BY p.id, p.project_key, p.name, p.color
      ORDER BY p.id ASC
    `;

    const [rows] = await pool.query(query, [userId]);
    return rows.map(r => ({
      id: r.id,
      name: r.name,
      color: r.color,
      taskCount: Number(r.taskCount || 0),
      pendingCount: Number(r.pendingCount || 0)
    }));
  },

  /**
   * Resolves a project by ID, project_key, or name for a specific user
   * Guarantees project ownership isolation.
   * @param {number} userId
   * @param {string|number} identifier
   * @returns {Promise<object|null>}
   */
  async findByIdentifier(userId, identifier) {
    if (!identifier) return null;

    const query = `
      SELECT id, project_key, name, color 
      FROM projects 
      WHERE user_id = ? AND (id = ? OR project_key = ? OR LOWER(name) = LOWER(?))
      LIMIT 1
    `;

    const [rows] = await pool.query(query, [userId, identifier, identifier, identifier]);
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Creates a new project for a specific user
   * @param {number} userId
   * @param {object} projectData
   * @returns {Promise<object>}
   */
  async create(userId, projectData) {
    const name = (projectData.name || '').trim();
    const color = projectData.color || '#C6F55A';
    const cleanKey = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const projectKey = projectData.project_key || `${cleanKey}-${Date.now().toString(36)}`;

    const query = `
      INSERT INTO projects (user_id, project_key, name, color)
      VALUES (?, ?, ?, ?)
    `;

    await pool.query(query, [userId, projectKey, name, color]);
    return {
      id: projectKey,
      name,
      color,
      taskCount: 0,
      pendingCount: 0
    };
  }
};

