import {
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const studentFeeConcessionsTable =
  sqliteTable(
    "student_fee_concessions",
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

      academicYear:
        text("academic_year")
          .notNull(),

      concessionType:
        text("concession_type")
          .notNull(),

      basis:
        text("basis")
          .notNull(),

      basisValue:
        integer("basis_value")
          .notNull(),

      grossAmount:
        integer("gross_amount")
          .notNull(),

      concessionAmount:
        integer("concession_amount")
          .notNull(),

      netAmount:
        integer("net_amount")
          .notNull(),

      remark:
        text("remark"),

      receiptNo:
        text("receipt_no"),

      receiptSequence:
        integer("receipt_sequence"),

      createdAt:
        integer("created_at")
          .notNull(),

      updatedAt:
        integer("updated_at"),
    }
  );
