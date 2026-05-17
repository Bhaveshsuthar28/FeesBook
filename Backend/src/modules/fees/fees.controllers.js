import {

  createFeeTypeSchema,
  updateFeeTypeSchema,

  assignFeeToClassSchema,
  updateClassFeeSchema,

} from "./fees.validation.js";

import {

  createFeeTypeService,
  updateFeeTypeService,

  assignFeeToClassService,
  updateClassFeeService,

} from "./fees.service.js";

export const createFeeTypeController =
  async (request, reply) => {

    const parsed =
      createFeeTypeSchema.parse(
        request.body
      );

    const result =
      await createFeeTypeService({
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


export const updateFeeTypeController =
  async (request, reply) => {

    const parsed =
      updateFeeTypeSchema.parse(
        request.body
      );

    if (
      Object.keys(parsed)
        .length === 0
    ) {
      throw new Error(
        "No fields provided"
      );
    }

    await updateFeeTypeService({
      schoolId:
        request.user.schoolId,

      feeTypeId:
        request.params.id,

      data: parsed,
    });

    return reply.send({
      success: true,
      message:
        "Fee updated successfully",
    });
  };

export const assignFeeToClassController =
  async (request, reply) => {

    const parsed =
      assignFeeToClassSchema.parse(
        request.body
      );

    const result =
      await assignFeeToClassService({
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


export const updateClassFeeController =
  async (request, reply) => {

    const parsed =
      updateClassFeeSchema.parse(
        request.body
      );

    if (
      Object.keys(parsed)
        .length === 0
    ) {
      throw new Error(
        "No fields provided"
      );
    }

    await updateClassFeeService({
      schoolId:
        request.user.schoolId,

      classFeeId:
        request.params.id,

      data: parsed,
    });

    return reply.send({
      success: true,
      message:
        "Class fee updated successfully",
    });
  };