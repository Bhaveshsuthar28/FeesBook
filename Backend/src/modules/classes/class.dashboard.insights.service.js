// src/modules/classes/class.dashboard.insights.service.js

import {
  db,
} from "../../cors/database/DB.Connect.js";

import {
  studentPaymentsTable,
} from "../../cors/schema/studentPayments.schema.js";

import {
  studentFeesTable,
} from "../../cors/schema/studentFees.schema.js";

import {
  studentsTable,
} from "../../cors/schema/students.schema.js";

import {
  classesTable,
} from "../../cors/schema/classes.schema.js";

import {
  eq,
  and,
  desc,
  gte,
  lt,
  sql,
} from "drizzle-orm";

const startOfMonth =
  (d) =>
    new Date(
      d.getFullYear(),
      d.getMonth(),
      1
    ).getTime();

const startOfNextMonth =
  (d) =>
    new Date(
      d.getFullYear(),
      d.getMonth() + 1,
      1
    ).getTime();

const startOfPreviousMonth =
  (d) =>
    new Date(
      d.getFullYear(),
      d.getMonth() - 1,
      1
    ).getTime();

export const getDashboardInsightsService =
  async ({
    schoolId,
  }) => {

    const now =
      new Date();

    const thisMonthStart =
      startOfMonth(now);

    const thisMonthEnd =
      startOfNextMonth(now);

    const lastMonthStart =
      startOfPreviousMonth(now);

    const lastMonthEnd =
      thisMonthStart;

    const recentRows =
      await db
        .select({
          id:
            studentPaymentsTable.id,

          amount:
            studentPaymentsTable.amount,

          paidAt:
            studentPaymentsTable.paidAt,

          studentName:
            studentsTable.fullName,

          className:
            classesTable.name,
        })

        .from(
          studentPaymentsTable
        )

        .innerJoin(
          studentsTable,

          eq(
            studentsTable.id,
            studentPaymentsTable.studentId
          )
        )

        .innerJoin(
          classesTable,

          eq(
            classesTable.id,
            studentsTable.classId
          )
        )

        .where(
          eq(
            studentPaymentsTable.schoolId,
            schoolId
          )
        )

        .orderBy(
          desc(
            studentPaymentsTable.paidAt
          )
        )

        .limit(10);

    const [
      thisMonthSum,
    ] =
      await db
        .select({
          total:
            sql`
              coalesce(
                sum(
                  ${studentPaymentsTable.amount}
                ),
                0
              )
            `,
        })

        .from(
          studentPaymentsTable
        )

        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),

            gte(
              studentPaymentsTable.paidAt,
              thisMonthStart
            ),

            lt(
              studentPaymentsTable.paidAt,
              thisMonthEnd
            )
          )
        );

    const [
      lastMonthSum,
    ] =
      await db
        .select({
          total:
            sql`
              coalesce(
                sum(
                  ${studentPaymentsTable.amount}
                ),
                0
              )
            `,
        })

        .from(
          studentPaymentsTable
        )

        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),

            gte(
              studentPaymentsTable.paidAt,
              lastMonthStart
            ),

            lt(
              studentPaymentsTable.paidAt,
              lastMonthEnd
            )
          )
        );

    const [
      pendingRow,
    ] =
      await db
        .select({
          total:
            sql`
              coalesce(
                sum(
                  ${studentFeesTable.dueAmount}
                ),
                0
              )
            `,
        })

        .from(
          studentFeesTable
        )

        .where(
          eq(
            studentFeesTable.schoolId,
            schoolId
          )
        );

    const monthPayments =
      await db
        .select({
          amount:
            studentPaymentsTable.amount,

          paidAt:
            studentPaymentsTable.paidAt,
        })

        .from(
          studentPaymentsTable
        )

        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),

            gte(
              studentPaymentsTable.paidAt,
              thisMonthStart
            ),

            lt(
              studentPaymentsTable.paidAt,
              thisMonthEnd
            )
          )
        );

    const byDay =
      new Map();

    for (const p of monthPayments) {

      const d =
        new Date(
          Number(
            p.paidAt
          )
        );

      const key =
        [
          d.getFullYear(),

          String(
            d.getMonth() + 1
          ).padStart(
            2,
            "0"
          ),

          String(
            d.getDate()
          ).padStart(
            2,
            "0"
          ),
        ].join("-");

      const next =
        (byDay.get(key) || 0) +
        Number(
          p.amount || 0
        );

      byDay.set(
        key,
        next
      );
    }

    const totalPending =
      Number(
        pendingRow?.total || 0
      );

    const dailyTrend = [];

    for (
      let t =
        thisMonthStart;

      t < thisMonthEnd;

      t += 86400000
    ) {

      const d =
        new Date(t);

      const key =
        [
          d.getFullYear(),

          String(
            d.getMonth() + 1
          ).padStart(
            2,
            "0"
          ),

          String(
            d.getDate()
          ).padStart(
            2,
            "0"
          ),
        ].join("-");

      dailyTrend.push({
        date:
          key,

        label:
          String(
            d.getDate()
          ),

        collected:
          byDay.get(key) || 0,

        pendingSnapshot:
          totalPending,
      });
    }

    const collectedThisMonth =
      Number(
        thisMonthSum?.total || 0
      );

    const collectedLastMonth =
      Number(
        lastMonthSum?.total || 0
      );

    return {
      recentPayments:
        recentRows.map(
          (row) => ({
            id:
              row.id,

            amount:
              Number(
                row.amount || 0
              ),

            paidAt:
              Number(
                row.paidAt
              ),

            studentName:
              row.studentName,

            className:
              row.className,
          })
        ),

      collectedThisMonth,

      collectedLastMonth,

      totalPendingFees:
        totalPending,

      dailyTrend,
    };
  };
