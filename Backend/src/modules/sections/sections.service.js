import crypto from "crypto";

import { db }
  from "../../cors/database/DB.Connect.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

import {
  eq,
  and,
  asc,
} from "drizzle-orm";

export const createSectionService =
  async ({
    schoolId,
    data,
  }) => {

    try {

      const section = {
        id:
          crypto.randomUUID(),

        schoolId,

        name:
          data.name.toUpperCase(),

        classId:
          data.classId,
      };

      await db
        .insert(sectionsTable)
        .values(section);

      return section;

    } catch (error) {

      const message =
        error.message.toLowerCase();

      if (
        message.includes(
          "unique"
        )
      ) {
        throw new Error(
          "Section already exists in this class"
        );
      }

      throw error;
    }
  };

export const updateSectionService =
  async ({
    schoolId,
    sectionId,
    data,
  }) => {

    if (data.name) {
      data.name =
        data.name.toUpperCase();
    }

    await db
      .update(sectionsTable)

      .set(data)

      .where(
        and(
          eq(
            sectionsTable.id,
            sectionId
          ),

          eq(
            sectionsTable.schoolId,
            schoolId
          )
        )
      );

    return true;
  };

export const getSectionsByClassService =
  async ({
    schoolId,
    classId,
  }) => {

    return await db
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
  };

export const archiveSectionService =
  async ({
    schoolId,
    sectionId,
  }) => {

    await db
      .update(sectionsTable)

      .set({
        isArchived: true,
      })

      .where(
        and(
          eq(
            sectionsTable.id,
            sectionId
          ),

          eq(
            sectionsTable.schoolId,
            schoolId
          )
        )
      );

    return true;
  };