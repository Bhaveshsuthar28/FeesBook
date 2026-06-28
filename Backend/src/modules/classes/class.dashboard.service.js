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
  enrollmentsTable,
} from "../../cors/schema/enrollments.schema.js";

import {
  eq,
  sql,
  and,
  asc,
  inArray,
} from "drizzle-orm";

import {
  getCurrentAcademicYear,
} from "./class.catalog.js";

import {
  cleanupUnusedClassesService,
} from "./class.service.js";

import {
  getActiveAcademicYearService,
} from "../settings/settings.service.js";

import { getCache, setCache } from "../../cors/cache/cache.service.js";
import { keys, TTL } from "../../cors/cache/cache.keys.js";

export const getClassesDashboardService =
  async ({
    schoolId,
    academicYear,
  }) => {
    const targetYear =
      academicYear ||
      await getActiveAcademicYearService({
        schoolId,
      });

    const cacheKey = keys.dashboard(schoolId, targetYear);
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    await cleanupUnusedClassesService({
      schoolId,
      academicYear: targetYear,
    });

    const classes =
      await db
        .select({
          id: classesTable.id,
          name: classesTable.name,
          sectionsCount: sql`(SELECT COUNT(*) FROM sections WHERE sections.class_id = classes.id AND sections.school_id = ${schoolId} AND sections.is_archived = 0)`,
          studentsCount: sql`(SELECT COUNT(*) FROM enrollments WHERE enrollments.class_id = classes.id AND enrollments.academic_year = ${targetYear} AND enrollments.status IN ('active','promoted'))`,
          pendingFees: sql`COALESCE((SELECT SUM(sf.due_amount) FROM student_fees sf INNER JOIN enrollments e ON e.student_id = sf.student_id WHERE e.class_id = classes.id AND e.academic_year = ${targetYear} AND e.status IN ('active','promoted') AND sf.academic_year = ${targetYear}), 0)`,
          collectedFees: sql`COALESCE((SELECT SUM(sf.paid_amount) FROM student_fees sf INNER JOIN enrollments e ON e.student_id = sf.student_id WHERE e.class_id = classes.id AND e.academic_year = ${targetYear} AND e.status IN ('active','promoted') AND sf.academic_year = ${targetYear}), 0)`
        })
        .from(classesTable)
        .where(
          and(
            eq(classesTable.schoolId, schoolId),
            eq(classesTable.academicYear, targetYear),
            eq(classesTable.isArchived, false)
          )
        )
        .orderBy(
          asc(classesTable.sequence)
        );

    const result = classes.map((cls) => {
      const pendingFees = Number(cls.pendingFees || 0);
      const collectedFees = Number(cls.collectedFees || 0);
      const total = pendingFees + collectedFees;
      const pendingPercentage = total === 0 ? 0 : (pendingFees / total) * 100;

      let feeHealth = "healthy";
      if (pendingPercentage >= 30) {
        feeHealth = "critical";
      } else if (pendingPercentage >= 10) {
        feeHealth = "medium";
      }

      return {
        id: cls.id,
        name: cls.name,
        sectionsCount: Number(cls.sectionsCount || 0),
        studentsCount: Number(cls.studentsCount || 0),
        pendingFees,
        collectedFees,
        feeHealth,
      };
    });


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

    const finalResult = {
      stats,

      classes:
        result,
    };

    await setCache(cacheKey, finalResult, TTL.DASHBOARD);
    return finalResult;
  };
