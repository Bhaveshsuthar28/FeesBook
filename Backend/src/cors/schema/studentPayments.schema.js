import {
  integer,
  sqliteTable,
  text,
  index,
} from "drizzle-orm/sqlite-core";

export const studentPaymentsTable =
  sqliteTable(
    "student_payments",
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

      studentFeeId:
        text("student_fee_id")
          .notNull(),

      feeTypeId:
        text("fee_type_id")
          .notNull(),

      amount:
        integer("amount")
          .notNull(),

      paymentMode:
        text("payment_mode")
          .default("Cash"),

      receiptNo:
        text("receipt_no"),

      receiptSequence:
        integer("receipt_sequence"),

      receiptAcademicYear:
        text("receipt_academic_year"),

      paidAt:
        integer("paid_at")
          .notNull(),

      note:
        text("note"),

      remark:
        text("remark"),

      transactionRef:
        text("transaction_ref"),

      receiptSent:
        integer("receipt_sent", { mode: "boolean" })
          .default(false),

      receiptSentAt:
        integer("receipt_sent_at"),

      createdAt:
        integer("created_at")
          .notNull(),
    },
    (table) => ({
      schoolPaidIdx: index("idx_student_payments_school_paid").on(table.schoolId, table.paidAt),
      studentIdx: index("idx_student_payments_student").on(table.studentId),
      studentFeeIdx: index("idx_student_payments_student_fee").on(table.studentFeeId),
    })
  );
