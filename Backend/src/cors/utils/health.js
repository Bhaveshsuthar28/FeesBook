import { sqlClient } from "../database/DB.Connect.js";
import { cacheRedis, queueRedis } from "../cache/redis.client.js";

const TIMEOUT_MS = 3000;

const withTimeout = (promise, ms) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), ms))
  ]);
};

export default async function healthRoutes(app) {
  app.get("/health", async (request, reply) => {
    // Database Check
    const dbPromise = (async () => {
      const start = Date.now();
      try {
        await withTimeout(sqlClient.execute("SELECT 1"), TIMEOUT_MS);
        return { status: "ok", latencyMs: Date.now() - start };
      } catch (err) {
        return { status: "error", latencyMs: Date.now() - start, error: err.message || String(err) };
      }
    })();

    // Cache Check
    const cachePromise = (async () => {
      const start = Date.now();
      if (!cacheRedis || typeof cacheRedis.ping !== "function") {
        return { status: "disabled", latencyMs: 0 };
      }
      try {
        await withTimeout(cacheRedis.ping(), TIMEOUT_MS);
        return { status: "ok", latencyMs: Date.now() - start };
      } catch (err) {
        return { status: "error", latencyMs: Date.now() - start, error: err.message || String(err) };
      }
    })();

    // Queue Check
    const queuePromise = (async () => {
      const start = Date.now();
      if (!queueRedis || typeof queueRedis.ping !== "function") {
        return { status: "disabled", latencyMs: 0 };
      }
      try {
        await withTimeout(queueRedis.ping(), TIMEOUT_MS);
        return { status: "ok", latencyMs: Date.now() - start };
      } catch (err) {
        return { status: "error", latencyMs: Date.now() - start, error: err.message || String(err) };
      }
    })();

    const [dbResult, cacheResult, queueResult] = await Promise.all([
      dbPromise,
      cachePromise,
      queuePromise
    ]);

    let overallStatus = "ok";
    if (dbResult.status === "error") {
      overallStatus = "down";
    } else if (cacheResult.status === "error" || queueResult.status === "error") {
      overallStatus = "degraded";
    }

    const response = {
      status: overallStatus,
      version: process.env.npm_package_version || "1.0.0",
      uptime: process.uptime(),
      timestamp: Date.now(),
      services: {
        database: dbResult,
        cache: cacheResult,
        queue: queueResult
      }
    };

    if (overallStatus === "down") {
      return reply.code(503).send(response);
    } else {
      return reply.code(200).send(response);
    }
  });
}