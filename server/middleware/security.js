/**
 * Production Security & Performance Middleware (Phase 6)
 * Configures Helmet HTTP security headers, gzip response compression,
 * and rate limiting against DDoS and brute-force attacks.
 */

import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

// 1. Helmet HTTP Security Headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false // Allow embedding SVG and assets
});

// 2. HTTP Gzip Compression Middleware
export const responseCompression = compression({
  threshold: 1024, // Only compress responses larger than 1KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// 3. Rate Limiters
// General API Limiter (300 requests per 15 minutes per IP)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in automated tests
  message: {
    success: false,
    error: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});

// Auth Limiter for Login/Register (20 attempts per 15 minutes to prevent brute-force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in automated tests
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

