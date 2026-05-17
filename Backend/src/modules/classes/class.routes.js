import {
  createClassController,
  getClassesController,
  updateClassController,
  archiveClassController,
} from "./class.cotrollers.js";

import { getClassesDashboardController } from "./class.dashboard.controllers.js";

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

  fastify.patch(
    "/:id",
    updateClassController
  );

  fastify.delete(
    "/:id",
    archiveClassController
  );

  fastify.get(
    "/dashboard",
    getClassesDashboardController
  );
}