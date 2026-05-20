import crypto from "crypto";
import XLSX from "xlsx";
import { jsPDF } from "jspdf";

import {
  db,
  sqlClient,
}
  from "../../cors/database/DB.Connect.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  studentPaymentsTable,
} from "../../cors/schema/studentPayments.schema.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import {
  feeTypesTable,
} from "../../cors/schema/feesType.schema.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

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
} from "drizzle-orm";

import {
  env,
} from "../../cors/config/env.js";

import {
  getActiveAcademicYearService,
  getSchoolProfileService,
} from "../settings/settings.service.js";

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

const makePaymentStatus =
  ({
    pendingFees,
    collectedFees,
  }) =>
    pendingFees === 0
      ? "Paid"
      : collectedFees > 0
        ? "Partial"
        : "Pending";

const makeFeeStatus =
  ({
    amount,
    paidAmount,
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

    return safeAmount === safePaid
      ? "paid"
      : safePaid > 0
        ? "partial"
        : "pending";
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

    for (const catalogClass of getClassCatalog(
      targetAcademicYear
    )) {
      if (
        !classByName.has(
          catalogClass.name
        )
      ) {
        const newClass = {
          id:
            crypto.randomUUID(),
          schoolId,
          name:
            catalogClass.name,
          sequence:
            catalogClass.sequence,
          academicYear:
            catalogClass.academicYear,
          createdAt:
            Date.now(),
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
              Date.now(),
          });
        targetSectionNames.add(
          sourceSection.name
        );
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

const getNextReceiptMeta =
  async ({
    schoolId,
    schoolName,
    academicYear,
  }) => {
    const counterId =
      `${schoolId}:${academicYear}`;
    const result =
      await sqlClient.execute({
        sql:
          `INSERT INTO receipt_counters (id, school_id, academic_year, last_sequence, updated_at)
           VALUES (?, ?, ?, 1, ?)
           ON CONFLICT(school_id, academic_year)
           DO UPDATE SET
             last_sequence = receipt_counters.last_sequence + 1,
             updated_at = excluded.updated_at
           RETURNING last_sequence`,
        args: [
          counterId,
          schoolId,
          academicYear,
          Date.now(),
        ],
      });
    const nextSequence =
      Number(
        result.rows[0]?.last_sequence ||
          1
      );

    const receiptNo =
      `${makeSchoolCode(schoolName)}/${academicYear}/${String(nextSequence).padStart(6, "0")}`;

    return {
      receiptNo,
      receiptSequence:
        nextSequence,
      receiptAcademicYear:
        academicYear,
    };
  };

const getImageDataUrl =
  async (url) => {
    if (!url) {
      return null;
    }

    try {
      const response =
        await fetch(url);

      if (!response.ok) {
        return null;
      }

      const contentType =
        response.headers.get(
          "content-type"
        ) || "image/png";
      const buffer =
        Buffer.from(
          await response.arrayBuffer()
        );

      return {
        dataUrl:
          `data:${contentType};base64,${buffer.toString("base64")}`,
        format:
          contentType.includes("jpeg") ||
          contentType.includes("jpg")
            ? "JPEG"
            : "PNG",
      };
    } catch {
      return null;
    }
  };

const drawWrappedText =
  ({
    doc,
    text,
    x,
    y,
    maxWidth,
    lineHeight = 5,
  }) => {
    const lines =
      doc.splitTextToSize(
        String(text || ""),
        maxWidth
      );

    doc.text(lines, x, y);

    return y + lines.length * lineHeight;
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

    return student;
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
          const feeSummary =
            await db
              .select({
                pending:
                  sql`
                    coalesce(
                      sum(
                        ${studentFeesTable.dueAmount}
                      ),
                      0
                    )
                  `,
                collected:
                  sql`
                    coalesce(
                      sum(
                        ${studentFeesTable.paidAmount}
                      ),
                      0
                    )
                  `,
              })
              .from(
                studentFeesTable
              )
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
              );

          const pendingFees =
            Number(
              feeSummary[0]
                ?.pending || 0
            );

          const collectedFees =
            Number(
              feeSummary[0]
                ?.collected || 0
            );

          const paymentStatus =
            makePaymentStatus({
              pendingFees,
              collectedFees,
            });

          return {
            ...student,
            pendingFees,
            collectedFees,
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

            const totalFees =
              fees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.amount || 0
                  ),
                0
              );
            const collectedFees =
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
              paymentStatus:
                makePaymentStatus({
                  pendingFees,
                  collectedFees,
                }),
              publicStatus:
                (student.status ||
                  "active") === "previous"
                  ? "left"
                  : student.status ||
                    "active",
              statusLabel:
                (student.status ||
                  "active") === "previous"
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
          const key =
            student.status ||
            "active";
          summary[key] =
            (summary[key] || 0) +
            1;
          if (key === "previous") {
            summary.left += 1;
          }
          summary.all += 1;
          return summary;
        },
        {
          active: 0,
          alumni: 0,
          previous: 0,
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
          const matchesStatus =
            status === "all" ||
            (student.status ||
              "active") === status;
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
      classId,
      sectionId,
      monthYear,
      paymentMode,
      sortBy,
    } =
      normalizeFeesLedgerQuery(query);
    const monthWindow =
      getMonthWindow(monthYear);
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
            const totalFees =
              fees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.amount || 0
                  ),
                0
              );
            const paidAmount =
              fees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.paidAmount || 0
                  ),
                0
              );
            const dueAmount =
              fees.reduce(
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
                ? payments.filter(
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
                : payments;
            const hasPaymentInMonth =
              selectedMonthPayments
                .length > 0;
            const baseStatus =
              dueAmount === 0
                ? "Paid"
                : paidAmount > 0
                  ? "Partial"
                  : "Unpaid";
            const ledgerStatus =
              dueAmount > 0 &&
              monthWindow &&
              !hasPaymentInMonth
                ? "Overdue"
                : baseStatus;
            const normalizedPayments =
              payments.map(
                (payment) => ({
                  ...payment,
                  paymentMode:
                    payment.paymentMode ||
                    "Cash",
                })
              );
            const dueFees =
              fees
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
              status:
                ledgerStatus,
              baseStatus,
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
              dueFees,
            };
          }
        )
      );
    const filterOptions =
      ledgerRows.reduce(
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
      ledgerRows.filter((row) => {
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

        return (
          matchesSearch &&
          matchesClass &&
          matchesSection &&
          matchesPaymentMode &&
          matchesStatus
        );
      });
    const statusCounts =
      ledgerRows.reduce(
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

    return await Promise.all(
      rows.map(async (fee) => {
        const [feeType] =
          await db
            .select()
            .from(feeTypesTable)
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
          isOptional:
            Boolean(
              feeType?.isOptional
            ),
        };
      })
    );
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

    return await Promise.all(
      rows.map(async (payment) => {
        const [feeType] =
          await db
            .select()
            .from(feeTypesTable)
            .where(
              and(
                eq(
                  feeTypesTable.id,
                  payment.feeTypeId
                ),
                eq(
                  feeTypesTable.schoolId,
                  schoolId
                )
              )
            );

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
      })
    );
  };

const makeStudentStats =
  ({
    fees,
    payments,
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
        payments[0] || null,
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
          fee.status ||
          makeFeeStatus(fee),
      }));

    return {
      student: {
        ...student,
        paymentStatus:
          makePaymentStatus({
            pendingFees:
              normalizedFees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.dueAmount || 0
                  ),
                0
              ),
            collectedFees:
              normalizedFees.reduce(
                (sum, fee) =>
                  sum +
                  Number(
                    fee.paidAmount || 0
                  ),
                0
              ),
          }),
      },
      class:
        singleClass,
      section,
      fees:
        normalizedFees,
      payments,
      stats:
        makeStudentStats({
          fees:
            normalizedFees,
          payments,
        }),
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
      rollNumber:
        makeRollNumber(
          schoolRegisterNo
        ),
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

    if (isFinalClass(singleClass)) {
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

    await db
      .update(studentsTable)
      .set({
        classId:
          parsed.targetClassId,
        sectionId:
          parsed.targetSectionId,
        status: "active",
        lastAcademicYear:
          singleClass.academicYear,
        previousClassId:
          student.classId,
        previousSectionId:
          student.sectionId,
        leftAt: null,
        alumniAt: null,
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

    const result = {
      promoted: 0,
      alumni: 0,
      skipped: 0,
      errors: [],
    };

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

        if (isFinalClass(singleClass)) {
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

        if (isTenthClass(singleClass)) {
          result.skipped += 1;
          result.errors.push({
            studentId:
              student.id,
            message:
              "10th class requires manual stream selection",
          });
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
          result.skipped += 1;
          result.errors.push({
            studentId:
              student.id,
            message:
              "Next class is not available",
          });
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
        });
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

    await db
      .update(studentFeesTable)
      .set({
        amount,
        paidAmount,
        dueAmount,
        status:
          makeFeeStatus({
            amount,
            paidAmount,
          }),
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
    const activeAcademicYear =
      await getActiveAcademicYearService({
        schoolId,
      });
    const receiptMeta =
      await getNextReceiptMeta({
        schoolId,
        schoolName:
          profile.schoolName,
        academicYear:
          activeAcademicYear,
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
        createdAt:
          Date.now(),
      });

    await db
      .update(studentFeesTable)
      .set({
        paidAmount:
          nextPaid,
        dueAmount:
          nextDue,
        status:
          makeFeeStatus({
            amount:
              fee.amount,
            paidAmount:
              nextPaid,
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

const drawReceiptTable =
  ({
    doc,
    fees,
    startY,
  }) => {
    const x = 14;
    const tableWidth = 182;
    const columnWidths = [
      18,
      102,
      32,
      30,
    ];
    const headers = [
      "#",
      "PARTICULARS",
      "DUE AMOUNT (₹)",
      "PAID AMOUNT (₹)",
    ];
    const headerHeight = 9;
    const rowHeight = 8;
    let y = startY;

    doc.setFillColor(8, 38, 95);
    doc.rect(x, y, tableWidth, headerHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");

    let cursor = x;
    headers.forEach((header, index) => {
      const align = index > 1 ? "right" : "left";
      const xPos = index > 1 ? cursor + columnWidths[index] - 2 : cursor + 2;
      doc.text(header, xPos, y + 6, { align });
      cursor += columnWidths[index];
    });

    doc.setDrawColor(200, 210, 225);
    cursor = x;
    columnWidths.slice(0, -1).forEach((width) => {
      cursor += width;
      doc.line(cursor, y, cursor, y + headerHeight);
    });

    y += headerHeight;
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    fees.forEach((fee, index) => {
      if (y + rowHeight > 192) {
        return;
      }

      let rowX = x;
      columnWidths.forEach((width) => {
        doc.setDrawColor(220, 220, 220);
        doc.rect(rowX, y, width, rowHeight);
        rowX += width;
      });

      const feeName =
        String(fee.feeTypeName || "Fee");
      const trimmedName =
        feeName.length > 35
          ? `${feeName.slice(0, 32)}...`
          : feeName;
      let cellX = x;
      doc.text(
        String(index + 1),
        cellX + 2,
        y + 5.5
      );
      cellX += columnWidths[0];
      doc.text(
        trimmedName,
        cellX + 2,
        y + 5.5
      );
      cellX += columnWidths[1];
      doc.text(
        formatMoney(fee.dueAmount),
        cellX + columnWidths[2] - 2,
        y + 5.5,
        { align: "right" }
      );
      cellX += columnWidths[2];
      doc.text(
        formatMoney(fee.paidAmount),
        cellX + columnWidths[3] - 2,
        y + 5.5,
        { align: "right" }
      );
      y += rowHeight;
    });

    return y;
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
    const academicYear =
      payment.receiptAcademicYear ||
      (await getActiveAcademicYearService({
        schoolId,
      }));
    const [logoData, stampData, signatureData] =
      await Promise.all([
        getImageDataUrl(profile.logoUrl),
        getImageDataUrl(profile.stampUrl),
        getImageDataUrl(profile.principalSignatureUrl),
      ]);

    const fees = detail.fees || [];
    const totalAmount = fees.reduce(
      (sum, fee) => sum + Number(fee.amount || 0),
      0
    );
    const paidAmount = fees.reduce(
      (sum, fee) => sum + Number(fee.paidAmount || 0),
      0
    );
    const dueAmount = fees.reduce(
      (sum, fee) => sum + Number(fee.dueAmount || 0),
      0
    );
    const paymentStatus =
      dueAmount === 0
        ? "PAID"
        : paidAmount > 0
          ? "PARTIAL"
          : "UNPAID";
    const transactionId =
      clean(payment.note) ||
      payment.id ||
      "-";

    const doc = new jsPDF({
      unit: "mm",
      format: "a4",
    });

    const pageLeft = 15;
    const pageRight = 195;
    const pageWidth = pageRight - pageLeft;

    // ============ HEADER SECTION ============
    const headerTop = 15;
    const logoSize = 20;

    // Logo
    if (logoData) {
      doc.addImage(
        logoData.dataUrl,
        logoData.format,
        pageLeft,
        headerTop,
        logoSize,
        logoSize
      );
    } else {
      doc.setFillColor(240, 245, 250);
      doc.rect(
        pageLeft,
        headerTop,
        logoSize,
        logoSize
      );
    }

    // School name and info
    const schoolInfoX = pageLeft + logoSize + 8;
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(
      profile.schoolName || "School Name",
      schoolInfoX,
      headerTop + 4
    );

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 80, 100);
    const addressLine =
      clean(profile.address) || "-";
    doc.text(`📍 ${addressLine}`, schoolInfoX, headerTop + 10);

    const mobileText =
      profile.mobile || "-";
    doc.text(`📞 ${mobileText}`, schoolInfoX, headerTop + 15);

    const emailText = clean(profile.email) || "-";
    doc.text(
      `📧 ${emailText}`,
      schoolInfoX,
      headerTop + 20
    );

    // Receipt box (top right)
    const receiptBoxX = pageRight - 58;
    const receiptBoxY = headerTop;
    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(1);
    doc.rect(
      receiptBoxX,
      receiptBoxY,
      58,
      28
    );

    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(
      "FEE RECEIPT",
      receiptBoxX + 29,
      receiptBoxY + 6,
      { align: "center" }
    );

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 80, 100);
    doc.text(
      "Receipt No.",
      receiptBoxX + 4,
      receiptBoxY + 12
    );
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.text(
      payment.receiptNo || payment.id,
      receiptBoxX + 4,
      receiptBoxY + 16
    );

    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 80, 100);
    doc.text(
      "Date",
      receiptBoxX + 4,
      receiptBoxY + 20
    );
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.text(
      formatReceiptDate(payment.paidAt),
      receiptBoxX + 4,
      receiptBoxY + 24
    );

    // Status badge
    const statusY = receiptBoxY + 26;
    const statusText = paymentStatus;
    const statusColor =
      paymentStatus === "PAID"
        ? [22, 163, 74]
        : paymentStatus === "PARTIAL"
          ? [249, 115, 22]
          : [185, 28, 28];

    doc.setFillColor(...statusColor);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const statusWidth = 40;
    const statusX = receiptBoxX + (58 - statusWidth) / 2;
    doc.roundedRect(
      statusX,
      statusY,
      statusWidth,
      6,
      2,
      2,
      "F"
    );
    doc.text(
      statusText,
      statusX + statusWidth / 2,
      statusY + 4,
      { align: "center" }
    );

    // ============ STUDENT & PAYMENT DETAILS ============
    const detailsY = headerTop + 32;
    const colWidth = pageWidth / 2 - 1;

    // Student Details Header
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("STUDENT DETAILS", pageLeft, detailsY);

    // Payment Details Header
    doc.text(
      "PAYMENT DETAILS",
      pageLeft + pageWidth / 2,
      detailsY
    );

    // Student details rows
    const detailsContentY = detailsY + 6;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);

    const studentDetails = [
      [
        "Student Name",
        detail.student.fullName || "-",
      ],
      [
        "Admission No.",
        detail.student.schoolRegisterNo || "-",
      ],
      [
        "Class & Section",
        `${detail.class?.name || "-"} ${detail.section?.name || ""}`,
      ],
      [
        "Roll No.",
        detail.student.rollNumber || "-",
      ],
      ["Father's Name", detail.student.fatherName || "-"],
    ];

    const paymentDetails = [
      [
        "Payment Mode",
        payment.paymentMode || "Cash",
      ],
      ["Transaction ID", transactionId],
      [
        "Payment Date",
        formatReceiptDateTime(payment.paidAt),
      ],
      ["Academic Year", academicYear],
    ];

    let rowY = detailsContentY;
    studentDetails.forEach(([label, value]) => {
      doc.setTextColor(100, 100, 100);
      doc.text(label, pageLeft + 2, rowY);
      doc.text(":", pageLeft + 54, rowY);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "normal");
      doc.text(value, pageLeft + 58, rowY);
      rowY += 5.5;
    });

    rowY = detailsContentY;
    paymentDetails.forEach(([label, value]) => {
      const colX = pageLeft + pageWidth / 2;
      doc.setTextColor(100, 100, 100);
      doc.text(label, colX + 2, rowY);
      doc.text(":", colX + 54, rowY);
      doc.setTextColor(30, 30, 30);
      doc.text(value, colX + 58, rowY);
      rowY += 5.5;
    });

    // ============ FEE TABLE ============
    const tableY = detailsY + 36;
    doc.setFillColor(8, 38, 95);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    const tableHeight = 7;
    doc.rect(
      pageLeft,
      tableY,
      pageWidth,
      tableHeight
    );

    const col1Width = 15;
    const col2Width = 130;
    const col3Width = 70;
    const col4Width = 70;

    doc.text("#", pageLeft + 2, tableY + 5.5);
    doc.text(
      "PARTICULARS",
      pageLeft + col1Width + 4,
      tableY + 5.5
    );
    doc.text(
      "DUE AMOUNT (₹)",
      pageLeft +
        col1Width +
        col2Width +
        col3Width -
        60,
      tableY + 5.5,
      { align: "right" }
    );
    doc.text(
      "PAID AMOUNT (₹)",
      pageRight - 4,
      tableY + 5.5,
      { align: "right" }
    );

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(8);

    let currentY = tableY + tableHeight;
    fees.forEach((fee, index) => {
      if (currentY > 220) return;

      doc.setDrawColor(220, 220, 220);
      doc.rect(
        pageLeft,
        currentY,
        pageWidth,
        6
      );

      doc.text(String(index + 1), pageLeft + 2, currentY + 4);
      doc.text(
        fee.feeTypeName || "Fee",
        pageLeft + col1Width + 4,
        currentY + 4
      );
      doc.text(
        formatMoney(fee.dueAmount),
        pageLeft +
          col1Width +
          col2Width +
          col3Width -
          60,
        currentY + 4,
        { align: "right" }
      );
      doc.text(
        formatMoney(fee.paidAmount),
        pageRight - 4,
        currentY + 4,
        { align: "right" }
      );

      currentY += 6;
    });

    // ============ AMOUNT IN WORDS (Left) ============
    const amountWordsY = currentY + 8;
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Amount in Words:", pageLeft, amountWordsY);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(22, 163, 74);
    doc.setFontSize(8);
    doc.text(
      numberToWords(payment.amount),
      pageLeft,
      amountWordsY + 5
    );

    // ============ SUMMARY BOX (Right) ============
    const summaryBoxY = currentY + 6;
    const summaryBoxX = pageLeft + 110;
    const summaryBoxWidth = pageRight - summaryBoxX;

    // Total Due
    doc.setFillColor(245, 245, 245);
    doc.rect(
      summaryBoxX,
      summaryBoxY,
      summaryBoxWidth,
      7
    );
    doc.setTextColor(60, 80, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Total Due Amount", summaryBoxX + 4, summaryBoxY + 5);
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.text(
      `: ${formatMoney(totalAmount)}`,
      summaryBoxX + 75,
      summaryBoxY + 5,
      { align: "right" }
    );

    // Total Paid
    doc.setFillColor(245, 245, 245);
    doc.rect(
      summaryBoxX,
      summaryBoxY + 7,
      summaryBoxWidth,
      7
    );
    doc.setTextColor(60, 80, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(
      "Total Paid Amount",
      summaryBoxX + 4,
      summaryBoxY + 12
    );
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.text(
      `: ${formatMoney(paidAmount)}`,
      summaryBoxX + 75,
      summaryBoxY + 12,
      { align: "right" }
    );

    // Balance Amount (Green)
    doc.setFillColor(22, 163, 74);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.rect(
      summaryBoxX,
      summaryBoxY + 14,
      summaryBoxWidth,
      8,
      1
    );
    doc.setFontSize(8.5);
    doc.text(
      "Balance Amount",
      summaryBoxX + 4,
      summaryBoxY + 18.5
    );
    doc.setFontSize(9);
    doc.text(
      `₹ ${formatMoney(dueAmount)}`,
      summaryBoxX + 75,
      summaryBoxY + 18.5,
      { align: "right" }
    );

    // ============ NOTES SECTION ============
    const notesY = summaryBoxY + 25;
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("NOTES", pageLeft, notesY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    let notesLineY = notesY + 6;
    const notesList = [
      "This is a computer generated receipt.",
      "No signature is required.",
      "Please retain this receipt for future reference.",
      "Fees once paid will not be refunded.",
    ];
    notesList.forEach((note) => {
      doc.text(`• ${note}`, pageLeft + 2, notesLineY);
      notesLineY += 4.5;
    });

    // ============ STAMP & SIGNATURE ============
    const stampSignatureY = notesY + 28;
    const stampX = pageLeft + 15;
    const signatureX = pageRight - 40;

    // Stamp
    if (stampData) {
      doc.addImage(
        stampData.dataUrl,
        stampData.format,
        stampX,
        stampSignatureY,
        20,
        20
      );
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.rect(stampX, stampSignatureY, 20, 20);
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(8, 38, 95);
    doc.text(
      "School Stamp",
      stampX + 10,
      stampSignatureY + 23,
      { align: "center" }
    );

    // Signature
    if (signatureData) {
      doc.addImage(
        signatureData.dataUrl,
        signatureData.format,
        signatureX - 15,
        stampSignatureY,
        30,
        15
      );
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.rect(
        signatureX - 15,
        stampSignatureY,
        30,
        15
      );
    }

    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(8, 38, 95);
    doc.text(
      "Authorized Signatory",
      signatureX,
      stampSignatureY + 20,
      { align: "center" }
    );

    // ============ FOOTER ============
    const footerY = 280;
    doc.setTextColor(8, 38, 95);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.text(
      "Thank you for your timely payment!",
      pageLeft + pageWidth / 2,
      footerY,
      { align: "center" }
    );

    return {
      fileName:
        `${(payment.receiptNo || payment.id).replace(/[\\/]/g, "-")}.pdf`,
      buffer: Buffer.from(doc.output("arraybuffer")),
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
