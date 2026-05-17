import {
  createSectionController,
  updateSectionController,
  getSectionsByClassController,
  archiveSectionController,
} from "./sections.controllers.js";

export default async function (
  fastify
) {

  fastify.post(
    "/",
    createSectionController
  );

  fastify.patch(
    "/:id",
    updateSectionController
  );

  fastify.get(
    "/class/:classId",
    getSectionsByClassController
  );

  fastify.delete(
    "/:id",
    archiveSectionController
  );
}