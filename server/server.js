/**
 * Tempo Server Entry Point (Phase 4)
 */

import app from './app.js';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🚀 Tempo Backend Server (Phase 4: MySQL Active)`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api/tasks`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`📁 Static Frontend: Served from root`);
  console.log(`==================================================\n`);
});

export default server;
