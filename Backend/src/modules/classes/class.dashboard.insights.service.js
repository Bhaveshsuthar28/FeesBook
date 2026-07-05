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

import {
  getActiveAcademicYearService,
} from "../settings/settings.service.js";

import { getCache, setCache } from "../../cors/cache/cache.service.js";
import { keys, TTL } from "../../cors/cache/cache.keys.js";

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
    academicYear,
    startDate,
    endDate,
  }) => {
    const targetYear =
      academicYear ||
      await getActiveAcademicYearService({
        schoolId,
      });

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

    const rangeStart = startDate ? Number(startDate) : thisMonthStart;
    const rangeEnd = endDate ? Number(endDate) : thisMonthEnd;

    const cacheKey = `${keys.dashboardInsights(schoolId, targetYear)}_${rangeStart}_${rangeEnd}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

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
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),
            eq(
              classesTable.academicYear,
              targetYear
            )
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

        .innerJoin(
          studentFeesTable,
          eq(
            studentFeesTable.id,
            studentPaymentsTable.studentFeeId
          )
        )

        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),

            eq(
              studentFeesTable.academicYear,
              targetYear
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

        .innerJoin(
          studentFeesTable,
          eq(
            studentFeesTable.id,
            studentPaymentsTable.studentFeeId
          )
        )

        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),

            eq(
              studentFeesTable.academicYear,
              targetYear
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
              studentFeesTable.schoolId,
              schoolId
            ),
            eq(
              studentsTable.status,
              "active"
            ),
            eq(
              studentFeesTable.academicYear,
              targetYear
            )
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
        .innerJoin(
          studentFeesTable,
          eq(
            studentFeesTable.id,
            studentPaymentsTable.studentFeeId
          )
        )
        .where(
          and(
            eq(
              studentPaymentsTable.schoolId,
              schoolId
            ),
            eq(
              studentFeesTable.academicYear,
              targetYear
            ),
            gte(
              studentPaymentsTable.paidAt,
              rangeStart
            ),
            lt(
              studentPaymentsTable.paidAt,
              rangeEnd
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

    // Fetch total allocated fees (amount) for the active academic year
    const [totalAllocatedRow] = await db
      .select({
        total: sql`coalesce(sum(${studentFeesTable.amount}), 0)`
      })
      .from(studentFeesTable)
      .innerJoin(studentsTable, eq(studentsTable.id, studentFeesTable.studentId))
      .where(
        and(
          eq(studentFeesTable.schoolId, schoolId),
          eq(studentsTable.status, "active"),
          eq(studentFeesTable.academicYear, targetYear)
        )
      );

    const totalSchoolFees = Number(totalAllocatedRow?.total || 0);

    // Fetch total collected before rangeStart
    const [collectedBeforeRow] = await db
      .select({
        total: sql`coalesce(sum(${studentPaymentsTable.amount}), 0)`
      })
      .from(studentPaymentsTable)
      .innerJoin(studentFeesTable, eq(studentFeesTable.id, studentPaymentsTable.studentFeeId))
      .where(
        and(
          eq(studentPaymentsTable.schoolId, schoolId),
          eq(studentFeesTable.academicYear, targetYear),
          lt(studentPaymentsTable.paidAt, rangeStart)
        )
      );

    const collectedBeforeRange = Number(collectedBeforeRow?.total || 0);

    const isYearly = (rangeEnd - rangeStart) > 45 * 86400000;
    const dailyTrend = [];
    let cumulativeCollected = collectedBeforeRange;

    if (isYearly) {
      let current = new Date(rangeStart);
      const end = new Date(rangeEnd);
      while (current < end) {
        const year = current.getFullYear();
        const month = current.getMonth();
        
        let monthCollected = 0;
        for (const [key, val] of byDay.entries()) {
          const [pYear, pMonth, pDay] = key.split("-").map(Number);
          if (pYear === year && pMonth === (month + 1)) {
            monthCollected += val;
          }
        }
        
        cumulativeCollected += monthCollected;
        const monthPending = Math.max(0, totalSchoolFees - cumulativeCollected);
        const monthLabel = current.toLocaleString("en-US", { month: "short" });
        const key = `${year}-${String(month + 1).padStart(2, "0")}`;
        
        dailyTrend.push({
          date: key,
          label: monthLabel,
          collected: monthCollected,
          pendingSnapshot: monthPending,
        });
        
        current.setMonth(current.getMonth() + 1);
      }
    } else {
      for (
        let t = rangeStart;
        t < rangeEnd;
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

        const dayCollected = byDay.get(key) || 0;
        cumulativeCollected += dayCollected;

        const dayPending = Math.max(0, totalSchoolFees - cumulativeCollected);

        dailyTrend.push({
          date:
            key,

          label:
            String(
              d.getDate()
            ),

          collected:
            dayCollected,

          pendingSnapshot:
            dayPending,
        });
      }
    }

    const totalPending =
      Number(
        pendingRow?.total || 0
      );

    const collectedThisMonth =
      Number(
        thisMonthSum?.total || 0
      );

    const collectedLastMonth =
      Number(
        lastMonthSum?.total || 0
      );

    const finalResult = {
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

    await setCache(cacheKey, finalResult, TTL.DASHBOARD);
    return finalResult;
  };
