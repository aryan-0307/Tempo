/**
 * Tasks Controller (Phase 4.3)
 * Handles REST endpoints for Task resources via MySQL tasksRepository.
 */

import { tasksRepository } from '../db/repositories/tasksRepository.js';

export const tasksController = {
  // GET /api/tasks
  async getTasks(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { status, view, search, sort } = req.query;
      const tasks = await tasksRepository.findAll({ userId, status, view, search, sort });
      res.json({
        success: true,
        count: tasks.length,
        data: tasks
      });
    } catch (err) {
      next(err);
    }
  },

  // GET /api/tasks/:id
  async getTaskById(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { id } = req.params;
      const task = await tasksRepository.findById(id, userId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Task with id '${id}' not found.`
        });
      }
      res.json({
        success: true,
        data: task
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/tasks
  async createTask(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { title, description, priority, dueDate, project } = req.body;
      const newTask = await tasksRepository.create(userId, { title, description, priority, dueDate, project });
      res.status(201).json({
        success: true,
        message: 'Task created successfully.',
        data: newTask
      });
    } catch (err) {
      next(err);
    }
  },

  // PUT /api/tasks/:id
  async updateTask(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { id } = req.params;
      const updated = await tasksRepository.update(id, userId, req.body);
      if (!updated) {
        return res.status(404).json({
          success: false,
          error: `Task with id '${id}' not found.`
        });
      }
      res.json({
        success: true,
        message: 'Task updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  // PATCH /api/tasks/:id/toggle
  async toggleTask(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { id } = req.params;
      const task = await tasksRepository.toggle(id, userId);
      if (!task) {
        return res.status(404).json({
          success: false,
          error: `Task with id '${id}' not found.`
        });
      }
      res.json({
        success: true,
        message: `Task marked as ${task.completed ? 'completed' : 'pending'}.`,
        data: task
      });
    } catch (err) {
      next(err);
    }
  },

  // DELETE /api/tasks/:id
  async deleteTask(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { id } = req.params;
      const deleted = await tasksRepository.delete(id, userId);
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: `Task with id '${id}' not found.`
        });
      }
      res.json({
        success: true,
        message: 'Task deleted successfully.',
        data: deleted
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/tasks/reorder
  async reorderTasks(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const { sourceId, targetId, position } = req.body;
      const success = await tasksRepository.reorder(userId, sourceId, targetId, position);
      if (!success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to reorder tasks. Verify both task IDs exist.'
        });
      }
      const updatedTasks = await tasksRepository.findAll({ userId });
      res.json({
        success: true,
        message: 'Task order updated successfully.',
        data: updatedTasks
      });
    } catch (err) {
      next(err);
    }
  }
};
