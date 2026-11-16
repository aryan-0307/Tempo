/**
 * Projects Controller (Phase 4.3)
 * Handles REST endpoints for Project resources via MySQL projectsRepository.
 */

import { projectsRepository } from '../db/repositories/projectsRepository.js';

export const projectsController = {
  // GET /api/projects
  async getProjects(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required. User not identified.'
        });
      }
      const projects = await projectsRepository.findAll(userId);
      res.json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (err) {
      next(err);
    }
  },

  // POST /api/projects
  async createProject(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required. User not identified.'
        });
      }
      const { name, color } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Project name is required'
        });
      }

      // Check if project with same name already exists for this user
      const existing = await projectsRepository.findByIdentifier(userId, name.trim());
      if (existing) {
        return res.status(409).json({
          success: false,
          error: `Project "${name.trim()}" already exists`
        });
      }

      const project = await projectsRepository.create(userId, { name: name.trim(), color });
      res.status(201).json({
        success: true,
        data: project
      });
    } catch (err) {
      next(err);
    }
  }
};
