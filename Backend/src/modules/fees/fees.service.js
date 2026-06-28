import crypto from "crypto";

import {
  db,
  sqlClient,
}
  from "../../cors/database/DB.Connect.js";

import {
  feeTypesTable,
} from "../../cors/schema/feesType.schema.js";

import {
  classFeesTable,
} from "../../cors/schema/classFee.schema.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import { getCache, setCache, deleteCache } from "../../cors/cache/cache.service.js";
import { keys, TTL } from "../../cors/cache/cache.keys.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

import {
  eq,
  and,
  inArray,
} from "drizzle-orm";

import {
  getActiveAcademicYearService,
} from "../settings/settings.service.js";

import {
  cleanupUnusedClassesService,
} from "../classes/class.service.js";

export const ensureFeeColumns =
  async () => {
    const feeTypeColumns =
      await sqlClient.execute(
        "PRAGMA table_info(fee_types)"
      );
    const existingFeeTypeColumns =
      new Set(
        feeTypeColumns.rows.map(
          (row) => String(row.name)
        )
      );

    if (
      !existingFeeTypeColumns.has(
        "frequency"
      )
    ) {
      await sqlClient.execute(
        "ALTER TABLE fee_types ADD COLUMN frequency text DEFAULT 'Yearly'"
      );
    }
  };

export const getFeeTypesService =
  async ({ schoolId }) => {
    const cacheKey = keys.feeTypes(schoolId);
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await db
      .select()
      .from(feeTypesTable)
      .where(
        and(
          eq(
            feeTypesTable.schoolId,
            schoolId
          ),
          eq(
            feeTypesTable.isArchived,
            false
          )
        )
      );

    await setCache(cacheKey, result, TTL.FEE_TYPES);
    return result;
  };

export const getClassFeesService =
  async ({ schoolId, classId }) => {
    const cacheKey = keys.classFees(classId);
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const result = await db
      .select()
      .from(classFeesTable)
      .where(
        and(
          eq(classFeesTable.schoolId, schoolId),
          eq(classFeesTable.classId, classId),
          eq(classFeesTable.isArchived, false)
        )
      );

    await setCache(cacheKey, result, TTL.CLASS_FEES);
    return result;
  };

export const assertClassHasFeeStructure =
  async ({
    schoolId,
    classId,
  }) => {
    const activeFees =
      await db
        .select({
          id: classFeesTable.id,
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
              classId
            ),
            eq(
              classFeesTable.isArchived,
              false
            )
          )
        )
        .limit(1);

    if (activeFees.length === 0) {
      const error = new Error(
        "Fee structure is not defined for this class. Go to Settings → Fees, select the class, and assign fees before adding students."
      );
      error.statusCode = 409;
      error.code =
        "FEE_STRUCTURE_NOT_DEFINED";
      throw error;
    }
  };

export const getClassFeeStructureStatusService =
  async ({
    schoolId,
    classId,
  }) => {
    const activeFees =
      await db
        .select({
          id: classFeesTable.id,
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
              classId
            ),
            eq(
              classFeesTable.isArchived,
              false
            )
          )
        );

    let hasStudentFees = false;
    if (activeFees.length === 0) {
      const studentFees = await db
        .select({
          id: studentFeesTable.id,
        })
        .from(studentFeesTable)
        .innerJoin(
          studentsTable,
          eq(studentsTable.id, studentFeesTable.studentId)
        )
        .where(
          and(
            eq(studentsTable.classId, classId),
            eq(studentsTable.status, "active")
          )
        )
        .limit(1);
      hasStudentFees = studentFees.length > 0;
    }

    return {
      classId,
      hasFeeStructure:
        activeFees.length > 0 || hasStudentFees,
      feeCount:
        activeFees.length,
    };
  };

export const getFeeStructureService =
  async ({ schoolId, classId, academicYear }) => {
    let targetAcademicYear = academicYear;

    if (!targetAcademicYear && classId) {
      const [cls] = await db
        .select({ academicYear: classesTable.academicYear })
        .from(classesTable)
        .where(
          and(
            eq(classesTable.schoolId, schoolId),
            eq(classesTable.id, classId)
          )
        );
      if (cls) {
        targetAcademicYear = cls.academicYear;
      }
    }

    if (!targetAcademicYear) {
      targetAcademicYear =
        await getActiveAcademicYearService({
          schoolId,
        });
    }

    await cleanupUnusedClassesService({
      schoolId,
      academicYear: targetAcademicYear,
    });

    const [
      feeTypes,
      classes,
      classFees,
    ] =
      await Promise.all([
        getFeeTypesService({
          schoolId,
        }),
        db
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
              ),
              eq(
                classesTable.isArchived,
                false
              )
            )
          ),
        db
          .select()
          .from(classFeesTable)
          .where(
            eq(
              classFeesTable.schoolId,
              schoolId
            )
          ),
      ]);

    const activeClassFees =
      classFees.filter(
        (fee) => !fee.isArchived
      );

    const feeTypeById =
      new Map(
        feeTypes.map(
          (feeType) => [
            feeType.id,
            feeType,
          ]
        )
      );

    return {
      feeTypes,
      classes:
        classes
          .sort(
            (first, second) =>
              first.sequence -
              second.sequence
          )
          .map(
            (singleClass) => ({
              ...singleClass,
              fees:
                activeClassFees
                  .filter(
                    (fee) =>
                      fee.classId ===
                      singleClass.id
                  )
                  .map((fee) => {
                    const feeType =
                      feeTypeById.get(
                        fee.feeTypeId
                      );

                    return {
                      classFeeId:
                        fee.id,
                      feeTypeId:
                        fee.feeTypeId,
                      name:
                        feeType?.name ||
                        "Fee",
                      amount:
                        fee.amount,
                      isDefault:
                        Boolean(
                          fee.isDefault
                        ),
                      isOptional:
                        Boolean(
                          feeType?.isOptional
                        ),
                      frequency:
                        feeType?.frequency ||
                        "Yearly",
                      isArchived:
                        Boolean(
                          fee.isArchived ||
                            feeType?.isArchived
                        ),
                    };
                  }),
              archivedFees:
                classFees
                  .filter(
                    (fee) =>
                      fee.classId ===
                        singleClass.id &&
                      fee.isArchived
                  )
                  .map((fee) => {
                    const feeType =
                      feeTypeById.get(
                        fee.feeTypeId
                      );

                    return {
                      classFeeId:
                        fee.id,
                      feeTypeId:
                        fee.feeTypeId,
                      name:
                        feeType?.name ||
                        "Fee",
                      amount:
                        fee.amount,
                      isDefault:
                        Boolean(
                          fee.isDefault
                        ),
                      isOptional:
                        Boolean(
                          feeType?.isOptional
                        ),
                      frequency:
                        feeType?.frequency ||
                        "Yearly",
                    };
                  }),
            })
          ),
    };
  };

export const createFeeTypeService =
  async ({
    schoolId,
    data,
  }) => {

    try {

      const feeType = {
        id:
          crypto.randomUUID(),

        schoolId,

        frequency:
          data.frequency ||
          "Yearly",

        ...data,
      };

      await db
        .insert(feeTypesTable)
        .values(feeType);

      await deleteCache(keys.feeTypes(schoolId));

      return feeType;

    } catch (error) {
      const message = (error.message || "").toLowerCase() + " " + (error.cause?.message || "").toLowerCase();
      if (message.includes("unique")) {
        const err = new Error("Fee type already exists");
        err.statusCode = 400;
        err.code = "FEE_TYPE_ALREADY_EXISTS";
        throw err;
      }
      throw error;
    }
  };



export const updateFeeTypeService =
  async ({
    schoolId,
    feeTypeId,
    data,
  }) => {
    try {
      await db
        .update(feeTypesTable)
        .set(data)
        .where(
          and(
            eq(
              feeTypesTable.id,
              feeTypeId
            ),
            eq(
              feeTypesTable.schoolId,
              schoolId
            )
          )
        );

      await deleteCache(keys.feeTypes(schoolId));

      return true;
    } catch (error) {
      const message = (error.message || "").toLowerCase() + " " + (error.cause?.message || "").toLowerCase();
      if (message.includes("unique")) {
        const err = new Error("Fee type already exists");
        err.statusCode = 400;
        err.code = "FEE_TYPE_ALREADY_EXISTS";
        throw err;
      }
      throw error;
    }
  };


export const assignFeeToClassService =
  async ({
    schoolId,
    data,
  }) => {

    try {
      const [existing] =
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
                data.classId
              ),
              eq(
                classFeesTable.feeTypeId,
                data.feeTypeId
              )
            )
          );

      if (existing) {
        const updateData = {
          amount:
            data.amount,
          isDefault:
            data.isDefault,
          isArchived:
            false,
        };

        await db
          .update(classFeesTable)
          .set(updateData)
          .where(
            and(
              eq(
                classFeesTable.id,
                existing.id
              ),
              eq(
                classFeesTable.schoolId,
                schoolId
              )
            )
          );

        await deleteCache(keys.classFees(data.classId));

        return {
          ...existing,
          ...updateData,
        };
      }

      const classFee = {
        id:
          crypto.randomUUID(),

        schoolId,

        ...data,
      };

      await db
        .insert(classFeesTable)
        .values(classFee);

      await deleteCache(keys.classFees(data.classId));

      return classFee;

    } catch (error) {

      const message =
        error.message.toLowerCase();

      if (
        message.includes(
          "unique"
        )
      ) {
        throw new Error(
          "Fee already assigned to class"
        );
      }

      throw error;
    }
  };


export const updateClassFeeService =
  async ({
    schoolId,
    classFeeId,
    data,
  }) => {
    const [fee] = await db
      .select({ classId: classFeesTable.classId })
      .from(classFeesTable)
      .where(eq(classFeesTable.id, classFeeId));

    await db
      .update(classFeesTable)

      .set(data)

      .where(
        and(
          eq(
            classFeesTable.id,
            classFeeId
          ),

          eq(
            classFeesTable.schoolId,
            schoolId
          )
        )
      );

    if (fee) {
      await deleteCache(keys.classFees(fee.classId));
    }

    return true;
  };

export const archiveFeeTypeService =
  async ({
    schoolId,
    feeTypeId,
    isArchived = true,
  }) => {
    await db
      .update(feeTypesTable)
      .set({
        isArchived,
      })
      .where(
        and(
          eq(
            feeTypesTable.id,
            feeTypeId
          ),
          eq(
            feeTypesTable.schoolId,
            schoolId
          )
        )
      );

    await deleteCache(keys.feeTypes(schoolId));

    return true;
  };

export const archiveClassFeeService =
  async ({
    schoolId,
    classFeeId,
    isArchived = true,
  }) => {
    const [fee] = await db
      .select({ classId: classFeesTable.classId })
      .from(classFeesTable)
      .where(eq(classFeesTable.id, classFeeId));

    await db
      .update(classFeesTable)
      .set({
        isArchived,
      })
      .where(
        and(
          eq(
            classFeesTable.id,
            classFeeId
          ),
          eq(
            classFeesTable.schoolId,
            schoolId
          )
        )
      );

    if (fee) {
      await deleteCache(keys.classFees(fee.classId));
    }

    return true;
  };

export const allocateClassFeesService =
  async ({
    schoolId,
    data,
    optionalOnly = false,
  }) => {
    if (optionalOnly) {
      const feeTypes =
        await db
          .select()
          .from(feeTypesTable)
          .where(
            and(
              eq(
                feeTypesTable.schoolId,
                schoolId
              ),
              inArray(
                feeTypesTable.id,
                data.feeTypeIds
              )
            )
          );

      const hasMandatory =
        feeTypes.some(
          (feeType) =>
            !feeType.isOptional
        );

      if (hasMandatory) {
        const error =
          new Error(
            "Only optional fees can be assigned to individual students or sections"
          );
        error.statusCode = 400;
        error.code =
          "MANDATORY_FEE_NOT_ALLOWED";
        throw error;
      }
    }

    const [targetClass] = await db
      .select()
      .from(classesTable)
      .where(
        and(
          eq(classesTable.schoolId, schoolId),
          eq(classesTable.id, data.classId)
        )
      );

    if (!targetClass) {
      const error = new Error("Class not found");
      error.statusCode = 404;
      throw error;
    }

    const selectedClassFees =
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
              data.classId
            ),
            eq(
              classFeesTable.isArchived,
              false
            ),
            inArray(
              classFeesTable.feeTypeId,
              data.feeTypeIds
            )
          )
        );

    if (
      selectedClassFees.length === 0
    ) {
      return {
        created: 0,
        skipped: 0,
        students: 0,
      };
    }

    const studentFilters = [
      eq(
        studentsTable.schoolId,
        schoolId
      ),
      eq(
        studentsTable.classId,
        data.classId
      ),
      eq(
        studentsTable.status,
        "active"
      ),
    ];

    if (data.sectionId) {
      studentFilters.push(
        eq(
          studentsTable.sectionId,
          data.sectionId
        )
      );
    }

    if (
      data.studentIds?.length
    ) {
      studentFilters.push(
        inArray(
          studentsTable.id,
          data.studentIds
        )
      );
    }

    const students =
      await db
        .select()
        .from(studentsTable)
        .where(
          and(
            ...studentFilters
          )
        );

    if (students.length === 0) {
      return {
        created: 0,
        skipped: 0,
        students: 0,
      };
    }

    const existing =
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
              studentFeesTable.classId,
              data.classId
            ),
            inArray(
              studentFeesTable.studentId,
              students.map(
                (student) =>
                  student.id
              )
            ),
            inArray(
              studentFeesTable.feeTypeId,
              selectedClassFees.map(
                (fee) =>
                  fee.feeTypeId
              )
            )
          )
        );

    const existingKeys =
      new Set(
        existing.map(
          (fee) =>
            `${fee.studentId}:${fee.feeTypeId}`
        )
      );

    const rows = [];

    students.forEach(
      (student) => {
        selectedClassFees.forEach(
          (fee) => {
            const key =
              `${student.id}:${fee.feeTypeId}`;

            if (
              existingKeys.has(key)
            ) {
              return;
            }

            rows.push({
              id:
                crypto.randomUUID(),
              schoolId,
              studentId:
                student.id,
              feeTypeId:
                fee.feeTypeId,
              amount:
                fee.amount,
              paidAmount:
                0,
              dueAmount:
                fee.amount,
              status:
                "pending",
              classId:
                data.classId,
              academicYear:
                targetClass.academicYear,
              createdAt:
                Date.now(),
            });
          }
        );
      }
    );

    if (rows.length > 0) {
      await db
        .insert(studentFeesTable)
        .values(rows);
    }

    return {
      created:
        rows.length,
      skipped:
        students.length *
          selectedClassFees.length -
        rows.length,
      students:
        students.length,
    };
  };
