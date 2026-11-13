/**
 * PM2 Production Ecosystem Configuration for Tempo
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 status
 *   pm2 logs
 */

module.exports = {
  apps: [
    {
      name: 'tempo-app',
      script: 'server/server.js',
      instances: 'max', // Scale across all available CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000
      }
    }
  ]
};

