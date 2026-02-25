module.exports = {
  apps: [{
    name: 'household-services-api',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
    },
  }],
};
