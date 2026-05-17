import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const classesTable = sqliteTable(
  "classes",
  {
    id: text("id").primaryKey(),

    schoolId: text("school_id").notNull(),

    name: text("name").notNull(),

    sequence: integer("sequence").notNull(),

    academicYear: text("academic_year").notNull(),

    status: text("status")
      .notNull()
      .default("active"),

    isArchived: integer("is_archived", {
      mode: "boolean",
    })
      .notNull()
      .default(false),

    createdAt: integer("created_at", {
      mode: "timestamp_ms",
    }).$defaultFn(() => new Date()),
  },

  (table) => ({
    uniqueSequence: uniqueIndex(
      "unique_sequence_idx"
    ).on(
      table.schoolId,
      table.academicYear,
      table.sequence
    ),

    uniqueClassName: uniqueIndex(
      "unique_class_name_idx"
    ).on(
      table.schoolId,
      table.academicYear,
      table.name
    ),
  })
);