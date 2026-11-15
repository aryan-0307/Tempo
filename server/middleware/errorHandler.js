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
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Error]', err.stack || err.message || err);
  }
  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  const message = isProd && status === 500
    ? 'An unexpected internal server error occurred.'
    : (err.message || 'Internal Server Error');

  res.status(status).json({
    success: false,
    error: message
  });
}

