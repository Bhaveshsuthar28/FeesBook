import crypto from "crypto";

import { db }
  from "../../cors/database/DB.Connect.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  eq,
  and,
  asc,
  sql,
} from "drizzle-orm";

import {
  isCatalogSectionName,
  normalizeSectionName,
  SECTION_CATALOG,
} from "./sections.catalog.js";

const createSectionError =
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

const getClassForSchool =
  async ({
    schoolId,
    classId,
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

    return singleClass;
  };

const assertActiveClass =
  async ({
    schoolId,
    classId,
  }) => {
    const singleClass =
      await getClassForSchool({
        schoolId,
        classId,
      });

    if (!singleClass) {
      throw createSectionError({
        statusCode: 404,
        code: "CLASS_NOT_FOUND",
        message:
          "Class not found",
      });
    }

    if (
      singleClass.isArchived
    ) {
      throw createSectionError({
        statusCode: 409,
        code: "CLASS_ARCHIVED",
        message:
          "Archived classes cannot be changed",
      });
    }

    return singleClass;
  };

const getSectionForSchool =
  async ({
    schoolId,
    sectionId,
  }) => {
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
              sectionsTable.schoolId,
              schoolId
            )
          )
        );

    return section;
  };

const getExistingSection =
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
            )
          )
        );

    return section;
  };

export const createSectionService =
  async ({
    schoolId,
    data,
  }) => {
    await assertActiveClass({
      schoolId,
      classId:
        data.classId,
    });

    const sectionName =
      normalizeSectionName(
        data.name
      );

    if (
      !isCatalogSectionName(
        sectionName
      )
    ) {
      throw createSectionError({
        statusCode: 400,
        code: "INVALID_SECTION_NAME",
        message:
          "Section name must be A, B, C, or D",
      });
    }

    const existingSection =
      await getExistingSection({
        schoolId,
        classId:
          data.classId,
        name:
          sectionName,
      });

    if (existingSection) {
      throw createSectionError({
        statusCode: 409,
        code:
          existingSection.isArchived
            ? "SECTION_ARCHIVED"
            : "SECTION_ALREADY_ACTIVE",
        message:
          existingSection.isArchived
            ? "Section is archived and can be restored"
            : "Section is already active",
        details: {
          sectionId:
            existingSection.id,
        },
      });
    }

    try {

      const section = {
        id:
          crypto.randomUUID(),

        schoolId,

        name:
          sectionName,

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
        throw createSectionError({
          statusCode: 409,
          code: "SECTION_ALREADY_EXISTS",
          message:
            "Section already exists in this class",
        });
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
    const existingSection =
      await getSectionForSchool({
        schoolId,
        sectionId,
      });

    if (!existingSection) {
      throw createSectionError({
        statusCode: 404,
        code: "SECTION_NOT_FOUND",
        message:
          "Section not found",
      });
    }

    await assertActiveClass({
      schoolId,
      classId:
        data.classId ||
        existingSection.classId,
    });

    if (data.name) {
      data.name =
        normalizeSectionName(
          data.name
        );

      if (
        !isCatalogSectionName(
          data.name
        )
      ) {
        throw createSectionError({
          statusCode: 400,
          code: "INVALID_SECTION_NAME",
          message:
            "Section name must be A, B, C, or D",
        });
      }
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
    status = "active",
  }) => {
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
      throw createSectionError({
        statusCode: 400,
        code: "INVALID_SECTION_STATUS",
        message:
          "Section status must be active, archived, or all",
      });
    }

    const singleClass =
      await getClassForSchool({
        schoolId,
        classId,
      });

    if (!singleClass) {
      throw createSectionError({
        statusCode: 404,
        code: "CLASS_NOT_FOUND",
        message:
          "Class not found",
      });
    }

    const filters = [
      eq(
        sectionsTable.schoolId,
        schoolId
      ),
      eq(
        sectionsTable.classId,
        classId
      ),
    ];

    if (status === "active") {
      filters.push(
        eq(
          sectionsTable.isArchived,
          false
        )
      );
    }

    if (status === "archived") {
      filters.push(
        eq(
          sectionsTable.isArchived,
          true
        )
      );
    }

    return await db
      .select()

      .from(sectionsTable)

      .where(
        and(...filters)
      )

      .orderBy(
        asc(
          sectionsTable.name
        )
      );
  };

export const getSectionCatalogService =
  async ({
    schoolId,
    classId,
  }) => {
    const sections =
      await getSectionsByClassService({
        schoolId,
        classId,
        status: "all",
      });

    const sectionByName =
      new Map(
        sections.map(
          (item) => [
            item.name,
            item,
          ]
        )
      );

    return SECTION_CATALOG.map(
      (name) => {
        const existing =
          sectionByName.get(
            name
          );

        return {
          name,
          classId,
          status:
            !existing
              ? "available"
              : existing.isArchived
                ? "archived"
                : "active",
          sectionId:
            existing?.id ||
            null,
        };
      }
    );
  };

export const getSectionStatsService =
  async ({
    schoolId,
    classId,
  }) => {
    const singleClass =
      await getClassForSchool({
        schoolId,
        classId,
      });

    if (!singleClass) {
      throw createSectionError({
        statusCode: 404,
        code: "CLASS_NOT_FOUND",
        message:
          "Class not found",
      });
    }

    const [
      sectionsCountResult,
    ] =
      await db
        .select({
          count:
            sql`
              count(*)
            `,
        })
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
        );

    const [
      studentsCountResult,
    ] =
      await db
        .select({
          count:
            sql`
              count(*)
            `,
        })
        .from(studentsTable)
        .innerJoin(
          sectionsTable,
          eq(
            sectionsTable.id,
            studentsTable.sectionId
          )
        )
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
              sectionsTable.schoolId,
              schoolId
            ),
            eq(
              sectionsTable.isArchived,
              false
            )
          )
        );

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
        .from(studentFeesTable)
        .innerJoin(
          studentsTable,
          eq(
            studentsTable.id,
            studentFeesTable.studentId
          )
        )
        .innerJoin(
          sectionsTable,
          eq(
            sectionsTable.id,
            studentsTable.sectionId
          )
        )
        .where(
          and(
            eq(
              studentFeesTable.schoolId,
              schoolId
            ),
            eq(
              studentsTable.schoolId,
              schoolId
            ),
            eq(
              studentsTable.classId,
              classId
            ),
            eq(
              sectionsTable.schoolId,
              schoolId
            ),
            eq(
              sectionsTable.isArchived,
              false
            )
          )
        );

    return {
      totalSections:
        Number(
          sectionsCountResult
            ?.count || 0
        ),
      totalStudents:
        Number(
          studentsCountResult
            ?.count || 0
        ),
      totalPendingFees:
        Number(
          feeSummary[0]
            ?.pending || 0
        ),
      totalCollectedFees:
        Number(
          feeSummary[0]
            ?.collected || 0
        ),
    };
  };

export const archiveSectionService =
  async ({
    schoolId,
    sectionId,
  }) => {
    const existingSection =
      await getSectionForSchool({
        schoolId,
        sectionId,
      });

    if (!existingSection) {
      throw createSectionError({
        statusCode: 404,
        code: "SECTION_NOT_FOUND",
        message:
          "Section not found",
      });
    }

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

export const unarchiveSectionService =
  async ({
    schoolId,
    sectionId,
  }) => {
    const existingSection =
      await getSectionForSchool({
        schoolId,
        sectionId,
      });

    if (!existingSection) {
      throw createSectionError({
        statusCode: 404,
        code: "SECTION_NOT_FOUND",
        message:
          "Section not found",
      });
    }

    await assertActiveClass({
      schoolId,
      classId:
        existingSection.classId,
    });

    if (
      !existingSection.isArchived
    ) {
      return existingSection;
    }

    await db
      .update(sectionsTable)

      .set({
        isArchived: false,
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

    return {
      ...existingSection,
      isArchived: false,
    };
  };
