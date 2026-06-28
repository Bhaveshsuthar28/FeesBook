import { cacheRedis } from "./redis.client.js";

/**
 * Retrieves a value from the Redis cache.
 * If the key does not exist or an error occurs, it returns null.
 * 
 * @param {string} key - The Redis cache key.
 * @returns {Promise<any|null>} The parsed cached object/value, or null if miss or error.
 */
export async function getCache(key) {
  try {
    const value = await cacheRedis.get(key);
    if (value === null) {
      return null;
    }
    return JSON.parse(value);
  } catch (error) {
    console.error(`[Cache Service] getCache error for key "${key}":`, error.message || error);
    return null;
  }
}

/**
 * Sets a value in the Redis cache with an expiration Time-To-Live (TTL).
 * If an error occurs, it is caught and false is returned.
 * 
 * @param {string} key - The Redis cache key.
 * @param {any} value - The value to cache (will be JSON stringified).
 * @param {number} ttlSeconds - The TTL in seconds.
 * @returns {Promise<boolean>} True if set successfully, false otherwise.
 */
export async function setCache(key, value, ttlSeconds) {
  try {
    const serialized = JSON.stringify(value);
    await cacheRedis.set(key, serialized, "EX", ttlSeconds);
    return true;
  } catch (error) {
    console.error(`[Cache Service] setCache error for key "${key}":`, error.message || error);
    return false;
  }
}

/**
 * Deletes one or more keys from the Redis cache.
 * If an error occurs, it is caught and false is returned.
 * 
 * @param {...string|string[]} keys - One or more keys to delete. Can be passed as multiple arguments or a single array.
 * @returns {Promise<boolean>} True if deleted successfully, false otherwise.
 */
export async function deleteCache(...keys) {
  try {
    const flatKeys = keys.flat();
    if (flatKeys.length === 0) {
      return true;
    }
    await cacheRedis.del(flatKeys);
    return true;
  } catch (error) {
    console.error(`[Cache Service] deleteCache error for keys [${keys}]:`, error.message || error);
    return false;
  }
}

/**
 * Deletes all keys matching a specific pattern using SCAN.
 * This is an incremental scan that avoids blocking the Redis server.
 * If an error occurs, it is caught and false is returned.
 * 
 * @param {string} pattern - The key pattern to match (e.g., "school:xyz:*").
 * @returns {Promise<boolean>} True if all matching keys are deleted, false otherwise.
 */
export async function deleteCachePattern(pattern) {
  try {
    let cursor = "0";
    do {
      const [nextCursor, keys] = await cacheRedis.scan(cursor, "MATCH", pattern, "COUNT", 100);
      cursor = nextCursor;
      if (keys && keys.length > 0) {
        await cacheRedis.del(keys);
      }
    } while (cursor !== "0");
    return true;
  } catch (error) {
    console.error(`[Cache Service] deleteCachePattern error for pattern "${pattern}":`, error.message || error);
    return false;
  }
}
