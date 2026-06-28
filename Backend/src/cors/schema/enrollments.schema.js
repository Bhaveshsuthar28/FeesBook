// src/cors/schema/enrollments.schema.js

import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";

export const enrollmentsTable = sqliteTable(
  "enrollments",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id").notNull(),
    studentId: text("student_id").notNull(),
    academicYear: text("academic_year").notNull(),
    classId: text("class_id").notNull(),
    sectionId: text("section_id").notNull(),
    rollNumber: integer("roll_number"),
    admissionType: text("admission_type")
      .notNull()
      .default("new"), // "new" | "promoted" | "retained"
    status: text("status")
      .notNull()
      .default("active"), // "active" | "promoted" | "alumni" | "left"
    promotedFrom: text("promoted_from"), // previous enrollment id
    note: text("note"),
    createdAt: integer("created_at").notNull(),
  },
  (table) => ({
    uniqueSchoolStudentYear: uniqueIndex("unique_school_student_year_idx").on(
      table.schoolId,
      table.studentId,
      table.academicYear
    ),
    schoolYearClassSection: index("school_year_class_section_idx").on(
      table.schoolId,
      table.academicYear,
      table.classId,
      table.sectionId
    ),
    schoolStudent: index("school_student_idx").on(
      table.schoolId,
      table.studentId
    ),
    studentIdIdx: index("idx_enrollments_student_id").on(table.studentId),
    classYearIdx: index("idx_enrollments_class_year").on(table.classId, table.academicYear),
    schoolYearIdx: index("idx_enrollments_school_year").on(table.schoolId, table.academicYear),
    statusIdx: index("idx_enrollments_status").on(table.schoolId, table.status, table.academicYear),
  })
);
