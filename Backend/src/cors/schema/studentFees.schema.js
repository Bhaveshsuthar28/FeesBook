// src/cors/schema/studentFees.schema.js

import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const studentFeesTable =
  sqliteTable(
    "student_fees",
    {

      id:
        text("id")
          .primaryKey(),

      schoolId:
        text("school_id")
          .notNull(),

      studentId:
        text("student_id")
          .notNull(),

      feeTypeId:
        text("fee_type_id")
          .notNull(),

      amount:
        integer("amount")
          .notNull(),

      paidAmount:
        integer("paid_amount")
          .default(0),

      dueAmount:
        integer("due_amount")
          .notNull(),

      status:
        text("status")
          .default("pending"),

      classId:
        text("class_id"),

      academicYear:
        text("academic_year"),

      createdAt:
        integer("created_at")
          .notNull(),
    }
  );