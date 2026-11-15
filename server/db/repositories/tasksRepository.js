/**
 * Tasks Repository (PostgreSQL Edition)
 * Parameterized SQL queries for Task resources, filtering, sorting, and transactional reordering.
 */

import { pool } from '../pool.js';
import { projectsRepository } from './projectsRepository.js';

function formatTaskRow(row) {
  if (!row) return null;
  let dueDateStr = '';
  if (row.dueDate instanceof Date) {
    const yr = row.dueDate.getFullYear();
    const mo = String(row.dueDate.getMonth() + 1).padStart(2, '0');
    const da = String(row.dueDate.getDate()).padStart(2, '0');
    dueDateStr = `${yr}-${mo}-${da}`;
  } else if (row.due_date instanceof Date) {
    const yr = row.due_date.getFullYear();
    const mo = String(row.due_date.getMonth() + 1).padStart(2, '0');
    const da = String(row.due_date.getDate()).padStart(2, '0');
    dueDateStr = `${yr}-${mo}-${da}`;
  } else {
    dueDateStr = String(row.dueDate || row.due_date || '').slice(0, 10);
  }

  let createdAtStr = '';
  if (row.createdAt instanceof Date) {
    createdAtStr = row.createdAt.toISOString();
  } else if (row.created_at instanceof Date) {
    createdAtStr = row.created_at.toISOString();
  } else {
    createdAtStr = row.createdAt || row.created_at || new Date().toISOString();
  }

  let updatedAtStr = '';
  if (row.updatedAt instanceof Date) {
    updatedAtStr = row.updatedAt.toISOString();
  } else if (row.updated_at instanceof Date) {
    updatedAtStr = row.updated_at.toISOString();
  } else {
    updatedAtStr = row.updatedAt || row.updated_at || new Date().toISOString();
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    priority: row.priority,
    status: row.status,
    dueDate: dueDateStr,
    project: row.project,
    completed: Boolean(row.completed),
    displayOrder: Number(row.displayOrder ?? row.display_order ?? 0),
    createdAt: createdAtStr,
    updatedAt: updatedAtStr
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
        t.due_date AS "dueDate", 
        COALESCE(p.name, 'Work') AS project, 
        CASE WHEN t.completed = TRUE OR t.status = 'completed' THEN TRUE ELSE FALSE END AS completed, 
        t.display_order AS "displayOrder", 
        t.created_at AS "createdAt", 
        t.updated_at AS "updatedAt"
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = $1
    `;
    const params = [userId];
    let paramIndex = 2;

    // 1. Status Filter
    if (status === 'pending') {
      sql += ` AND (t.completed = FALSE AND t.status != 'completed')`;
    } else if (status === 'completed') {
      sql += ` AND (t.completed = TRUE OR t.status = 'completed')`;
    }

    // 2. View Filter
    if (view === 'my-tasks') {
      sql += ` AND (t.completed = FALSE AND t.status != 'completed')`;
    } else if (view === 'upcoming') {
      sql += ` AND (t.completed = FALSE AND t.status != 'completed') AND t.due_date > CURRENT_DATE`;
    } else if (view === 'completed') {
      sql += ` AND (t.completed = TRUE OR t.status = 'completed')`;
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
      sql += ` AND (LOWER(t.title) LIKE $${paramIndex} OR LOWER(COALESCE(p.name, '')) LIKE $${paramIndex + 1} OR LOWER(t.priority) LIKE $${paramIndex + 2})`;
      params.push(term, term, term);
      paramIndex += 3;
    }

    // 4. Sorting
    if (sort === 'due-date') {
      sql += ` ORDER BY t.due_date ASC, t.display_order ASC`;
    } else if (sort === 'priority') {
      sql += ` ORDER BY CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 ELSE 4 END ASC, t.display_order ASC`;
    } else if (sort === 'title') {
      sql += ` ORDER BY t.title ASC, t.display_order ASC`;
    } else {
      sql += ` ORDER BY t.display_order ASC, t.created_at DESC`;
    }

    const { rows } = await pool.query(sql, params);
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
        t.due_date AS "dueDate", 
        COALESCE(p.name, 'Work') AS project, 
        CASE WHEN t.completed = TRUE OR t.status = 'completed' THEN TRUE ELSE FALSE END AS completed, 
        t.display_order AS "displayOrder", 
        t.created_at AS "createdAt", 
        t.updated_at AS "updatedAt"
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.id = $1 AND t.user_id = $2
      LIMIT 1
    `;
    const { rows } = await pool.query(sql, [id, userId]);
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
    const completed = false;

    // Get next display_order
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 AS "nextOrder" FROM tasks WHERE user_id = $1',
      [userId]
    );
    const displayOrder = Number(orderResult.rows[0].nextOrder || 1);

    const insertSql = `
      INSERT INTO tasks 
        (id, user_id, project_id, title, description, priority, status, due_date, completed, display_order)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
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
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      params.push(updates.title.trim());
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      params.push(updates.description ? updates.description.trim() : null);
    }

    if (updates.priority !== undefined) {
      fields.push(`priority = $${paramIndex++}`);
      params.push(updates.priority.toLowerCase());
    }

    if (updates.dueDate !== undefined) {
      fields.push(`due_date = $${paramIndex++}`);
      params.push(updates.dueDate);
    }

    if (updates.project !== undefined) {
      const projectRecord = await projectsRepository.findByIdentifier(userId, updates.project);
      fields.push(`project_id = $${paramIndex++}`);
      params.push(projectRecord ? projectRecord.id : null);
    }

    if (updates.completed !== undefined) {
      const isCompleted = Boolean(updates.completed);
      fields.push(`completed = $${paramIndex++}`);
      params.push(isCompleted);
      fields.push(`status = $${paramIndex++}`);
      params.push(isCompleted ? 'completed' : 'todo');
    } else if (updates.status !== undefined) {
      const status = updates.status.toLowerCase();
      fields.push(`status = $${paramIndex++}`);
      params.push(status);
      fields.push(`completed = $${paramIndex++}`);
      params.push(status === 'completed');
    }

    if (fields.length === 0) {
      return existing;
    }

    fields.push('updated_at = NOW()');
    const updateSql = `UPDATE tasks SET ${fields.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}`;
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

    const newCompleted = !existing.completed;
    const newStatus = newCompleted ? 'completed' : 'todo';

    const sql = `
      UPDATE tasks 
      SET 
        completed = $1,
        status = $2,
        updated_at = NOW()
      WHERE id = $3 AND user_id = $4
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

    await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2', [id, userId]);
    return existing;
  },

  /**
   * Atomically reorders task positions in a database transaction.
   */
  async reorder(userId, sourceId, targetId, position = 'before') {
    const { rows: tasks } = await pool.query(
      'SELECT id, display_order FROM tasks WHERE user_id = $1 ORDER BY display_order ASC',
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

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < tasks.length; i++) {
        await client.query(
          'UPDATE tasks SET display_order = $1 WHERE id = $2 AND user_id = $3',
          [i + 1, tasks[i].id, userId]
        );
      }

      await client.query('COMMIT');
      return true;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
};

export default tasksRepository;
