/**
 * Configuration PM2 (production). Lancé depuis le lien symbolique « current ».
 *   pm2 start ecosystem.config.cjs && pm2 save
 */
module.exports = {
  apps: [
    {
      name: 'liratsu',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 127.0.0.1',
      instances: 1, // une instance : le rate limiting et les caches sont en mémoire
      exec_mode: 'fork',
      max_memory_restart: '900M',
      env: { NODE_ENV: 'production', NODE_OPTIONS: '--no-deprecation' },
      out_file: '../../shared/logs/out.log',
      error_file: '../../shared/logs/error.log',
      time: true,
    },
  ],
}
