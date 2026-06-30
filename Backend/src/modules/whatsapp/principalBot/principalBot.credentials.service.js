import { db } from "../../../cors/database/DB.Connect.js";
import { principalBotCredentialsTable } from "../../../cors/schema/principalBotCredentials.schema.js";
import { eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";

/**
 * Saves or updates WhatsApp bot credentials for a specific school.
 * Validates activationCommand (6-30 alphanumeric chars) and password (at least 8 chars).
 * Performs a uniqueness check to ensure the activationCommand is not in use by another school.
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID (principal's clerkId)
 * @param {string} params.activationCommand - The bot activation command
 * @param {string} params.password - The bot password
 * @returns {Promise<Object>} The safe status object (no passwordHash)
 * @throws {Error} If validation fails or activationCommand is already in use
 */
export async function saveBotCredentialsService({
  schoolId,
  activationCommand,
  password,
}) {
  if (!activationCommand) {
    throw new Error("Activation command is required.");
  }
  const normalizedCommand = activationCommand.trim().toLowerCase();
  const alphanumericRegex = /^[a-z0-9]+$/i;
  if (
    normalizedCommand.length < 6 ||
    normalizedCommand.length > 30 ||
    !alphanumericRegex.test(normalizedCommand)
  ) {
    throw new Error(
      "Activation command must be between 6 and 30 characters and contain alphanumeric characters only."
    );
  }

  if (!password || password.length < 8) {
    throw new Error("Password must be at least 8 characters long.");
  }

  // 1. Uniqueness check for activationCommand across other schools
  const commandConflict = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.activationCommand, normalizedCommand))
    .limit(1);

  if (
    commandConflict.length > 0 &&
    commandConflict[0].schoolId !== schoolId
  ) {
    throw new Error(
      "This activation command is already in use. Please choose a different one."
    );
  }

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Upsert row
  const existingRow = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  let phoneNumber = null;

  if (existingRow.length > 0) {
    phoneNumber = existingRow[0].phoneNumber;
    await db
      .update(principalBotCredentialsTable)
      .set({
        activationCommand: normalizedCommand,
        passwordHash,
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(principalBotCredentialsTable.schoolId, schoolId));
  } else {
    const id = randomUUID();
    await db.insert(principalBotCredentialsTable).values({
      id,
      schoolId,
      activationCommand: normalizedCommand,
      passwordHash,
      failedAttempts: 0,
      lockedUntil: null,
      phoneNumber: null,
      isActive: false,
    });
  }

  return {
    schoolId,
    activationCommand: normalizedCommand,
    hasPhoneBound: Boolean(phoneNumber),
    status: phoneNumber ? "active" : "not_activated",
    isActive: existingRow.length > 0 ? Boolean(existingRow[0].isActive) : false,
  };
}

/**
 * Retrieves the status of the bot credentials for a specific school.
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID
 * @returns {Promise<Object>} Safe credentials status object, or status "not_configured" if not found
 */
export async function getBotCredentialsStatusService({ schoolId }) {
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  if (rows.length === 0) {
    return { status: "not_configured" };
  }

  const row = rows[0];
  return {
    schoolId: row.schoolId,
    activationCommand: row.activationCommand,
    hasPhoneBound: Boolean(row.phoneNumber),
    status: row.phoneNumber ? "active" : "not_activated",
    isActive: Boolean(row.isActive),
  };
}

/**
 * Finds a school credentials row by activation command.
 *
 * @param {Object} params
 * @param {string} params.activationCommand - The activation command to search
 * @returns {Promise<Object|null>} The database row including passwordHash, or null if not found
 */
export async function findSchoolByActivationCommand({ activationCommand }) {
  const normalizedCommand = (activationCommand || "").trim().toLowerCase();
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.activationCommand, normalizedCommand))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }
  return rows[0];
}

/**
 * Verifies the bot password and manages failed attempt locking logic.
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID
 * @param {string} params.password - The password attempt
 * @returns {Promise<Object>} Verification outcome indicating if password is valid, reasons, lockout details
 */
export async function verifyBotPassword({ schoolId, password }) {
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  if (rows.length === 0) {
    return { valid: false, reason: "not_configured" };
  }

  const row = rows[0];

  // Check lockout
  if (row.lockedUntil && new Date(row.lockedUntil) > new Date()) {
    return {
      valid: false,
      reason: "locked",
      lockedUntil: row.lockedUntil,
    };
  }

  const match = await bcrypt.compare(password, row.passwordHash);

  if (match) {
    await db
      .update(principalBotCredentialsTable)
      .set({
        failedAttempts: 0,
        lockedUntil: null,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(principalBotCredentialsTable.schoolId, schoolId));
    return { valid: true };
  } else {
    const newFailedAttempts = (row.failedAttempts || 0) + 1;
    let lockedUntil = null;

    if (newFailedAttempts >= 3) {
      lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    }

    await db
      .update(principalBotCredentialsTable)
      .set({
        failedAttempts: newFailedAttempts,
        lockedUntil,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(principalBotCredentialsTable.schoolId, schoolId));

    return {
      valid: false,
      reason: "wrong_password",
      attemptsRemaining: Math.max(0, 3 - newFailedAttempts),
    };
  }
}

/**
 * Binds a phone number to a school's bot credentials.
 * Only binds if phoneNumber is currently null (preventing overwrite).
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID
 * @param {string} params.phoneNumber - The phone number to bind
 * @returns {Promise<boolean>} True if updated/already bound to same number, false if bound to another number or not found
 */
export async function bindPhoneNumberService({ schoolId, phoneNumber }) {
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  if (rows.length === 0) {
    return false;
  }

  const row = rows[0];

  if (row.phoneNumber === null) {
    await db
      .update(principalBotCredentialsTable)
      .set({
        phoneNumber,
        updatedAt: sql`(CURRENT_TIMESTAMP)`,
      })
      .where(eq(principalBotCredentialsTable.schoolId, schoolId));
    return true;
  }

  return row.phoneNumber === phoneNumber;
}

/**
 * Checks if the given phone number matches the bound number or if no number is bound yet.
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID
 * @param {string} params.phoneNumber - The phone number to check
 * @returns {Promise<boolean>} True if bound phone matches, or if no phone is bound yet. False otherwise.
 */
export async function isPhoneNumberBound({ schoolId, phoneNumber }) {
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  if (rows.length === 0) {
    return false;
  }

  const row = rows[0];
  return row.phoneNumber === null || row.phoneNumber === phoneNumber;
}

/**
 * Revokes the bot access by clearing the bound phone number and resetting locks/attempts.
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID
 * @returns {Promise<boolean>} True on success, false if not found
 */
export async function revokeBotAccessService({ schoolId }) {
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  if (rows.length === 0) {
    return false;
  }

  await db
    .update(principalBotCredentialsTable)
    .set({
      phoneNumber: null,
      failedAttempts: 0,
      lockedUntil: null,
      updatedAt: sql`(CURRENT_TIMESTAMP)`,
    })
    .where(eq(principalBotCredentialsTable.schoolId, schoolId));

  return true;
}

/**
 * Toggles the WhatsApp bot active/inactive status.
 *
 * @param {Object} params
 * @param {string} params.schoolId - The school's ID
 * @param {boolean} params.isActive - The new active status
 * @returns {Promise<boolean>} True on success, false if not found
 */
export async function toggleBotActiveStatusService({ schoolId, isActive }) {
  const rows = await db
    .select()
    .from(principalBotCredentialsTable)
    .where(eq(principalBotCredentialsTable.schoolId, schoolId))
    .limit(1);

  if (rows.length === 0) {
    return false;
  }

  await db
    .update(principalBotCredentialsTable)
    .set({
      isActive,
      updatedAt: sql`(CURRENT_TIMESTAMP)`,
    })
    .where(eq(principalBotCredentialsTable.schoolId, schoolId));

  return true;
}
