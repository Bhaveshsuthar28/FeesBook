import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const sectionsTable =
  sqliteTable(
    "sections",

    {
      id: text("id")
        .primaryKey(),

      schoolId: text(
        "school_id"
      ).notNull(),

      classId: text(
        "class_id"
      ).notNull(),

      name: text("name")
        .notNull(),

      isArchived: integer(
        "is_archived",
        {
          mode: "boolean",
        }
      )
        .notNull()
        .default(false),

      createdAt: integer(
        "created_at",
        {
          mode: "timestamp_ms",
        }
      ).$defaultFn(
        () => new Date()
      ),
    },

    (table) => ({
      uniqueSection:
        uniqueIndex(
          "unique_section_idx"
        ).on(
          table.classId,
          table.name
        ),
    })
  );