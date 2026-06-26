import {
  getPromotionDashboardController,
  getStudentsByClassController,
  getAlumniDirectoryController,
  getFailedStudentsController,
  getPromotionPreviewController,
} from "./promotion.controllers.js";

export default async function (fastify) {
  fastify.get("/", getPromotionDashboardController);
  fastify.get("/students", getStudentsByClassController);
  fastify.get("/alumni", getAlumniDirectoryController);
  fastify.get("/failed", getFailedStudentsController);
  fastify.get("/preview", getPromotionPreviewController);
}
