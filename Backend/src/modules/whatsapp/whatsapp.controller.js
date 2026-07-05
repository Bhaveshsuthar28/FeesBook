import { env } from "../../cors/config/env.js";
import { db } from "../../cors/database/DB.Connect.js";
import { whatsappMessages, whatsappSettings } from "./whatsapp.schema.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { enrollmentsTable } from "../../cors/schema/enrollments.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";
import { eq, and, desc, gt, inArray } from "drizzle-orm";
import { whatsappQueue } from "../../utils/queue.js";
import { studentFeesTable } from "../../cors/schema/studentFees.schema.js";
import { 
  normalizePhone, 
  validatePhone, 
  queueBroadcastMessages,
  resolvePersonalizedMessage,
  resolvePersonalizedVariables
} from "./whatsapp.service.js";
import { 
  isPrincipalNumber, 
  processBotMessage 
} from "./bot.service.js";
import { processAutoReminders, countPendingReminders } from "./reminder.service.js";
import {
  handleIncomingMessage,
  logoutCommand,
} from "./principalBot/principalBot.auth.middleware.js";
import { sendTextMessage, sendPDFReceiptDirect } from "./whatsapp.service.js";
import { handleParentMessage } from "./parentBot/parentBot.handler.service.js";
import nodemailer from "nodemailer";

// 1. GET Verification Handshake for Meta API Webhook
export async function verifyWebhookController(request, reply) {
  const mode = request.query["hub.mode"];
  const token = request.query["hub.verify_token"];
  const challenge = request.query["hub.challenge"];

  const verifyToken = env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WhatsApp Webhook] Handshake verified successfully.");
    return reply.status(200).send(challenge);
  } else {
    console.warn("[WhatsApp Webhook] Handshake verification failed.");
    return reply.status(403).send("Forbidden");
  }
}

// 2. POST Incoming Messages Webhook (Meta)
export async function handleWebhookController(request, reply) {
  // Always return 200 immediately to prevent Meta from retrying and causing duplicate requests
  reply.status(200).send({ status: "ok" });

  const body = request.body || {};

  // Process asynchronously in the background
  (async () => {
    try {
      // 1. Handle Delivery Status Webhook Updates
      const statusUpdate = body.entry?.[0]?.changes?.[0]?.value?.statuses?.[0];
      if (statusUpdate) {
        const waMessageId = statusUpdate.id;
        const status = statusUpdate.status?.toUpperCase();

        await db
          .update(whatsappMessages)
          .set({ status })
          .where(eq(whatsappMessages.waMessageId, waMessageId));
        return;
      }

      // 2. Handle Incoming User Messages
      const incomingMessage = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
      if (incomingMessage) {
        const from = incomingMessage.from;
        const text = incomingMessage.text?.body?.trim();

        if (!from || !text) return;

        // Run through the new Principal Bot Auth State Machine first
        const authResult = await handleIncomingMessage({
          phoneNumber: from,
          messageText: text,
        });

        if (authResult.reply) {
          await sendTextMessage(from, authResult.reply);
          return;
        }

        if (authResult.authenticated) {
          const command = text.toLowerCase();
          if (command === "logout") {
            const logoutRes = await logoutCommand({ phoneNumber: from });
            await sendTextMessage(from, logoutRes.reply);
            return;
          }

          if (command === "help") {
            const helpMsg = `Available Commands:\n- help: Show this guide\n- logout: Close active bot session`;
            await sendTextMessage(from, helpMsg);
            return;
          }

          await sendTextMessage(from, `🤖 Command received: "${text}"`);
          return;
        }

        // Run through the Parent Bot flow next
        const parentResult = await handleParentMessage({ phoneNumber: from, messageText: text });
        if (parentResult.reply) {
          if (parentResult.pdfUrl) {
            await sendTextMessage(from, parentResult.reply);
            await sendPDFReceiptDirect(
              from, 
              parentResult.pdfUrl, 
              parentResult.fileName || "receipt.pdf", 
              "Receipt Attachment"
            );
          } else {
            await sendTextMessage(from, parentResult.reply);
          }
          return;
        }

        // Fallback to legacy check if not handled by any bot state machine
        const isPrincipal = await isPrincipalNumber(from);
        if (isPrincipal) {
          await processBotMessage(from, text);
        } else {
          console.log(`[WhatsApp Webhook] Ignored incoming message from: ${from}`);
        }
      }
    } catch (error) {
      console.error("[WhatsApp Webhook] Error processing incoming payload:", error);
    }
  })();
}

// 3. POST send-personal API
export async function sendPersonalController(request, reply) {
  const { studentId, message, fileData, fileName, fileType, templateName, variables } = request.body || {};
  const schoolId = request.user?.schoolId;

  if (!studentId || !message) {
    return reply.status(400).send({ success: false, message: "studentId and message are required" });
  }

  try {
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(and(eq(studentsTable.id, studentId), eq(studentsTable.schoolId, schoolId)));

    if (!student) {
      return reply.status(404).send({ success: false, message: "Student not found" });
    }

    const to = normalizePhone(student.phone);
    if (!validatePhone(to)) {
      return reply.status(400).send({ success: false, message: `Invalid recipient phone number: ${student.phone}` });
    }

    // Create message record
    const [msgRecord] = await db
      .insert(whatsappMessages)
      .values({
        schoolId,
        studentId,
        recipientPhone: to,
        messageType: "PERSONAL",
        status: "PENDING",
      })
      .returning();

    // Resolve template variables dynamically for this student
    const resolvedMessage = await resolvePersonalizedMessage(studentId, message);
    const resolvedVars = await resolvePersonalizedVariables(studentId, variables);

    // Queue job to Bull
    await whatsappQueue.add({
      type: "SEND_PERSONAL",
      messageRecordId: msgRecord.id,
      phone: to,
      message: resolvedMessage,
      fileData,
      fileName,
      fileType,
      templateName,
      variables: resolvedVars,
    });

    return reply.status(200).send({ success: true, message: "Message queued successfully" });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: error.message });
  }
}

// 4. POST broadcast API
export async function sendBroadcastController(request, reply) {
  const { targetType, targetId, message, fileData, fileName, fileType, isFeesReminder, templateName, variables } = request.body || {};
  const schoolId = request.user?.schoolId;

  if (!targetType || !message) {
    return reply.status(400).send({ success: false, message: "targetType and message are required" });
  }

  try {
    const baseQuery = db
      .select({
        id: studentsTable.id,
        phone: studentsTable.phone,
      })
      .from(studentsTable)
      .innerJoin(
        enrollmentsTable,
        eq(enrollmentsTable.studentId, studentsTable.id)
      )
      .innerJoin(
        classesTable,
        eq(classesTable.id, enrollmentsTable.classId)
      );

    const queryConditions = [
      eq(studentsTable.schoolId, schoolId),
      eq(studentsTable.status, "active"),
      eq(enrollmentsTable.schoolId, schoolId),
      inArray(enrollmentsTable.status, ["active", "promoted"]),
      eq(enrollmentsTable.academicYear, classesTable.academicYear),
    ];

    if (targetType === "CLASS") {
      if (!targetId) return reply.status(400).send({ success: false, message: "targetId is required for CLASS type" });
      queryConditions.push(eq(enrollmentsTable.classId, targetId));
    } else if (targetType === "SECTION") {
      if (!targetId) return reply.status(400).send({ success: false, message: "targetId is required for SECTION type" });
      queryConditions.push(eq(enrollmentsTable.sectionId, targetId));
    } else if (targetType === "SCHOOL") {
      queryConditions.push(eq(classesTable.status, "active"));
    } else {
      return reply.status(400).send({ success: false, message: "Invalid targetType. Must be SCHOOL, CLASS, or SECTION" });
    }

    if (isFeesReminder) {
      const pendingStudentIds = await db
        .select({ studentId: studentFeesTable.studentId })
        .from(studentFeesTable)
        .where(and(eq(studentFeesTable.schoolId, schoolId), gt(studentFeesTable.dueAmount, 0)))
        .groupBy(studentFeesTable.studentId);

      const pendingIds = pendingStudentIds.map((p) => p.studentId);
      if (pendingIds.length === 0) {
        return reply.status(200).send({ success: true, queued: 0, estimatedTime: "0 seconds" });
      }
      queryConditions.push(inArray(studentsTable.id, pendingIds));
    }

    const students = await baseQuery.where(and(...queryConditions));

    if (students.length === 0) {
      return reply.status(200).send({ success: true, queued: 0, estimatedTime: "0 seconds" });
    }

    // Deduplicate phone numbers to prevent duplicates
    const phoneMap = new Map();
    students.forEach((s) => {
      const normalized = normalizePhone(s.phone);
      if (normalized && validatePhone(normalized)) {
        if (!phoneMap.has(normalized)) {
          phoneMap.set(normalized, s.id);
        }
      }
    });

    const studentsList = Array.from(phoneMap.entries()).map(([phone, studentId]) => ({
      phone,
      studentId,
    }));

    const result = await queueBroadcastMessages({
      schoolId,
      studentsList,
      message,
      fileData,
      fileName,
      fileType,
      templateName,
      variables,
    });

    const estimatedTime = Math.ceil(result.queued / 5) * 0.5;

    return reply.status(200).send({
      success: true,
      queued: result.queued,
      estimatedTime: `${estimatedTime} seconds`,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: error.message });
  }
}

// 5. GET WhatsApp Settings
export async function getWhatsappSettingsController(request, reply) {
  const schoolId = request.user?.schoolId;

  try {
    const [settings] = await db
      .select()
      .from(whatsappSettings)
      .where(eq(whatsappSettings.schoolId, schoolId));

    if (!settings) {
      return reply.status(200).send({
        success: true,
        data: {
          schoolId,
          reminderIntervalDays: 90,
          reminderTime: "09:00",
          autoSendEnabled: false,
          templates: [],
        },
      });
    }

    const data = {
      ...settings,
      autoSendEnabled: Boolean(settings.autoSendEnabled),
      templates: typeof settings.templates === "string" ? JSON.parse(settings.templates || "[]") : settings.templates,
    };

    return reply.status(200).send({ success: true, data });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: error.message });
  }
}

// 6. POST WhatsApp Settings
export async function updateWhatsappSettingsController(request, reply) {
  const schoolId = request.user?.schoolId;
  const { reminderIntervalDays, reminderTime, autoSendEnabled, templates } = request.body || {};

  try {
    const [existing] = await db
      .select()
      .from(whatsappSettings)
      .where(eq(whatsappSettings.schoolId, schoolId));

    const templatesStr = typeof templates === "string" ? templates : JSON.stringify(templates || []);

    if (existing) {
      await db
        .update(whatsappSettings)
        .set({
          reminderIntervalDays: reminderIntervalDays !== undefined ? parseInt(reminderIntervalDays, 10) : existing.reminderIntervalDays,
          reminderTime: reminderTime !== undefined ? reminderTime : existing.reminderTime,
          autoSendEnabled: autoSendEnabled !== undefined ? Boolean(autoSendEnabled) : existing.autoSendEnabled,
          templates: templates !== undefined ? templatesStr : existing.templates,
        })
        .where(eq(whatsappSettings.schoolId, schoolId));
    } else {
      await db.insert(whatsappSettings).values({
        schoolId,
        reminderIntervalDays: reminderIntervalDays !== undefined ? parseInt(reminderIntervalDays, 10) : 90,
        reminderTime: reminderTime !== undefined ? reminderTime : "09:00",
        autoSendEnabled: autoSendEnabled !== undefined ? Boolean(autoSendEnabled) : false,
        templates: templatesStr,
        createdAt: Date.now(),
      });
    }

    return reply.status(200).send({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: error.message });
  }
}

// 7. GET WhatsApp Sent Messages History
export async function getWhatsappHistoryController(request, reply) {
  const schoolId = request.user?.schoolId;
  const limit = parseInt(request.query.limit, 10) || 50;

  try {
    const history = await db
      .select({
        id: whatsappMessages.id,
        recipientPhone: whatsappMessages.recipientPhone,
        messageType: whatsappMessages.messageType,
        status: whatsappMessages.status,
        waMessageId: whatsappMessages.waMessageId,
        errorReason: whatsappMessages.errorReason,
        sentAt: whatsappMessages.sentAt,
        createdAt: whatsappMessages.createdAt,
        studentName: studentsTable.fullName,
      })
      .from(whatsappMessages)
      .leftJoin(studentsTable, eq(whatsappMessages.studentId, studentsTable.id))
      .where(eq(whatsappMessages.schoolId, schoolId))
      .orderBy(desc(whatsappMessages.createdAt))
      .limit(limit);

    return reply.status(200).send({ success: true, data: history });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: error.message });
  }
}

// 8. POST Trigger Fees Reminders Manually
export async function triggerFeesRemindersController(request, reply) {
  const schoolId = request.user?.schoolId;

  try {
    // 1. Get the count of pending reminders that will be processed
    const queuedCount = await countPendingReminders(schoolId, true); // forceSend = true

    // 2. Trigger the generation process in the background asynchronously
    processAutoReminders(schoolId, true).catch((error) => {
      request.log.error(`[Background Reminders] Failed for school ${schoolId}: ${error.message}`);
    });

    // 3. Return immediately to the frontend to keep the user experience fast
    return reply.status(200).send({ success: true, queued: queuedCount });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: error.message });
  }
}

// 9. POST Public Contact/Help Email Controller
export async function handlePublicContactEmailController(request, reply) {
  const { email, message, type } = request.body || {};

  if (!email || !email.trim()) {
    return reply.status(400).send({ success: false, message: "Email is required." });
  }
  if (!message || !message.trim()) {
    return reply.status(400).send({ success: false, message: "Message is required." });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `FeesBook Public Website: New ${type === "help" ? "Help Ticket" : "Contact Query"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f9; color: #333333; margin: 0; padding: 20px; }
            .container { max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border: 1px solid #e1e4e8; }
            .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
            .logo-text { font-size: 24px; font-weight: 800; }
            .content { padding: 30px; }
            .ticket-title { font-size: 18px; font-weight: 700; color: #1e3a8a; margin-bottom: 20px; border-bottom: 2px solid #e1e4e8; padding-bottom: 10px; }
            .label { font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px; }
            .problem-card { background-color: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; border-radius: 8px; margin-bottom: 25px; line-height: 1.6; font-size: 14px; color: #334155; }
            .info-grid { background-color: #f8fafc; border-radius: 8px; padding: 20px; border: 1px solid #edf2f7; }
            .info-row { display: flex; margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid #edf2f7; padding-bottom: 8px; }
            .info-row:last-child { margin-bottom: 0; border-bottom: none; padding-bottom: 0; }
            .info-label { width: 140px; font-weight: 750; color: #64748b; }
            .info-val { font-weight: 600; color: #0f172a; }
            .footer { background-color: #f7fafc; padding: 20px; text-align: center; font-size: 12px; color: #a0aec0; border-top: 1px solid #edf2f7; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo-text">Fees<span style="color: #60a5fa;">Book</span></div>
            </div>
            <div class="content">
              <div class="ticket-title">New Website Request (${type === "help" ? "Help Center Guide" : "Support Form"})</div>
              <div class="label">User Query Message:</div>
              <div class="problem-card">${message.replace(/\n/g, "<br/>")}</div>
              
              <div class="label">Sender Details:</div>
              <div class="info-grid">
                <div class="info-row">
                  <span class="info-label">Sender Email:</span>
                  <span class="info-val">${email}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Query Type:</span>
                  <span class="info-val" style="text-transform: uppercase;">${type || "general"}</span>
                </div>
              </div>
            </div>
            <div class="footer">
              This support ticket was sent from the public website contact portal.
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return reply.status(200).send({ success: true, message: "Email sent successfully." });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({ success: false, message: "Failed to send support email." });
  }
}
