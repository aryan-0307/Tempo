/**
 * Tempo Server Entry Point (Phase 6: Production Ready)
 * Handles HTTP listening, graceful shutdown signals (SIGTERM, SIGINT), and connection pool teardown.
 */

import app from './app.js';
import { pool } from './db/pool.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Tempo Server v1.0.0 (Production Ready)`);
  console.log(`📡 URL: http://${HOST}:${PORT}`);
  console.log(`📋 API: http://${HOST}:${PORT}/api/tasks`);
  console.log(`🔐 Auth: http://${HOST}:${PORT}/api/auth`);
  console.log(`📊 Stats: http://${HOST}:${PORT}/api/stats`);
  console.log(`📁 Static Frontend: Served from root`);
  console.log(`🛡️ Security: Helmet CSP, Rate Limiting & Gzip Active`);
  console.log(`==================================================\n`);
});

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\n[Server] Received ${signal}. Initiating graceful shutdown...`);

  server.close(async () => {
    console.log('[Server] HTTP server closed.');
    try {
      await pool.end();
      console.log('[Server] PostgreSQL connection pool closed.');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error closing PostgreSQL pool:', err.message);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    console.error('[Server] Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
