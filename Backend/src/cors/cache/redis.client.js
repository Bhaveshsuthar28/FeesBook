import Redis from "ioredis";
import { env } from "../config/env.js";

/**
 * Helper to build configuration options for ioredis, 
 * adding retry strategies and handling TLS protocols.
 * 
 * @param {string} urlString - The Redis connection URL.
 * @returns {import("ioredis").RedisOptions} Options for the Redis client.
 */
function getRedisOptions(urlString) {
  const baseOptions = {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy(times) {
      // Exponential backoff retry strategy with a max delay of 10 seconds
      const delay = Math.min(100 * Math.pow(2, times), 10000);
      return delay;
    },
  };

  try {
    const parsed = new URL(urlString);
    if (parsed.protocol === "rediss:") {
      baseOptions.tls = {
        rejectUnauthorized: false,
      };
    }
  } catch (error) {
    console.warn(`[Redis Client] Warning: Failed to parse URL "${urlString}". Falling back to default options.`, error.message);
  }

  return baseOptions;
}

// CACHE_REDIS_URL connection
export const cacheRedis = new Redis(env.CACHE_REDIS_URL, getRedisOptions(env.CACHE_REDIS_URL));

// QUEUE_REDIS_URL connection
export const queueRedis = new Redis(env.QUEUE_REDIS_URL, getRedisOptions(env.QUEUE_REDIS_URL));

// Register error listeners to prevent the process from crashing on connection errors
cacheRedis.on("error", (error) => {
  console.error("[Redis Cache Client] Error occurred:", error.message || error);
});

queueRedis.on("error", (error) => {
  console.error("[Redis Queue Client] Error occurred:", error.message || error);
});

// Logs on successful connection
cacheRedis.on("connect", () => {
  console.log("[Redis Cache Client] Connected to Redis server.");
});

cacheRedis.on("ready", () => {
  console.log("[Redis Cache Client] Ready and accepting commands.");
});

queueRedis.on("connect", () => {
  console.log("[Redis Queue Client] Connected to Redis server.");
});

queueRedis.on("ready", () => {
  console.log("[Redis Queue Client] Ready and accepting commands.");
});
