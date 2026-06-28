import Bull from "bull";
import { env } from "../cors/config/env.js";
import { db } from "../cors/database/DB.Connect.js";
import { whatsappMessages } from "../modules/whatsapp/whatsapp.schema.js";
import { eq } from "drizzle-orm";
import { 
  sendTextMessage, 
  sendTemplateMessage, 
  sendPDFReceiptDirect,
  sendMediaMessageDirect
} from "../modules/whatsapp/whatsapp.service.js";

import { URL } from "url";

const REDIS_URL = env.QUEUE_REDIS_URL;

// Parse Redis URL to supply explicit connection options, especially for secure TLS (rediss://)
let redisOptions = REDIS_URL;
try {
  const parsed = new URL(REDIS_URL);
  const options = {
    host: parsed.hostname,
    port: parsed.port ? parseInt(parsed.port) : 6379,
  };
  if (parsed.username) {
    options.username = parsed.username;
  }
  if (parsed.password) {
    options.password = parsed.password;
  }
  if (parsed.protocol === "rediss:") {
    options.tls = {
      rejectUnauthorized: false,
    };
  }
  redisOptions = options;
} catch (err) {
  console.warn("[Queue Config] Failed to parse REDIS_URL, falling back to connection string:", err.message);
}

export const whatsappQueue = new Bull("whatsapp", {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s between retries
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

// Queue processor
// Process 5 messages concurrently
whatsappQueue.process(5, async (job) => {
  const { type, messageRecordId, phone, message, templateName, variables, pdfBufferBase64, filename, caption, fileData, fileType, fileName } = job.data;
  
  // Clean/validate phone
  if (!phone) {
    throw new Error("Phone number is required");
  }

  // Add 500ms delay between each job to avoid rate limit issues
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    let result;

    if (type === "SEND_PERSONAL" || type === "SEND_BROADCAST") {
      if (fileData) {
        const fileBuffer = Buffer.from(fileData, "base64");
        result = await sendMediaMessageDirect(phone, fileBuffer, fileType, fileName, message);
      } else {
        result = await sendTextMessage(phone, message);
      }
    } else if (type === "SEND_REMINDER") {
      result = await sendTemplateMessage(phone, templateName, variables);
    } else if (type === "SEND_RECEIPT") {
      // Decode the base64 pdfBuffer
      const pdfBuffer = Buffer.from(pdfBufferBase64, "base64");
      result = await sendPDFReceiptDirect(phone, pdfBuffer, filename, caption);
    } else {
      throw new Error(`Unknown job type: ${type}`);
    }

    if (!result.success) {
      throw new Error(result.error || "Failed to send message via Meta API");
    }

    // On success: update database record
    if (messageRecordId) {
      await db
        .update(whatsappMessages)
        .set({
          status: "SENT",
          waMessageId: result.waMessageId,
          sentAt: Date.now(),
        })
        .where(eq(whatsappMessages.id, messageRecordId));
    }

    return { success: true, waMessageId: result.waMessageId };
  } catch (error) {
    console.error(`Job ${job.id} (Type: ${type}, Recipient: ${phone}) failed:`, error.message);
    
    // Update DB status if it's the final attempt
    if (messageRecordId) {
      if (job.attemptsMade + 1 >= job.opts.attempts) {
        await db
          .update(whatsappMessages)
          .set({
            status: "FAILED",
            errorReason: error.message,
          })
          .where(eq(whatsappMessages.id, messageRecordId));
      } else {
        await db
          .update(whatsappMessages)
          .set({
            errorReason: `Attempt ${job.attemptsMade + 1} failed: ${error.message}`,
          })
          .where(eq(whatsappMessages.id, messageRecordId));
      }
    }

    throw error; // Re-throw for Bull's retry mechanism
  }
});
