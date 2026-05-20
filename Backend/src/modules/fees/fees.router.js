import {

  getFeeStructureController,
  getFeeTypesController,
  archiveFeeTypeController,
  createFeeTypeController,
  updateFeeTypeController,

  archiveClassFeeController,
  allocateClassFeesController,
  assignFeeToClassController,
  updateClassFeeController,

} from "./fees.controllers.js";

export default async function (
  fastify
) {

  fastify.get(
    "/structure",
    getFeeStructureController
  );

  fastify.get(
    "/types",
    getFeeTypesController
  );

  fastify.post(
    "/types",
    createFeeTypeController
  );

  fastify.patch(
    "/types/:id",
    updateFeeTypeController
  );

  fastify.patch(
    "/types/:id/archive",
    archiveFeeTypeController
  );

  fastify.post(
    "/assign",
    assignFeeToClassController
  );

  fastify.post(
    "/allocate",
    allocateClassFeesController
  );

  fastify.patch(
    "/assign/:id",
    updateClassFeeController
  );

  fastify.patch(
    "/assign/:id/archive",
    archiveClassFeeController
  );
}
