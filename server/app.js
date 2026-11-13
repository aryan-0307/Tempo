/**
 * Express Application Setup (Phase 5: Authentication & Security)
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Serve Frontend Static Files
app.use(express.static(projectRoot));

// Public & Protected Auth Routes
app.use('/api/auth', authRoutes);

// Protected Resource Routes (Guarded by JWT/Session Authentication)
app.use('/api', authenticate);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/stats', statsRoutes);

// Health Check Endpoint (Includes MySQL connection status)
app.get('/api/health', async (req, res) => {
  const dbConnected = await checkDatabaseHealth();
  res.json({
    status: 'ok',
    version: '0.5.0',
    database: dbConnected ? 'connected' : 'disconnected',
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
