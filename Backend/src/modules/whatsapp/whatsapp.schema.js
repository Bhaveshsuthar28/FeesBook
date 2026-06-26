import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { randomUUID } from "node:crypto";

// whatsapp_messages — log every message sent
export const whatsappMessages = sqliteTable("whatsapp_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),

  schoolId: text("school_id"),

  studentId: text("student_id"),

  recipientPhone: text("recipient_phone").notNull(),

  messageType: text("message_type").notNull(), 
  // 'REMINDER' | 'RECEIPT' | 'BROADCAST' | 'PERSONAL' | 'BOT'

  status: text("status").default("PENDING"),
  // 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED'

  waMessageId: text("wa_message_id"),

  errorReason: text("error_reason"),

  sentAt: integer("sent_at"),

  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// bot_sessions — principal bot state machine
export const botSessions = sqliteTable("bot_sessions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),

  phone: text("phone").notNull().unique(),

  schoolId: text("school_id"),

  currentStep: text("current_step").default("AUTH"),

  context: text("context").$defaultFn(() => "{}"), // JSON string

  authenticated: integer("authenticated", { mode: "boolean" }).default(false),

  expiresAt: integer("expires_at"),

  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// principal_bot_auth — principal credentials
export const principalBotAuth = sqliteTable("principal_bot_auth", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),

  schoolId: text("school_id"),

  phone: text("phone").notNull(),

  secretCode: text("secret_code").notNull(), // bcrypt hashed

  failedAttempts: integer("failed_attempts").default(0),

  blockedUntil: integer("blocked_until"),

  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});

// whatsapp_settings — whatsapp reminders config
export const whatsappSettings = sqliteTable("whatsapp_settings", {
  schoolId: text("school_id")
    .primaryKey(),

  reminderIntervalDays: integer("reminder_interval_days").default(90),

  reminderTime: text("reminder_time").default("09:00"),

  autoSendEnabled: integer("auto_send_enabled", { mode: "boolean" }).default(false),

  templates: text("templates").default("[]"), // JSON list of templates

  createdAt: integer("created_at").$defaultFn(() => Date.now()),
});
