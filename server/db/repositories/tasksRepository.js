/**
 * Tasks Repository (Phase 4.3)
 * Parameterized SQL queries for Task resources, filtering, sorting, and transactional reordering.
 */

import { pool } from '../pool.js';
import { projectsRepository } from './projectsRepository.js';

function formatTaskRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    priority: row.priority,
    status: row.status,
    dueDate: row.dueDate,
    project: row.project,
    completed: Boolean(row.completed),
    displayOrder: Number(row.displayOrder || 0),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export const tasksRepository = {
  /**
   * Retrieves tasks filtered by status, view, search keyword, and sorted accordingly.
   */
  async findAll({ userId, status, view, search, sort }) {
    let sql = `
      SELECT 
        t.id, 
        t.title, 
        COALESCE(t.description, '') AS description, 
        t.priority, 
        t.status, 
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate, 
        COALESCE(p.name, 'Work') AS project, 
        CASE WHEN t.completed = 1 OR t.status = 'completed' THEN 1 ELSE 0 END AS completed, 
        t.display_order AS displayOrder, 
        DATE_FORMAT(t.created_at, '%Y-%m-%dT%T.000Z') AS createdAt, 
        DATE_FORMAT(t.updated_at, '%Y-%m-%dT%T.000Z') AS updatedAt
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ?
    `;
    const params = [userId];

    // 1. Status Filter
    if (status === 'pending') {
      sql += ` AND (t.completed = 0 AND t.status != 'completed')`;
    } else if (status === 'completed') {
      sql += ` AND (t.completed = 1 OR t.status = 'completed')`;
    }

    // 2. View Filter
    if (view === 'my-tasks') {
      sql += ` AND (t.completed = 0 AND t.status != 'completed')`;
    } else if (view === 'upcoming') {
      sql += ` AND (t.completed = 0 AND t.status != 'completed') AND t.due_date > CURDATE()`;
    } else if (view === 'completed') {
      sql += ` AND (t.completed = 1 OR t.status = 'completed')`;
    } else if (view === 'project-work' || view === 'work') {
      sql += ` AND LOWER(p.name) = 'work'`;
    } else if (view === 'project-personal' || view === 'personal') {
      sql += ` AND LOWER(p.name) = 'personal'`;
    } else if (view === 'project-design' || view === 'design system') {
      sql += ` AND LOWER(p.name) = 'design system'`;
    }

    // 3. Search Keyword Filter
    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(t.title) LIKE ? OR LOWER(COALESCE(p.name, '')) LIKE ? OR LOWER(t.priority) LIKE ?)`;
      params.push(term, term, term);
    }

    // 4. Sorting
    if (sort === 'due-date') {
      sql += ` ORDER BY t.due_date ASC, t.display_order ASC`;
    } else if (sort === 'priority') {
      sql += ` ORDER BY FIELD(t.priority, 'high', 'medium', 'low'), t.display_order ASC`;
    } else if (sort === 'title') {
      sql += ` ORDER BY t.title ASC, t.display_order ASC`;
    } else {
      sql += ` ORDER BY t.display_order ASC, t.created_at DESC`;
    }

    const [rows] = await pool.query(sql, params);
    return rows.map(formatTaskRow);
  },

  /**
   * Retrieves single task by ID scoped to the authenticated user.
   */
  async findById(id, userId) {
    const sql = `
      SELECT 
        t.id, 
        t.title, 
        COALESCE(t.description, '') AS description, 
        t.priority, 
        t.status, 
        DATE_FORMAT(t.due_date, '%Y-%m-%d') AS dueDate, 
        COALESCE(p.name, 'Work') AS project, 
        CASE WHEN t.completed = 1 OR t.status = 'completed' THEN 1 ELSE 0 END AS completed, 
        t.display_order AS displayOrder, 
        DATE_FORMAT(t.created_at, '%Y-%m-%dT%T.000Z') AS createdAt, 
        DATE_FORMAT(t.updated_at, '%Y-%m-%dT%T.000Z') AS updatedAt
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = ? AND t.user_id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(sql, [id, userId]);
    return rows.length > 0 ? formatTaskRow(rows[0]) : null;
  },

  /**
   * Creates a new task with project ownership resolution.
   */
  async create(userId, { title, description = '', priority = 'medium', dueDate, project = 'Work' }) {
    // Resolve project for user
    const projectRecord = await projectsRepository.findByIdentifier(userId, project);
    const projectId = projectRecord ? projectRecord.id : null;

    const id = `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const finalPriority = (priority || 'medium').toLowerCase();
    const finalDueDate = dueDate || new Date().toISOString().slice(0, 10);
    const status = 'todo';
    const completed = 0;

    // Get next display_order
    const [orderResult] = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 AS nextOrder FROM tasks WHERE user_id = ?',
      [userId]
    );
    const displayOrder = orderResult[0].nextOrder;

    const insertSql = `
      INSERT INTO tasks 
        (id, user_id, project_id, title, description, priority, status, due_date, completed, display_order)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await pool.query(insertSql, [
      id,
      userId,
      projectId,
      title.trim(),
      description ? description.trim() : null,
      finalPriority,
      status,
      finalDueDate,
      completed,
      displayOrder
    ]);

    return this.findById(id, userId);
  },

  /**
   * Updates existing task fields while keeping completed and canonical status synchronized.
   */
  async update(id, userId, updates) {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const fields = [];
    const params = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      params.push(updates.title.trim());
    }

    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description ? updates.description.trim() : null);
    }

    if (updates.priority !== undefined) {
      fields.push('priority = ?');
      params.push(updates.priority.toLowerCase());
    }

    if (updates.dueDate !== undefined) {
      fields.push('due_date = ?');
      params.push(updates.dueDate);
    }

    if (updates.project !== undefined) {
      const projectRecord = await projectsRepository.findByIdentifier(userId, updates.project);
      fields.push('project_id = ?');
      params.push(projectRecord ? projectRecord.id : null);
    }

    if (updates.completed !== undefined) {
      const isCompleted = Boolean(updates.completed);
      fields.push('completed = ?');
      params.push(isCompleted ? 1 : 0);
      fields.push('status = ?');
      params.push(isCompleted ? 'completed' : 'todo');
    } else if (updates.status !== undefined) {
      const status = updates.status.toLowerCase();
      fields.push('status = ?');
      params.push(status);
      fields.push('completed = ?');
      params.push(status === 'completed' ? 1 : 0);
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = NOW()');
    const updateSql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`;
    params.push(id, userId);

    await pool.query(updateSql, params);
    return this.findById(id, userId);
  },

  /**
   * Toggles completion status atomically.
   */
  async toggle(id, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    const newCompleted = existing.completed ? 0 : 1;
    const newStatus = newCompleted ? 'completed' : 'todo';

    const sql = `
      UPDATE tasks 
      SET 
        completed = ?,
        status = ?,
        updated_at = NOW()
      WHERE id = ? AND user_id = ?
    `;
    await pool.query(sql, [newCompleted, newStatus, id, userId]);
    return this.findById(id, userId);
  },

  /**
   * Deletes task and returns deleted task object.
   */
  async delete(id, userId) {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, userId]);
    return existing;
  },

  /**
   * Atomically reorders task positions in a database transaction.
   */
  async reorder(userId, sourceId, targetId, position = 'before') {
    const [tasks] = await pool.query(
      'SELECT id, display_order FROM tasks WHERE user_id = ? ORDER BY display_order ASC',
      [userId]
    );

    const sourceIndex = tasks.findIndex(t => t.id === sourceId);
    const targetIndex = tasks.findIndex(t => t.id === targetId);

    if (sourceIndex === -1 || targetIndex === -1 || sourceId === targetId) {
      return false;
    }

    const [moved] = tasks.splice(sourceIndex, 1);
    const newTargetIndex = tasks.findIndex(t => t.id === targetId);
    const insertIndex = position === 'after' ? newTargetIndex + 1 : newTargetIndex;
    tasks.splice(insertIndex, 0, moved);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      for (let i = 0; i < tasks.length; i++) {
        await connection.query(
          'UPDATE tasks SET display_order = ? WHERE id = ? AND user_id = ?',
          [i + 1, tasks[i].id, userId]
        );
      }

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
};
