import { db } from "../../cors/database/DB.Connect.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";
import { sectionsTable } from "../../cors/schema/sections.schema.js";
import { enrollmentsTable } from "../../cors/schema/enrollments.schema.js";
import { and, eq, sql, desc, asc } from "drizzle-orm";

const createPromotionError = ({ statusCode, code, message, details = {} }) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

// ── Dashboard overview ────────────────────────────────────────────────────────
export const getPromotionDashboardService = async ({ schoolId }) => {
  // Student status counts
  const [activeRow] = await db
    .select({ total: sql`count(*)` })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

  const [alumniRow] = await db
    .select({ total: sql`count(*)` })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "alumni")));

  const [previousRow] = await db
    .select({ total: sql`count(*)` })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "previous")));

  // Pending stream allocation: active students in a class named "10th"
  const [pendingStreamRow] = await db
    .select({ total: sql`count(*)` })
    .from(studentsTable)
    .innerJoin(classesTable, eq(classesTable.id, studentsTable.classId))
    .where(
      and(
        eq(studentsTable.schoolId, schoolId),
        eq(studentsTable.status, "active"),
        sql`lower(${classesTable.name}) = '10th'`
      )
    );

  // All active classes with student counts
  const classes = await db
    .select({
      classId: classesTable.id,
      className: classesTable.name,
      academicYear: classesTable.academicYear,
      sequence: classesTable.sequence,
    })
    .from(classesTable)
    .where(and(eq(classesTable.schoolId, schoolId), eq(classesTable.isArchived, false)))
    .orderBy(asc(classesTable.sequence));

  // Batch count students per class
  const classBreakdown = await Promise.all(
    classes.map(async (cls) => {
      const [row] = await db
        .select({ count: sql`count(*)` })
        .from(studentsTable)
        .where(
          and(
            eq(studentsTable.schoolId, schoolId),
            eq(studentsTable.classId, cls.classId),
            eq(studentsTable.status, "active")
          )
        );
      return { ...cls, studentCount: Number(row?.count || 0) };
    })
  );

  return {
    totalActive: Number(activeRow?.total || 0),
    totalAlumni: Number(alumniRow?.total || 0),
    totalPrevious: Number(previousRow?.total || 0),
    pendingStreamAllocation: Number(pendingStreamRow?.total || 0),
    classBreakdown,
  };
};

// ── Students by class/section/status ─────────────────────────────────────────
export const getStudentsByClassService = async ({ schoolId, classId, sectionId, status }) => {
  const conditions = [eq(studentsTable.schoolId, schoolId)];

  if (classId) conditions.push(eq(studentsTable.classId, classId));
  if (sectionId) conditions.push(eq(studentsTable.sectionId, sectionId));
  if (status) conditions.push(eq(studentsTable.status, status));

  const rows = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      fatherName: studentsTable.fatherName,
      schoolRegisterNo: studentsTable.schoolRegisterNo,
      rollNumber: studentsTable.rollNumber,
      phone: studentsTable.phone,
      gender: studentsTable.gender,
      status: studentsTable.status,
      classId: studentsTable.classId,
      sectionId: studentsTable.sectionId,
      createdAt: studentsTable.createdAt,
      className: classesTable.name,
      sectionName: sectionsTable.name,
      academicYear: classesTable.academicYear,
    })
    .from(studentsTable)
    .innerJoin(classesTable, eq(classesTable.id, studentsTable.classId))
    .innerJoin(sectionsTable, eq(sectionsTable.id, studentsTable.sectionId))
    .where(and(...conditions))
    .orderBy(asc(classesTable.sequence), asc(studentsTable.fullName));

  return rows;
};

// ── Alumni directory ──────────────────────────────────────────────────────────
export const getAlumniDirectoryService = async ({ schoolId, search = "", page = 1, limit = 50 }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const conditions = [
    eq(studentsTable.schoolId, schoolId),
    eq(studentsTable.status, "alumni"),
  ];

  if (search && search.trim()) {
    const term = `%${search.trim().toLowerCase()}%`;
    conditions.push(sql`lower(${studentsTable.fullName}) like ${term}`);
  }

  const [totalRow] = await db
    .select({ total: sql`count(*)` })
    .from(studentsTable)
    .where(and(...conditions));

  const students = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      firstName: studentsTable.firstName,
      lastName: studentsTable.lastName,
      fatherName: studentsTable.fatherName,
      schoolRegisterNo: studentsTable.schoolRegisterNo,
      phone: studentsTable.phone,
      gender: studentsTable.gender,
      status: studentsTable.status,
      alumniAt: studentsTable.alumniAt,
      lastAcademicYear: studentsTable.lastAcademicYear,
      previousClassId: studentsTable.previousClassId,
      movementNote: studentsTable.movementNote,
    })
    .from(studentsTable)
    .where(and(...conditions))
    .orderBy(desc(studentsTable.alumniAt))
    .limit(Number(limit))
    .offset(offset);

  // Enrich with last class name
  const enriched = await Promise.all(
    students.map(async (s) => {
      if (!s.previousClassId) return { ...s, lastClassName: null };
      const [cls] = await db
        .select({ name: classesTable.name })
        .from(classesTable)
        .where(eq(classesTable.id, s.previousClassId));
      return { ...s, lastClassName: cls?.name || null };
    })
  );

  return {
    students: enriched,
    total: Number(totalRow?.total || 0),
    page: Number(page),
    limit: Number(limit),
  };
};

// ── Failed / Previous students ────────────────────────────────────────────────
export const getFailedStudentsService = async ({ schoolId }) => {
  const rows = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      fatherName: studentsTable.fatherName,
      schoolRegisterNo: studentsTable.schoolRegisterNo,
      phone: studentsTable.phone,
      gender: studentsTable.gender,
      status: studentsTable.status,
      leftAt: studentsTable.leftAt,
      lastAcademicYear: studentsTable.lastAcademicYear,
      movementNote: studentsTable.movementNote,
      previousClassId: studentsTable.previousClassId,
      previousSectionId: studentsTable.previousSectionId,
    })
    .from(studentsTable)
    .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "previous")))
    .orderBy(desc(studentsTable.leftAt));

  // Enrich with previous class / section names
  const enriched = await Promise.all(
    rows.map(async (s) => {
      const extra = { lastClassName: null, lastSectionName: null };
      if (s.previousClassId) {
        const [cls] = await db
          .select({ name: classesTable.name })
          .from(classesTable)
          .where(eq(classesTable.id, s.previousClassId));
        extra.lastClassName = cls?.name || null;
      }
      if (s.previousSectionId) {
        const [sec] = await db
          .select({ name: sectionsTable.name })
          .from(sectionsTable)
          .where(eq(sectionsTable.id, s.previousSectionId));
        extra.lastSectionName = sec?.name || null;
      }
      return { ...s, ...extra };
    })
  );

  return enriched;
};

// ── Promotion preview ─────────────────────────────────────────────────────────
export const getPromotionPreviewService = async ({ schoolId, fromClassId, toClassId }) => {
  if (!fromClassId) {
    throw createPromotionError({
      statusCode: 400,
      code: "FROM_CLASS_REQUIRED",
      message: "fromClassId is required",
    });
  }

  const [fromClass] = await db
    .select()
    .from(classesTable)
    .where(and(eq(classesTable.id, fromClassId), eq(classesTable.schoolId, schoolId)));

  if (!fromClass) {
    throw createPromotionError({
      statusCode: 404,
      code: "CLASS_NOT_FOUND",
      message: "Source class not found",
    });
  }

  let toClass = null;
  if (toClassId) {
    const [row] = await db
      .select()
      .from(classesTable)
      .where(and(eq(classesTable.id, toClassId), eq(classesTable.schoolId, schoolId)));
    toClass = row || null;
  }

  const students = await db
    .select({
      id: studentsTable.id,
      fullName: studentsTable.fullName,
      fatherName: studentsTable.fatherName,
      schoolRegisterNo: studentsTable.schoolRegisterNo,
      rollNumber: studentsTable.rollNumber,
      sectionId: studentsTable.sectionId,
      sectionName: sectionsTable.name,
    })
    .from(studentsTable)
    .innerJoin(sectionsTable, eq(sectionsTable.id, studentsTable.sectionId))
    .where(
      and(
        eq(studentsTable.schoolId, schoolId),
        eq(studentsTable.classId, fromClassId),
        eq(studentsTable.status, "active")
      )
    )
    .orderBy(asc(studentsTable.fullName));

  return {
    fromClass,
    toClass,
    students,
    count: students.length,
  };
};
