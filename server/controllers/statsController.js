/**
 * Stats Controller (Phase 4.3)
 * Handles REST endpoints for overview metrics via MySQL statsRepository.
 */

import { statsRepository } from '../db/repositories/statsRepository.js';

export const statsController = {
  // GET /api/stats
  async getStats(req, res, next) {
    try {
      const userId = req.user ? req.user.id : 1;
      const stats = await statsRepository.getStats(userId);
      res.json({
        success: true,
        data: stats
      });
    } catch (err) {
      next(err);
    }
  }
};
