import {
  createStudentController,
  bulkPromoteStudentsController,
  getFeesLedgerController,
  getImageKitAuthController,
  getStudentDirectoryController,
  getStudentDetailController,
  getStudentsBySectionController,
  importStudentsController,
  markStudentAlumniController,
  markStudentLeftController,
  promoteStudentController,
  recordStudentPaymentController,
  updateStudentController,
  updateStudentFeeController,
} from "./students.controllers.js";

export default async function (
  fastify
) {
  fastify.post(
    "/",
    createStudentController
  );

  fastify.get(
    "/",
    getStudentDirectoryController
  );

  fastify.post(
    "/import",
    importStudentsController
  );

  fastify.post(
    "/promote/bulk",
    bulkPromoteStudentsController
  );

  fastify.get(
    "/fees-ledger",
    getFeesLedgerController
  );

  fastify.get(
    "/imagekit-auth",
    getImageKitAuthController
  );

  fastify.get(
    "/class/:classId/section/:sectionId",
    getStudentsBySectionController
  );

  fastify.get(
    "/:studentId",
    getStudentDetailController
  );

  fastify.patch(
    "/:studentId",
    updateStudentController
  );

  fastify.patch(
    "/:studentId/left",
    markStudentLeftController
  );

  fastify.patch(
    "/:studentId/alumni",
    markStudentAlumniController
  );

  fastify.patch(
    "/:studentId/promote",
    promoteStudentController
  );

  fastify.patch(
    "/:studentId/fees/:feeId",
    updateStudentFeeController
  );

  fastify.post(
    "/:studentId/payments",
    recordStudentPaymentController
  );
}
