import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const feeTypesTable =
  sqliteTable(
    "fee_types",

    {
      id: text("id")
        .primaryKey(),

      schoolId: text(
        "school_id"
      ).notNull(),

      name: text("name")
        .notNull(),

      defaultAmount: integer(
        "default_amount"
      ).notNull(),

      frequency: text("frequency")
        .default("Yearly"),

      isOptional: integer(
        "is_optional",
        {
          mode: "boolean",
        }
      )
        .notNull()
        .default(false),

      isArchived: integer(
        "is_archived",
        {
          mode: "boolean",
        }
      )
        .notNull()
        .default(false),
    },

    (table) => ({
      uniqueFeeName:
        uniqueIndex(
          "unique_fee_name_idx"
        ).on(
          table.schoolId,
          table.name
        ),
    })
  );
