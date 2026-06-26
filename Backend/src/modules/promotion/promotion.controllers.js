import {
  getPromotionDashboardService,
  getStudentsByClassService,
  getAlumniDirectoryService,
  getFailedStudentsService,
  getPromotionPreviewService,
} from "./promotion.service.js";

export const getPromotionDashboardController = async (request, reply) => {
  const result = await getPromotionDashboardService({
    schoolId: request.user.schoolId,
  });
  return reply.send({ success: true, data: result });
};

export const getStudentsByClassController = async (request, reply) => {
  const { classId, sectionId, status } = request.query;
  const result = await getStudentsByClassService({
    schoolId: request.user.schoolId,
    classId,
    sectionId,
    status,
  });
  return reply.send({ success: true, data: result });
};

export const getAlumniDirectoryController = async (request, reply) => {
  const { search, page, limit } = request.query;
  const result = await getAlumniDirectoryService({
    schoolId: request.user.schoolId,
    search: search || "",
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 50,
  });
  return reply.send({ success: true, data: result });
};

export const getFailedStudentsController = async (request, reply) => {
  const result = await getFailedStudentsService({
    schoolId: request.user.schoolId,
  });
  return reply.send({ success: true, data: result });
};

export const getPromotionPreviewController = async (request, reply) => {
  const { fromClassId, toClassId } = request.query;
  const result = await getPromotionPreviewService({
    schoolId: request.user.schoolId,
    fromClassId,
    toClassId,
  });
  return reply.send({ success: true, data: result });
};
