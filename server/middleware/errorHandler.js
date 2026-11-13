/**
 * Centralized Error Handler Middleware (Phase 3)
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
}

