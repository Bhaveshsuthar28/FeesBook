import crypto from "crypto";
import XLSX from "xlsx";
import {
  db,
  sqlClient,
}
  from "../../cors/database/DB.Connect.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  enrollmentsTable,
} from "../../cors/schema/enrollments.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  studentPaymentsTable,
} from "../../cors/schema/studentPayments.schema.js";

import {
  studentFeeConcessionsTable,
} from "../../cors/schema/studentFeeConcession.schema.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import {
  feeTypesTable,
} from "../../cors/schema/feesType.schema.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

import { deleteCache, deleteCachePattern } from "../../cors/cache/cache.service.js";
import { keys } from "../../cors/cache/cache.keys.js";

import {
  getClassCatalog,
  getCurrentAcademicYear,
  getPreviousAcademicYear,
} from "../classes/class.catalog.js";

import {
  and,
  asc,
  desc,
  eq,
  sql,
  or,
  isNull,
  inArray,
} from "drizzle-orm";

import {
  env,
} from "../../cors/config/env.js";

import {
  getActiveAcademicYearService,
  getSchoolProfileService,
  setActiveAcademicYearService,
} from "../settings/settings.service.js";

import {
  classFeesTable,
} from "../../cors/schema/classFee.schema.js";

import {
  allocateClassFeesService,
  assertClassHasFeeStructure,
} from "../fees/fees.service.js";

import {
  buildReceiptFileName,
} from "./receipt/receiptFormatters.js";
import {
  buildPaymentReceiptViewModel,
} from "./receipt/receiptViewModel.js";
import {
  generateReceiptPdf,
} from "./receipt/generateReceiptPdf.js";
import {
  renderReceiptHtml,
} from "./receipt/receiptTemplate.js";
import {
  createStudentSchema,
  bulkPromoteStudentsSchema,
  dobRegex,
  recordStudentPaymentSchema,
  studentLifecycleSchema,
  updateStudentFeeSchema,
  updateStudentSchema,
} from "./students.validation.js";

const createStudentError =
  ({
    statusCode,
    code,
    message,
    details = {},
  }) => {
    const error =
      new Error(message);

    error.statusCode =
      statusCode;
    error.code = code;
    error.details = details;

    return error;
  };

const clean =
  (value) =>
    value === undefined ||
    value === null
      ? ""
      : String(value).trim();

const normalizeOptional =
  (value) => {
    const normalized =
      clean(value);

    return normalized || null;
  };

const normalizeDateValue =
  (value) => {
    if (value instanceof Date) {
      const day =
        String(value.getDate())
          .padStart(2, "0");
      const month =
        String(value.getMonth() + 1)
          .padStart(2, "0");
      const year =
        value.getFullYear();

      return `${day}/${month}/${year}`;
    }

    if (typeof value === "number") {
      const excelEpoch =
        new Date(
          Date.UTC(1899, 11, 30)
        );
      const date =
        new Date(
          excelEpoch.getTime() +
            value * 24 * 60 * 60 * 1000
        );

      return normalizeDateValue(date);
    }

    const normalized =
      clean(value);

    if (
      /^\d{4}-\d{2}-\d{2}$/.test(
        normalized
      )
    ) {
      const [
        year,
        month,
        day,
      ] =
        normalized.split("-");

      return `${day}/${month}/${year}`;
    }

    return normalized;
  };

const getRowValue =
  (row, keys) => {
    const entries =
      Object.entries(row).map(
        ([key, value]) => [
          key
            .toLowerCase()
            .replace(/[^a-z0-9]/g, ""),
          value,
        ]
      );

    const normalizedRow =
      new Map(entries);

    for (const key of keys) {
      const normalizedKey =
        key
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "");

      const value =
        normalizedRow.get(
          normalizedKey
        );

      if (
        value !== undefined &&
        value !== null &&
        String(value).trim() !== ""
      ) {
        return value;
      }
    }

    return "";
  };

const splitName =
  (fullName) => {
    const parts =
      clean(fullName)
        .split(/\s+/)
        .filter(Boolean);

    return {
      firstName:
        parts[0] || "",
      lastName:
        parts.slice(1)
          .join(" "),
    };
  };

const makeFullName =
  ({
    firstName,
    lastName,
  }) =>
    [
      clean(firstName),
      clean(lastName),
    ]
      .filter(Boolean)
      .join(" ");

const makeRollNumber =
  (schoolRegisterNo) => {
    const numeric =
      Number.parseInt(
        clean(schoolRegisterNo)
          .replace(/\D/g, ""),
        10
      );

    return Number.isFinite(numeric)
      ? numeric
      : 0;
  };

const getRollNumberBase = (className) => {
  const name = String(className).trim().toUpperCase();
  if (name === "LKG") return 100;
  if (name === "UKG") return 200;

  const streamMatch = name.match(/^(\d+)(ST|ND|RD|TH)-([A-Z]+)$/);
  if (streamMatch) {
    const grade = parseInt(streamMatch[1], 10);
    const stream = streamMatch[3];
    const streamCodes = {
      PCM: 1,
      PCB: 2,
      PCMB: 3,
      COM: 4,
      ARTS: 5,
      AGRI: 6,
    };
    const code = streamCodes[stream] || 9;
    return (grade * 10 + code) * 1000;
  }

  const stdMatch = name.match(/^(\d+)(ST|ND|RD|TH)$/);
  if (stdMatch) {
    const grade = parseInt(stdMatch[1], 10);
    return grade * 1000;
  }

  return 1000;
};

export const reshuffleRollNumbers = async ({ schoolId, classId, sectionId }) => {
  if (!classId || !sectionId) return;

  const [classDetails] = await db
    .select({ name: classesTable.name })
    .from(classesTable)
    .where(
      and(
        eq(classesTable.id, classId),
        eq(classesTable.schoolId, schoolId)
      )
    );

  if (!classDetails) return;

  const base = getRollNumberBase(classDetails.name);

  const students = await db
    .select()
    .from(studentsTable)
    .where(
      and(
        eq(studentsTable.schoolId, schoolId),
        eq(studentsTable.classId, classId),
        eq(studentsTable.sectionId, sectionId),
        eq(studentsTable.status, "active")
      )
    );

  students.sort((a, b) => {
    const nameA = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
    const nameB = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();

    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;

    const timeA = a.createdAt || 0;
    const timeB = b.createdAt || 0;
    if (timeA !== timeB) {
      return timeA - timeB;
    }
    return String(a.id).localeCompare(String(b.id));
  });

  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const newRollNumber = base + (i + 1);

    if (student.rollNumber !== newRollNumber) {
      await db
        .update(studentsTable)
        .set({ rollNumber: newRollNumber })
        .where(eq(studentsTable.id, student.id));

      await db
        .update(enrollmentsTable)
        .set({ rollNumber: newRollNumber })
        .where(
          and(
            eq(enrollmentsTable.studentId, student.id),
            eq(enrollmentsTable.schoolId, schoolId),
            eq(enrollmentsTable.status, "active")
          )
        );
    }
  }
};

const makePaymentStatus =
  ({
    pendingFees,
    collectedFees,
    totalFees,
  }) =>
    totalFees === 0
      ? "Pending"
      : pendingFees === 0
        ? "Paid"
        : collectedFees > 0
          ? "Partial"
          : "Pending";

const makeFeeStatus =
  ({
    amount,
    paidAmount,
    academicYear,
    activeAcademicYear,
  }) => {
    const safeAmount =
      Math.max(
        0,
        Number(amount || 0)
      );
    const safePaid =
      Math.min(
        safeAmount,
        Math.max(
          0,
          Number(paidAmount || 0)
        )
      );

    if (safeAmount === safePaid) {
      return "paid";
    }

    if (academicYear && activeAcademicYear && academicYear !== activeAcademicYear) {
      return "overdue";
    }

    return safePaid > 0 ? "partial" : "pending";
  };

const getNextAcademicYear = (academicYear) => {
  const [startYear] = String(academicYear || "").split("-");
  const next = Number(startYear) + 1;
  if (!next || isNaN(next)) return getCurrentAcademicYear();
  return `${next}-${next + 1}`;
};

const isTenthClass =
  (singleClass) =>
    String(singleClass?.name || "")
      .trim()
      .toLowerCase() === "10th";

const isFinalClass =
  (singleClass) =>
    String(singleClass?.name || "")
      .trim()
      .toLowerCase()
      .startsWith("12th");

const isFinalClassForSchool = async (schoolId, academicYear, singleClass) => {
  if (!singleClass) return false;
  if (isFinalClass(singleClass)) return true;

  const activeClasses = await db
    .select({ sequence: classesTable.sequence })
    .from(classesTable)
    .where(
      and(
        eq(classesTable.schoolId, schoolId),
        eq(classesTable.academicYear, academicYear),
        eq(classesTable.isArchived, false)
      )
    );

  if (activeClasses.length === 0) {
    return false;
  }

  const maxSequence = Math.max(...activeClasses.map(c => Number(c.sequence || 0)));
  return Number(singleClass.sequence || 0) >= maxSequence;
};

const hasUpperClasses = async (schoolId, academicYear) => {
  const classes = await db
    .select({ name: classesTable.name })
    .from(classesTable)
    .where(
      and(
        eq(classesTable.schoolId, schoolId),
        eq(classesTable.academicYear, academicYear),
        eq(classesTable.isArchived, false)
      )
    );

  return classes.some((cls) => {
    const name = String(cls.name || "").trim().toLowerCase();
    return name.startsWith("11th") || name.startsWith("12th");
  });
};

const getManualPromotionGuardMessage =
  (singleClass) =>
    isTenthClass(singleClass)
      ? "10th class students must be moved manually to a selected 11th stream"
      : "Target class and section are required";

const getNextClassForPromotion =
  async ({
    schoolId,
    currentClass,
    academicYear =
      currentClass?.academicYear,
  }) => {
    if (!currentClass) {
      return null;
    }

    if (isTenthClass(currentClass)) {
      return null;
    }

    const className =
      String(currentClass.name || "");

    if (className.startsWith("11th-")) {
      const targetName =
        className.replace(
          "11th-",
          "12th-"
        );

      const [streamClass] =
        await db
          .select()
          .from(classesTable)
          .where(
            and(
              eq(
                classesTable.schoolId,
                schoolId
              ),
              eq(
                classesTable.academicYear,
                academicYear
              ),
              eq(
                classesTable.name,
                targetName
              ),
              eq(
                classesTable.isArchived,
                false
              )
            )
          );

      return streamClass || null;
    }

    const [nextClass] =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              academicYear
            ),
            eq(
              classesTable.sequence,
              Number(currentClass.sequence) + 1
            ),
            eq(
              classesTable.isArchived,
              false
            )
          )
        );

    return nextClass || null;
  };

const getFirstActiveSection =
  async ({
    schoolId,
    classId,
  }) => {
    const sections =
      await db
        .select()
        .from(sectionsTable)
        .where(
          and(
            eq(
              sectionsTable.schoolId,
              schoolId
            ),
            eq(
              sectionsTable.classId,
              classId
            ),
            eq(
              sectionsTable.isArchived,
              false
            )
          )
        )
        .orderBy(
          asc(
            sectionsTable.name
          )
        );

    return sections[0] || null;
  };

const getSectionByName =
  async ({
    schoolId,
    classId,
    name,
  }) => {
    const [section] =
      await db
        .select()
        .from(sectionsTable)
        .where(
          and(
            eq(
              sectionsTable.schoolId,
              schoolId
            ),
            eq(
              sectionsTable.classId,
              classId
            ),
            eq(
              sectionsTable.name,
              name
            ),
            eq(
              sectionsTable.isArchived,
              false
            )
          )
        );

    return section || null;
  };

const ensureAcademicYearStructure =
  async ({
    schoolId,
    fromAcademicYear,
    targetAcademicYear,
  }) => {
    const existingClasses =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              targetAcademicYear
            )
          )
        );
    const classByName =
      new Map(
        existingClasses.map(
          (item) => [
            item.name,
            item,
          ]
        )
      );

    const sourceClasses =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              fromAcademicYear
            ),
            eq(
              classesTable.isArchived,
              false
            )
          )
        );

    if (sourceClasses.length > 0) {
      for (const sourceClass of sourceClasses) {
        if (
          !classByName.has(
            sourceClass.name
          )
        ) {
          const newClass = {
            id:
              crypto.randomUUID(),
            schoolId,
            name:
              sourceClass.name,
            sequence:
              sourceClass.sequence,
            academicYear:
              targetAcademicYear,
            createdAt:
              new Date(),
          };

          await db
            .insert(classesTable)
            .values(newClass);
          classByName.set(
            newClass.name,
            newClass
          );
        }
      }
    }

    for (const sourceClass of sourceClasses) {
      const targetClass =
        classByName.get(
          sourceClass.name
        );

      if (!targetClass) {
        continue;
      }

      const sourceSections =
        await db
          .select()
          .from(sectionsTable)
          .where(
            and(
              eq(
                sectionsTable.schoolId,
                schoolId
              ),
              eq(
                sectionsTable.classId,
                sourceClass.id
              ),
              eq(
                sectionsTable.isArchived,
                false
              )
            )
          );

      const targetSections =
        await db
          .select()
          .from(sectionsTable)
          .where(
            and(
              eq(
                sectionsTable.schoolId,
                schoolId
              ),
              eq(
                sectionsTable.classId,
                targetClass.id
              )
            )
          );
      const targetSectionNames =
        new Set(
          targetSections.map(
            (section) =>
              section.name
          )
        );

      for (const sourceSection of sourceSections) {
        if (
          targetSectionNames.has(
            sourceSection.name
          )
        ) {
          continue;
        }

        await db
          .insert(sectionsTable)
          .values({
            id:
              crypto.randomUUID(),
            schoolId,
            classId:
              targetClass.id,
            name:
              sourceSection.name,
            isArchived:
              false,
            createdAt:
              new Date(),
          });
        targetSectionNames.add(
          sourceSection.name
        );
      }

      // Clone class fees from source to target
      const sourceFees =
        await db
          .select()
          .from(classFeesTable)
          .where(
            and(
              eq(
                classFeesTable.schoolId,
                schoolId
              ),
              eq(
                classFeesTable.classId,
                sourceClass.id
              ),
              eq(
                classFeesTable.isArchived,
                false
              )
            )
          );

      const targetFees =
        await db
          .select()
          .from(classFeesTable)
          .where(
            and(
              eq(
                classFeesTable.schoolId,
                schoolId
              ),
              eq(
                classFeesTable.classId,
                targetClass.id
              )
            )
          );

      const targetFeeTypeIds =
        new Set(
          targetFees.map(
            (fee) =>
              fee.feeTypeId
          )
        );

      for (const sourceFee of sourceFees) {
        if (
          targetFeeTypeIds.has(
            sourceFee.feeTypeId
          )
        ) {
          continue;
        }

        await db
          .insert(classFeesTable)
          .values({
            id:
              crypto.randomUUID(),
            schoolId,
            classId:
              targetClass.id,
            feeTypeId:
              sourceFee.feeTypeId,
            amount:
              sourceFee.amount,
            isDefault:
              sourceFee.isDefault,
            isArchived:
              false,
          });
      }
    }

    return [
      ...classByName.values(),
    ];
  };

const normalizeTimestamp =
  (value) => {
    const timestamp =
      Number(value);

    return Number.isFinite(timestamp) &&
      timestamp > 0
      ? timestamp
      : Date.now();
  };

const formatReceiptDate =
  (value) =>
    new Date(Number(value || Date.now()))
      .toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

const formatReceiptDateTime =
  (value) =>
    new Date(Number(value || Date.now()))
      .toLocaleString(
        "en-IN",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

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

const makeSchoolCode =
  (schoolName) => {
    const words =
      clean(schoolName)
        .split(/\s+/)
        .filter(Boolean);

    const code =
      words
        .map((word) =>
          word[0]
        )
        .join("")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toUpperCase()
        .slice(0, 8);

    return code || "FB";
  };

const numberToWords =
  (value) => {
    const number =
      Math.floor(
        Number(value || 0)
      );
    const ones = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const belowHundred =
      (amount) =>
        amount < 20
          ? ones[amount]
          : `${tens[Math.floor(amount / 10)]} ${ones[amount % 10]}`.trim();

    const belowThousand =
      (amount) => {
        if (amount < 100) {
          return belowHundred(amount);
        }

        return `${ones[Math.floor(amount / 100)]} Hundred ${belowHundred(amount % 100)}`.trim();
      };

    if (number === 0) {
      return "Rupees Zero Only";
    }

    const crore =
      Math.floor(number / 10000000);
    const lakh =
      Math.floor(
        (number % 10000000) /
          100000
      );
    const thousand =
      Math.floor(
        (number % 100000) /
          1000
      );
    const rest =
      number % 1000;
    const parts = [];

    if (crore) {
      parts.push(
        `${belowThousand(crore)} Crore`
      );
    }

    if (lakh) {
      parts.push(
        `${belowThousand(lakh)} Lakh`
      );
    }

    if (thousand) {
      parts.push(
        `${belowThousand(thousand)} Thousand`
      );
    }

    if (rest) {
      parts.push(
        belowThousand(rest)
      );
    }

    return `Rupees ${parts.join(" ")} Only`;
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

const getNextReceiptMeta =
  async ({
    schoolId,
    schoolName,
  }) => {
    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const prefix =
      clean(
        profile.receiptPrefix
      ) ||
      makeSchoolCode(schoolName);
    const calendarYear =
      getCalendarYear();
    const counterId = `${schoolId}:${calendarYear}`;
    const result =
      await sqlClient.execute({
        sql:
          `INSERT INTO receipt_counters (id, school_id, academic_year, last_sequence, updated_at)
           VALUES (?, ?, ?, 1, ?)
           ON CONFLICT(id)
           DO UPDATE SET
             last_sequence = receipt_counters.last_sequence + 1,
             updated_at = excluded.updated_at
           RETURNING last_sequence`,
        args: [
          counterId,
          schoolId,
          calendarYear,
          Date.now(),
        ],
      });
    const nextSequence =
      Number(
        result.rows[0]?.last_sequence ||
          1
      );

    const receiptNo = `${prefix}/${calendarYear}/${String(nextSequence).padStart(6, "0")}`;

    return {
      receiptNo,
      receiptSequence:
        nextSequence,
      receiptAcademicYear:
        calendarYear,
    };
  };

export const ensureStudentLifecycleColumns =
  async () => {
    const columns =
      await sqlClient.execute(
        "PRAGMA table_info(students)"
      );
    const existing =
      new Set(
        columns.rows.map((row) =>
          String(row.name)
        )
      );
    const additions = [
      [
        "last_academic_year",
        "ALTER TABLE students ADD last_academic_year text",
      ],
      [
        "previous_class_id",
        "ALTER TABLE students ADD previous_class_id text",
      ],
      [
        "previous_section_id",
        "ALTER TABLE students ADD previous_section_id text",
      ],
      [
        "left_at",
        "ALTER TABLE students ADD left_at integer",
      ],
      [
        "alumni_at",
        "ALTER TABLE students ADD alumni_at integer",
      ],
      [
        "movement_note",
        "ALTER TABLE students ADD movement_note text",
      ],
    ];

    for (const [
      column,
      statement,
    ] of additions) {
      if (!existing.has(column)) {
        await sqlClient.execute(
          statement
        );
      }
    }

    const paymentColumns =
      await sqlClient.execute(
        "PRAGMA table_info(student_payments)"
      );
    const existingPaymentColumns =
      new Set(
        paymentColumns.rows.map((row) =>
          String(row.name)
        )
      );

    if (
      !existingPaymentColumns.has(
        "payment_mode"
      )
    ) {
      await sqlClient.execute(
        "ALTER TABLE student_payments ADD payment_mode text DEFAULT 'Cash'"
      );
    }

    const paymentAdditions = [
      [
        "receipt_no",
        "ALTER TABLE student_payments ADD receipt_no text",
      ],
      [
        "receipt_sequence",
        "ALTER TABLE student_payments ADD receipt_sequence integer",
      ],
      [
        "receipt_academic_year",
        "ALTER TABLE student_payments ADD receipt_academic_year text",
      ],
      [
        "remark",
        "ALTER TABLE student_payments ADD remark text",
      ],
      [
        "transaction_ref",
        "ALTER TABLE student_payments ADD transaction_ref text",
      ],
    ];

    for (const [
      column,
      statement,
    ] of paymentAdditions) {
      if (
        !existingPaymentColumns.has(
          column
        )
      ) {
        await sqlClient.execute(
          statement
        );
      }
    }

    await sqlClient.execute(`
      CREATE TABLE IF NOT EXISTS receipt_counters (
        id text PRIMARY KEY,
        school_id text NOT NULL,
        academic_year text NOT NULL,
        last_sequence integer NOT NULL DEFAULT 0,
        updated_at integer NOT NULL
      )
    `);

    await sqlClient.execute(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_receipt_counter_idx
      ON receipt_counters (school_id, academic_year)
    `);

    // Ensure student_fees has class_id and academic_year columns
    const studentFeesColumns =
      await sqlClient.execute(
        "PRAGMA table_info(student_fees)"
      );
    const existingStudentFeesColumns =
      new Set(
        studentFeesColumns.rows.map((row) =>
          String(row.name)
        )
      );

    if (!existingStudentFeesColumns.has("class_id")) {
      await sqlClient.execute(
        "ALTER TABLE student_fees ADD class_id text"
      );
    }
    if (!existingStudentFeesColumns.has("academic_year")) {
      await sqlClient.execute(
        "ALTER TABLE student_fees ADD academic_year text"
      );
    }

    // Trigger backfill asynchronously on startup
    backfillStudentFeesAcademicYears().catch((err) => {
      console.error("[Backfill Error]", err);
    });
  };

export const backfillStudentFeesAcademicYears = async () => {
  const [{ count }] = await db.select({ count: sql`COUNT(*)` }).from(studentFeesTable)
    .where(or(isNull(studentFeesTable.classId), isNull(studentFeesTable.academicYear)));
  if (Number(count) === 0) return;

  const pendingFees = await db
    .select()
    .from(studentFeesTable)
    .where(
      or(
        isNull(studentFeesTable.classId),
        isNull(studentFeesTable.academicYear)
      )
    );

  if (pendingFees.length === 0) return;

  console.log(`[Backfill] Found ${pendingFees.length} student_fees records to backfill.`);
  for (const fee of pendingFees) {
    try {
      const enrollments = await db
        .select()
        .from(enrollmentsTable)
        .where(eq(enrollmentsTable.studentId, fee.studentId));

      if (enrollments.length === 0) {
        const [student] = await db
          .select()
          .from(studentsTable)
          .where(eq(studentsTable.id, fee.studentId));
        if (student && student.classId) {
          const [cls] = await db
            .select()
            .from(classesTable)
            .where(eq(classesTable.id, student.classId));
          if (cls) {
            await db
              .update(studentFeesTable)
              .set({ classId: cls.id, academicYear: cls.academicYear })
              .where(eq(studentFeesTable.id, fee.id));
          }
        }
        continue;
      }

      let matchedEnrollment = null;
      for (const enrollment of enrollments) {
        const [classFee] = await db
          .select()
          .from(classFeesTable)
          .where(
            and(
              eq(classFeesTable.classId, enrollment.classId),
              eq(classFeesTable.feeTypeId, fee.feeTypeId)
            )
          );
        if (classFee) {
          matchedEnrollment = enrollment;
          break;
        }
      }

      if (!matchedEnrollment) {
        matchedEnrollment = enrollments[0];
      }

      if (matchedEnrollment) {
        await db
          .update(studentFeesTable)
          .set({
            classId: matchedEnrollment.classId,
            academicYear: matchedEnrollment.academicYear
          })
          .where(eq(studentFeesTable.id, fee.id));
      }
    } catch (e) {
      console.error(`[Backfill] Failed backfilling fee ID ${fee.id}:`, e);
    }
  }
  console.log(`[Backfill] Finished backfilling.`);
};

const normalizeListQuery =
  (query = {}) => {
    const page =
      Math.max(
        1,
        Number.parseInt(
          query.page,
          10
        ) || 1
      );

    const limit =
      Math.min(
        50,
        Math.max(
          1,
          Number.parseInt(
            query.limit,
            10
          ) || 10
        )
      );

    return {
      page,
      limit,
      search:
        clean(query.search)
          .toLowerCase(),
      paymentStatus:
        clean(
          query.paymentStatus
        ),
      sortBy:
        clean(query.sortBy) ||
        "rollNumber",
    };
  };

const normalizeDirectoryQuery =
  (query = {}) => {
    const base =
      normalizeListQuery(query);
    const status =
      clean(query.status)
        .toLowerCase();
    const normalizedStatus =
      status === "left"
        ? "previous"
        : status;

    return {
      ...base,
      status:
        [
          "all",
          "active",
          "alumni",
          "previous",
          "archived",
        ].includes(normalizedStatus)
          ? normalizedStatus
          : "all",
      publicStatus:
        status || "all",
      classId:
        clean(query.classId),
      sectionId:
        clean(query.sectionId),
    };
  };

const normalizeFeesLedgerQuery =
  (query = {}) => {
    const base =
      normalizeListQuery(query);
    const status =
      clean(query.status);
    const studentStatus =
      clean(query.studentStatus);

    return {
      ...base,
      status:
        [
          "All",
          "Paid",
          "Partial",
          "Unpaid",
          "Overdue",
        ].includes(status)
          ? status
          : "All",
      studentStatus:
        [
          "all",
          "active",
          "alumni",
        ].includes(studentStatus)
          ? studentStatus
          : "active",
      classId:
        clean(query.classId),
      sectionId:
        clean(query.sectionId),
      monthYear:
        clean(query.monthYear),
      paymentMode:
        clean(query.paymentMode),
    };
  };

const getMonthWindow =
  (monthYear) => {
    if (
      !/^\d{4}-\d{2}$/.test(
        monthYear
      )
    ) {
      return null;
    }

    const [
      year,
      month,
    ] =
      monthYear
        .split("-")
        .map(Number);
    const start =
      new Date(
        year,
        month - 1,
        1
      ).getTime();
    const end =
      new Date(
        year,
        month,
        1
      ).getTime();

    return {
      start,
      end,
    };
  };

const assertSectionForSchool =
  async ({
    schoolId,
    classId,
    sectionId,
  }) => {
    const [singleClass] =
      await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(
              classesTable.id,
              classId
            ),
            eq(
              classesTable.schoolId,
              schoolId
            )
          )
        );

    if (!singleClass) {
      throw createStudentError({
        statusCode: 404,
        code: "CLASS_NOT_FOUND",
        message:
          "Class not found",
      });
    }

    const [section] =
      await db
        .select()
        .from(sectionsTable)
        .where(
          and(
            eq(
              sectionsTable.id,
              sectionId
            ),
            eq(
              sectionsTable.classId,
              classId
            ),
            eq(
              sectionsTable.schoolId,
              schoolId
            )
          )
        );

    if (!section) {
      throw createStudentError({
        statusCode: 404,
        code: "SECTION_NOT_FOUND",
        message:
          "Section not found",
      });
    }

    return {
      singleClass,
      section,
    };
  };

const assertActiveSection =
  async ({
    schoolId,
    classId,
    sectionId,
  }) => {
    const {
      singleClass,
      section,
    } =
      await assertSectionForSchool({
        schoolId,
        classId,
        sectionId,
      });

    if (singleClass.isArchived) {
      throw createStudentError({
        statusCode: 409,
        code: "CLASS_ARCHIVED",
        message:
          "Archived classes cannot accept students",
      });
    }

    if (section.isArchived) {
      throw createStudentError({
        statusCode: 409,
        code: "SECTION_ARCHIVED",
        message:
          "Archived sections cannot accept students",
      });
    }

    return section;
  };

const findExistingStudent =
  async ({
    schoolId,
    schoolRegisterNo,
  }) => {
    const [student] =
      await db
        .select()
        .from(studentsTable)
        .where(
          and(
            eq(
              studentsTable.schoolId,
              schoolId
            ),
            eq(
              studentsTable.schoolRegisterNo,
              schoolRegisterNo
            )
          )
        );

    return student;
  };

const createStudentRecord =
  async ({
    schoolId,
    data,
  }) => {
    await assertActiveSection({
      schoolId,
      classId:
        data.classId,
      sectionId:
        data.sectionId,
    });

    await assertClassHasFeeStructure({
      schoolId,
      classId:
        data.classId,
    });

    const schoolRegisterNo =
      clean(
        data.schoolRegisterNo
      );

    const existing =
      await findExistingStudent({
        schoolId,
        schoolRegisterNo,
      });

    if (existing) {
      throw createStudentError({
        statusCode: 409,
        code: "STUDENT_ALREADY_EXISTS",
        message:
          "Student register number already exists",
        details: {
          studentId:
            existing.id,
        },
      });
    }

    const fullName =
      makeFullName({
        firstName:
          data.firstName,
        lastName:
          data.lastName,
      });

    const student = {
      id:
        crypto.randomUUID(),
      schoolId,
      classId:
        data.classId,
      sectionId:
        data.sectionId,
      schoolRegisterNo,
      rollNumber:
        makeRollNumber(
          schoolRegisterNo
        ),
      firstName:
        clean(
          data.firstName
        ),
      lastName:
        normalizeOptional(
          data.lastName
        ),
      fullName,
      fatherName:
        clean(
          data.fatherName
        ),
      dob:
        clean(data.dob),
      phone:
        clean(data.phone),
      gender:
        clean(data.gender),
      aadharNo:
        normalizeOptional(
          data.aadharNo
        ),
      aadharVerificationStatus:
        normalizeOptional(
          data.aadharVerificationStatus
        ),
      admissionDate:
        normalizeOptional(
          data.admissionDate
        ),
      photoUrl:
        normalizeOptional(
          data.photoUrl
        ),
      photoFileId:
        normalizeOptional(
          data.photoFileId
        ),
      status: "active",
      createdAt:
        Date.now(),
    };

    await db
      .insert(studentsTable)
      .values(student);

    // Create enrollment record so student appears in dashboard/class counts
    const [targetClass] = await db
      .select()
      .from(classesTable)
      .where(
        and(
          eq(classesTable.id, student.classId),
          eq(classesTable.schoolId, schoolId)
        )
      );

    if (targetClass) {
      const enrollmentId = crypto.randomUUID();
      await db
        .insert(enrollmentsTable)
        .values({
          id: enrollmentId,
          schoolId,
          studentId: student.id,
          academicYear: targetClass.academicYear,
          classId: student.classId,
          sectionId: student.sectionId,
          rollNumber: student.rollNumber,
          admissionType: "new",
          status: "active",
          createdAt: Date.now(),
        });

      await db
        .update(studentsTable)
        .set({
          currentEnrollmentId: enrollmentId,
        })
        .where(
          eq(studentsTable.id, student.id)
        );
    }

    await allocateMandatoryFeesForStudent({
      schoolId,
      student,
    });

    await reshuffleRollNumbers({
      schoolId,
      classId: student.classId,
      sectionId: student.sectionId,
    });

    const year = targetClass?.academicYear || getCurrentAcademicYear();
    await deleteCache(keys.dashboard(schoolId, year));
    await deleteCache(keys.dashboardInsights(schoolId, year));
    await deleteCachePattern(`section:${student.sectionId}:students:*`);

    return student;
  };

const allocateMandatoryFeesForStudent =
  async ({
    schoolId,
    student,
  }) => {
    const mandatoryClassFees =
      await db
        .select({
          feeTypeId:
            classFeesTable.feeTypeId,
        })
        .from(classFeesTable)
        .where(
          and(
            eq(
              classFeesTable.schoolId,
              schoolId
            ),
            eq(
              classFeesTable.classId,
              student.classId
            ),
            eq(
              classFeesTable.isDefault,
              true
            ),
            eq(
              classFeesTable.isArchived,
              false
            )
          )
        );

    const feeTypeIds =
      mandatoryClassFees.map(
        (fee) =>
          fee.feeTypeId
      );

    if (
      feeTypeIds.length === 0
    ) {
      return;
    }

    await allocateClassFeesService({
      schoolId,
      data: {
        classId:
          student.classId,
        studentIds: [
          student.id,
        ],
        feeTypeIds,
      },
    });
  };

export const createStudentService =
  async ({
    schoolId,
    data,
  }) => {
    const parsed =
      createStudentSchema.parse(
        data
      );

    return await createStudentRecord({
      schoolId,
      data: parsed,
    });
  };

export const getStudentsBySectionService =
  async ({
    schoolId,
    classId,
    sectionId,
    query = {},
  }) => {
    await assertSectionForSchool({
      schoolId,
      classId,
      sectionId,
    });

    const [singleClass] = await db
      .select({ academicYear: classesTable.academicYear })
      .from(classesTable)
      .where(
        and(
          eq(classesTable.schoolId, schoolId),
          eq(classesTable.id, classId)
        )
      );

    const classYear = singleClass?.academicYear || "";

    const students =
      await db
      .select()
      .from(studentsTable)
      .where(
        and(
          eq(
            studentsTable.schoolId,
            schoolId
          ),
          eq(
            studentsTable.classId,
            classId
          ),
          eq(
            studentsTable.sectionId,
            sectionId
          ),
          eq(
            studentsTable.status,
            "active"
          )
        )
      )
      .orderBy(
        asc(
          studentsTable.rollNumber
        )
      );

    const enrichedStudents =
      await Promise.all(
      students.map(
        async (student) => {
          const fees = await db
            .select()
            .from(studentFeesTable)
            .where(
              and(
                eq(studentFeesTable.schoolId, schoolId),
                eq(studentFeesTable.studentId, student.id)
              )
            );

          const currentYearFees = fees.filter(
            (fee) => !classYear || fee.academicYear === classYear
          );

          const overdueFeesList = fees.filter(
            (fee) => classYear && fee.academicYear !== classYear
          );

          const totalFees = currentYearFees.reduce(
            (sum, fee) => sum + Number(fee.amount || 0),
            0
          );
          const collectedFees = currentYearFees.reduce(
            (sum, fee) => sum + Number(fee.paidAmount || 0),
            0
          );
          const pendingFees = currentYearFees.reduce(
            (sum, fee) => sum + Number(fee.dueAmount || 0),
            0
          );
          const overdueFees = overdueFeesList.reduce(
            (sum, fee) => sum + Number(fee.dueAmount || 0),
            0
          );

          const paymentStatus =
            makePaymentStatus({
              pendingFees,
              collectedFees,
              totalFees,
            });

          return {
            ...student,
            totalFees,
            pendingFees,
            collectedFees,
            overdueFees,
            paymentStatus,
          };
        }
      )
    );

    const stats =
      enrichedStudents.reduce(
        (summary, student) => {
          const pendingFees =
            Number(
              student.pendingFees || 0
            );
          const collectedFees =
            Number(
              student.collectedFees || 0
            );

          summary.totalStudents += 1;
          summary.feeCollected +=
            collectedFees;
          summary.totalPending +=
            pendingFees;

          if (
            student.paymentStatus ===
            "Paid"
          ) {
            summary.fullyPaid += 1;
            summary.paid += 1;
          } else if (
            student.paymentStatus ===
            "Partial"
          ) {
            summary.partial += 1;
          } else {
            summary.pending += 1;
          }

          return summary;
        },
        {
          totalStudents: 0,
          feeCollected: 0,
          totalPending: 0,
          fullyPaid: 0,
          paid: 0,
          partial: 0,
          pending: 0,
        }
      );

    const {
      page,
      limit,
      search,
      paymentStatus,
      sortBy,
    } =
      normalizeListQuery(query);

    const filteredStudents =
      enrichedStudents.filter(
        (student) => {
          const matchesSearch =
            !search ||
            [
              student.fullName,
              student.fatherName,
              student.phone,
              student.schoolRegisterNo,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(search)
              );

          const matchesPaymentStatus =
            !paymentStatus ||
            paymentStatus ===
              "All Payment Status" ||
            student.paymentStatus ===
              paymentStatus;

          return (
            matchesSearch &&
            matchesPaymentStatus
          );
        }
      );

    const sortedStudents =
      [...filteredStudents].sort(
        (first, second) => {
          if (
            sortBy === "name" ||
            sortBy === "Name"
          ) {
            return first.fullName.localeCompare(
              second.fullName
            );
          }

          if (
            sortBy === "dueAmount" ||
            sortBy === "Due Amount"
          ) {
            return (
              Number(
                second.pendingFees || 0
              ) -
              Number(
                first.pendingFees || 0
              )
            );
          }

          return (
            Number(
              first.rollNumber || 0
            ) -
            Number(
              second.rollNumber || 0
            )
          );
        }
      );

    const total =
      sortedStudents.length;
    const totalPages =
      Math.max(
        1,
        Math.ceil(total / limit)
      );
    const safePage =
      Math.min(page, totalPages);
    const start =
      (safePage - 1) * limit;

    return {
      students:
        sortedStudents.slice(
          start,
          start + limit
        ),
      pagination: {
        page:
          safePage,
        limit,
        total,
        totalPages,
      },
      stats,
    };
  };

export const getStudentDirectoryService =
  async ({
    schoolId,
    query = {},
  }) => {
    const {
      page,
      limit,
      search,
      status,
      classId,
      sectionId,
      paymentStatus,
      sortBy,
    } =
      normalizeDirectoryQuery(query);

    const allStudents =
      await db
        .select()
        .from(studentsTable)
        .where(
          eq(
            studentsTable.schoolId,
            schoolId
          )
        )
        .orderBy(
          asc(
            studentsTable.rollNumber
          )
        );

    const enrichedStudents =
      await Promise.all(
        allStudents.map(
          async (student) => {
            const [
              singleClass,
              section,
              fees,
            ] =
              await Promise.all([
                db
                  .select()
                  .from(classesTable)
                  .where(
                    and(
                      eq(
                        classesTable.id,
                        student.classId
                      ),
                      eq(
                        classesTable.schoolId,
                        schoolId
                      )
                    )
                  )
                  .then(
                    (rows) =>
                      rows[0] || null
                  ),
                db
                  .select()
                  .from(sectionsTable)
                  .where(
                    and(
                      eq(
                        sectionsTable.id,
                        student.sectionId
                      ),
                      eq(
                        sectionsTable.schoolId,
                        schoolId
                      )
                    )
                  )
                  .then(
                    (rows) =>
                      rows[0] || null
                  ),
                db
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
                        student.id
                      )
                    )
                  ),
              ]);

            const currentYear = singleClass?.academicYear || "";

            const currentYearFees = fees.filter(
              (fee) => !currentYear || fee.academicYear === currentYear
            );

            const overdueFeesList = fees.filter(
              (fee) => currentYear && fee.academicYear !== currentYear
            );

            const totalFees = currentYearFees.reduce(
              (sum, fee) =>
                sum +
                Number(
                  fee.amount || 0
                ),
              0
            );
            const collectedFees = currentYearFees.reduce(
              (sum, fee) =>
                sum +
                Number(
                  fee.paidAmount || 0
                ),
              0
            );
            const pendingFees = currentYearFees.reduce(
              (sum, fee) =>
                sum +
                Number(
                  fee.dueAmount || 0
                ),
              0
            );
            const overdueFees = overdueFeesList.reduce(
              (sum, fee) =>
                sum +
                Number(
                  fee.dueAmount || 0
                ),
              0
            );

            return {
              ...student,
              className:
                singleClass?.name ||
                "Class",
              sectionName:
                section?.name ||
                "Section",
              totalFees,
              collectedFees,
              pendingFees,
              overdueFees,
              paymentStatus:
                makePaymentStatus({
                  pendingFees,
                  collectedFees,
                  totalFees,
                }),
              publicStatus:
                (student.status === "previous" || student.status === "archived")
                  ? "left"
                  : student.status ||
                    "active",
              statusLabel:
                (student.status === "previous" || student.status === "archived")
                  ? "Left"
                  : (student.status ||
                      "active")
                      .charAt(0)
                      .toUpperCase() +
                    (student.status ||
                      "active").slice(1),
            };
          }
        )
      );

    const statusCounts =
      enrichedStudents.reduce(
        (summary, student) => {
          const key = student.status || "active";
          if (key === "active") {
            summary.active += 1;
            summary.all += 1;
          } else if (key === "alumni") {
            summary.alumni += 1;
            summary.all += 1;
          } else if (key === "previous" || key === "archived") {
            summary.left += 1;
          }
          return summary;
        },
        {
          active: 0,
          alumni: 0,
          left: 0,
          all: 0,
        }
      );

    const filterOptions =
      enrichedStudents.reduce(
        (options, student) => {
          if (
            student.classId &&
            !options.classMap.has(
              student.classId
            )
          ) {
            options.classMap.set(
              student.classId,
              {
                id: student.classId,
                name:
                  student.className,
              }
            );
          }

          if (
            student.sectionId &&
            !options.sectionMap.has(
              student.sectionId
            )
          ) {
            options.sectionMap.set(
              student.sectionId,
              {
                id: student.sectionId,
                classId:
                  student.classId,
                name:
                  student.sectionName,
              }
            );
          }

          return options;
        },
        {
          classMap:
            new Map(),
          sectionMap:
            new Map(),
        }
      );

    const filtered =
      enrichedStudents.filter(
        (student) => {
          const studentStatus = student.status || "active";
          const matchesStatus =
            status === "all"
              ? (studentStatus === "active" || studentStatus === "alumni")
              : status === "left"
              ? (studentStatus === "previous" || studentStatus === "archived")
              : studentStatus === status;
          const matchesClass =
            !classId ||
            student.classId === classId;
          const matchesSection =
            !sectionId ||
            student.sectionId === sectionId;
          const matchesPaymentStatus =
            !paymentStatus ||
            paymentStatus ===
              "All Payment Status" ||
            student.paymentStatus ===
              paymentStatus;
          const matchesSearch =
            !search ||
            [
              student.fullName,
              student.fatherName,
              student.phone,
              student.schoolRegisterNo,
              student.rollNumber,
              student.className,
              student.sectionName,
            ]
              .filter(Boolean)
              .some((value) =>
                String(value)
                  .toLowerCase()
                  .includes(search)
              );

          return (
            matchesStatus &&
            matchesClass &&
            matchesSection &&
            matchesPaymentStatus &&
            matchesSearch
          );
        }
      );

    const sorted =
      [...filtered].sort(
        (first, second) => {
          if (sortBy === "name") {
            return first.fullName.localeCompare(
              second.fullName
            );
          }

          if (sortBy === "dueAmount") {
            return (
              Number(
                second.pendingFees || 0
              ) -
              Number(
                first.pendingFees || 0
              )
            );
          }

          return (
            Number(
              first.rollNumber || 0
            ) -
            Number(
              second.rollNumber || 0
            )
          );
        }
      );

    const stats =
      filtered.reduce(
        (summary, student) => {
          summary.totalStudents += 1;
          summary.totalFees +=
            Number(
              student.totalFees || 0
            );
          summary.feeCollected +=
            Number(
              student.collectedFees ||
                0
            );
          summary.totalPending +=
            Number(
              student.pendingFees || 0
            );

          if (
            student.paymentStatus ===
            "Paid"
          ) {
            summary.paid += 1;
          } else if (
            student.paymentStatus ===
            "Partial"
          ) {
            summary.partial += 1;
          } else {
            summary.pending += 1;
          }

          return summary;
        },
        {
          totalStudents: 0,
          totalFees: 0,
          feeCollected: 0,
          totalPending: 0,
          paid: 0,
          partial: 0,
          pending: 0,
        }
      );

    const total =
      sorted.length;
    const totalPages =
      Math.max(
        1,
        Math.ceil(total / limit)
      );
    const safePage =
      Math.min(page, totalPages);
    const start =
      (safePage - 1) * limit;

    return {
      students:
        sorted.slice(
          start,
          start + limit
        ),
      stats,
      statusCounts,
      summary: {
        totalStudents:
          statusCounts.all,
        activeStudents:
          statusCounts.active,
        alumniStudents:
          statusCounts.alumni,
        leftStudents:
          statusCounts.left,
      },
      filterOptions: {
        classes: [
          ...filterOptions.classMap.values(),
        ].sort((first, second) =>
          first.name.localeCompare(
            second.name,
            undefined,
            {
              numeric: true,
            }
          )
        ),
        sections: [
          ...filterOptions.sectionMap.values(),
        ].sort((first, second) =>
          first.name.localeCompare(
            second.name,
            undefined,
            {
              numeric: true,
            }
          )
        ),
      },
      pagination: {
        page:
          safePage,
        limit,
        total,
        totalPages,
      },
    };
  };

export const getFeesLedgerService =
  async ({
    schoolId,
    query = {},
  }) => {
    const {
      page,
      limit,
      search,
      status,
      studentStatus,
      classId,
      sectionId,
      monthYear,
      paymentMode,
      sortBy,
    } =
      normalizeFeesLedgerQuery(query);
    const monthWindow =
      getMonthWindow(monthYear);
    const activeAcademicYear =
      await getActiveAcademicYearService({
        schoolId,
      });
    const concessionRows =
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
              studentFeeConcessionsTable.academicYear,
              activeAcademicYear
            )
          )
        );
    const concessionByStudent =
      new Map(
        concessionRows.map(
          (row) => [
            row.studentId,
            row,
          ]
        )
      );
    const allStudents =
      await db
        .select()
        .from(studentsTable)
        .where(
          and(
            eq(
              studentsTable.schoolId,
              schoolId
            ),
            inArray(
              studentsTable.status,
              ["active", "alumni"]
            )
          )
        )
        .orderBy(
          asc(
            studentsTable.rollNumber
          )
        );

    const ledgerRows =
      await Promise.all(
        allStudents.map(
          async (student) => {
            const [
              singleClass,
              section,
              fees,
              payments,
            ] =
              await Promise.all([
                db
                  .select()
                  .from(classesTable)
                  .where(
                    and(
                      eq(
                        classesTable.id,
                        student.classId
                      ),
                      eq(
                        classesTable.schoolId,
                        schoolId
                      )
                    )
                  )
                  .then(
                    (rows) =>
                      rows[0] || null
                  ),
                db
                  .select()
                  .from(sectionsTable)
                  .where(
                    and(
                      eq(
                        sectionsTable.id,
                        student.sectionId
                      ),
                      eq(
                        sectionsTable.schoolId,
                        schoolId
                      )
                    )
                  )
                  .then(
                    (rows) =>
                      rows[0] || null
                  ),
                db
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
                        student.id
                      )
                    )
                  ),
                db
                  .select()
                  .from(studentPaymentsTable)
                  .where(
                    and(
                      eq(
                        studentPaymentsTable.schoolId,
                        schoolId
                      ),
                      eq(
                        studentPaymentsTable.studentId,
                        student.id
                      )
                    )
                  )
                  .orderBy(
                    desc(
                      studentPaymentsTable.paidAt
                    )
                  ),
              ]);
            const currentYear = singleClass?.academicYear || "";

            const currentYearFeesList = fees.filter(
              (fee) => !currentYear || fee.academicYear === currentYear
            );

            const overdueFeesList = fees.filter(
              (fee) => currentYear && fee.academicYear !== currentYear
            );

            const overdueFees = overdueFeesList.reduce(
              (sum, fee) => sum + Number(fee.dueAmount || 0),
              0
            );

            const currentYearPayments = payments.filter(
              (p) => !currentYear || p.receiptAcademicYear === currentYear
            );

            const enrichedFees =
              await Promise.all(
                currentYearFeesList.map(
                  async (fee) => {
                    const [feeType] =
                      await db
                        .select()
                        .from(
                          feeTypesTable
                        )
                        .where(
                          and(
                            eq(
                              feeTypesTable.id,
                              fee.feeTypeId
                            ),
                            eq(
                              feeTypesTable.schoolId,
                              schoolId
                            )
                          )
                        );

                    return {
                      ...fee,
                      feeTypeName:
                        feeType?.name ||
                        "Fee",
                      grossAmount:
                        fee.grossAmount,
                      concessionAmount:
                        Number(
                          fee.concessionAmount ||
                            0
                        ),
                    };
                  }
                )
              );
            const totalFees =
              enrichedFees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.amount || 0
                  ),
                0
              );
            const paidAmount =
              enrichedFees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.paidAmount || 0
                  ),
                0
              );
            const dueAmount =
              enrichedFees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.dueAmount || 0
                  ),
                0
              );
            const lastPayment =
              payments[0] || null;
            const selectedMonthPayments =
              monthWindow
                ? currentYearPayments.filter(
                    (payment) =>
                      Number(
                        payment.paidAt
                      ) >=
                        monthWindow.start &&
                      Number(
                        payment.paidAt
                      ) <
                        monthWindow.end
                  )
                : currentYearPayments;
            const hasPaymentInMonth =
              selectedMonthPayments
                .length > 0;
            const baseStatus =
              totalFees === 0
                ? "Unpaid"
                : dueAmount === 0
                  ? "Paid"
                  : paidAmount > 0
                    ? "Partial"
                    : "Unpaid";
            const ledgerStatus =
              overdueFees > 0
                ? "Overdue"
                : baseStatus;
            const normalizedPayments =
              payments.map(
                (payment) => {
                  const linkedFee =
                    enrichedFees.find(
                      (fee) =>
                        fee.id ===
                        payment.studentFeeId
                    );

                  return {
                    id: payment.id,
                    amount:
                      Number(
                        payment.amount ||
                          0
                      ),
                    paidAt:
                      payment.paidAt,
                    paymentMode:
                      payment.paymentMode ||
                      "Cash",
                    receiptNo:
                      payment.receiptNo,
                    receiptAcademicYear:
                      payment.receiptAcademicYear,
                    note:
                      payment.note,
                    studentFeeId:
                      payment.studentFeeId,
                    feeTypeId:
                      payment.feeTypeId,
                    feeTypeName:
                      linkedFee?.feeTypeName ||
                      "Fee",
                    isPartial:
                      Number(
                        linkedFee?.dueAmount ||
                          0
                      ) > 0,
                  };
                }
              );
            const activeConcession =
              concessionByStudent.get(
                student.id
              );
            const dueFees =
              enrichedFees
                .filter(
                  (fee) =>
                    Number(
                      fee.dueAmount || 0
                    ) > 0
                )
                .map((fee) => ({
                  id: fee.id,
                  amount:
                    Number(fee.amount || 0),
                  paidAmount:
                    Number(
                      fee.paidAmount || 0
                    ),
                  dueAmount:
                    Number(
                      fee.dueAmount || 0
                    ),
                  feeTypeName:
                    fee.feeTypeName,
                  academicYear:
                    fee.academicYear,
                }));

            return {
              id: student.id,
              fullName:
                student.fullName,
              firstName:
                student.firstName,
              lastName:
                student.lastName,
              photoUrl:
                student.photoUrl,
              phone:
                student.phone,
              schoolRegisterNo:
                student.schoolRegisterNo,
              admissionNo:
                student.schoolRegisterNo,
              rollNumber:
                student.rollNumber,
              classId:
                student.classId,
              sectionId:
                student.sectionId,
              className:
                singleClass?.name ||
                "Class",
              sectionName:
                section?.name ||
                "Section",
              totalFees,
              paidAmount,
              dueAmount,
              overdueFees,
              status:
                ledgerStatus,
              baseStatus,
              studentStatus:
                student.status,
              lastPayment:
                lastPayment
                  ? {
                      id:
                        lastPayment.id,
                      amount:
                        Number(
                          lastPayment.amount ||
                            0
                        ),
                      paidAt:
                        lastPayment.paidAt,
                      paymentMode:
                        lastPayment.paymentMode ||
                        "Cash",
                      note:
                        lastPayment.note,
                      receiptNo:
                        lastPayment.receiptNo,
                      receiptAcademicYear:
                        lastPayment.receiptAcademicYear,
                    }
                  : null,
              paymentModes: [
                ...new Set(
                  normalizedPayments.map(
                    (payment) =>
                      payment.paymentMode
                  )
                ),
              ],
              hasReceipt:
                normalizedPayments.length > 0,
              payments:
                normalizedPayments,
              paymentCount:
                normalizedPayments.length,
              concession:
                activeConcession
                  ? {
                      id:
                        activeConcession.id,
                      concessionType:
                        activeConcession.concessionType,
                      basis:
                        activeConcession.basis,
                      basisValue:
                        Number(
                          activeConcession.basisValue ||
                            0
                        ),
                      concessionAmount:
                        Number(
                          activeConcession.concessionAmount ||
                            0
                        ),
                      academicYear:
                        activeConcession.academicYear,
                      remark:
                        activeConcession.remark,
                      receiptNo:
                        activeConcession.receiptNo,
                    }
                  : null,
              dueFees,
              hasPaymentInMonth,
            };
          }
        )
      );
    const studentStatusFilteredRows = ledgerRows.filter((row) => {
      return studentStatus === "all" || row.studentStatus === studentStatus;
    });

    const filterOptions =
      studentStatusFilteredRows.reduce(
        (options, row) => {
          if (
            row.classId &&
            !options.classMap.has(
              row.classId
            )
          ) {
            options.classMap.set(
              row.classId,
              {
                id: row.classId,
                name: row.className,
              }
            );
          }

          if (
            row.sectionId &&
            !options.sectionMap.has(
              row.sectionId
            )
          ) {
            options.sectionMap.set(
              row.sectionId,
              {
                id: row.sectionId,
                classId:
                  row.classId,
                name:
                  row.sectionName,
              }
            );
          }

          for (const mode of row.paymentModes) {
            options.paymentModes.add(
              mode
            );
          }

          return options;
        },
        {
          classMap:
            new Map(),
          sectionMap:
            new Map(),
          paymentModes:
            new Set(["Cash"]),
        }
      );
    const filtered =
      studentStatusFilteredRows.filter((row) => {
        const matchesSearch =
          !search ||
          [
            row.fullName,
            row.phone,
            row.schoolRegisterNo,
            row.className,
            row.sectionName,
          ]
            .filter(Boolean)
            .some((value) =>
              String(value)
                .toLowerCase()
                .includes(search)
            );
        const matchesClass =
          !classId ||
          row.classId === classId;
        const matchesSection =
          !sectionId ||
          row.sectionId === sectionId;
        const matchesPaymentMode =
          !paymentMode ||
          row.paymentModes.includes(
            paymentMode
          );
        const matchesStatus =
          status === "All" ||
          row.status === status ||
          (status === "Partial" &&
            row.baseStatus === "Partial");
        const matchesMonthYear =
          !monthWindow || row.hasPaymentInMonth;

        return (
          matchesSearch &&
          matchesClass &&
          matchesSection &&
          matchesPaymentMode &&
          matchesStatus &&
          matchesMonthYear
        );
      });
    const statusCounts =
      studentStatusFilteredRows.reduce(
        (summary, row) => {
          summary.All += 1;
          summary[row.status] =
            (summary[row.status] || 0) +
            1;
          return summary;
        },
        {
          All: 0,
          Paid: 0,
          Partial: 0,
          Unpaid: 0,
          Overdue: 0,
        }
      );
    const stats =
      filtered.reduce(
        (summary, row) => {
          summary.totalCollected +=
            row.paidAmount;
          summary.pendingFees +=
            row.dueAmount;
          if (
            row.baseStatus === "Partial"
          ) {
            summary.partialPayments +=
              row.paidAmount;
          }
          if (row.status === "Overdue") {
            summary.overdueStudents += 1;
          }
          return summary;
        },
        {
          totalCollected: 0,
          pendingFees: 0,
          partialPayments: 0,
          overdueStudents: 0,
        }
      );
    const sorted =
      [...filtered].sort(
        (first, second) => {
          if (sortBy === "name") {
            return first.fullName.localeCompare(
              second.fullName
            );
          }

          if (sortBy === "dueAmount") {
            return (
              second.dueAmount -
              first.dueAmount
            );
          }

          return (
            Number(
              first.rollNumber || 0
            ) -
            Number(
              second.rollNumber || 0
            )
          );
        }
      );
    const total =
      sorted.length;
    const totalPages =
      Math.max(
        1,
        Math.ceil(total / limit)
      );
    const safePage =
      Math.min(page, totalPages);
    const start =
      (safePage - 1) * limit;

    return {
      students:
        sorted.slice(
          start,
          start + limit
        ),
      stats,
      statusCounts,
      filterOptions: {
        classes: [
          ...filterOptions.classMap.values(),
        ],
        sections: [
          ...filterOptions.sectionMap.values(),
        ],
        paymentModes: [
          ...filterOptions.paymentModes,
        ],
      },
      pagination: {
        page:
          safePage,
        limit,
        total,
        totalPages,
      },
    };
  };

const getStudentForSchool =
  async ({
    schoolId,
    studentId,
  }) => {
    let [student] =
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
      [student] =
        await db
          .select()
          .from(studentsTable)
          .where(
            and(
              eq(
                studentsTable.schoolRegisterNo,
                studentId
              ),
              eq(
                studentsTable.schoolId,
                schoolId
              )
            )
          );
    }

    if (!student) {
      throw createStudentError({
        statusCode: 404,
        code: "STUDENT_NOT_FOUND",
        message:
          "Student not found",
      });
    }

    return student;
  };

const getStudentFeeRows =
  async ({
    schoolId,
    studentId,
  }) => {
    const rows =
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
        )
        .orderBy(
          asc(
            studentFeesTable.createdAt
          )
        );

    if (rows.length === 0) return [];

    const feeTypeIds = [...new Set(rows.map(row => row.feeTypeId).filter(Boolean))];
    const feeTypesMap = new Map();
    if (feeTypeIds.length > 0) {
      const feeTypes = await db
        .select()
        .from(feeTypesTable)
        .where(
          and(
            inArray(feeTypesTable.id, feeTypeIds),
            eq(feeTypesTable.schoolId, schoolId)
          )
        );
      for (const ft of feeTypes) {
        feeTypesMap.set(ft.id, ft);
      }
    }

    return rows.map((fee) => {
      const feeType = feeTypesMap.get(fee.feeTypeId);
      return {
        ...fee,
        feeTypeName:
          feeType?.name ||
          "Fee",
        isOptional:
          Boolean(
            feeType?.isOptional
          ),
        grossAmount:
          fee.grossAmount != null
            ? Number(
                fee.grossAmount
              )
            : null,
        concessionAmount:
          Number(
            fee.concessionAmount ||
              0
          ),
      };
    });
  };

const getStudentPaymentRows =
  async ({
    schoolId,
    studentId,
  }) => {
    const rows =
      await db
        .select()
        .from(studentPaymentsTable)
        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),
            eq(
              studentPaymentsTable.studentId,
              studentId
            )
          )
        )
        .orderBy(
          desc(
            studentPaymentsTable.paidAt
          )
        );

    if (rows.length === 0) return [];

    const feeTypeIds = [...new Set(rows.map(row => row.feeTypeId).filter(Boolean))];
    const feeTypesMap = new Map();
    if (feeTypeIds.length > 0) {
      const feeTypes = await db
        .select()
        .from(feeTypesTable)
        .where(
          and(
            inArray(feeTypesTable.id, feeTypeIds),
            eq(feeTypesTable.schoolId, schoolId)
          )
        );
      for (const ft of feeTypes) {
        feeTypesMap.set(ft.id, ft);
      }
    }

    return rows.map((payment) => {
      const feeType = feeTypesMap.get(payment.feeTypeId);
      return {
        ...payment,
        feeTypeName:
          feeType?.name ||
          "Fee",
        receiptNo:
          payment.receiptNo,
        receiptAcademicYear:
          payment.receiptAcademicYear,
      };
    });
  };

const makeStudentStats =
  ({
    fees,
    payments,
    allPayments,
  }) => {
    const totalFees =
      fees.reduce(
        (sum, fee) =>
          sum +
          Number(fee.amount || 0),
        0
      );
    const paidFees =
      fees.reduce(
        (sum, fee) =>
          sum +
          Number(
            fee.paidAmount || 0
          ),
        0
      );
    const pendingFees =
      fees.reduce(
        (sum, fee) =>
          sum +
          Number(
            fee.dueAmount || 0
          ),
        0
      );
    const paidPercent =
      totalFees === 0
        ? 0
        : Number(
            (
              (paidFees /
                totalFees) *
              100
            ).toFixed(2)
          );
    const pendingPercent =
      totalFees === 0
        ? 0
        : Number(
            (
              (pendingFees /
                totalFees) *
              100
            ).toFixed(2)
          );

    return {
      totalFees,
      paidFees,
      pendingFees,
      paidPercent,
      pendingPercent,
      totalFeeItems:
        fees.length,
      paidItems:
        fees.filter(
          (fee) =>
            fee.status ===
            "paid"
        ).length,
      partialItems:
        fees.filter(
          (fee) =>
            fee.status ===
            "partial"
        ).length,
      pendingItems:
        fees.filter(
          (fee) =>
            fee.status ===
            "pending"
        ).length,
      lastPayment:
        (allPayments || payments)[0] || null,
    };
  };

export const getStudentDetailService =
  async ({
    schoolId,
    studentId,
  }) => {
    const student =
      await getStudentForSchool({
        schoolId,
        studentId,
      });

    const [
      singleClass,
      section,
      fees,
      payments,
    ] =
      await Promise.all([
        db
          .select()
          .from(classesTable)
          .where(
            and(
              eq(
                classesTable.id,
                student.classId
              ),
              eq(
                classesTable.schoolId,
                schoolId
              )
            )
          )
          .then(
            (rows) =>
              rows[0] || null
          ),
        db
          .select()
          .from(sectionsTable)
          .where(
            and(
              eq(
                sectionsTable.id,
                student.sectionId
              ),
              eq(
                sectionsTable.schoolId,
                schoolId
              )
            )
          )
          .then(
            (rows) =>
              rows[0] || null
          ),
        getStudentFeeRows({
          schoolId,
          studentId,
        }),
        getStudentPaymentRows({
          schoolId,
          studentId,
        }),
      ]);

    const activeAcademicYear =
      await getActiveAcademicYearService({
        schoolId,
      });

    const normalizedFees =
      fees.map((fee) => ({
        ...fee,
        amount:
          Number(
            fee.amount || 0
          ),
        paidAmount:
          Number(
            fee.paidAmount || 0
          ),
        dueAmount:
          Number(
            fee.dueAmount || 0
          ),
        status:
          makeFeeStatus({
            amount: fee.amount,
            paidAmount: fee.paidAmount,
            academicYear: fee.academicYear,
            activeAcademicYear,
          }),
      }));
    const [concession] =
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
              activeAcademicYear
            )
          )
        );

    const currentYear = singleClass?.academicYear || "";

    const currentYearFees = normalizedFees.filter(
      (fee) => !currentYear || fee.academicYear === currentYear
    );

    const overdueFeesList = normalizedFees.filter(
      (fee) => currentYear && fee.academicYear !== currentYear
    );

    const overdueFees = overdueFeesList.reduce(
      (sum, fee) => sum + Number(fee.dueAmount || 0),
      0
    );

    const overdueGroups = {};
    for (const fee of overdueFeesList) {
      const feeDue = Number(fee.dueAmount || 0);
      if (feeDue > 0) {
        let clsName = "Previous Class";
        if (fee.classId) {
          const [clsRow] = await db
            .select()
            .from(classesTable)
            .where(eq(classesTable.id, fee.classId));
          if (clsRow?.name) {
            clsName = clsRow.name;
          }
        }
        const groupYear = fee.academicYear || "Previous Year";
        const groupKey = `${clsName} (${groupYear})`;
        overdueGroups[groupKey] = (overdueGroups[groupKey] || 0) + feeDue;
      }
    }
    const overdueDetails = overdueFees > 0
      ? Object.entries(overdueGroups).map(([key, amount]) => `₹${amount} for ${key}`).join(", ")
      : "None";

    const currentYearPayments = payments.filter(
      (p) => !currentYear || p.receiptAcademicYear === currentYear
    );

    const currentYearTotalFees = currentYearFees.reduce(
      (sum, fee) => sum + Number(fee.amount || 0),
      0
    );

    const currentYearCollectedFees = currentYearFees.reduce(
      (sum, fee) => sum + Number(fee.paidAmount || 0),
      0
    );

    const currentYearPendingFees = currentYearFees.reduce(
      (sum, fee) => sum + Number(fee.dueAmount || 0),
      0
    );

    const statsObj = makeStudentStats({
      fees: currentYearFees,
      payments: currentYearPayments,
      allPayments: payments,
    });
    statsObj.overdueFees = overdueFees;

    return {
      student: {
        ...student,
        pendingFees: currentYearPendingFees,
        collectedFees: currentYearCollectedFees,
        totalFees: currentYearTotalFees,
        overdueFees,
        overdueDetails,
        paymentStatus:
          makePaymentStatus({
            pendingFees: currentYearPendingFees,
            collectedFees: currentYearCollectedFees,
            totalFees: currentYearTotalFees,
          }),
      },
      class:
        singleClass,
      section,
      fees:
        normalizedFees,
      payments,
      concession:
        concession || null,
      activeAcademicYear,
      stats: statsObj,
    };
  };

export const updateStudentService =
  async ({
    schoolId,
    studentId,
    data,
  }) => {
    const parsed =
      updateStudentSchema.parse(
        data
      );

    if (
      Object.keys(parsed)
        .length === 0
    ) {
      throw createStudentError({
        statusCode: 400,
        code: "NO_FIELDS",
        message:
          "No fields provided",
      });
    }

    const current =
      await getStudentForSchool({
        schoolId,
        studentId,
      });

    const schoolRegisterNo =
      parsed.schoolRegisterNo
        ? clean(
            parsed.schoolRegisterNo
          )
        : current.schoolRegisterNo;

    if (
      schoolRegisterNo !==
      current.schoolRegisterNo
    ) {
      const existing =
        await findExistingStudent({
          schoolId,
          schoolRegisterNo,
        });

      if (
        existing &&
        existing.id !== studentId
      ) {
        throw createStudentError({
          statusCode: 409,
          code:
            "STUDENT_ALREADY_EXISTS",
          message:
            "Student register number already exists",
        });
      }
    }

    const nextFirstName =
      parsed.firstName !== undefined
        ? clean(parsed.firstName)
        : current.firstName;
    const nextLastName =
      parsed.lastName !== undefined
        ? normalizeOptional(
            parsed.lastName
          )
        : current.lastName;

    const updateData = {
      ...parsed,
      schoolRegisterNo,
      firstName:
        nextFirstName,
      lastName:
        nextLastName,
      fullName:
        makeFullName({
          firstName:
            nextFirstName,
          lastName:
            nextLastName,
        }),
    };

    await db
      .update(studentsTable)
      .set(updateData)
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

    const nameChanged = (parsed.firstName !== undefined && parsed.firstName !== current.firstName) ||
                        (parsed.lastName !== undefined && parsed.lastName !== current.lastName);
    const statusChanged = (parsed.status !== undefined && parsed.status !== current.status);

    if (nameChanged || statusChanged) {
      await reshuffleRollNumbers({
        schoolId,
        classId: current.classId,
        sectionId: current.sectionId,
      });
    }

    await deleteCachePattern(`section:${current.sectionId}:students:*`);

    return await getStudentDetailService({
      schoolId,
      studentId,
    });
  };

export const markStudentLeftService =
  async ({
    schoolId,
    studentId,
    data = {},
  }) => {
    const parsed =
      studentLifecycleSchema.parse(
        data
      );
    const student =
      await getStudentForSchool({
        schoolId,
        studentId,
      });
    const {
      singleClass,
    } =
      await assertSectionForSchool({
        schoolId,
        classId:
          student.classId,
        sectionId:
          student.sectionId,
      });

    await db
      .update(studentsTable)
      .set({
        status: "previous",
        lastAcademicYear:
          singleClass.academicYear,
        previousClassId:
          student.classId,
        previousSectionId:
          student.sectionId,
        leftAt:
          Date.now(),
        movementNote:
          normalizeOptional(
            parsed.note
          ),
      })
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

    const [activeEnrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.studentId, studentId),
          eq(enrollmentsTable.schoolId, schoolId),
          eq(enrollmentsTable.status, "active")
        )
      );

    if (activeEnrollment) {
      await db
        .update(enrollmentsTable)
        .set({ status: "left" })
        .where(eq(enrollmentsTable.id, activeEnrollment.id));
    }

    return await getStudentDetailService({
      schoolId,
      studentId,
    });
  };

export const markStudentAlumniService =
  async ({
    schoolId,
    studentId,
    data = {},
  }) => {
    const parsed =
      studentLifecycleSchema.parse(
        data
      );
    const student =
      await getStudentForSchool({
        schoolId,
        studentId,
      });
    const {
      singleClass,
    } =
      await assertSectionForSchool({
        schoolId,
        classId:
          student.classId,
        sectionId:
          student.sectionId,
      });

    await db
      .update(studentsTable)
      .set({
        status: "alumni",
        lastAcademicYear:
          singleClass.academicYear,
        previousClassId:
          student.classId,
        previousSectionId:
          student.sectionId,
        alumniAt:
          Date.now(),
        movementNote:
          normalizeOptional(
            parsed.note
          ),
      })
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

    const [activeEnrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.studentId, studentId),
          eq(enrollmentsTable.schoolId, schoolId),
          eq(enrollmentsTable.status, "active")
        )
      );

    if (activeEnrollment) {
      await db
        .update(enrollmentsTable)
        .set({ status: "alumni" })
        .where(eq(enrollmentsTable.id, activeEnrollment.id));
    }

    return await getStudentDetailService({
      schoolId,
      studentId,
    });
  };

export const promoteStudentService =
  async ({
    schoolId,
    studentId,
    data = {},
    skipTenthGuard = false,
    skipReshuffle = false,
  }) => {
    const parsed =
      studentLifecycleSchema.parse(
        data
      );
    const student =
      await getStudentForSchool({
        schoolId,
        studentId,
      });
    const {
      singleClass,
    } =
      await assertSectionForSchool({
        schoolId,
        classId:
          student.classId,
        sectionId:
          student.sectionId,
      });

    if (!skipTenthGuard && isTenthClass(singleClass)) {
      throw createStudentError({
        statusCode: 400,
        code: "TENTH_CLASS_GUARD",
        message: "10th class students must be promoted via stream selection",
      });
    }

    const isFinal = await isFinalClassForSchool(schoolId, singleClass.academicYear, singleClass);
    if (isFinal) {
      return await markStudentAlumniService({
        schoolId,
        studentId,
        data: parsed,
      });
    }

    if (
      !parsed.targetClassId ||
      !parsed.targetSectionId
    ) {
      throw createStudentError({
        statusCode: 400,
        code: "TARGET_REQUIRED",
        message:
          getManualPromotionGuardMessage(
            singleClass
          ),
      });
    }

    await assertActiveSection({
      schoolId,
      classId:
        parsed.targetClassId,
      sectionId:
        parsed.targetSectionId,
    });

    await assertClassHasFeeStructure({
      schoolId,
      classId:
        parsed.targetClassId,
    });

    // STEP 1: find existing active enrollment for this student
    const [currentEnrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.studentId, studentId),
          eq(enrollmentsTable.schoolId, schoolId),
          eq(enrollmentsTable.status, "active")
        )
      );

    // STEP 2: create new enrollment
    const newEnrollmentId = crypto.randomUUID();
    const newEnrollment = {
      id: newEnrollmentId,
      schoolId,
      studentId,
      academicYear: getNextAcademicYear(
        currentEnrollment?.academicYear || singleClass.academicYear
      ),
      classId: parsed.targetClassId,
      sectionId: parsed.targetSectionId,
      rollNumber: student.rollNumber || null,
      admissionType: "promoted",
      status: "active",
      promotedFrom: currentEnrollment?.id || null,
      note: normalizeOptional(parsed.note),
      createdAt: Date.now(),
    };
    await db.insert(enrollmentsTable).values(newEnrollment);

    // STEP 3: mark old enrollment as promoted (if exists)
    if (currentEnrollment) {
      await db
        .update(enrollmentsTable)
        .set({ status: "promoted" })
        .where(eq(enrollmentsTable.id, currentEnrollment.id));
    }

    // STEP 4: update student row as cache (keep existing logic working)
    await db
      .update(studentsTable)
      .set({
        classId: parsed.targetClassId,
        sectionId: parsed.targetSectionId,
        status: "active",
        lastAcademicYear: singleClass.academicYear,
        previousClassId: student.classId,
        previousSectionId: student.sectionId,
        leftAt: null,
        alumniAt: null,
        movementNote: normalizeOptional(parsed.note),
        currentEnrollmentId: newEnrollmentId,
      })
      .where(
        and(
          eq(studentsTable.id, studentId),
          eq(studentsTable.schoolId, schoolId)
        )
      );

    // STEP 5: allocate mandatory fees for the target class
    await allocateMandatoryFeesForStudent({
      schoolId,
      student: {
        ...student,
        id: studentId,
        classId: parsed.targetClassId,
      },
    });

    if (!skipReshuffle) {
      await reshuffleRollNumbers({
        schoolId,
        classId: student.classId,
        sectionId: student.sectionId,
      });

      await reshuffleRollNumbers({
        schoolId,
        classId: parsed.targetClassId,
        sectionId: parsed.targetSectionId,
      });
    }

    return await getStudentDetailService({
      schoolId,
      studentId,
    });
  };

export const bulkPromoteStudentsService =
  async ({
    schoolId,
    data = {},
  }) => {
    const parsed =
      bulkPromoteStudentsSchema.parse(
        data
      );
    const fromAcademicYear =
      parsed.fromAcademicYear;
    const targetAcademicYear =
      parsed.targetAcademicYear;

    if (
      fromAcademicYear &&
      targetAcademicYear
    ) {
      await ensureAcademicYearStructure({
        schoolId,
        fromAcademicYear,
        targetAcademicYear,
      });
    }

    const allStudents =
      await db
        .select()
        .from(studentsTable)
        .where(
          and(
            eq(
              studentsTable.schoolId,
              schoolId
            ),
            eq(
              studentsTable.status,
              "active"
            )
          )
        );

    const targetStudents =
      allStudents.filter(
        (student) =>
          (!parsed.fromClassId ||
            student.classId ===
              parsed.fromClassId) &&
          (!parsed.fromSectionId ||
            student.sectionId ===
              parsed.fromSectionId)
      );

    const targetYear = targetAcademicYear || (fromAcademicYear ? getNextAcademicYear(fromAcademicYear) : getCurrentAcademicYear());
    const hasUpper = await hasUpperClasses(schoolId, targetYear);

    const result = {
      promoted: 0,
      alumni: 0,
      skipped: 0,
      errors: [],
    };

    const affectedPairs = [];

    for (const student of targetStudents) {
      try {
        const {
          singleClass,
          section,
        } =
          await assertSectionForSchool({
            schoolId,
            classId:
              student.classId,
            sectionId:
              student.sectionId,
          });

        if (
          fromAcademicYear &&
          singleClass.academicYear !==
            fromAcademicYear
        ) {
          continue;
        }

        const isFinal = await isFinalClassForSchool(schoolId, singleClass.academicYear, singleClass);
        if (isFinal || (isTenthClass(singleClass) && !hasUpper)) {
          await markStudentAlumniService({
            schoolId,
            studentId:
              student.id,
            data: {
              note:
                parsed.note ||
                "Automatic May academic year movement",
            },
          });
          result.alumni += 1;
          continue;
        }

        if (isTenthClass(singleClass) && hasUpper) {
          await markStudentAlumniService({
            schoolId,
            studentId:
              student.id,
            data: {
              note:
                parsed.note ||
                "Not promoted to 11th class — marked as alumni",
            },
          });
          result.alumni += 1;
          continue;
        }

        const nextClass =
          parsed.targetClassId
            ? await db
                .select()
                .from(classesTable)
                .where(
                  and(
                    eq(
                      classesTable.id,
                      parsed.targetClassId
                    ),
                    eq(
                      classesTable.schoolId,
                      schoolId
                    )
                  )
                )
                .then(
                  (rows) =>
                    rows[0] || null
                )
            : await getNextClassForPromotion({
                schoolId,
                currentClass:
                  singleClass,
                academicYear:
                  targetAcademicYear ||
                  singleClass.academicYear,
              });

        if (!nextClass) {
          await markStudentAlumniService({
            schoolId,
            studentId:
              student.id,
            data: {
              note:
                parsed.note ||
                "No next class available — marked as alumni",
            },
          });
          result.alumni += 1;
          continue;
        }

        const nextSection =
          parsed.targetSectionId
            ? {
                id:
                  parsed.targetSectionId,
              }
            : (await getSectionByName({
                schoolId,
                classId:
                  nextClass.id,
                name:
                  section.name,
              })) ||
              (await getFirstActiveSection({
                schoolId,
                classId:
                  nextClass.id,
              }));

        if (!nextSection?.id) {
          result.skipped += 1;
          result.errors.push({
            studentId:
              student.id,
            message:
              "Target section is not available",
          });
          continue;
        }

        await promoteStudentService({
          schoolId,
          studentId:
            student.id,
          data: {
            targetClassId:
              nextClass.id,
            targetSectionId:
              nextSection.id,
            note:
              parsed.note ||
              "Automatic May academic year movement",
          },
          skipReshuffle: true,
        });

        affectedPairs.push({ classId: student.classId, sectionId: student.sectionId });
        affectedPairs.push({ classId: nextClass.id, sectionId: nextSection.id });

        result.promoted += 1;
      } catch (error) {
        result.skipped += 1;
        result.errors.push({
          studentId:
            student.id,
          message:
            error.message,
        });
      }
    }

    const uniquePairs = [];
    const seen = new Set();
    for (const pair of affectedPairs) {
      const key = `${pair.classId}_${pair.sectionId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePairs.push(pair);
      }
    }

    for (const pair of uniquePairs) {
      await reshuffleRollNumbers({
        schoolId,
        classId: pair.classId,
        sectionId: pair.sectionId,
      });
    }

    if (result.promoted > 0 && targetAcademicYear) {
      await setActiveAcademicYearService({
        schoolId,
        year: targetAcademicYear,
      });
    }

    return result;
  };

export const runMayAcademicYearAutomationService =
  async () => {
    const targetAcademicYear =
      getCurrentAcademicYear();
    const fromAcademicYear =
      getPreviousAcademicYear(
        targetAcademicYear
      );
    const activeStudents =
      await db
        .select()
        .from(studentsTable)
        .where(
          eq(
            studentsTable.status,
            "active"
          )
        );
    const schoolIds =
      [
        ...new Set(
          activeStudents.map(
            (student) =>
              student.schoolId
          )
        ),
      ].filter(Boolean);
    const summary = [];

    for (const schoolId of schoolIds) {
      const result =
        await bulkPromoteStudentsService({
          schoolId,
          data: {
            fromAcademicYear,
            targetAcademicYear,
            note:
              "Automatic May academic year movement",
          },
        });

      summary.push({
        schoolId,
        fromAcademicYear,
        targetAcademicYear,
        ...result,
      });
    }

    return summary;
  };

export const updateStudentFeeService =
  async ({
    schoolId,
    studentId,
    feeId,
    data,
  }) => {
    const parsed =
      updateStudentFeeSchema.parse(
        data
      );

    const [fee] =
      await db
        .select()
        .from(studentFeesTable)
        .where(
          and(
            eq(
              studentFeesTable.id,
              feeId
            ),
            eq(
              studentFeesTable.studentId,
              studentId
            ),
            eq(
              studentFeesTable.schoolId,
              schoolId
            )
          )
        );

    if (!fee) {
      throw createStudentError({
        statusCode: 404,
        code: "FEE_NOT_FOUND",
        message:
          "Student fee not found",
      });
    }

    const amount =
      Math.max(
        0,
        Number(parsed.amount)
      );
    const paidAmount =
      Math.min(
        amount,
        Math.max(
          0,
          Number(
            parsed.paidAmount
          )
        )
      );
    const dueAmount =
      amount - paidAmount;

    const oldPaidAmount = Number(fee.paidAmount || 0);
    const paidDifference = paidAmount - oldPaidAmount;

    if (paidDifference > 0) {
      const profile = await getSchoolProfileService({ schoolId });
      const receiptMeta = await getNextReceiptMeta({
        schoolId,
        schoolName: profile.schoolName,
      });
      const paymentId = crypto.randomUUID();

      await db.insert(studentPaymentsTable).values({
        id: paymentId,
        schoolId,
        studentId,
        studentFeeId: fee.id,
        feeTypeId: fee.feeTypeId,
        amount: paidDifference,
        paymentMode: "Cash",
        receiptNo: receiptMeta.receiptNo,
        receiptSequence: receiptMeta.receiptSequence,
        receiptAcademicYear: receiptMeta.receiptAcademicYear,
        paidAt: Date.now(),
        note: "Direct fee edit adjustment",
        createdAt: Date.now(),
      });
    }

    const activeAcademicYear = await getActiveAcademicYearService({ schoolId });
    const status = makeFeeStatus({
      amount,
      paidAmount,
      academicYear: fee.academicYear,
      activeAcademicYear,
    });

    await db
      .update(studentFeesTable)
      .set({
        amount,
        paidAmount,
        dueAmount,
        status,
      })
      .where(
        and(
          eq(
            studentFeesTable.id,
            feeId
          ),
          eq(
            studentFeesTable.schoolId,
            schoolId
          )
        )
      );

    return await getStudentDetailService({
      schoolId,
      studentId,
    });
  };

export const recordStudentPaymentService =
  async ({
    schoolId,
    studentId,
    data,
  }) => {
    const parsed =
      recordStudentPaymentSchema.parse(
        data
      );

    await getStudentForSchool({
      schoolId,
      studentId,
    });

    const [fee] =
      await db
        .select()
        .from(studentFeesTable)
        .where(
          and(
            eq(
              studentFeesTable.id,
              parsed.studentFeeId
            ),
            eq(
              studentFeesTable.studentId,
              studentId
            ),
            eq(
              studentFeesTable.schoolId,
              schoolId
            )
          )
        );

    if (!fee) {
      throw createStudentError({
        statusCode: 404,
        code: "FEE_NOT_FOUND",
        message:
          "Student fee not found",
      });
    }

    const amount =
      Number(parsed.amount);
    const dueAmount =
      Number(
        fee.dueAmount || 0
      );

    if (amount > dueAmount) {
      throw createStudentError({
        statusCode: 400,
        code: "PAYMENT_TOO_HIGH",
        message:
          "Payment amount cannot be greater than remaining fee",
      });
    }

    const nextPaid =
      Number(
        fee.paidAmount || 0
      ) + amount;
    const nextDue =
      Math.max(
        0,
        Number(fee.amount || 0) -
          nextPaid
      );

    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const receiptMeta =
      await getNextReceiptMeta({
        schoolId,
        schoolName:
          profile.schoolName,
      });
    const paymentId =
      crypto.randomUUID();

    await db
      .insert(
        studentPaymentsTable
      )
      .values({
        id:
          paymentId,
        schoolId,
        studentId,
        studentFeeId:
          fee.id,
        feeTypeId:
          fee.feeTypeId,
        amount,
        paymentMode:
          normalizeOptional(
            parsed.paymentMode
          ) || "Cash",
        receiptNo:
          receiptMeta.receiptNo,
        receiptSequence:
          receiptMeta.receiptSequence,
        receiptAcademicYear:
          receiptMeta.receiptAcademicYear,
        paidAt:
          normalizeTimestamp(
            parsed.paidAt
          ),
        note:
          normalizeOptional(
            parsed.note
          ),
        remark:
          normalizeOptional(
            parsed.remark
          ),
        transactionRef:
          normalizeOptional(
            parsed.transactionRef
          ),
        createdAt:
          Date.now(),
      });

    const activeAcademicYear =
      await getActiveAcademicYearService({
        schoolId,
      });

    await db
      .update(studentFeesTable)
      .set({
        paidAmount:
          nextPaid,
        dueAmount:
          nextDue,
        lastPaidDate:
          Date.now(),
        nextReminderDate:
          Date.now() + 90 * 24 * 60 * 60 * 1000,
        status:
          makeFeeStatus({
            amount:
              fee.amount,
            paidAmount:
              nextPaid,
            academicYear:
              fee.academicYear,
            activeAcademicYear,
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

    await deleteCache(keys.dashboard(schoolId, fee.academicYear));
    await deleteCache(keys.dashboardInsights(schoolId, fee.academicYear));
    if (activeAcademicYear !== fee.academicYear) {
      await deleteCache(keys.dashboard(schoolId, activeAcademicYear));
      await deleteCache(keys.dashboardInsights(schoolId, activeAcademicYear));
    }

    // Trigger WhatsApp receipt send asynchronously
    (async () => {
      try {
        const { sendFeeReceipt } = await import("../whatsapp/whatsapp.service.js");
        await sendFeeReceipt(paymentId);
      } catch (err) {
        console.error("Failed to trigger WhatsApp receipt sending:", err);
      }
    })();

    const detail =
      await getStudentDetailService({
        schoolId,
        studentId,
      });

    return {
      ...detail,
      receipt: {
        paymentId,
        ...receiptMeta,
      },
    };
  };

const getReceiptPayment =
  async ({
    schoolId,
    studentId,
    paymentId,
  }) => {
    const [payment] =
      await db
        .select()
        .from(studentPaymentsTable)
        .where(
          and(
            eq(
              studentPaymentsTable.id,
              paymentId
            ),
            eq(
              studentPaymentsTable.studentId,
              studentId
            ),
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            )
          )
        );

    if (!payment) {
      throw createStudentError({
        statusCode: 404,
        code: "PAYMENT_NOT_FOUND",
        message:
          "Payment not found",
      });
    }

    return payment;
  };

export const getStudentPaymentReceiptPdfService =
  async ({
    schoolId,
    studentId,
    paymentId,
  }) => {
    const payment =
      await getReceiptPayment({
        schoolId,
        studentId,
        paymentId,
      });
    const detail =
      await getStudentDetailService({
        schoolId,
        studentId,
      });
    const profile =
      await getSchoolProfileService({
        schoolId,
      });
    const viewModel =
      await buildPaymentReceiptViewModel({
        payment,
        detail,
        profile,
        schoolId,
      });
    const html =
      renderReceiptHtml(viewModel);
    const buffer =
      await generateReceiptPdf(html);

    const studentName =
      detail.student?.fullName ||
      [
        detail.student?.firstName,
        detail.student?.lastName,
      ]
        .filter(Boolean)
        .join(" ");

    return {
      fileName: buildReceiptFileName({
        studentName,
        paidAt: payment.paidAt,
      }),
      buffer,
    };
  };

const normalizeImportRow =
  ({
    row,
    classId,
    sectionId,
  }) => {
    const fullName =
      clean(
        getRowValue(row, [
          "nameofstudents",
          "studentname",
          "name",
          "fullname",
        ])
      );

    const split =
      splitName(fullName);

    return {
      classId,
      sectionId,
      schoolRegisterNo:
        clean(
          getRowValue(row, [
            "srno",
            "srnoschoolregisterno",
            "serialno",
            "schoolregisterno",
            "register no",
            "registerno",
            "admissionno",
          ])
        ),
      firstName:
        split.firstName,
      lastName:
        split.lastName,
      fatherName:
        clean(
          getRowValue(row, [
            "fathername",
            "fathersname",
          ])
        ),
      dob:
        normalizeDateValue(
          getRowValue(row, [
            "dob",
            "dobxxxxxxxxformat",
            "dobddmmyyyyformat",
            "dateofbirth",
          ])
        ),
      phone:
        clean(
          getRowValue(row, [
            "mobilenumber",
            "mobile",
            "phone",
            "phonenumber",
          ])
        ),
      gender:
        clean(
          getRowValue(row, [
            "gender",
          ])
        ),
      aadharNo:
        clean(
          getRowValue(row, [
            "aadharno",
            "aadhaarno",
            "aadharnumber",
            "aadhaarnumber",
          ])
        ),
      aadharVerificationStatus:
        clean(
          getRowValue(row, [
            "verifcationstatusofaadhar",
            "verificationstatusofaadhar",
            "aadharverificationstatus",
            "aadhaarverificationstatus",
          ])
        ),
      admissionDate:
        normalizeDateValue(
          getRowValue(row, [
            "admisiondate",
            "admissiondate",
          ])
        ),
    };
  };

export const importStudentsService =
  async ({
    schoolId,
    data,
  }) => {
    await assertActiveSection({
      schoolId,
      classId:
        data.classId,
      sectionId:
        data.sectionId,
    });

    const workbook =
      XLSX.read(
        Buffer.from(
          data.fileBase64,
          "base64"
        ),
        {
          type: "buffer",
          cellDates: false,
        }
      );

    const sheetName =
      workbook.SheetNames[0];

    if (!sheetName) {
      throw createStudentError({
        statusCode: 400,
        code: "EMPTY_EXCEL_FILE",
        message:
          "Excel file has no sheets",
      });
    }

    const rows =
      XLSX.utils.sheet_to_json(
        workbook.Sheets[sheetName],
        {
          defval: "",
        }
      );

    const result = {
      created: 0,
      skipped: 0,
      errors: [],
    };

    for (const [
      index,
      row,
    ] of rows.entries()) {
      const rowNumber =
        index + 2;

      const normalized =
        normalizeImportRow({
          row,
          classId:
            data.classId,
          sectionId:
            data.sectionId,
        });

      const parsed =
        createStudentSchema
          .safeParse(
            normalized
          );

      if (!parsed.success) {
        result.skipped += 1;
        result.errors.push({
          rowNumber,
          message:
            parsed.error.errors[0]
              ?.message ||
            "Invalid student row",
        });
        continue;
      }

      if (
        !dobRegex.test(
          parsed.data.dob
        )
      ) {
        result.skipped += 1;
        result.errors.push({
          rowNumber,
          message:
            "DOB must be DD/MM/YYYY",
        });
        continue;
      }

      try {
        await createStudentRecord({
          schoolId,
          data:
            parsed.data,
        });
        result.created += 1;
      } catch (error) {
        result.skipped += 1;
        result.errors.push({
          rowNumber,
          message:
            error.message,
        });
      }
    }

    return result;
  };

export const getImageKitAuthService =
  () => {
    if (
      !env.IMAGEKIT_PUBLIC_KEY ||
      !env.IMAGEKIT_PRIVATE_KEY
    ) {
      throw createStudentError({
        statusCode: 503,
        code: "IMAGEKIT_NOT_CONFIGURED",
        message:
          "ImageKit credentials are not configured",
      });
    }

    const token =
      crypto.randomUUID();

    const expire =
      Math.floor(
        Date.now() / 1000
      ) + 60 * 10;

    const signature =
      crypto
        .createHmac(
          "sha1",
          env.IMAGEKIT_PRIVATE_KEY
        )
        .update(
          token + expire
        )
        .digest("hex");

    return {
      token,
      expire,
      signature,
      publicKey:
        env.IMAGEKIT_PUBLIC_KEY,
    };
  };

/**
 * Promotes a list of 10th-class students into their chosen 11th stream.
 *
 * Each entry in `data.students` must supply:
 *   - studentId        – student to promote
 *   - targetClassId    – an 11th-* class that belongs to this school
 *   - targetSectionId  – a section in that class
 *   - note?            – optional movement note
 *
 * The service validates that every supplied student:
 *   1. Belongs to this school
 *   2. Is currently active
 *   3. Is in a class whose name is exactly "10th"
 * Then delegates actual promotion (enrollment record + cache update) to
 * promoteStudentService with skipTenthGuard = true.
 */
export const promoteStreamService = async ({ schoolId, data = {} }) => {
  const { students, fromAcademicYear, targetAcademicYear } = data;

  if (!Array.isArray(students) || students.length === 0) {
    throw createStudentError({
      statusCode: 400,
      code: "NO_STUDENTS",
      message: "At least one student entry is required",
    });
  }

  // If year-pair is provided, ensure the target academic year structure exists
  if (fromAcademicYear && targetAcademicYear) {
    await ensureAcademicYearStructure({
      schoolId,
      fromAcademicYear,
      targetAcademicYear,
    });
  }

  const result = {
    promoted: 0,
    skipped: 0,
    errors: [],
  };

  for (const entry of students) {
    const { studentId, targetClassId, targetSectionId, note } = entry;

    try {
      // 1. Fetch student and verify school ownership
      const student = await getStudentForSchool({ schoolId, studentId });

      // 2. Must be active
      if (student.status !== "active") {
        result.skipped += 1;
        result.errors.push({
          studentId,
          message: `Student is not active (status: ${student.status})`,
        });
        continue;
      }

      // 3. Fetch current class
      const { singleClass } = await assertSectionForSchool({
        schoolId,
        classId: student.classId,
        sectionId: student.sectionId,
      });

      // 4. Must be in 10th
      if (!isTenthClass(singleClass)) {
        result.skipped += 1;
        result.errors.push({
          studentId,
          message: `Student is in class "${singleClass.name}", not in 10th`,
        });
        continue;
      }

      // 5. Verify target class starts with "11th-"
      const [targetClass] = await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(classesTable.id, targetClassId),
            eq(classesTable.schoolId, schoolId)
          )
        );

      if (!targetClass) {
        result.skipped += 1;
        result.errors.push({
          studentId,
          message: "Target class not found",
        });
        continue;
      }

      const targetName = String(targetClass.name || "").toLowerCase();
      if (!targetName.startsWith("11th-")) {
        result.skipped += 1;
        result.errors.push({
          studentId,
          message: `Target class "${targetClass.name}" is not a valid 11th stream class`,
        });
        continue;
      }

      // 6. Promote — skipTenthGuard lets us bypass the guard inside promoteStudentService
      await promoteStudentService({
        schoolId,
        studentId,
        data: {
          targetClassId,
          targetSectionId,
          note: note || "Stream promotion from 10th",
        },
        skipTenthGuard: true,
      });

      result.promoted += 1;
    } catch (err) {
      result.skipped += 1;
      result.errors.push({
        studentId,
        message: err.message || "Unexpected error during stream promotion",
      });
    }
  }

  return result;
};

export const moveStudentStreamService = async ({ schoolId, studentId, data }) => {
  const { targetClassId, targetSectionId, note } = data;

  // 1. Fetch student and verify school ownership
  const student = await getStudentForSchool({ schoolId, studentId });
  if (student.status !== "active") {
    throw createStudentError({
      statusCode: 400,
      code: "INACTIVE_STUDENT",
      message: "Student is not active",
    });
  }

  // 2. Fetch current class and section
  const { singleClass: currentClass } = await assertSectionForSchool({
    schoolId,
    classId: student.classId,
    sectionId: student.sectionId,
  });

  // Verify it is an 11th or 12th grade class
  const currentClassName = String(currentClass.name || "");
  const isStreamClass = currentClassName.startsWith("11th-") || currentClassName.startsWith("12th-");
  if (!isStreamClass) {
    throw createStudentError({
      statusCode: 400,
      code: "NOT_STREAM_CLASS",
      message: "Student must be in an 11th or 12th grade class to move stream",
    });
  }

  // 3. Fetch target class
  const [targetClass] = await db
    .select()
    .from(classesTable)
    .where(
      and(
        eq(classesTable.id, targetClassId),
        eq(classesTable.schoolId, schoolId),
        eq(classesTable.isArchived, false)
      )
    );

  if (!targetClass) {
    throw createStudentError({
      statusCode: 404,
      code: "CLASS_NOT_FOUND",
      message: "Target class not found",
    });
  }

  const targetClassName = String(targetClass.name || "");
  
  // Verify target class is at the same grade level (e.g. 11th to 11th, or 12th to 12th)
  const getPrefix = (name) => name.startsWith("11th-") ? "11th-" : name.startsWith("12th-") ? "12th-" : null;
  const currentPrefix = getPrefix(currentClassName);
  const targetPrefix = getPrefix(targetClassName);

  if (!targetPrefix || currentPrefix !== targetPrefix) {
    throw createStudentError({
      statusCode: 400,
      code: "INVALID_STREAM_TARGET",
      message: `Cannot move student from ${currentClassName} to ${targetClassName}. Grade level must match.`,
    });
  }

  // 4. Verify target section is active under target class
  await assertActiveSection({
    schoolId,
    classId: targetClassId,
    sectionId: targetSectionId,
  });

  // 5. Update enrollment: find the active enrollment for this student in this academic year
  const [activeEnrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.studentId, studentId),
        eq(enrollmentsTable.schoolId, schoolId),
        eq(enrollmentsTable.status, "active")
      )
    );

  if (activeEnrollment) {
    await db
      .update(enrollmentsTable)
      .set({
        classId: targetClassId,
        sectionId: targetSectionId,
        note: note ? normalizeOptional(note) : activeEnrollment.note,
      })
      .where(eq(enrollmentsTable.id, activeEnrollment.id));
  }

  // 6. Update student cache fields
  await db
    .update(studentsTable)
    .set({
      classId: targetClassId,
      sectionId: targetSectionId,
      movementNote: note ? normalizeOptional(note) : student.movementNote,
      previousClassId: student.classId,
      previousSectionId: student.sectionId,
    })
    .where(eq(studentsTable.id, studentId));

  // 7. Reallocate fees:
  // Fetch existing fees for this student in the OLD class
  const existingStudentFees = await db
    .select()
    .from(studentFeesTable)
    .where(
      and(
        eq(studentFeesTable.studentId, studentId),
        eq(studentFeesTable.classId, student.classId),
        eq(studentFeesTable.schoolId, schoolId)
      )
    );

  // Fetch active class fees for the TARGET class
  const targetClassFees = await db
    .select()
    .from(classFeesTable)
    .where(
      and(
        eq(classFeesTable.classId, targetClassId),
        eq(classFeesTable.schoolId, schoolId),
        eq(classFeesTable.isArchived, false)
      )
    );

  // Match by feeTypeId
  const matchedStudentFeeIds = new Set();

  for (const targetFee of targetClassFees) {
    const matchedFee = existingStudentFees.find(
      (sf) => sf.feeTypeId === targetFee.feeTypeId
    );

    if (matchedFee) {
      // Update existing fee record to refer to targetClassId and adjust amounts
      const newAmount = targetFee.amount;
      const paidAmount = matchedFee.paidAmount || 0;
      const dueAmount = Math.max(0, newAmount - paidAmount);
      const newStatus = dueAmount <= 0 ? "paid" : (paidAmount > 0 ? "partial" : "pending");

      await db
        .update(studentFeesTable)
        .set({
          classId: targetClassId,
          amount: newAmount,
          dueAmount: dueAmount,
          status: newStatus,
        })
        .where(eq(studentFeesTable.id, matchedFee.id));

      matchedStudentFeeIds.add(matchedFee.id);
    } else {
      // Allocate new fee for the target class
      await db
        .insert(studentFeesTable)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          studentId,
          feeTypeId: targetFee.feeTypeId,
          amount: targetFee.amount,
          paidAmount: 0,
          dueAmount: targetFee.amount,
          status: "pending",
          classId: targetClassId,
          academicYear: targetClass.academicYear,
          createdAt: Date.now(),
        });
    }
  }

  // Handle fees that were in the old class but are NOT in the target class
  for (const sf of existingStudentFees) {
    if (matchedStudentFeeIds.has(sf.id)) continue;

    if ((sf.paidAmount || 0) === 0) {
      // Delete the student fee record since it has no payments
      await db
        .delete(studentFeesTable)
        .where(eq(studentFeesTable.id, sf.id));
    } else {
      // Keep the student fee record, but update its classId to targetClassId
      // so it is associated with their current enrollment class.
      await db
        .update(studentFeesTable)
        .set({
          classId: targetClassId,
        })
        .where(eq(studentFeesTable.id, sf.id));
    }
  }

  await reshuffleRollNumbers({
    schoolId,
    classId: student.classId,
    sectionId: student.sectionId,
  });

  await reshuffleRollNumbers({
    schoolId,
    classId: targetClassId,
    sectionId: targetSectionId,
  });

  return await getStudentDetailService({
    schoolId,
    studentId,
  });
};

export const archiveStudentService = async ({ schoolId, studentId }) => {
  const student = await getStudentForSchool({ schoolId, studentId });
  if (student.status === "archived") {
    throw createStudentError({
      statusCode: 400,
      code: "STUDENT_ALREADY_ARCHIVED",
      message: "Student is already archived",
    });
  }

  await db
    .update(studentsTable)
    .set({
      status: "archived",
      movementNote: "Student archived",
    })
    .where(
      and(
        eq(studentsTable.id, studentId),
        eq(studentsTable.schoolId, schoolId)
      )
    );

  const [activeEnrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.studentId, studentId),
        eq(enrollmentsTable.schoolId, schoolId),
        eq(enrollmentsTable.status, "active")
      )
    );

  if (activeEnrollment) {
    await db
      .update(enrollmentsTable)
      .set({
        status: "left",
        note: "Student archived",
      })
      .where(eq(enrollmentsTable.id, activeEnrollment.id));
  }

  await reshuffleRollNumbers({
    schoolId,
    classId: student.classId,
    sectionId: student.sectionId,
  });

  return await getStudentDetailService({
    schoolId,
    studentId,
  });
};

export const unarchiveStudentService = async ({ schoolId, studentId }) => {
  const student = await getStudentForSchool({ schoolId, studentId });
  if (student.status !== "archived") {
    throw createStudentError({
      statusCode: 400,
      code: "STUDENT_NOT_ARCHIVED",
      message: "Student is not archived",
    });
  }

  await db
    .update(studentsTable)
    .set({
      status: "active",
      movementNote: "Student unarchived",
    })
    .where(
      and(
        eq(studentsTable.id, studentId),
        eq(studentsTable.schoolId, schoolId)
      )
    );

  // Restore the enrollment record to active if it was set to left when archived
  const [leftEnrollment] = await db
    .select()
    .from(enrollmentsTable)
    .where(
      and(
        eq(enrollmentsTable.studentId, studentId),
        eq(enrollmentsTable.schoolId, schoolId),
        eq(enrollmentsTable.status, "left")
      )
    )
    .orderBy(desc(enrollmentsTable.createdAt));

  if (leftEnrollment) {
    await db
      .update(enrollmentsTable)
      .set({
        status: "active",
        note: "Student unarchived",
      })
      .where(eq(enrollmentsTable.id, leftEnrollment.id));
  }

  await reshuffleRollNumbers({
    schoolId,
    classId: student.classId,
    sectionId: student.sectionId,
  });

  return await getStudentDetailService({
    schoolId,
    studentId,
  });
};

