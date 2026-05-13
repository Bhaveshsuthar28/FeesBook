import app from "./app.js";
import { env } from "./config/env.js";
import "./db/index.js";

const server = app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});

const shutdown = () => {
  server.close((error) => {
    if (error) {
      console.error("Failed to close server", error);
      process.exit(1);
    }

    process.exit(0);
  });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
