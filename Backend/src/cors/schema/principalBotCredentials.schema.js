import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

export const principalBotCredentialsTable = sqliteTable(
  "principal_bot_credentials",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => randomUUID()),

    schoolId: text("school_id")
      .notNull(),

    activationCommand: text("activation_command")
      .notNull(),

    passwordHash: text("password_hash")
      .notNull(),

    phoneNumber: text("phone_number"),

    failedAttempts: integer("failed_attempts")
      .default(0),

    lockedUntil: text("locked_until"),

    isActive: integer("is_active", {
      mode: "boolean",
    })
      .notNull()
      .default(false),

    createdAt: text("created_at")
      .default(sql`(CURRENT_TIMESTAMP)`),

    updatedAt: text("updated_at")
      .default(sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    idxActivationCommand: uniqueIndex("idx_activation_command").on(
      table.activationCommand
    ),
    idxPrincipalBotSchool: uniqueIndex("idx_principal_bot_school").on(
      table.schoolId
    ),
  })
);

export const principalBotCredentials = principalBotCredentialsTable;
