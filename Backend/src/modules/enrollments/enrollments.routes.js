import {
  getStudentEnrollmentHistoryController,
  getEnrollmentByIdController,
} from "./enrollments.controllers.js";

export default async function (fastify) {
  fastify.get(
    "/student/:studentId",
    getStudentEnrollmentHistoryController
  );

  fastify.get(
    "/:enrollmentId",
    getEnrollmentByIdController
  );
}
