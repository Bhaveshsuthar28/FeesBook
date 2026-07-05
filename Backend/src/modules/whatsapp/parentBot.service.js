import { db } from "../../cors/database/DB.Connect.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";
import { cacheRedis } from "../../cors/cache/redis.client.js";
import { eq, or, and } from "drizzle-orm";
import { getStudentProfileDetails } from "./bot.service.js";

/**
 * Handles incoming WhatsApp messages from parent numbers to query student fee profiles.
 * Suppors selecting a child if multiple are linked to the same phone number.
 *
 * @param {string} phoneNumber - Senders WhatsApp phone number
 * @param {string} messageText - Senders text content
 * @returns {Promise<{reply: string|null}>} The response message to send back, or null if ignored
 */
export async function handleParentIncomingMessage(phoneNumber, messageText) {
  try {
    const input = (messageText || "").trim();
    if (!input) return { reply: null };

    const normalizedPhone = phoneNumber.replace(/\D/g, "");
    const clean10Digit = normalizedPhone.replace(/^91/, "");

    // 1. Fetch active students linked to this phone number
    const parentStudents = await db
      .select({
        id: studentsTable.id,
        fullName: studentsTable.fullName,
        schoolId: studentsTable.schoolId,
        className: classesTable.name,
      })
      .from(studentsTable)
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
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

    // 2. Check for active parent selection session in Redis
    const sessionKey = `parentsession:${phoneNumber}`;
    const rawSession = await cacheRedis.get(sessionKey);

    if (rawSession) {
      const session = JSON.parse(rawSession);
      const choice = parseInt(input);

      if (!isNaN(choice) && choice >= 1 && choice <= session.studentIds.length) {
        const studentId = session.studentIds[choice - 1];
        const details = await getStudentProfileDetails(session.schoolId, studentId);
        
        // Terminate the temporary selection session
        await cacheRedis.del(sessionKey);
        return { reply: details };
      }

      // If they sent anything else, present choice prompt again
      let retryMsg = `⚠️ Invalid selection. Please reply with the option number (1-${session.studentIds.length}) corresponding to your child:\n\n`;
      
      // Re-fetch current students mapping to match index labels
      parentStudents.forEach((student, idx) => {
        retryMsg += `${idx + 1}️⃣ ${student.fullName} (Class: ${student.className || "N/A"})\n`;
      });
      return { reply: retryMsg };
    }

    // 3. No active session: trigger initial detection
    if (parentStudents.length === 0) {
      // Not a parent number
      return { reply: null };
    }

    if (parentStudents.length === 1) {
      // Single child: directly display profile details
      const student = parentStudents[0];
      const details = await getStudentProfileDetails(student.schoolId, student.id);
      return { reply: details };
    }

    // Multiple children: start a selection session
    const studentIds = parentStudents.map((s) => s.id);
    const sessionData = {
      step: "select_child",
      schoolId: parentStudents[0].schoolId,
      studentIds,
    };

    await cacheRedis.set(sessionKey, JSON.stringify(sessionData), "EX", 300);

    let replyMsg = `Welcome to FeeGo! 👋\nWe found multiple children linked to your phone number:\n\n`;
    parentStudents.forEach((student, idx) => {
      replyMsg += `${idx + 1}️⃣ ${student.fullName} (Class: ${student.className || "N/A"})\n`;
    });
    replyMsg += `\nReply with the option number (1-${parentStudents.length}) to check details:`;

    return { reply: replyMsg };
  } catch (error) {
    console.error(`[ParentBot Service] Error processing message from ${phoneNumber}:`, error);
    return { reply: null };
  }
}
