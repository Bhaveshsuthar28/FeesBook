import crypto from "crypto";

import { db } from "../../cors/database/DB.Connect.js";

import { classesTable } from "../../cors/schema/classes.schema.js";
import { sectionsTable } from "../../cors/schema/sections.schema.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { classFeesTable } from "../../cors/schema/classFee.schema.js";
import { principals } from "../auth/auth.schema.js";
import { getActiveAcademicYearService } from "../settings/settings.service.js";

import {
  eq,
  and,
  asc,
  sql,
} from "drizzle-orm";

import {
  getClassCatalog,
  getCurrentAcademicYear,
  getCatalogClassByName,
  getClassLevel,
  getPreviousAcademicYear,
} from "./class.catalog.js";

const createClassError =
  ({
    statusCode,
    code,
    message,
    details = {},
  }) => {
    const error = new Error(
      message
    );

    error.statusCode = statusCode;
    error.code = code;
    error.details = details;

    return error;
  };

const getExistingClass =
  async ({
    schoolId,
    name,
    sequence,
    academicYear =
      getCurrentAcademicYear(),
  }) => {
    const existing =
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
          )
        );

    return existing.find(
      (item) =>
        item.name === name ||
        item.sequence ===
          sequence
    );
  };

export const createClassService =
  async ({
    schoolId,
    data,
  }) => {
    const academicYear =
      data.academicYear ||
      await getActiveAcademicYearService({ schoolId });
    const catalogClass =
      getCatalogClassByName(
        data.name,
        academicYear
      );

    if (!catalogClass) {
      throw createClassError({
        statusCode: 400,
        code: "INVALID_CLASS_NAME",
        message:
          "Class name is not available in the class catalog",
      });
    }

    const existingClass =
      await getExistingClass({
        schoolId,
        name:
          catalogClass.name,
        sequence:
          catalogClass.sequence,
        academicYear,
      });

    if (existingClass) {
      throw createClassError({
        statusCode: 409,
        code:
          existingClass.isArchived
            ? "CLASS_ARCHIVED"
            : "CLASS_ALREADY_ACTIVE",
        message:
          existingClass.isArchived
            ? "Class is archived and can be restored"
            : "Class is already active",
        details: {
          classId:
            existingClass.id,
        },
      });
    }

    const targetLevel = getClassLevel(catalogClass.name);
    if (targetLevel > 1) {
      // Get all active classes for the current academic year
      const activeClasses = await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(classesTable.schoolId, schoolId),
            eq(classesTable.academicYear, academicYear),
            eq(classesTable.isArchived, false)
          )
        );

      if (activeClasses.length === 0) {
        throw createClassError({
          statusCode: 400,
          code: "CLASS_SEQUENCE_VIOLATION",
          message: `The school must start with LKG. Please create LKG class first.`,
        });
      }

      if (catalogClass.name.startsWith("12th-")) {
        const stream = catalogClass.name.substring(5); // e.g. "PCM" from "12th-PCM"
        const predecessorName = `11th-${stream}`;
        const hasPredecessor = activeClasses.some(
          (c) => c.name === predecessorName
        );
        if (!hasPredecessor) {
          throw createClassError({
            statusCode: 400,
            code: "CLASS_SEQUENCE_VIOLATION",
            message: `You cannot add ${catalogClass.name} before ${predecessorName} is added to the system.`,
          });
        }
      } else {
        const hasPredecessor = activeClasses.some(
          (c) => getClassLevel(c.name) === targetLevel - 1
        );
        if (!hasPredecessor) {
          const getLevelFriendlyName = (level) => {
            if (level === 1) return "LKG";
            if (level === 2) return "UKG";
            if (level === 3) return "1st";
            if (level === 4) return "2nd";
            if (level === 5) return "3rd";
            if (level === 6) return "4th";
            if (level === 7) return "5th";
            if (level === 8) return "6th";
            if (level === 9) return "7th";
            if (level === 10) return "8th";
            if (level === 11) return "9th";
            if (level === 12) return "10th";
            if (level === 13) return "11th class";
            if (level === 14) return "12th class";
            return "previous class";
          };
          const requiredClassName = getLevelFriendlyName(targetLevel - 1);
          throw createClassError({
            statusCode: 400,
            code: "CLASS_SEQUENCE_VIOLATION",
            message: `You cannot add ${catalogClass.name} before ${requiredClassName} is added to the system.`,
          });
        }
      }
      }

    const newClass = {
      id: crypto.randomUUID(),

      schoolId,

      name:
        catalogClass.name,

      sequence:
        catalogClass.sequence,

      academicYear:
        catalogClass.academicYear,
    };

    await db
      .insert(classesTable)
      .values(newClass);

    return newClass;
  };

const ensureAcademicYearStructure = async ({
  schoolId,
  fromAcademicYear,
  targetAcademicYear,
}) => {
  const existingClasses = await db
    .select()
    .from(classesTable)
    .where(
      and(
        eq(classesTable.schoolId, schoolId),
        eq(classesTable.academicYear, targetAcademicYear)
      )
    );
  const classByName = new Map(
    existingClasses.map((item) => [item.name, item])
  );

  const sourceClasses = await db
    .select()
    .from(classesTable)
    .where(
      and(
        eq(classesTable.schoolId, schoolId),
        eq(classesTable.academicYear, fromAcademicYear),
        eq(classesTable.isArchived, false)
      )
    );

  if (sourceClasses.length > 0) {
    for (const sourceClass of sourceClasses) {
      if (!classByName.has(sourceClass.name)) {
        const newClass = {
          id: crypto.randomUUID(),
          schoolId,
          name: sourceClass.name,
          sequence: sourceClass.sequence,
          academicYear: targetAcademicYear,
          createdAt: new Date(),
        };

        await db.insert(classesTable).values(newClass);
        classByName.set(newClass.name, newClass);
      }
    }
  }

  for (const sourceClass of sourceClasses) {
    const targetClass = classByName.get(sourceClass.name);
    if (!targetClass) continue;

    const sourceSections = await db
      .select()
      .from(sectionsTable)
      .where(
        and(
          eq(sectionsTable.schoolId, schoolId),
          eq(sectionsTable.classId, sourceClass.id),
          eq(sectionsTable.isArchived, false)
        )
      );

    const targetSections = await db
      .select()
      .from(sectionsTable)
      .where(
        and(
          eq(sectionsTable.schoolId, schoolId),
          eq(sectionsTable.classId, targetClass.id)
        )
      );
    const targetSectionNames = new Set(
      targetSections.map((section) => section.name)
    );

    for (const sourceSection of sourceSections) {
      if (targetSectionNames.has(sourceSection.name)) {
        continue;
      }

      await db.insert(sectionsTable).values({
        id: crypto.randomUUID(),
        schoolId,
        classId: targetClass.id,
        name: sourceSection.name,
        isArchived: false,
        createdAt: new Date(),
      });
    }

    // Clone class fees from source to target
    const sourceFees = await db
      .select()
      .from(classFeesTable)
      .where(
        and(
          eq(classFeesTable.schoolId, schoolId),
          eq(classFeesTable.classId, sourceClass.id),
          eq(classFeesTable.isArchived, false)
        )
      );

    const targetFees = await db
      .select()
      .from(classFeesTable)
      .where(
        and(
          eq(classFeesTable.schoolId, schoolId),
          eq(classFeesTable.classId, targetClass.id)
        )
      );

    const targetFeeTypeIds = new Set(
      targetFees.map((fee) => fee.feeTypeId)
    );

    for (const sourceFee of sourceFees) {
      if (targetFeeTypeIds.has(sourceFee.feeTypeId)) {
        continue;
      }

      await db.insert(classFeesTable).values({
        id: crypto.randomUUID(),
        schoolId,
        classId: targetClass.id,
        feeTypeId: sourceFee.feeTypeId,
        amount: sourceFee.amount,
        isDefault: sourceFee.isDefault,
        isArchived: false,
      });
    }
  }
};

export const getClassesService =
  async ({
    schoolId,
    status = "active",
    academicYear,
  }) => {
    const activeYear =
      await getActiveAcademicYearService({
        schoolId,
      });

    const year = academicYear || activeYear;

    if (academicYear) {
      if (year !== activeYear) {
        const targetClasses = await db
          .select()
          .from(classesTable)
          .where(
            and(
              eq(classesTable.schoolId, schoolId),
              eq(classesTable.academicYear, year)
            )
          );

        if (targetClasses.length === 0) {
          await ensureAcademicYearStructure({
            schoolId,
            fromAcademicYear: activeYear,
            targetAcademicYear: year,
          });
        }
      }
    }

    await cleanupUnusedClassesService({ schoolId, academicYear: year });
    const allowedStatuses = [
      "active",
      "archived",
      "all",
    ];

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      throw createClassError({
        statusCode: 400,
        code: "INVALID_CLASS_STATUS",
        message:
          "Class status must be active, archived, or all",
      });
    }

    const filters = [
      eq(
        classesTable.schoolId,
        schoolId
      ),

      eq(
        classesTable.academicYear,
        year
      ),
    ];

    if (status === "active") {
      filters.push(
        eq(
          classesTable.isArchived,
          false
        )
      );
    }

    if (status === "archived") {
      filters.push(
        eq(
          classesTable.isArchived,
          true
        )
      );
    }

    const classes =
      await db
      .select({
        id: classesTable.id,
        schoolId: classesTable.schoolId,
        name: classesTable.name,
        sequence: classesTable.sequence,
        academicYear: classesTable.academicYear,
        status: classesTable.status,
        isArchived: classesTable.isArchived,
        createdAt: classesTable.createdAt,
        studentsCount: sql`coalesce((select count(*) from students join sections on students.section_id = sections.id where sections.class_id = classes.id and students.status = 'active'), 0)`
      })
      .from(classesTable)
      .where(
        and(...filters)
      )
      .orderBy(
        asc(
          classesTable.sequence
        )
      );

    return classes.map((cls) => ({
      ...cls,
      studentsCount: Number(cls.studentsCount),
    }));
  };

export const getClassCatalogService =
  async (schoolId) => {
    const existingClasses =
      await getClassesService({
        schoolId,
        status: "all",
      });

    const classByName =
      new Map(
        existingClasses.map(
          (item) => [
            item.name,
            item,
          ]
        )
      );

    const classBySequence =
      new Map(
        existingClasses.map(
          (item) => [
            item.sequence,
            item,
          ]
        )
      );

    return getClassCatalog().map(
      (item) => {
        const existing =
          classByName.get(
            item.name
          ) ||
          classBySequence.get(
            item.sequence
          );

        return {
          ...item,
          status:
            !existing
              ? "available"
              : existing.isArchived
                ? "archived"
                : "active",
          classId:
            existing?.id ||
            null,
        };
      }
    );
  };

export const updateClassService =
  async ({
    classId,
    schoolId,
    data,
  }) => {
    const updateData = {
      ...data,
    };

    if (data.name) {
      const [existingClass] = await db
        .select({ academicYear: classesTable.academicYear })
        .from(classesTable)
        .where(
          and(
            eq(classesTable.schoolId, schoolId),
            eq(classesTable.id, classId)
          )
        );
      const academicYear = existingClass?.academicYear || getCurrentAcademicYear();

      const catalogClass =
        getCatalogClassByName(
          data.name,
          academicYear
        );

      if (!catalogClass) {
        throw createClassError({
          statusCode: 400,
          code: "INVALID_CLASS_NAME",
          message:
            "Class name is not available in the class catalog",
        });
      }

      updateData.name =
        catalogClass.name;
      updateData.sequence =
        catalogClass.sequence;
      updateData.academicYear =
        catalogClass.academicYear;
    }

    await db
      .update(classesTable)
      .set(updateData)
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

    return true;
  };

export const archiveClassService =
  async ({
    classId,
    schoolId,
  }) => {
    const [existingClass] =
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

    if (!existingClass) {
      throw createClassError({
        statusCode: 404,
        code: "CLASS_NOT_FOUND",
        message:
          "Class not found",
      });
    }

    await db
      .update(classesTable)
      .set({
        isArchived: true,
      })
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

    return true;
  };

export const unarchiveClassService =
  async ({
    classId,
    schoolId,
  }) => {
    const [existingClass] =
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

    if (!existingClass) {
      throw createClassError({
        statusCode: 404,
        code: "CLASS_NOT_FOUND",
        message:
          "Class not found",
      });
    }

    if (!existingClass.isArchived) {
      return existingClass;
    }

    const targetLevel = getClassLevel(existingClass.name);
    if (targetLevel > 1) {
      const activeClasses = await db
        .select()
        .from(classesTable)
        .where(
          and(
            eq(classesTable.schoolId, schoolId),
            eq(classesTable.academicYear, existingClass.academicYear),
            eq(classesTable.isArchived, false)
          )
        );

      if (activeClasses.length === 0) {
        throw createClassError({
          statusCode: 400,
          code: "CLASS_SEQUENCE_VIOLATION",
          message: `The school must start with LKG. Please create or restore LKG first.`,
        });
      }

      const hasPredecessor = activeClasses.some(
        (c) => getClassLevel(c.name) === targetLevel - 1
      );
      if (!hasPredecessor) {
          const getLevelFriendlyName = (level) => {
            if (level === 1) return "LKG";
            if (level === 2) return "UKG";
            if (level === 3) return "1st";
            if (level === 4) return "2nd";
            if (level === 5) return "3rd";
            if (level === 6) return "4th";
            if (level === 7) return "5th";
            if (level === 8) return "6th";
            if (level === 9) return "7th";
            if (level === 10) return "8th";
            if (level === 11) return "9th";
            if (level === 12) return "10th";
            if (level === 13) return "11th class";
            if (level === 14) return "12th class";
            return "previous class";
          };
          const requiredClassName = getLevelFriendlyName(targetLevel - 1);
          throw createClassError({
            statusCode: 400,
            code: "CLASS_SEQUENCE_VIOLATION",
            message: `You cannot restore ${existingClass.name} before ${requiredClassName} is added to the system.`,
          });
        }
      }

    await db
      .update(classesTable)
      .set({
        isArchived: false,
      })
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

    return {
      ...existingClass,
      isArchived: false,
    };
  };

export const cleanupUnusedClassesService = async ({ schoolId, academicYear }) => {
  try {
    const classes = await db
      .select()
      .from(classesTable)
      .where(
        and(
          eq(classesTable.schoolId, schoolId),
          eq(classesTable.academicYear, academicYear)
        )
      );

    if (classes.length === 0) return;

    const previousYear = getPreviousAcademicYear(academicYear);
    const previousClasses = await db
      .select({ name: classesTable.name })
      .from(classesTable)
      .where(
        and(
          eq(classesTable.schoolId, schoolId),
          eq(classesTable.academicYear, previousYear)
        )
      );
    const previousNames = new Set(previousClasses.map((c) => c.name));

    for (const singleClass of classes) {
      // If previous classes exist, keep classes that existed previously
      if (previousClasses.length > 0 && previousNames.has(singleClass.name)) {
        continue;
      }

      // Check sections
      const sections = await db
        .select({ id: sectionsTable.id })
        .from(sectionsTable)
        .where(
          and(
            eq(sectionsTable.classId, singleClass.id),
            eq(sectionsTable.isArchived, false)
          )
        )
        .limit(1);
      if (sections.length > 0) continue;

      // Check students
      const students = await db
        .select({ id: studentsTable.id })
        .from(studentsTable)
        .where(
          and(
            eq(studentsTable.classId, singleClass.id),
            eq(studentsTable.status, "active")
          )
        )
        .limit(1);
      if (students.length > 0) continue;

      // Check class fees
      const classFees = await db
        .select({ id: classFeesTable.id })
        .from(classFeesTable)
        .where(
          and(
            eq(classFeesTable.classId, singleClass.id),
            eq(classFeesTable.isArchived, false)
          )
        )
        .limit(1);
      if (classFees.length > 0) continue;

      // Ensure we only delete historical auto-provisioned classes from before our deployment date (June 24, 2026).
      // Any class manually created today or in the future will have a timestamp >= June 24, 2026 and will never be deleted.
      const deployDate = new Date("2026-06-24T00:00:00Z").getTime();
      const classTime = new Date(singleClass.createdAt || 0).getTime();
      if (classTime < deployDate) {
        await db
          .delete(classesTable)
          .where(eq(classesTable.id, singleClass.id));
      }
    }
  } catch (error) {
    console.error("Failed to clean up unused classes:", error);
  }
};
