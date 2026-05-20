import { z } from "zod";

const requiredString = z.string().trim().min(1);

export const getStudentEnrollmentHistorySchema = z.object({
  studentId: requiredString,
});

export const getEnrollmentByIdSchema = z.object({
  enrollmentId: requiredString,
});
