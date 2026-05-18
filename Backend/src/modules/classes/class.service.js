import crypto from "crypto";

import { db } from "../../cors/database/DB.Connect.js";

import { classesTable } from "../../cors/schema/classes.schema.js";

import {
  eq,
  and,
  asc,
} from "drizzle-orm";

import {
  getClassCatalog,
  getCurrentAcademicYear,
  getCatalogClassByName,
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
      getCurrentAcademicYear();
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

export const getClassesService =
  async ({
    schoolId,
    status = "active",
  }) => {
    const academicYear =
      getCurrentAcademicYear();
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
        academicYear
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
      .select()
      .from(classesTable)
      .where(
        and(...filters)
      )
      .orderBy(
        asc(
          classesTable.sequence
        )
      );

    return classes;
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
      const catalogClass =
        getCatalogClassByName(
          data.name,
          getCurrentAcademicYear()
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
