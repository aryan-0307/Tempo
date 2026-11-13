/**
 * Projects Controller (Phase 4.3)
 * Handles REST endpoints for Project resources via MySQL projectsRepository.
 */

import { projectsRepository } from '../db/repositories/projectsRepository.js';

export const projectsController = {
  // GET /api/projects
  async getProjects(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const projects = await projectsRepository.findAll(userId);
      res.json({
        success: true,
        count: projects.length,
        data: projects
      });
    } catch (err) {
      next(err);
    }
  }
};
