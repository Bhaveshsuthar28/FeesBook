import crypto from "crypto";

import { db } from "../../cors/database/DB.Connect.js";

import { classesTable } from "../../cors/schema/classes.schema.js";

import {
  eq,
  and,
} from "drizzle-orm";

export const createClassService =
  async ({
    schoolId,
    data,
  }) => {
    const newClass = {
      id: crypto.randomUUID(),

      schoolId,

      name: data.name,

      sequence: data.sequence,

      academicYear:
        data.academicYear,
    };

    await db
      .insert(classesTable)
      .values(newClass);

    return newClass;
  };

export const getClassesService =
  async (schoolId) => {
    const classes = await db
      .select()
      .from(classesTable)
      .where(
        and(
          eq(
            classesTable.schoolId,
            schoolId
          ),

          eq(
            classesTable.isArchived,
            false
          )
        )
      )
      .orderBy(
        classesTable.sequence
      );

    return classes;
  };

export const updateClassService =
  async ({
    classId,
    schoolId,
    data,
  }) => {
    await db
      .update(classesTable)
      .set({
        ...data,
        updatedAt: new Date(),
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

export const archiveClassService =
  async ({
    classId,
    schoolId,
  }) => {
    await db
      .update(classesTable)
      .set({
        isArchived: true,

        updatedAt: new Date(),
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