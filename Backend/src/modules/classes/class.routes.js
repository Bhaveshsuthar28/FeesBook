import {
  createClassController,
  getClassesController,
  updateClassController,
  archiveClassController,
  unarchiveClassController,
  getClassCatalogController,
} from "./class.cotrollers.js";

import {
  getClassesDashboardController,
  getClassesDashboardInsightsController,
} from "./class.dashboard.controllers.js";

export default async function (
  fastify
) {
  fastify.post(
    "/",
    createClassController
  );

  fastify.get(
    "/",
    getClassesController
  );

  fastify.get(
    "/catalog",
    getClassCatalogController
  );

  fastify.get(
    "/dashboard",
    getClassesDashboardController
  );

  fastify.get(
    "/dashboard/insights",
    getClassesDashboardInsightsController
  );

  fastify.patch(
    "/:id/unarchive",
    unarchiveClassController
  );

  fastify.patch(
    "/:id",
    updateClassController
  );

  fastify.delete(
    "/:id",
    archiveClassController
  );
}
