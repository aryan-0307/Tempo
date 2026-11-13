/**
 * Request Validation Middleware (Phase 3)
 * Validates request payload schema, field requirements, and enum constraints
 */

const VALID_PRIORITIES = ['low', 'medium', 'high'];
const VALID_PROJECTS = ['Work', 'Personal', 'Design System'];

export function validateCreateTask(req, res, next) {
  const { title, priority, dueDate, project } = req.body || {};

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Task title is required and must be a non-empty string.'
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority '${priority}'. Allowed values: ${VALID_PRIORITIES.join(', ')}.`
    });
  }

  if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({
      success: false,
      error: `Invalid dueDate '${dueDate}'. Must be in YYYY-MM-DD format.`
    });
  }

  next();
}

export function validateUpdateTask(req, res, next) {
  const { title, priority, dueDate } = req.body || {};

  if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
    return res.status(400).json({
      success: false,
      error: 'Task title cannot be empty.'
    });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority.toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: `Invalid priority '${priority}'. Allowed values: ${VALID_PRIORITIES.join(', ')}.`
    });
  }

  if (dueDate !== undefined && dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    return res.status(400).json({
      success: false,
      error: `Invalid dueDate '${dueDate}'. Must be in YYYY-MM-DD format.`
    });
  }

  next();
}

export function validateReorder(req, res, next) {
  const { sourceId, targetId, position } = req.body || {};

  if (!sourceId || !targetId) {
    return res.status(400).json({
      success: false,
      error: 'Both sourceId and targetId are required for reordering.'
    });
  }

  if (position && !['before', 'after'].includes(position)) {
    return res.status(400).json({
      success: false,
      error: "position must be either 'before' or 'after'."
    });
  }

  next();
}

