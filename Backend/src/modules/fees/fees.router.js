import {

  createFeeTypeController,
  updateFeeTypeController,

  assignFeeToClassController,
  updateClassFeeController,

} from "./fees.controllers.js";

export default async function (
  fastify
) {

  fastify.post(
    "/types",
    createFeeTypeController
  );

  fastify.patch(
    "/types/:id",
    updateFeeTypeController
  );

  fastify.post(
    "/assign",
    assignFeeToClassController
  );

  fastify.patch(
    "/assign/:id",
    updateClassFeeController
  );
}