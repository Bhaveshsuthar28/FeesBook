import {
  createStudentSchema,
  bulkPromoteStudentsSchema,
  importStudentsSchema,
  studentLifecycleSchema,
} from "./students.validation.js";

import {
  createStudentService,
  getFeesLedgerService,
  getImageKitAuthService,
  getStudentPaymentReceiptPdfService,
  getStudentDirectoryService,
  getStudentDetailService,
  getStudentsBySectionService,
  bulkPromoteStudentsService,
  importStudentsService,
  markStudentAlumniService,
  markStudentLeftService,
  promoteStudentService,
  recordStudentPaymentService,
  updateStudentFeeService,
  updateStudentService,
} from "./students.service.js";

export const createStudentController =
  async (request, reply) => {
    const parsed =
      createStudentSchema.parse(
        request.body
      );

    const result =
      await createStudentService({
        schoolId:
          request.user.schoolId,
        data: parsed,
      });

    return reply
      .code(201)
      .send({
        success: true,
        data: result,
      });
  };

export const getStudentsBySectionController =
  async (request, reply) => {
    const result =
      await getStudentsBySectionService({
        schoolId:
          request.user.schoolId,
        classId:
          request.params.classId,
        sectionId:
          request.params.sectionId,
        query:
          request.query,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getStudentDirectoryController =
  async (request, reply) => {
    const result =
      await getStudentDirectoryService({
        schoolId:
          request.user.schoolId,
        query:
          request.query,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getFeesLedgerController =
  async (request, reply) => {
    const result =
      await getFeesLedgerService({
        schoolId:
          request.user.schoolId,
        query:
          request.query,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getStudentDetailController =
  async (request, reply) => {
    const result =
      await getStudentDetailService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateStudentController =
  async (request, reply) => {
    const result =
      await updateStudentService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        data:
          request.body,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const markStudentLeftController =
  async (request, reply) => {
    const parsed =
      studentLifecycleSchema.parse(
        request.body || {}
      );

    const result =
      await markStudentLeftService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        data: parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const markStudentAlumniController =
  async (request, reply) => {
    const parsed =
      studentLifecycleSchema.parse(
        request.body || {}
      );

    const result =
      await markStudentAlumniService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        data: parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const promoteStudentController =
  async (request, reply) => {
    const parsed =
      studentLifecycleSchema.parse(
        request.body || {}
      );

    const result =
      await promoteStudentService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        data: parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const bulkPromoteStudentsController =
  async (request, reply) => {
    const parsed =
      bulkPromoteStudentsSchema.parse(
        request.body || {}
      );

    const result =
      await bulkPromoteStudentsService({
        schoolId:
          request.user.schoolId,
        data: parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateStudentFeeController =
  async (request, reply) => {
    const result =
      await updateStudentFeeService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        feeId:
          request.params.feeId,
        data:
          request.body,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const recordStudentPaymentController =
  async (request, reply) => {
    const result =
      await recordStudentPaymentService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        data:
          request.body,
      });

    return reply
      .code(201)
      .send({
        success: true,
        data: result,
      });
  };

export const getStudentPaymentReceiptPdfController =
  async (request, reply) => {
    const result =
      await getStudentPaymentReceiptPdfService({
        schoolId:
          request.user.schoolId,
        studentId:
          request.params.studentId,
        paymentId:
          request.params.paymentId,
      });

    return reply
      .header(
        "Content-Type",
        "application/pdf"
      )
      .header(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      )
      .send(result.buffer);
  };

export const importStudentsController =
  async (request, reply) => {
    const parsed =
      importStudentsSchema.parse(
        request.body
      );

    const result =
      await importStudentsService({
        schoolId:
          request.user.schoolId,
        data: parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getImageKitAuthController =
  async (request, reply) => {
    const result =
      getImageKitAuthService();

    return reply.send({
      success: true,
      data: result,
    });
  };
