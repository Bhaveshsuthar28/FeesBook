import cron from "node-cron";
import { processAutoReminders } from "../modules/whatsapp/reminder.service.js";
import { botSessions } from "../modules/whatsapp/whatsapp.schema.js";
import { lte } from "drizzle-orm";
import { db } from "../cors/database/DB.Connect.js";

// 1. Daily Auto Reminders at 9:00 AM IST
cron.schedule(
  "0 9 * * *",
  async () => {
    try {
      console.log("[Reminder Cron] Running daily auto reminder check...");
      const queuedCount = await processAutoReminders();
      console.log(`[Reminder Cron] Finished. Queued ${queuedCount} reminders.`);
    } catch (error) {
      console.error("[Reminder Cron] Error running auto reminders:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

// 2. Hourly Bot Session Cleanup
cron.schedule(
  "0 * * * *",
  async () => {
    try {
      const now = Date.now();
      await db
        .delete(botSessions)
        .where(lte(botSessions.expiresAt, now));
      console.log("[Bot Session Cron] Cleaned up expired sessions from database.");
    } catch (error) {
      console.error("[Bot Session Cron] Error cleaning up expired sessions:", error);
    }
  }
);
