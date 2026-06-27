import { db } from "../../cors/database/DB.Connect.js";
import { studentFeesTable } from "../../cors/schema/studentFees.schema.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";
import { principals } from "../auth/auth.schema.js";
import { and, lte, eq, gt, sql, asc } from "drizzle-orm";
import { whatsappQueue } from "../../utils/queue.js";
import { whatsappMessages, whatsappSettings } from "./whatsapp.schema.js";

// Helper to format date
function formatDate(timestamp) {
  if (!timestamp) return "N/A";
  const date = new Date(Number(timestamp));
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Quick helper to count total pending reminders without loading all data
export async function countPendingReminders(specificSchoolId = null, forceSend = false) {
  const now = new Date();
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const todayKolkata = new Date(now.getTime() + kolkataOffset);
  todayKolkata.setUTCHours(23, 59, 59, 999);
  const endOfToday = todayKolkata.getTime() - kolkataOffset;

  const conditions = [
    eq(studentFeesTable.status, "pending")
  ];

  if (specificSchoolId) {
    conditions.push(eq(studentFeesTable.schoolId, specificSchoolId));
  }

  if (!forceSend) {
    conditions.push(lte(studentFeesTable.nextReminderDate, endOfToday));
  }

  const result = await db
    .select({
      count: sql`COUNT(${studentFeesTable.id})`,
    })
    .from(studentFeesTable)
    .innerJoin(studentsTable, eq(studentFeesTable.studentId, studentsTable.id))
    .where(and(...conditions));

  return result[0]?.count ? Number(result[0].count) : 0;
}

export async function processAutoReminders(specificSchoolId = null, forceSend = false) {
  const now = new Date();
  // Calculate end of today in IST (Asia/Kolkata)
  const kolkataOffset = 5.5 * 60 * 60 * 1000;
  const todayKolkata = new Date(now.getTime() + kolkataOffset);
  todayKolkata.setUTCHours(23, 59, 59, 999);
  const endOfToday = todayKolkata.getTime() - kolkataOffset;

  const BATCH_SIZE = 50;
  let lastId = null;
  let totalQueued = 0;

  // Load WhatsApp settings
  const settingsList = await db.select().from(whatsappSettings);
  const settingsMap = {};
  settingsList.forEach((s) => {
    settingsMap[s.schoolId] = s;
  });

  console.log(`[Reminder Service] Starting auto reminder process. School: ${specificSchoolId || 'All'}, Force: ${forceSend}`);

  while (true) {
    const conditions = [
      eq(studentFeesTable.status, "pending")
    ];

    if (specificSchoolId) {
      conditions.push(eq(studentFeesTable.schoolId, specificSchoolId));
    }

    if (!forceSend) {
      conditions.push(lte(studentFeesTable.nextReminderDate, endOfToday));
    }

    // Apply keyset pagination using the last processed ID
    if (lastId) {
      conditions.push(gt(studentFeesTable.id, lastId));
    }

    // Query a batch of 50 student fees that are pending and due for reminder
    const batch = await db
      .select({
        feeId: studentFeesTable.id,
        dueAmount: studentFeesTable.dueAmount,
        lastPaidDate: studentFeesTable.lastPaidDate,
        createdAt: studentFeesTable.createdAt,
        studentId: studentsTable.id,
        studentName: studentsTable.fullName,
        parentName: studentsTable.fatherName,
        parentPhone: studentsTable.phone,
        schoolId: studentsTable.schoolId,
        className: classesTable.name,
        schoolName: principals.schoolName,
      })
      .from(studentFeesTable)
      .innerJoin(studentsTable, eq(studentFeesTable.studentId, studentsTable.id))
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
      .leftJoin(principals, eq(studentsTable.schoolId, principals.clerkId))
      .where(and(...conditions))
      .orderBy(asc(studentFeesTable.id))
      .limit(BATCH_SIZE);

    if (batch.length === 0) {
      break;
    }

    for (const fee of batch) {
      const parentName = fee.parentName || "Parent";
      const amount = fee.dueAmount;
      const studentName = fee.studentName;
      const className = fee.className || "N/A";
      const pendingSince = formatDate(fee.lastPaidDate || fee.createdAt);
      const schoolName = fee.schoolName || "FeesBook School";

      // Insert pending message record
      const [msgRecord] = await db
        .insert(whatsappMessages)
        .values({
          schoolId: fee.schoolId,
          studentId: fee.studentId,
          recipientPhone: fee.parentPhone,
          messageType: "REMINDER",
          status: "PENDING",
        })
        .returning();

      // Push reminder send job to Bull queue
      await whatsappQueue.add({
        type: "SEND_REMINDER",
        messageRecordId: msgRecord.id,
        phone: fee.parentPhone,
        templateName: "fees_reminder", // Meta template name
        variables: [parentName, amount, studentName, className, pendingSince, schoolName],
      });

      // Update nextReminderDate = today + school interval days
      const schoolSettings = settingsMap[fee.schoolId] || {};
      const intervalDays = schoolSettings.reminderIntervalDays || 90;
      const nextReminderDate = Date.now() + intervalDays * 24 * 60 * 60 * 1000;

      await db
        .update(studentFeesTable)
        .set({
          nextReminderDate: nextReminderDate,
        })
        .where(eq(studentFeesTable.id, fee.feeId));

      totalQueued += 1;
      lastId = fee.feeId; // Update cursor to the current fee ID
    }
  }

  console.log(`[Reminder Service] Auto reminder process finished. Total queued: ${totalQueued}`);
  return totalQueued;
}
