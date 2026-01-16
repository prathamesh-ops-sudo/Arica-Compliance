/**
 * PM2 Ecosystem Configuration for AricaInsights Backend
 * 
 * Usage:
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 restart ecosystem.config.cjs --env production
 *   pm2 logs arica-backend
 *   pm2 monit
 */

module.exports = {
  apps: [
    {
      name: 'arica-backend',
      script: './dist/server.js',
      cwd: '/home/ubuntu/arica-insights-builder/backend',
      instances: 'max', // Use all available CPUs
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      
      // Environment variables for all environments
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      
      // Production environment variables
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // These should be set via AWS Secrets Manager or Parameter Store
        // MONGO_URI: 'mongodb+srv://...',
        // JWT_SECRET: '...',
        // JWT_REFRESH_SECRET: '...',
        // FRONTEND_URL: 'https://your-cloudfront-url.cloudfront.net',
        // REDIS_URL: 'redis://...',
      },
      
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/home/ubuntu/arica-insights-builder/backend/logs/pm2-error.log',
      out_file: '/home/ubuntu/arica-insights-builder/backend/logs/pm2-out.log',
      merge_logs: true,
      
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
