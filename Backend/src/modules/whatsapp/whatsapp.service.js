import axios from "axios";
import { env } from "../../cors/config/env.js";
import { db, sqlClient } from "../../cors/database/DB.Connect.js";
import { whatsappMessages } from "./whatsapp.schema.js";
import { whatsappQueue } from "../../utils/queue.js";
import { eq, sql } from "drizzle-orm";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { studentFeesTable } from "../../cors/schema/studentFees.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";

const apiVersion = env.WHATSAPP_API_VERSION;
const defaultPhoneId = env.WHATSAPP_PHONE_NUMBER_ID;
const defaultToken = env.WHATSAPP_ACCESS_TOKEN;

// Phone number validation (Indian numbers, 10 digits prefixed with 91)
export function validatePhone(phone) {
  if (!phone) return false;
  const cleaned = String(phone).replace(/\D/g, "");
  const normalized = cleaned.length === 10 ? "91" + cleaned : cleaned;
  return /^91[6-9]\d{9}$/.test(normalized);
}

export function normalizePhone(phone) {
  if (!phone) return null;
  const cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.length === 10) {
    return "91" + cleaned;
  }
  return cleaned;
}

// 1. sendTextMessage
export async function sendTextMessage(phone, message, phoneNumberId = defaultPhoneId, accessToken = defaultToken) {
  try {
    const to = normalizePhone(phone);
    if (!validatePhone(to)) {
      return { success: false, error: `Invalid phone number: ${phone}` };
    }

    if (env.WHATSAPP_DRY_RUN === "true") {
      console.log(`\n📱 [DRY RUN] Reply to ${to}:\n${message}\n`);
      return { success: true, dryRun: true };
    }

    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
          preview_url: false,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const waMessageId = response.data?.messages?.[0]?.id;
    return { success: true, waMessageId };
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorDetails };
  }
}

// 2. sendTemplateMessage
export async function sendTemplateMessage(phone, templateName, variables = [], phoneNumberId = defaultPhoneId, accessToken = defaultToken) {
  try {
    const to = normalizePhone(phone);
    if (!validatePhone(to)) {
      return { success: false, error: `Invalid phone number: ${phone}` };
    }

    // Standard Meta test templates (hello_world, jaspers_market) are registered under en_US.
    // Custom templates could be en_US or en. We will default to en_US.
    let langCode = "en_US";

    const makeRequest = async (template, lang, vars) => {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "template",
        template: {
          name: template,
          language: {
            code: lang,
          },
        },
      };

      // Only add body components if variables are provided and template is not hello_world
      if (vars.length > 0 && template !== "hello_world") {
        payload.template.components = [
          {
            type: "body",
            parameters: vars.map((val) => ({
              type: "text",
              text: String(val),
            })),
          },
        ];
      }

      return axios.post(
        `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
    };

    let response;
    try {
      response = await makeRequest(templateName, langCode, variables);
    } catch (error) {
      const errorDetails = error.response?.data?.error;
      console.warn(`[WhatsApp Service] Template '${templateName}' send failed with code ${errorDetails?.code}: ${errorDetails?.message}`);

      // If it failed because the template doesn't exist (error code 100 or 132001),
      // fallback to the pre-approved hello_world template so the user receives the test message.
      if (errorDetails?.code === 100 || errorDetails?.code === 132001) {
        if (templateName !== "hello_world") {
          console.log(`[WhatsApp Service] Falling back to 'hello_world' template to verify credentials.`);
          response = await makeRequest("hello_world", "en_US", []);
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }

    const waMessageId = response.data?.messages?.[0]?.id;
    return { success: true, waMessageId };
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorDetails };
  }
}

// 3. sendPDFReceiptDirect (Two-step process: upload to media then send as message)
export async function sendPDFReceiptDirect(phone, pdfBuffer, filename, caption, phoneNumberId = defaultPhoneId, accessToken = defaultToken) {
  try {
    const to = normalizePhone(phone);
    if (!validatePhone(to)) {
      return { success: false, error: `Invalid phone number: ${phone}` };
    }

    // Step 1: Upload PDF to Meta media endpoint
    const formData = new FormData();
    const blob = new Blob([pdfBuffer], { type: "application/pdf" });
    formData.append("file", blob, filename || "receipt.pdf");
    formData.append("messaging_product", "whatsapp");

    const mediaResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!mediaResponse.ok) {
      const errText = await mediaResponse.text();
      return { success: false, error: `Failed to upload PDF media: ${errText}` };
    }

    const mediaData = await mediaResponse.json();
    const mediaId = mediaData?.id;
    if (!mediaId) {
      return { success: false, error: "Failed to upload PDF media to Meta (no ID returned)" };
    }

    // Step 2: Send document message using the media_id
    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "document",
        document: {
          id: mediaId,
          filename: filename || "receipt.pdf",
          caption: caption || "Your fee receipt",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const waMessageId = response.data?.messages?.[0]?.id;
    return { success: true, waMessageId };
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorDetails };
  }
}

// 3.5. sendMediaMessageDirect (Two-step process: upload media to Meta then send as message)
export async function sendMediaMessageDirect(phone, fileBuffer, mimeType, filename, caption, phoneNumberId = defaultPhoneId, accessToken = defaultToken) {
  try {
    const to = normalizePhone(phone);
    if (!validatePhone(to)) {
      return { success: false, error: `Invalid phone number: ${phone}` };
    }

    // Step 1: Upload media to Meta media endpoint
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("file", blob, filename || "file");
    formData.append("messaging_product", "whatsapp");

    const mediaResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!mediaResponse.ok) {
      const errText = await mediaResponse.text();
      return { success: false, error: `Failed to upload media: ${errText}` };
    }

    const mediaData = await mediaResponse.json();
    const mediaId = mediaData?.id;
    if (!mediaId) {
      return { success: false, error: "Failed to upload media to Meta (no ID returned)" };
    }

    // Determine type (image, document, video, audio)
    let type = "document";
    const mt = mimeType.toLowerCase();
    if (mt.startsWith("image/")) type = "image";
    else if (mt.startsWith("video/")) type = "video";
    else if (mt.startsWith("audio/")) type = "audio";

    const mediaPayload = { id: mediaId };
    if (type === "document") {
      mediaPayload.filename = filename || "file";
    }
    if (caption && (type === "image" || type === "document" || type === "video")) {
      mediaPayload.caption = caption;
    }

    // Step 2: Send message using the media_id
    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type,
        [type]: mediaPayload,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const waMessageId = response.data?.messages?.[0]?.id;
    return { success: true, waMessageId };
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorDetails };
  }
}

// Helper function to resolve template variables for a single student dynamically
export async function resolvePersonalizedMessage(studentId, templateText) {
  if (!templateText) return "";

  try {
    // 1. Fetch student info
    const [student] = await db
      .select({
        fullName: studentsTable.fullName,
        fatherName: studentsTable.fatherName,
        phone: studentsTable.phone,
        classId: studentsTable.classId,
        schoolId: studentsTable.schoolId,
      })
      .from(studentsTable)
      .where(eq(studentsTable.id, studentId));

    if (!student) return templateText;

    // 2. Fetch class details & current academic year
    let className = "";
    let currentAcademicYear = "";
    if (student.classId) {
      const [cls] = await db
        .select({ name: classesTable.name, academicYear: classesTable.academicYear })
        .from(classesTable)
        .where(eq(classesTable.id, student.classId));
      if (cls) {
        className = cls.name;
        currentAcademicYear = cls.academicYear;
      }
    }

    // Fetch school profile name
    let schoolName = "School";
    if (student.schoolId) {
      try {
        const { getSchoolProfileService } = await import("../settings/settings.service.js");
        const profile = await getSchoolProfileService({ schoolId: student.schoolId });
        if (profile?.schoolName) {
          schoolName = profile.schoolName;
        }
      } catch (err) {
        console.error("[resolvePersonalizedMessage] Error fetching school profile:", err);
      }
    }

    // 3. Fetch all student fees with class names
    const fees = await db
      .select({
        amount: studentFeesTable.amount,
        paidAmount: studentFeesTable.paidAmount,
        dueAmount: studentFeesTable.dueAmount,
        academicYear: studentFeesTable.academicYear,
        className: classesTable.name,
      })
      .from(studentFeesTable)
      .leftJoin(classesTable, eq(studentFeesTable.classId, classesTable.id))
      .where(eq(studentFeesTable.studentId, studentId));

    let currentYearPending = 0;
    let overduePending = 0;
    let totalFees = 0;
    let paidAmount = 0;
    const overdueGroups = {};

    fees.forEach((fee) => {
      const feeDue = Number(fee.dueAmount || 0);
      totalFees += Number(fee.amount || 0);
      paidAmount += Number(fee.paidAmount || 0);

      if (!currentAcademicYear || fee.academicYear === currentAcademicYear) {
        currentYearPending += feeDue;
      } else {
        overduePending += feeDue;
        if (feeDue > 0) {
          const groupName = fee.className || "Previous Class";
          const groupYear = fee.academicYear || "Previous Year";
          const groupKey = `${groupName} (${groupYear})`;
          overdueGroups[groupKey] = (overdueGroups[groupKey] || 0) + feeDue;
        }
      }
    });

    const overdueDetails = overduePending > 0
      ? Object.entries(overdueGroups).map(([key, amount]) => `₹${amount} for ${key}`).join(", ")
      : "None";

    const data = {
      full_name: student.fullName || "",
      parent_name: student.fatherName || "",
      class_name: className,
      school_name: schoolName,
      pending_fees: currentYearPending,
      remaining_fees: currentYearPending + overduePending,
      overdue_fees: overduePending,
      overdue_amount: overduePending,
      overdue_details: overdueDetails,
      due_date: "due date",
      paid_amount: paidAmount,
      total_fees: totalFees,
      phone_number: student.phone || "",
    };

    let resolvedText = templateText;
    Object.entries(data).forEach(([key, val]) => {
      const regex = new RegExp(`{${key}}`, "g");
      resolvedText = resolvedText.replace(regex, val);
    });

    return resolvedText;
  } catch (err) {
    console.error(`[resolvePersonalizedMessage] Error for student ${studentId}:`, err);
    return templateText;
  }
}

// 4. sendBroadcast helper to push to queue
export async function queueBroadcastMessages({ schoolId, studentsList, message, fileData, fileName, fileType, templateName, variables }) {
  const jobIds = [];
  let queuedCount = 0;

  for (const item of studentsList) {
    const { studentId, phone } = item;
    const to = normalizePhone(phone);

    if (!validatePhone(to)) {
      console.warn(`Skipping invalid phone number for student ${studentId}: ${phone}`);
      continue;
    }

    // Resolve template variables dynamically for this student
    const resolvedMessage = await resolvePersonalizedMessage(studentId, message);
    const resolvedVars = await resolvePersonalizedVariables(studentId, variables);

    // Insert pending message record
    const [msgRecord] = await db
      .insert(whatsappMessages)
      .values({
        schoolId,
        studentId,
        recipientPhone: to,
        messageType: "BROADCAST",
        status: "PENDING",
      })
      .returning();

    // Push send job to Bull queue
    const job = await whatsappQueue.add({
      type: "SEND_BROADCAST",
      messageRecordId: msgRecord.id,
      phone: to,
      message: resolvedMessage,
      fileData,
      fileName,
      fileType,
      templateName,
      variables: resolvedVars,
    });

    jobIds.push(job.id);
    queuedCount += 1;
  }

  return { queued: queuedCount, jobIds };
}

// 5. sendFeeReceipt
export async function sendFeeReceipt(paymentId) {
  try {
    const { studentPaymentsTable } = await import("../../cors/schema/studentPayments.schema.js");
    const { studentsTable } = await import("../../cors/schema/students.schema.js");
    const { getStudentPaymentReceiptPdfService } = await import("../students/students.service.js");
    const { eq } = await import("drizzle-orm");

    // 1. Fetch payment details
    const [payment] = await db
      .select()
      .from(studentPaymentsTable)
      .where(eq(studentPaymentsTable.id, paymentId));

    if (!payment) {
      console.error(`Payment record not found for receipt sending: ${paymentId}`);
      return;
    }

    // 2. Fetch student details
    const [student] = await db
      .select()
      .from(studentsTable)
      .where(eq(studentsTable.id, payment.studentId));

    if (!student) {
      console.error(`Student record not found for payment: ${payment.studentId}`);
      return;
    }

    // Fetch class name
    let className = "";
    if (student.classId) {
      const [cls] = await db
        .select({ name: classesTable.name })
        .from(classesTable)
        .where(eq(classesTable.id, student.classId));
      if (cls) className = cls.name;
    }

    // 3. Generate PDF receipt
    const pdfDetails = await getStudentPaymentReceiptPdfService({
      schoolId: payment.schoolId,
      studentId: payment.studentId,
      paymentId: payment.id,
    });

    // Convert PDF buffer to Base64 to safely pass through Bull queue
    const pdfBufferBase64 = pdfDetails.buffer.toString("base64");
    const filename = pdfDetails.fileName || `receipt-${payment.receiptNo}.pdf`;
    const caption = `Dear Parent, please find the fee receipt for ₹${payment.amount} paid on ${new Date(payment.paidAt).toLocaleDateString("en-IN")}.`;

    // 4. Split parent phone numbers by comma/semicolon and queue document send jobs
    const phones = student.phone
      .split(/[,;\/]+/)
      .map((p) => p.trim())
      .filter(Boolean);

    for (const phone of phones) {
      const to = normalizePhone(phone);
      if (!validatePhone(to)) {
        continue;
      }

      // Log PENDING receipt message
      const [msgRecord] = await db
        .insert(whatsappMessages)
        .values({
          schoolId: payment.schoolId,
          studentId: payment.studentId,
          recipientPhone: to,
          messageType: "RECEIPT",
          status: "PENDING",
        })
        .returning();

      const { getSchoolProfileService } = await import("../settings/settings.service.js");
      const profile = await getSchoolProfileService({ schoolId: payment.schoolId });
      const schoolName = profile?.schoolName || "School";

      // Add to Bull queue with templateName and variables to bypass 24h Meta restriction
      await whatsappQueue.add({
        type: "SEND_RECEIPT",
        messageRecordId: msgRecord.id,
        phone: to,
        pdfBufferBase64,
        filename,
        caption,
        templateName: "fees_receipt",
        variables: [
          student.fatherName || "Parent",
          String(payment.amount),
          student.fullName,
          className,
          String(payment.receiptNo),
          schoolName
        ]
      });
    }

    // 5. Update payment record: receiptSent = true, receiptSentAt = Date.now()
    await db
      .update(studentPaymentsTable)
      .set({
        receiptSent: true,
        receiptSentAt: Date.now(),
      })
      .where(eq(studentPaymentsTable.id, paymentId));

    console.log(`[WhatsApp Service] Queued PDF receipt for payment ID: ${paymentId}`);
  } catch (error) {
    console.error("Error in sendFeeReceipt:", error);
  }
}

// 6. Startup DB initialization for WhatsApp tables and columns
export async function ensureWhatsappTables() {
  try {
    // Create new tables if not exists
    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id TEXT PRIMARY KEY,
        school_id TEXT,
        student_id TEXT,
        recipient_phone TEXT NOT NULL,
        message_type TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        wa_message_id TEXT,
        error_reason TEXT,
        sent_at INTEGER,
        created_at INTEGER
      )
    `);

    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS bot_sessions (
        id TEXT PRIMARY KEY,
        phone TEXT NOT NULL UNIQUE,
        school_id TEXT,
        current_step TEXT DEFAULT 'AUTH',
        context TEXT,
        authenticated INTEGER DEFAULT 0,
        expires_at INTEGER,
        created_at INTEGER
      )
    `);

    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS principal_bot_auth (
        id TEXT PRIMARY KEY,
        school_id TEXT,
        phone TEXT NOT NULL,
        secret_code TEXT NOT NULL,
        failed_attempts INTEGER DEFAULT 0,
        blocked_until INTEGER,
        created_at INTEGER
      )
    `);

    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS whatsapp_settings (
        school_id TEXT PRIMARY KEY,
        reminder_interval_days INTEGER DEFAULT 90,
        reminder_time TEXT DEFAULT '09:00',
        auto_send_enabled INTEGER DEFAULT 0,
        templates TEXT DEFAULT '[]',
        created_at INTEGER
      )
    `);

    // Add columns to student_fees if they don't exist
    const feeCols = await sqlClient.execute("PRAGMA table_info(student_fees)");
    const existingFeeCols = new Set(feeCols.rows.map((r) => String(r.name)));

    if (!existingFeeCols.has("last_paid_date")) {
      await sqlClient.execute("ALTER TABLE student_fees ADD COLUMN last_paid_date integer");
      console.log("[DB Setup] Added last_paid_date column to student_fees");
    }
    if (!existingFeeCols.has("next_reminder_date")) {
      await sqlClient.execute("ALTER TABLE student_fees ADD COLUMN next_reminder_date integer");
      console.log("[DB Setup] Added next_reminder_date column to student_fees");
    }

    // Add columns to student_payments if they don't exist
    const paymentCols = await sqlClient.execute("PRAGMA table_info(student_payments)");
    const existingPaymentCols = new Set(paymentCols.rows.map((r) => String(r.name)));

    if (!existingPaymentCols.has("receipt_sent")) {
      await sqlClient.execute("ALTER TABLE student_payments ADD COLUMN receipt_sent integer DEFAULT 0");
      console.log("[DB Setup] Added receipt_sent column to student_payments");
    }
    if (!existingPaymentCols.has("receipt_sent_at")) {
      await sqlClient.execute("ALTER TABLE student_payments ADD COLUMN receipt_sent_at integer");
      console.log("[DB Setup] Added receipt_sent_at column to student_payments");
    }

    console.log("[DB Setup] WhatsApp table checks completed.");
  } catch (error) {
    console.error("[DB Setup] Error checking/creating WhatsApp tables:", error);
  }
}

// 7. sendMediaTemplateMessage (Upload media then send template message with document/image header)
export async function sendMediaTemplateMessage(phone, templateName, variables = [], fileBuffer, mimeType, filename, phoneNumberId = defaultPhoneId, accessToken = defaultToken) {
  try {
    const to = normalizePhone(phone);
    if (!validatePhone(to)) {
      return { success: false, error: `Invalid phone number: ${phone}` };
    }

    // Step 1: Upload media to Meta using fetch
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: mimeType });
    formData.append("file", blob, filename || "file");
    formData.append("messaging_product", "whatsapp");

    const mediaResponse = await fetch(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/media`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData,
      }
    );

    if (!mediaResponse.ok) {
      const errText = await mediaResponse.text();
      return { success: false, error: `Failed to upload media for template: ${errText}` };
    }

    const mediaData = await mediaResponse.json();
    const mediaId = mediaData?.id;
    if (!mediaId) {
      return { success: false, error: "Failed to upload media for template (no ID returned)" };
    }

    // Determine type (image, video or document)
    let mediaType = "document";
    const mt = mimeType.toLowerCase();
    if (mt.startsWith("image/")) mediaType = "image";
    else if (mt.startsWith("video/")) mediaType = "video";

    // Step 2: Send template message with media header and body variables
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: "en_US",
        },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: mediaType,
                [mediaType]: {
                  id: mediaId,
                  ...(mediaType === "document" ? { filename: filename || "file.pdf" } : {}),
                },
              },
            ],
          },
        ],
      },
    };

    if (variables && variables.length > 0) {
      payload.template.components.push({
        type: "body",
        parameters: variables.map((val) => ({
          type: "text",
          text: String(val),
        })),
      });
    }

    const response = await axios.post(
      `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const waMessageId = response.data?.messages?.[0]?.id;
    return { success: true, waMessageId };
  } catch (error) {
    const errorDetails = error.response?.data?.error?.message || error.message;
    return { success: false, error: errorDetails };
  }
}

// 8. resolvePersonalizedVariables
export async function resolvePersonalizedVariables(studentId, variables = []) {
  if (!variables || variables.length === 0) return [];
  
  const resolved = [];
  for (const v of variables) {
    if (typeof v === "string" && v.includes("{")) {
      resolved.push(await resolvePersonalizedMessage(studentId, v));
    } else {
      resolved.push(v);
    }
  }
  return resolved;
}

