// src/cors/schema/students.schema.js

import {
  sqliteTable,
  text,
  integer,
} from "drizzle-orm/sqlite-core";

export const studentsTable =
  sqliteTable(
    "students",
    {

      id:
        text("id")
          .primaryKey(),

      schoolId:
        text("school_id")
          .notNull(),

      classId:
        text("class_id")
          .notNull(),

      sectionId:
        text("section_id")
          .notNull(),

      fullName:
        text("full_name")
          .notNull(),

      rollNumber:
        integer("roll_number")
          .notNull(),

      gender:
        text("gender"),

      phone:
        text("phone"),

      fatherName:
        text("father_name"),

      motherName:
        text("mother_name"),

      status:
        text("status")
          .default("active"),

      createdAt:
        integer("created_at")
          .notNull(),
    }
  );