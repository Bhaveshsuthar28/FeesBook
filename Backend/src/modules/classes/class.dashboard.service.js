// src/modules/classes/class.dashboard.service.js

import {
  db,
} from "../../cors/database/DB.Connect.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import {
  sectionsTable,
} from "../../cors/schema/sections.schema.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  eq,
  sql,
  and,
  asc,
} from "drizzle-orm";

import {
  getCurrentAcademicYear,
} from "./class.catalog.js";

export const getClassesDashboardService =
  async ({
    schoolId,
  }) => {
    const academicYear =
      getCurrentAcademicYear();

    const classes =
      await db
        .select({
          id:
            classesTable.id,

          name:
            classesTable.name,
        })

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
              classesTable.isArchived,
              false
            )
          )
        )

        .orderBy(
          asc(
            classesTable.sequence
          )
        );

    const result =
      await Promise.all(

        classes.map(
          async (singleClass) => {

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

                .from(
                  sectionsTable
                )

                .where(
                  and(
                    eq(
                      sectionsTable.schoolId,
                      schoolId
                    ),

                    eq(
                      sectionsTable.classId,
                      singleClass.id
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

                .from(
                  studentsTable
                )

                .where(
                  and(
                    eq(
                      studentsTable.classId,
                      singleClass.id
                    ),
                    eq(
                      studentsTable.status,
                      "active"
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

                .from(
                  studentFeesTable
                )

                .innerJoin(
                  studentsTable,

                  eq(
                    studentsTable.id,
                    studentFeesTable.studentId
                  )
                )

                .where(
                  and(
                    eq(
                      studentsTable.classId,
                      singleClass.id
                    ),
                    eq(
                      studentsTable.status,
                      "active"
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

            const total =
              pendingFees +
              collectedFees;

            const pendingPercentage =
              total === 0
                ? 0
                : (
                    pendingFees /
                    total
                  ) * 100;

            let feeHealth =
              "healthy";

            if (
              pendingPercentage >=
              30
            ) {
              feeHealth =
                "critical";
            }

            else if (
              pendingPercentage >=
              10
            ) {
              feeHealth =
                "medium";
            }

            return {
              id:
                singleClass.id,

              name:
                singleClass.name,

              sectionsCount:
                Number(
                  sectionsCountResult
                    ?.count || 0
                ),

              studentsCount:
                Number(
                  studentsCountResult
                    ?.count || 0
                ),

              pendingFees,

              collectedFees,

              feeHealth,
            };
          }
        )
      );

    const stats = {
      totalClasses:
        result.length,

      totalStudents:
        result.reduce(
          (
            acc,
            current
          ) =>
            acc +
            current.studentsCount,

          0
        ),

      totalPendingFees:
        result.reduce(
          (
            acc,
            current
          ) =>
            acc +
            current.pendingFees,

          0
        ),

      totalCollectedFees:
        result.reduce(
          (
            acc,
            current
          ) =>
            acc +
            current.collectedFees,

          0
        ),
    };

    return {
      stats,

      classes:
        result,
    };
  };
