import {
  createSectionController,
  updateSectionController,
  getSectionsByClassController,
  archiveSectionController,
  unarchiveSectionController,
  getSectionCatalogController,
  getSectionStatsController,
} from "./sections.controllers.js";

export default async function (
  fastify
) {

  fastify.post(
    "/",
    createSectionController
  );

  fastify.patch(
    "/:id/unarchive",
    unarchiveSectionController
  );

  fastify.get(
    "/class/:classId",
    getSectionsByClassController
  );

  fastify.get(
    "/class/:classId/catalog",
    getSectionCatalogController
  );

  fastify.get(
    "/class/:classId/stats",
    getSectionStatsController
  );

  fastify.patch(
    "/:id",
    updateSectionController
  );

  fastify.delete(
    "/:id",
    archiveSectionController
  );
}
