import { db } from "../../cors/database/DB.Connect.js";
import { enrollmentsTable } from "../../cors/schema/enrollments.schema.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";
import { sectionsTable } from "../../cors/schema/sections.schema.js";
import { and, eq, desc } from "drizzle-orm";

const createEnrollmentError = ({ statusCode, code, message, details = {} }) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
};

export const getStudentEnrollmentHistoryService = async ({ schoolId, studentId }) => {
  // Verify student exists and belongs to this school
  const [student] = await db
    .select()
    .from(studentsTable)
    .where(
      and(
        eq(studentsTable.id, studentId),
        eq(studentsTable.schoolId, schoolId)
      )
    );

  if (!student) {
    throw createEnrollmentError({
      statusCode: 404,
      code: "STUDENT_NOT_FOUND",
      message: "Student not found",
    });
  }

  // Fetch all enrollments ordered by createdAt DESC
  const history = await db
    .select({
      id: enrollmentsTable.id,
      schoolId: enrollmentsTable.schoolId,
      studentId: enrollmentsTable.studentId,
      academicYear: enrollmentsTable.academicYear,
      classId: enrollmentsTable.classId,
      sectionId: enrollmentsTable.sectionId,
      rollNumber: enrollmentsTable.rollNumber,
      admissionType: enrollmentsTable.admissionType,
      status: enrollmentsTable.status,
      promotedFrom: enrollmentsTable.promotedFrom,
      note: enrollmentsTable.note,
      createdAt: enrollmentsTable.createdAt,
      className: classesTable.name,
      sectionName: sectionsTable.name,
    })
    .from(enrollmentsTable)
    .innerJoin(classesTable, eq(classesTable.id, enrollmentsTable.classId))
    .innerJoin(sectionsTable, eq(sectionsTable.id, enrollmentsTable.sectionId))
    .where(
      and(
        eq(enrollmentsTable.studentId, studentId),
        eq(enrollmentsTable.schoolId, schoolId)
      )
    )
    .orderBy(desc(enrollmentsTable.createdAt));

  return history;
};

export const getEnrollmentByIdService = async ({ schoolId, enrollmentId }) => {
  const [row] = await db
    .select({
      id: enrollmentsTable.id,
      schoolId: enrollmentsTable.schoolId,
      studentId: enrollmentsTable.studentId,
      academicYear: enrollmentsTable.academicYear,
      classId: enrollmentsTable.classId,
      sectionId: enrollmentsTable.sectionId,
      rollNumber: enrollmentsTable.rollNumber,
      admissionType: enrollmentsTable.admissionType,
      status: enrollmentsTable.status,
      promotedFrom: enrollmentsTable.promotedFrom,
      note: enrollmentsTable.note,
      createdAt: enrollmentsTable.createdAt,
      student: {
        id: studentsTable.id,
        fullName: studentsTable.fullName,
        schoolRegisterNo: studentsTable.schoolRegisterNo,
      },
      className: classesTable.name,
      sectionName: sectionsTable.name,
    })
    .from(enrollmentsTable)
    .innerJoin(studentsTable, eq(studentsTable.id, enrollmentsTable.studentId))
    .innerJoin(classesTable, eq(classesTable.id, enrollmentsTable.classId))
    .innerJoin(sectionsTable, eq(sectionsTable.id, enrollmentsTable.sectionId))
    .where(
      and(
        eq(enrollmentsTable.id, enrollmentId),
        eq(enrollmentsTable.schoolId, schoolId)
      )
    );

  if (!row) {
    throw createEnrollmentError({
      statusCode: 404,
      code: "ENROLLMENT_NOT_FOUND",
      message: "Enrollment record not found",
    });
  }

  return row;
};
