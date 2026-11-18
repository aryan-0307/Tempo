/**
 * Express Application Setup (Phase 6: Production Hardening & Security)
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { securityHeaders, responseCompression, apiLimiter, authLimiter } from './middleware/security.js';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { authenticate } from './middleware/auth.js';
import { checkDatabaseHealth } from './db/pool.js';

import authRoutes from './routes/authRoutes.js';
import tasksRoutes from './routes/tasksRoutes.js';
import projectsRoutes from './routes/projectsRoutes.js';
import statsRoutes from './routes/statsRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const app = express();

// Trust reverse proxy headers in cloud environments (Render, Cloudflare, Heroku)
app.set('trust proxy', true);

// Production Security & Compression Middlewares
app.use(securityHeaders);
app.use(responseCompression);

// Production CORS Configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Rate Limiting on API Endpoints
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Public & Protected Auth Routes
app.use('/api/auth', authRoutes);

// Enhanced Health Check Endpoint (Includes system uptime, memory, and database status)
app.get('/api/health', async (req, res) => {
  const dbConnected = await checkDatabaseHealth();
  const mem = process.memoryUsage();
  res.json({
    status: 'ok',
    version: '1.0.0',
    database: dbConnected ? 'connected' : 'disconnected',
    uptime: Math.round(process.uptime()),
    memoryUsageMB: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024)
    },
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Protected Resource Routes (Guarded by JWT/Session Authentication)
app.use('/api/tasks', authenticate, tasksRoutes);
app.use('/api/projects', authenticate, projectsRoutes);
app.use('/api/stats', authenticate, statsRoutes);

// Block direct access to sensitive server files, configs, tests, and database artifacts
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const normalizedPath = req.path.toLowerCase();
  const sensitivePatterns = [
    /^\/\.env/,
    /^\/\.git/,
    /^\/\.agent/,
    /^\/\.neon/,
    /^\/server/,
    /^\/tests/,
    /package\.json$/,
    /package-lock\.json$/,
    /neon\.ts$/,
    /\.sql$/,
    /\.dump$/,
    /\.gz$/
  ];
  if (sensitivePatterns.some(pattern => pattern.test(normalizedPath))) {
    return res.status(403).json({ success: false, error: 'Access denied.' });
  }
  next();
});

// Public Document & Metadata Routes
app.get(['/.well-known/security.txt', '/security.txt'], (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(projectRoot, '.well-known', 'security.txt'));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'sitemap.xml'));
});

app.get('/llms.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'llms.txt'));
});

app.get('/site.webmanifest', (req, res) => {
  res.type('application/manifest+json; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'site.webmanifest'));
});

app.get('/favicon.ico', (req, res) => {
  res.type('image/x-icon');
  res.sendFile(path.join(projectRoot, 'favicon.ico'));
});

app.get('/privacy', (req, res) => {
  res.type('text/html; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'privacy.html'));
});

app.get('/terms', (req, res) => {
  res.type('text/html; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'terms.html'));
});

// Primary SPA Application View Routes
const knownAppRoutes = ['/', '/index.html', '/dashboard', '/my-tasks', '/upcoming', '/completed', '/settings'];
app.get(knownAppRoutes, (req, res) => {
  res.type('text/html; charset=utf-8');
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Serve Frontend Static Files
app.use(express.static(projectRoot, {
  dotfiles: 'deny',
  index: false,
  setHeaders: (res, filePath) => {
    // Avoid caching HTML or JS modules in browser so deployments take effect immediately
    if (filePath.endsWith('.html') || filePath.endsWith('.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }
}));

// Custom Animated 404 Handler for Unrecognized Web Routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.status(404).type('text/html; charset=utf-8').sendFile(path.join(projectRoot, '404.html'));
});

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
