import {
  getStudentEnrollmentHistoryService,
  getEnrollmentByIdService,
} from "./enrollments.service.js";

export const getStudentEnrollmentHistoryController = async (request, reply) => {
  const result = await getStudentEnrollmentHistoryService({
    schoolId: request.user.schoolId,
    studentId: request.params.studentId,
  });
  return reply.send({ success: true, data: result });
};

export const getEnrollmentByIdController = async (request, reply) => {
  const result = await getEnrollmentByIdService({
    schoolId: request.user.schoolId,
    enrollmentId: request.params.enrollmentId,
  });
  return reply.send({ success: true, data: result });
};
