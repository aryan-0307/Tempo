/**
 * Development User Context Middleware (Phase 4.3)
 *
 * Attaches the verified development user (Alex Morgan) to req.user for local development.
 * Strictly disabled in production mode (requires Phase 5 authentication).
 */

export const DEV_USER = {
  id: 1,
  email: 'alex@tempo.dev',
  username: 'alex_morgan',
  fullName: 'Alex Morgan'
};

export function devUserMiddleware(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Authentication required in production environment.'
    });
  }

  // Attach development user context
  req.user = DEV_USER;
  next();
}

