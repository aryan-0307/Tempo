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

// Production Security & Compression Middlewares
app.use(securityHeaders);
app.use(responseCompression);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve Frontend Static Files
app.use(express.static(projectRoot));

// Rate Limiting
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Public & Protected Auth Routes
app.use('/api/auth', authRoutes);

// Protected Resource Routes (Guarded by JWT/Session Authentication)
app.use('/api', authenticate);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/stats', statsRoutes);

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

// Fallback to index.html for SPA view navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(projectRoot, 'index.html'));
});

// Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
