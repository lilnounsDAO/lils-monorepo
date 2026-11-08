// pm2 start ecosystem.config.cjs  (secrets live in .env next to this file)
module.exports = {
  apps: [
    {
      name: "rounds-api",
      script: "src/index.mjs",
      node_args: "--env-file=.env",
      max_memory_restart: "250M",
      restart_delay: 10_000,
    },
  ],
};
