// src/cors/schema/studentFees.schema.js

import {
  sqliteTable,
  text,
  integer,
  index,
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

      lastPaidDate:
        integer("last_paid_date"),

      nextReminderDate:
        integer("next_reminder_date"),

      createdAt:
        integer("created_at")
          .notNull(),
    },
    (table) => ({
      studentIdIdx: index("idx_student_fees_student_id").on(table.studentId),
      schoolAcademicIdx: index("idx_student_fees_school_academic").on(table.schoolId, table.academicYear),
      schoolStudentIdx: index("idx_student_fees_school_student").on(table.schoolId, table.studentId),
      statusIdx: index("idx_student_fees_status").on(table.schoolId, table.status),
    })
  );