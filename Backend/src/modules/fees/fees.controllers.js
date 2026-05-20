import {

  createFeeTypeSchema,
  updateFeeTypeSchema,

  assignFeeToClassSchema,
  updateClassFeeSchema,
  allocateClassFeesSchema,
  archiveSchema,

} from "./fees.validation.js";

import {

  createFeeTypeService,
  getClassFeeStructureStatusService,
  getFeeStructureService,
  getFeeTypesService,
  updateFeeTypeService,
  archiveClassFeeService,
  archiveFeeTypeService,

  allocateClassFeesService,
  assignFeeToClassService,
  updateClassFeeService,

} from "./fees.service.js";

export const getFeeTypesController =
  async (request, reply) => {
    const result =
      await getFeeTypesService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getFeeStructureController =
  async (request, reply) => {
    const result =
      await getFeeStructureService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getClassFeeStructureStatusController =
  async (request, reply) => {
    const result =
      await getClassFeeStructureStatusService({
        schoolId:
          request.user.schoolId,
        classId:
          request.params.classId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

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

export const archiveFeeTypeController =
  async (request, reply) => {
    const parsed =
      archiveSchema.parse(
        request.body || {}
      );

    await archiveFeeTypeService({
      schoolId:
        request.user.schoolId,
      feeTypeId:
        request.params.id,
      isArchived:
        parsed.isArchived ?? true,
    });

    const isArchived =
      parsed.isArchived ?? true;

    return reply.send({
      success: true,
      message: isArchived
        ? "Fee type archived successfully"
        : "Fee type restored successfully",
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

export const archiveClassFeeController =
  async (request, reply) => {
    const parsed =
      archiveSchema.parse(
        request.body || {}
      );

    await archiveClassFeeService({
      schoolId:
        request.user.schoolId,
      classFeeId:
        request.params.id,
      isArchived:
        parsed.isArchived ?? true,
    });

    const isArchived =
      parsed.isArchived ?? true;

    return reply.send({
      success: true,
      message: isArchived
        ? "Class fee archived successfully"
        : "Class fee restored successfully",
    });
  };

export const allocateClassFeesController =
  async (request, reply) => {
    const parsed =
      allocateClassFeesSchema.parse(
        request.body
      );

    const result =
      await allocateClassFeesService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
        optionalOnly:
          Boolean(
            parsed.sectionId ||
              parsed.studentIds?.length
          ),
      });

    return reply.send({
      success: true,
      data: result,
    });
  };
