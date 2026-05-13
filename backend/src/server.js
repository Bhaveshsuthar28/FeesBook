import app from "./app.js";
import { env } from "./config/env.js";
import "./db/index.js";

const server = app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});

const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
