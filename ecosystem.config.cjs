module.exports = {
  apps: [
    {
      name: 'mongo-gui',
      script: 'npm',
      args: 'start -- -p 4000', // Le -- est important pour passer l'argument -p à Next.js
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};