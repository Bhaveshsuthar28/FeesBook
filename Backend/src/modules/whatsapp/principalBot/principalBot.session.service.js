import { cacheRedis } from "../../../cors/cache/redis.client.js";

/**
 * Creates a new pending bot session for a phone number.
 * Called right after a valid activation command is received.
 * Stores session state in Redis with a 5-minute (300 seconds) expiration.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @param {string} params.schoolId - The school's clerkId/ID
 * @returns {Promise<Object|null>} The created session object, or null on failure
 */
export async function createPendingSession({ phoneNumber, schoolId }) {
  try {
    const key = `botsession:${phoneNumber}`;
    const session = {
      schoolId,
      authenticated: false,
      step: "awaiting_password",
      failedAttempts: 0,
      createdAt: Date.now(),
    };
    await cacheRedis.set(key, JSON.stringify(session), "EX", 300);
    return session;
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to create pending session for ${phoneNumber}:`,
      error
    );
    return null;
  }
}

/**
 * Retrieves the session object for a phone number from Redis.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @returns {Promise<Object|null>} The parsed session object, or null if not found/expired/error
 */
export async function getSession({ phoneNumber }) {
  try {
    const key = `botsession:${phoneNumber}`;
    const data = await cacheRedis.get(key);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to get session for ${phoneNumber}:`,
      error
    );
    return null;
  }
}

/**
 * Authenticates the session, updating state and resetting the TTL to 10 minutes (600 seconds).
 * Called after password verification succeeds.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
export async function authenticateSession({ phoneNumber }) {
  try {
    const key = `botsession:${phoneNumber}`;
    const session = await getSession({ phoneNumber });
    if (!session) return false;

    session.authenticated = true;
    session.step = "logged_in";

    await cacheRedis.set(key, JSON.stringify(session), "EX", 600);
    return true;
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to authenticate session for ${phoneNumber}:`,
      error
    );
    return false;
  }
}

/**
 * Refreshes the sliding expiration of an authenticated session to 10 minutes (600 seconds).
 * Called on every authenticated bot command.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @returns {Promise<boolean>} True if refreshed successfully, false if session does not exist/expired
 */
export async function refreshSession({ phoneNumber }) {
  try {
    const key = `botsession:${phoneNumber}`;
    const session = await getSession({ phoneNumber });
    if (!session) return false;

    await cacheRedis.set(key, JSON.stringify(session), "EX", 600);
    return true;
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to refresh session for ${phoneNumber}:`,
      error
    );
    return false;
  }
}

/**
 * Increments the failed attempts count by 1.
 * Locks the session for 15 minutes (900 seconds) if failed attempts reach 3.
 * Otherwise, maintains the existing session TTL.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @returns {Promise<number>} The updated failed attempts count, or 0 if session not found or on error
 */
export async function incrementFailedAttempts({ phoneNumber }) {
  try {
    const key = `botsession:${phoneNumber}`;
    const session = await getSession({ phoneNumber });
    if (!session) return 0;

    session.failedAttempts = (session.failedAttempts || 0) + 1;
    let ttl = 300; // default fallback

    if (session.failedAttempts >= 3) {
      session.step = "locked";
      ttl = 900;
    } else {
      const remainingTtl = await cacheRedis.ttl(key);
      if (remainingTtl > 0) {
        ttl = remainingTtl;
      }
    }

    await cacheRedis.set(key, JSON.stringify(session), "EX", ttl);
    return session.failedAttempts;
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to increment failed attempts for ${phoneNumber}:`,
      error
    );
    return 0;
  }
}

/**
 * Deletes the session from Redis entirely.
 * Used for explicit logout and "Revoke Access" commands.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @returns {Promise<boolean>} True if session was successfully deleted, false otherwise
 */
export async function destroySession({ phoneNumber }) {
  try {
    const key = `botsession:${phoneNumber}`;
    const result = await cacheRedis.del(key);
    return result > 0;
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to destroy session for ${phoneNumber}:`,
      error
    );
    return false;
  }
}

/**
 * Checks if the session is locked.
 *
 * @param {Object} params
 * @param {string} params.phoneNumber - The principal's phone number
 * @returns {Promise<boolean>} True if session step is "locked", false otherwise
 */
export async function isLocked({ phoneNumber }) {
  try {
    const session = await getSession({ phoneNumber });
    if (!session) return false;
    return session.step === "locked";
  } catch (error) {
    console.error(
      `[PrincipalBot Session] Failed to check lock status for ${phoneNumber}:`,
      error
    );
    return false;
  }
}
