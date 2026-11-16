/**
 * Stats Controller (Phase 4.3)
 * Handles REST endpoints for overview metrics via MySQL statsRepository.
 */

import { statsRepository } from '../db/repositories/statsRepository.js';

export const statsController = {
  // GET /api/stats
  async getStats(req, res, next) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required. User not identified.'
        });
      }
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
