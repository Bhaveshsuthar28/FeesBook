import crypto from "crypto";
import { jsPDF } from "jspdf";
import {
  and,
  eq,
} from "drizzle-orm";

import {
  db,
  sqlClient,
} from "../../cors/database/DB.Connect.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  studentFeeConcessionsTable,
} from "../../cors/schema/studentFeeConcession.schema.js";

import {
  getActiveAcademicYearService,
  getSchoolProfileService,
} from "../settings/settings.service.js";

import {
  upsertStudentFeeConcessionSchema,
} from "./students.validation.js";

import {
  getStudentDetailService,
} from "./students.service.js";

const createStudentError =
  ({
    statusCode,
    code,
    message,
  }) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    return error;
  };

const formatMoney =
  (amount) =>
    Number(amount || 0)
      .toLocaleString(
        "en-IN",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }
      );

const formatReceiptDate =
  (value) => {
    if (!value) {
      return "-";
    }

    return new Date(Number(value))
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );
  };

const makeFeeStatus =
  ({
    amount,
    paidAmount,
  }) => {
    const due =
      Number(amount || 0) -
      Number(paidAmount || 0);

    if (due <= 0) {
      return "paid";
    }

    if (Number(paidAmount || 0) > 0) {
      return "partial";
    }

    return "pending";
  };

const getStudentForSchool =
  async ({
    schoolId,
    studentId,
  }) => {
    const [student] =
      await db
        .select()
        .from(studentsTable)
        .where(
          and(
            eq(
              studentsTable.id,
              studentId
            ),
            eq(
              studentsTable.schoolId,
              schoolId
            )
          )
        );

    if (!student) {
      throw createStudentError({
        statusCode: 404,
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    }

    return student;
  };

const makeSchoolCode =
  (schoolName) => {
    const words = String(schoolName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const code = words
      .map((word) => word[0])
      .join("")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 8);

    return code || "FB";
  };

const numberToWords =
  (value) => {
    const number = Math.floor(Number(value || 0));

    if (number === 0) {
      return "Rupees Zero Only";
    }

    return `Rupees ${number.toLocaleString("en-IN")} Only`;
  };

const getImageDataUrl =
  async (url) => {
    if (!url) {
      return null;
    }

    try {
      const response = await fetch(url);

      if (!response.ok) {
        return null;
      }

      const buffer =
        Buffer.from(
          await response.arrayBuffer()
        );
      const contentType =
        response.headers.get(
          "content-type"
        ) || "image/png";
      const format = contentType.includes(
        "jpeg"
      )
        ? "JPEG"
        : "PNG";

      return {
        dataUrl: `data:${contentType};base64,${buffer.toString("base64")}`,
        format,
      };
    } catch {
      return null;
    }
  };

const getCalendarYear =
  () => {
    const parts =
      new Intl.DateTimeFormat(
        "en-IN",
        {
          timeZone:
            "Asia/Kolkata",
          year: "numeric",
        }
      ).formatToParts(
        new Date()
      );

    const yearPart =
      parts.find(
        (part) =>
          part.type === "year"
      );

    return (
      yearPart?.value ||
      String(
        new Date().getFullYear()
      )
    );
  };

const getConcessionReceiptMeta =
  async ({
    schoolId,
    schoolName,
  }) => {
    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const prefix =
      String(
        profile.receiptPrefix || ""
      )
        .trim() ||
      makeSchoolCode(schoolName);
    const calendarYear =
      getCalendarYear();
    const counterId = `${schoolId}:${calendarYear}:CON`;
    const result =
      await sqlClient.execute({
        sql: `INSERT INTO receipt_counters (id, school_id, academic_year, last_sequence, updated_at)
           VALUES (?, ?, ?, 1, ?)
           ON CONFLICT(id)
           DO UPDATE SET
             last_sequence = receipt_counters.last_sequence + 1,
             updated_at = excluded.updated_at
           RETURNING last_sequence`,
        args: [
          counterId,
          schoolId,
          `${calendarYear}-CON`,
          Date.now(),
        ],
      });
    const nextSequence =
      Number(
        result.rows[0]?.last_sequence || 1
      );
    const receiptNo = `${prefix}/${calendarYear}/C${String(nextSequence).padStart(6, "0")}`;

    return {
      receiptNo,
      receiptSequence: nextSequence,
      receiptAcademicYear: calendarYear,
    };
  };

export const ensureFeeConcessionColumns =
  async () => {
    const feeColumns =
      await sqlClient.execute(
        "PRAGMA table_info(student_fees)"
      );
    const existingFeeColumns =
      new Set(
        feeColumns.rows.map((row) =>
          String(row.name)
        )
      );

    const feeAdditions = [
      [
        "gross_amount",
        "ALTER TABLE student_fees ADD gross_amount integer",
      ],
      [
        "concession_amount",
        "ALTER TABLE student_fees ADD concession_amount integer DEFAULT 0",
      ],
    ];

    for (const [
      column,
      statement,
    ] of feeAdditions) {
      if (
        !existingFeeColumns.has(
          column
        )
      ) {
        await sqlClient.execute(
          statement
        );
      }
    }

    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS student_fee_concessions (
        id text PRIMARY KEY,
        school_id text NOT NULL,
        student_id text NOT NULL,
        academic_year text NOT NULL,
        concession_type text NOT NULL,
        basis text NOT NULL,
        basis_value integer NOT NULL,
        gross_amount integer NOT NULL,
        concession_amount integer NOT NULL,
        net_amount integer NOT NULL,
        remark text,
        receipt_no text,
        receipt_sequence integer,
        created_at integer NOT NULL,
        updated_at integer
      )
    `);

    await sqlClient.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_student_fee_concession_year_idx
      ON student_fee_concessions (school_id, student_id, academic_year)
    `);
  };

const getConcessionForStudentYear =
  async ({
    schoolId,
    studentId,
    academicYear,
  }) => {
    const [row] =
      await db
        .select()
        .from(
          studentFeeConcessionsTable
        )
        .where(
          and(
            eq(
              studentFeeConcessionsTable.schoolId,
              schoolId
            ),
            eq(
              studentFeeConcessionsTable.studentId,
              studentId
            ),
            eq(
              studentFeeConcessionsTable.academicYear,
              academicYear
            )
          )
        );

    return row || null;
  };

const applyConcessionToFees =
  async ({
    schoolId,
    studentId,
    concessionTotal,
  }) => {
    const fees =
      await db
        .select()
        .from(studentFeesTable)
        .where(
          and(
            eq(
              studentFeesTable.schoolId,
              schoolId
            ),
            eq(
              studentFeesTable.studentId,
              studentId
            )
          )
        );

    if (fees.length === 0) {
      throw createStudentError({
        statusCode: 400,
        code: "NO_FEES",
        message:
          "No fee records found for this student",
      });
    }

    const grossTotal =
      fees.reduce(
        (sum, fee) => {
          const gross =
            Number(
              fee.grossAmount ??
                fee.amount ??
                0
            );

          return sum + gross;
        },
        0
      );

    if (grossTotal <= 0) {
      throw createStudentError({
        statusCode: 400,
        code: "NO_GROSS_FEES",
        message:
          "Student has no assignable fee amount",
      });
    }

    const cappedConcession =
      Math.min(
        Math.max(
          0,
          Math.round(
            concessionTotal
          )
        ),
        grossTotal
      );

    let distributed = 0;

    for (
      let index = 0;
      index < fees.length;
      index += 1
    ) {
      const fee = fees[index];
      const gross =
        Number(
          fee.grossAmount ??
            fee.amount ??
            0
        );
      const share =
        gross / grossTotal;
      const lineConcession =
        index === fees.length - 1
          ? cappedConcession -
            distributed
          : Math.round(
              cappedConcession *
                share
            );

      distributed +=
        lineConcession;

      const netAmount =
        Math.max(
          0,
          gross - lineConcession
        );
      const paidAmount =
        Math.min(
          netAmount,
          Number(
            fee.paidAmount || 0
          )
        );
      const dueAmount =
        netAmount - paidAmount;

      await db
        .update(studentFeesTable)
        .set({
          grossAmount: gross,
          concessionAmount:
            lineConcession,
          amount: netAmount,
          paidAmount,
          dueAmount,
          status:
            makeFeeStatus({
              amount: netAmount,
              paidAmount,
            }),
        })
        .where(
          and(
            eq(
              studentFeesTable.id,
              fee.id
            ),
            eq(
              studentFeesTable.schoolId,
              schoolId
            )
          )
        );
    }

    return {
      grossTotal,
      concessionAmount:
        cappedConcession,
      netAmount:
        grossTotal -
        cappedConcession,
    };
  };

const restoreFeesFromConcession =
  async ({
    schoolId,
    studentId,
  }) => {
    const fees =
      await db
        .select()
        .from(studentFeesTable)
        .where(
          and(
            eq(
              studentFeesTable.schoolId,
              schoolId
            ),
            eq(
              studentFeesTable.studentId,
              studentId
            )
          )
        );

    for (const fee of fees) {
      const gross =
        Number(
          fee.grossAmount ??
            fee.amount ??
            0
        );
      const paidAmount =
        Math.min(
          gross,
          Number(
            fee.paidAmount || 0
          )
        );
      const dueAmount =
        gross - paidAmount;

      await db
        .update(studentFeesTable)
        .set({
          grossAmount: null,
          concessionAmount: 0,
          amount: gross,
          paidAmount,
          dueAmount,
          status:
            makeFeeStatus({
              amount: gross,
              paidAmount,
            }),
        })
        .where(
          and(
            eq(
              studentFeesTable.id,
              fee.id
            ),
            eq(
              studentFeesTable.schoolId,
              schoolId
            )
          )
        );
    }
  };

export const getStudentFeeConcessionService =
  async ({
    schoolId,
    studentId,
    academicYear,
  }) => {
    await getStudentForSchool({
      schoolId,
      studentId,
    });

    const year =
      academicYear ||
      (await getActiveAcademicYearService({
        schoolId,
      }));

    const concession =
      await getConcessionForStudentYear({
        schoolId,
        studentId,
        academicYear: year,
      });

    return {
      concession,
      academicYear: year,
    };
  };

export const upsertStudentFeeConcessionService =
  async ({
    schoolId,
    studentId,
    data,
  }) => {
    const parsed =
      upsertStudentFeeConcessionSchema.parse(
        data
      );

    await getStudentForSchool({
      schoolId,
      studentId,
    });

    const academicYear =
      parsed.academicYear ||
      (await getActiveAcademicYearService({
        schoolId,
      }));

    const fees =
      await db
        .select()
        .from(studentFeesTable)
        .where(
          and(
            eq(
              studentFeesTable.schoolId,
              schoolId
            ),
            eq(
              studentFeesTable.studentId,
              studentId
            )
          )
        );

    const grossTotal =
      fees.reduce(
        (sum, fee) => {
          const gross =
            Number(
              fee.grossAmount ??
                fee.amount ??
                0
            );

          return sum + gross;
        },
        0
      );

    if (grossTotal <= 0) {
      throw createStudentError({
        statusCode: 400,
        code: "NO_FEES",
        message:
          "Assign fees to this student before applying a concession",
      });
    }

    if (parsed.basis === "percentage" && Number(parsed.basisValue) > 100) {
      throw createStudentError({
        statusCode: 400,
        code: "INVALID_CONCESSION_PERCENTAGE",
        message: "Concession percentage cannot exceed 100%",
      });
    }

    const paidTotal = fees.reduce(
      (sum, fee) => sum + Number(fee.paidAmount || 0),
      0
    );
    const maxConcession = grossTotal - paidTotal;

    let concessionTotal = 0;

    if (parsed.basis === "percentage") {
      concessionTotal =
        Math.round(
          (grossTotal *
            Number(
              parsed.basisValue
            )) /
            100
        );
    } else {
      concessionTotal =
        Number(
          parsed.basisValue
        );
    }

    if (concessionTotal > maxConcession) {
      throw createStudentError({
        statusCode: 400,
        code: "CONCESSION_EXCEEDS_REMAINING",
        message: `Concession amount (Rs ${concessionTotal}) cannot exceed the remaining fee balance (Rs ${maxConcession})`,
      });
    }

    const existing =
      await getConcessionForStudentYear({
        schoolId,
        studentId,
        academicYear,
      });

    if (existing) {
      await restoreFeesFromConcession({
        schoolId,
        studentId,
      });
    }

    const totals =
      await applyConcessionToFees({
        schoolId,
        studentId,
        concessionTotal,
      });

    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const receiptMeta =
      await getConcessionReceiptMeta({
        schoolId,
        schoolName:
          profile.schoolName,
      });

    const now = Date.now();
    const payload = {
      concessionType:
        parsed.concessionType,
      basis: parsed.basis,
      basisValue:
        Number(
          parsed.basisValue
        ),
      grossAmount:
        totals.grossTotal,
      concessionAmount:
        totals.concessionAmount,
      netAmount:
        totals.netAmount,
      remark:
        parsed.remark || null,
      receiptNo:
        receiptMeta.receiptNo,
      receiptSequence:
        receiptMeta.receiptSequence,
      updatedAt: now,
    };

    if (existing) {
      await db
        .update(
          studentFeeConcessionsTable
        )
        .set(payload)
        .where(
          and(
            eq(
              studentFeeConcessionsTable.id,
              existing.id
            ),
            eq(
              studentFeeConcessionsTable.schoolId,
              schoolId
            )
          )
        );

      const detail =
        await getStudentDetailService({
          schoolId,
          studentId,
        });

      return {
        ...detail,
        concession: {
          ...existing,
          ...payload,
          academicYear,
        },
        receipt: {
          concessionId:
            existing.id,
          ...receiptMeta,
        },
      };
    }

    const concessionId =
      crypto.randomUUID();

    await db
      .insert(
        studentFeeConcessionsTable
      )
      .values({
        id: concessionId,
        schoolId,
        studentId,
        academicYear,
        ...payload,
        createdAt: now,
      });

    const detail =
      await getStudentDetailService({
        schoolId,
        studentId,
      });

    return {
      ...detail,
      concession: {
        id: concessionId,
        schoolId,
        studentId,
        academicYear,
        ...payload,
        createdAt: now,
      },
      receipt: {
        concessionId,
        ...receiptMeta,
      },
    };
  };

export const removeStudentFeeConcessionService =
  async ({
    schoolId,
    studentId,
    concessionId,
  }) => {
    await getStudentForSchool({
      schoolId,
      studentId,
    });

    const [concession] =
      await db
        .select()
        .from(
          studentFeeConcessionsTable
        )
        .where(
          and(
            eq(
              studentFeeConcessionsTable.id,
              concessionId
            ),
            eq(
              studentFeeConcessionsTable.studentId,
              studentId
            ),
            eq(
              studentFeeConcessionsTable.schoolId,
              schoolId
            )
          )
        );

    if (!concession) {
      throw createStudentError({
        statusCode: 404,
        code: "CONCESSION_NOT_FOUND",
        message:
          "Fee concession not found",
      });
    }

    await restoreFeesFromConcession({
      schoolId,
      studentId,
    });

    await db
      .delete(
        studentFeeConcessionsTable
      )
      .where(
        eq(
          studentFeeConcessionsTable.id,
          concessionId
        )
      );

    return await getStudentDetailService({
      schoolId,
      studentId,
    });
  };

export const getStudentFeeConcessionReceiptPdfService =
  async ({
    schoolId,
    studentId,
    concessionId,
  }) => {
    const [concession] =
      await db
        .select()
        .from(
          studentFeeConcessionsTable
        )
        .where(
          and(
            eq(
              studentFeeConcessionsTable.id,
              concessionId
            ),
            eq(
              studentFeeConcessionsTable.studentId,
              studentId
            ),
            eq(
              studentFeeConcessionsTable.schoolId,
              schoolId
            )
          )
        );

    if (!concession) {
      throw createStudentError({
        statusCode: 404,
        code: "CONCESSION_NOT_FOUND",
        message:
          "Fee concession not found",
      });
    }

    const detail =
      await getStudentDetailService({
        schoolId,
        studentId,
      });
    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const [logoData, stampData, signatureData] =
      await Promise.all([
        getImageDataUrl(profile.logoUrl),
        getImageDataUrl(profile.stampUrl),
        getImageDataUrl(
          profile.principalSignatureUrl
        ),
      ]);

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const pageLeft = 15;
    const pageRight = 195;
    const pageWidth =
      pageRight - pageLeft;
    const headerTop = 15;
    const logoSize = 20;

    if (logoData) {
      doc.addImage(
        logoData.dataUrl,
        logoData.format,
        pageLeft,
        headerTop,
        logoSize,
        logoSize
      );
    }

    const schoolInfoX =
      pageLeft + logoSize + 8;
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      profile.schoolName ||
        "School Name",
      schoolInfoX,
      headerTop + 4
    );

    const receiptBoxX =
      pageRight - 58;
    doc.setDrawColor(200, 210, 225);
    doc.rect(
      receiptBoxX,
      headerTop,
      58,
      28
    );
    doc.setFontSize(10);
    doc.text(
      "FEE CONCESSION",
      receiptBoxX + 29,
      headerTop + 6,
      { align: "center" }
    );
    doc.text(
      "RECEIPT",
      receiptBoxX + 29,
      headerTop + 11,
      { align: "center" }
    );
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      concession.receiptNo ||
        concession.id,
      receiptBoxX + 4,
      headerTop + 18
    );
    doc.text(
      formatReceiptDate(
        concession.updatedAt ||
          concession.createdAt
      ),
      receiptBoxX + 4,
      headerTop + 24
    );

    let y = headerTop + 36;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      "STUDENT DETAILS",
      pageLeft,
      y
    );
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const studentLines = [
      [
        "Name",
        detail.student.fullName,
      ],
      [
        "Admission No.",
        detail.student.schoolRegisterNo,
      ],
      [
        "Class",
        `${detail.class?.name || "-"} ${detail.section?.name || ""}`,
      ],
      [
        "Academic Year",
        concession.academicYear,
      ],
      [
        "Concession Type",
        concession.concessionType,
      ],
      [
        "Basis",
        concession.basis ===
        "percentage"
          ? `${concession.basisValue}%`
          : `₹${formatMoney(concession.basisValue)} fixed`,
      ],
    ];

    studentLines.forEach(
      ([label, value]) => {
        doc.text(
          `${label}: ${value || "-"}`,
          pageLeft,
          y
        );
        y += 5;
      }
    );

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text(
      "FEE BREAKDOWN",
      pageLeft,
      y
    );
    y += 6;

    const fees = detail.fees || [];
    fees.forEach((fee, index) => {
      const gross =
        Number(
          fee.grossAmount ??
            fee.amount ??
            0
        );
      const lineConcession =
        Number(
          fee.concessionAmount || 0
        );
      const net =
        Number(fee.amount || 0);

      doc.setFont(
        "helvetica",
        "normal"
      );
      doc.setFontSize(8);
      doc.text(
        `${index + 1}. ${fee.feeTypeName || "Fee"}`,
        pageLeft,
        y
      );
      doc.text(
        `Gross ₹${formatMoney(gross)} | Concession ₹${formatMoney(lineConcession)} | Net ₹${formatMoney(net)}`,
        pageLeft + 4,
        y + 4
      );
      y += 10;
    });

    y += 2;
    doc.setFillColor(249, 115, 22);
    doc.setTextColor(255, 255, 255);
    doc.rect(
      pageLeft,
      y,
      pageWidth,
      10,
      "F"
    );
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(
      `Total Concession: ₹${formatMoney(concession.concessionAmount)}`,
      pageLeft + 4,
      y + 6
    );
    y += 14;

    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(
      "Summary",
      pageLeft,
      y
    );
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gross Total: ₹${formatMoney(concession.grossAmount)}`,
      pageLeft,
      y
    );
    y += 5;
    doc.text(
      `Concession: ₹${formatMoney(concession.concessionAmount)}`,
      pageLeft,
      y
    );
    y += 5;
    doc.text(
      `Net Payable: ₹${formatMoney(concession.netAmount)}`,
      pageLeft,
      y
    );
    y += 5;
    doc.text(
      `In words: ${numberToWords(concession.concessionAmount)}`,
      pageLeft,
      y
    );

    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setTextColor(185, 28, 28);
    doc.text(
      "Remark:",
      pageLeft,
      y
    );
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    const remarkText =
      concession.remark
        ? `Fee Concession — ${concession.remark}`
        : "Fee Concession — Approved scholarship / concession for this academic year.";
    doc.text(
      remarkText,
      pageLeft,
      y + 5,
      {
        maxWidth: pageWidth,
      }
    );

    const stampY = 250;
    if (stampData) {
      doc.addImage(
        stampData.dataUrl,
        stampData.format,
        pageLeft + 15,
        stampY,
        20,
        20
      );
    }
    if (signatureData) {
      doc.addImage(
        signatureData.dataUrl,
        signatureData.format,
        pageRight - 45,
        stampY,
        30,
        12
      );
    }

    const buffer =
      Buffer.from(
        doc.output("arraybuffer")
      );

    return {
      buffer,
      fileName: `fee-concession-${concession.receiptNo || concessionId}.pdf`,
    };
  };
