import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const receiptCountersTable = sqliteTable(
  "receipt_counters",
  {
    id: text("id").primaryKey(),
    schoolId: text("school_id").notNull(),
    academicYear: text("academic_year").notNull(),
    lastSequence: integer("last_sequence").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => ({
    uniqueReceiptCounterIdx: uniqueIndex("unique_receipt_counter_idx").on(
      table.schoolId,
      table.academicYear
    ),
  })
);
