import {
  createStudentController,
  bulkPromoteStudentsController,
  getFeesLedgerController,
  getImageKitAuthController,
  getStudentFeeConcessionController,
  getStudentFeeConcessionReceiptPdfController,
  getStudentPaymentReceiptPdfController,
  getStudentDirectoryController,
  getStudentDetailController,
  getStudentsBySectionController,
  importStudentsController,
  markStudentAlumniController,
  markStudentLeftController,
  promoteStudentController,
  recordStudentPaymentController,
  removeStudentFeeConcessionController,
  updateStudentController,
  updateStudentFeeController,
  upsertStudentFeeConcessionController,
  promoteStreamController,
  moveStudentStreamController,
  archiveStudentController,
  unarchiveStudentController,
  reshuffleRollNumbersController,
} from "./students.controllers.js";

import idempotencyMiddleware from "../../cors/middlewares/idempotency.middleware.js";

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

  fastify.post(
    "/promote/stream",
    promoteStreamController
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
    { preHandler: [idempotencyMiddleware] },
    recordStudentPaymentController
  );

  fastify.get(
    "/:studentId/payments/:paymentId/receipt.pdf",
    getStudentPaymentReceiptPdfController
  );

  fastify.get(
    "/:studentId/concessions",
    getStudentFeeConcessionController
  );

  fastify.put(
    "/:studentId/concessions",
    upsertStudentFeeConcessionController
  );

  fastify.delete(
    "/:studentId/concessions/:concessionId",
    removeStudentFeeConcessionController
  );

  fastify.get(
    "/:studentId/concessions/:concessionId/receipt.pdf",
    getStudentFeeConcessionReceiptPdfController
  );

  fastify.post(
    "/:studentId/move-stream",
    moveStudentStreamController
  );

  fastify.patch(
    "/:studentId/archive",
    archiveStudentController
  );

  fastify.patch(
    "/:studentId/unarchive",
    unarchiveStudentController
  );

  fastify.post(
    "/class/:classId/section/:sectionId/reshuffle",
    reshuffleRollNumbersController
  );
}
