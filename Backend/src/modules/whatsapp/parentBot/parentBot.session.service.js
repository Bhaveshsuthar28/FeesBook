import { db } from "../../../cors/database/DB.Connect.js";
import { studentsTable } from "../../../cors/schema/students.schema.js";
import { classesTable } from "../../../cors/schema/classes.schema.js";
import { sectionsTable } from "../../../cors/schema/sections.schema.js";
import { principals } from "../../auth/auth.schema.js";
import { cacheRedis } from "../../../cors/cache/redis.client.js";
import { eq, or, and } from "drizzle-orm";

/**
 * Initializes a session for a parent's phone number.
 * Finds all linked students and their school details using a single query.
 */
export async function initParentSession({ phoneNumber }) {
  try {
    const sessionKey = `parentsession:${phoneNumber}`;
    
    // Normalize phone number to match phone query patterns
    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    const clean10Digit = normalizedPhone.replace(/^91/, "");

    // Fetch active students linked to this phone number
    const parentStudents = await db
      .select({
        studentId: studentsTable.id,
        studentName: studentsTable.fullName,
        schoolId: studentsTable.schoolId,
        schoolName: principals.schoolName,
        schoolCity: principals.city,
        className: classesTable.name,
        sectionName: sectionsTable.name,
      })
      .from(studentsTable)
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
      .leftJoin(sectionsTable, eq(studentsTable.sectionId, sectionsTable.id))
      .leftJoin(principals, eq(studentsTable.schoolId, principals.clerkId))
      .where(
        and(
          eq(studentsTable.status, "active"),
          or(
            eq(studentsTable.phone, normalizedPhone),
            eq(studentsTable.phone, clean10Digit),
            eq(studentsTable.phone, `+${normalizedPhone}`)
          )
        )
      );

    if (parentStudents.length === 0) {
      return { found: false };
    }

    const linkedSchools = parentStudents.map((student) => ({
      schoolId: student.schoolId || "",
      schoolName: student.schoolName || "",
      schoolCity: student.schoolCity || "",
      studentId: student.studentId || "",
      studentName: student.studentName || "",
      className: student.className || "",
      sectionName: student.sectionName || "",
    }));

    let activeSchoolIndex = null;
    let step = "awaiting_school_selection";

    if (linkedSchools.length === 1) {
      activeSchoolIndex = 0;
      step = "ready";
    }

    const session = {
      linkedSchools,
      activeSchoolIndex,
      step,
      lastActivity: Date.now(),
    };

    await cacheRedis.set(sessionKey, JSON.stringify(session), "EX", 86400);
    return { found: true, session };
  } catch (error) {
    console.error(`[parentBotSession] Error in initParentSession for ${phoneNumber}:`, error);
    return { found: false };
  }
}

/**
 * Fetches the parent bot session from Redis.
 */
export async function getParentSession({ phoneNumber }) {
  try {
    const sessionKey = `parentsession:${phoneNumber}`;
    const data = await cacheRedis.get(sessionKey);
    if (!data) return null;
    return JSON.parse(data);
  } catch (error) {
    console.error(`[parentBotSession] Error in getParentSession for ${phoneNumber}:`, error);
    return null;
  }
}

/**
 * Sets the active school selection for a parent's session.
 */
export async function setActiveSchool({ phoneNumber, index }) {
  try {
    const session = await getParentSession({ phoneNumber });
    if (!session) return null;

    const idx = index - 1; // 1-based to 0-based
    if (idx < 0 || idx >= session.linkedSchools.length) {
      return null;
    }

    session.activeSchoolIndex = idx;
    session.step = "ready";
    session.lastActivity = Date.now();

    const sessionKey = `parentsession:${phoneNumber}`;
    await cacheRedis.set(sessionKey, JSON.stringify(session), "EX", 86400);
    return session.linkedSchools[idx];
  } catch (error) {
    console.error(`[parentBotSession] Error in setActiveSchool for ${phoneNumber}:`, error);
    return null;
  }
}

/**
 * Extends the sliding window expiry for a parent session.
 */
export async function refreshSession({ phoneNumber }) {
  try {
    const sessionKey = `parentsession:${phoneNumber}`;
    const data = await cacheRedis.get(sessionKey);
    if (data) {
      const session = JSON.parse(data);
      session.lastActivity = Date.now();
      await cacheRedis.set(sessionKey, JSON.stringify(session), "EX", 86400);
    }
  } catch (error) {
    console.error(`[parentBotSession] Error in refreshSession for ${phoneNumber}:`, error);
  }
}

/**
 * Deletes the parent session from Redis.
 */
export async function destroyParentSession({ phoneNumber }) {
  try {
    const sessionKey = `parentsession:${phoneNumber}`;
    await cacheRedis.del(sessionKey);
  } catch (error) {
    console.error(`[parentBotSession] Error in destroyParentSession for ${phoneNumber}:`, error);
  }
}

/**
 * Helper to fetch the active selected school details for a parent.
 */
export async function getActiveSchool({ phoneNumber }) {
  try {
    const session = await getParentSession({ phoneNumber });
    if (!session || session.activeSchoolIndex === null || session.activeSchoolIndex === undefined) {
      return null;
    }
    return session.linkedSchools[session.activeSchoolIndex] || null;
  } catch (error) {
    console.error(`[parentBotSession] Error in getActiveSchool for ${phoneNumber}:`, error);
    return null;
  }
}
