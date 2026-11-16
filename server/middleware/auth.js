/**
 * Authentication Middleware (Phase 5)
 * Validates JWT Bearer tokens and attaches authenticated user context to req.user.
 * Provides fallback to development user in non-production environments when token is omitted.
 */

import { verifyToken } from '../utils/auth.js';
import { usersRepository } from '../db/repositories/usersRepository.js';

export const DEV_USER = {
  id: 1,
  email: 'alex@tempo.dev',
  username: 'alex_morgan',
  fullName: 'Alex Morgan'
};

/**
 * Universal authentication middleware applied to /api routes
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    try {
      const decoded = verifyToken(token);
      const user = await usersRepository.findById(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User associated with this token no longer exists.'
        });
      }

      req.user = user;
      return next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token.'
      });
    }
  }

  // If no token provided:
  // Strictly require authentication in all environments to prevent cross-account leakage.
  // Legacy bypass is permitted ONLY when explicitly instructed via ALLOW_DEV_AUTH_BYPASS
  if (process.env.ALLOW_DEV_AUTH_BYPASS === 'true') {
    req.user = DEV_USER;
    return next();
  }

  // Require explicit authentication token
  return res.status(401).json({
    success: false,
    error: 'Authentication required. Missing Bearer token.'
  });
}

/**
 * Strict authentication guard for endpoints that always require a valid token
 */
export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Missing Bearer token.'
    });
  }
  return authenticate(req, res, next);
}

