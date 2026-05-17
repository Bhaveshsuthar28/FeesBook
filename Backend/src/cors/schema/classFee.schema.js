import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";


export const classFeesTable =
  sqliteTable(
    "class_fees",

    {
      id: text("id")
        .primaryKey(),

      schoolId: text(
        "school_id"
      ).notNull(),

      classId: text(
        "class_id"
      ).notNull(),

      feeTypeId: text(
        "fee_type_id"
      ).notNull(),

      amount: integer(
        "amount"
      ).notNull(),

      isDefault: integer(
        "is_default",
        {
          mode: "boolean",
        }
      )
        .notNull()
        .default(true),

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
      uniqueClassFee:
        uniqueIndex(
          "unique_class_fee_idx"
        ).on(
          table.classId,
          table.feeTypeId
        ),
    })
  );