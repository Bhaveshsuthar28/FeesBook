import {
  createClassSchema,
  updateClassSchema,
} from "./class.validation.js";

import {
  createClassService,
  getClassesService,
  updateClassService,
  archiveClassService,
} from "./class.service.js";

export const createClassController =
  async (request, reply) => {
    const parsed =
      createClassSchema.parse(
        request.body
      );

    const schoolId =
      request.user.schoolId;

    const result =
      await createClassService({
        schoolId,
        data: parsed,
      });

    return reply.code(201).send({
      success: true,
      data: result,
    });
  };

export const getClassesController =
  async (request, reply) => {
    const schoolId =
      request.user.schoolId;

    const result =
      await getClassesService(
        schoolId
      );

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateClassController =
  async (request, reply) => {
    const parsed =
      updateClassSchema.parse(
        request.body
      );

    const schoolId =
      request.user.schoolId;

    await updateClassService({
      classId:
        request.params.id,

      schoolId,

      data: parsed,
    });

    return reply.send({
      success: true,
      message:
        "Class updated successfully",
    });
  };

export const archiveClassController =
  async (request, reply) => {
    const schoolId =
      request.user.schoolId;

    await archiveClassService({
      classId:
        request.params.id,

      schoolId,
    });

    return reply.send({
      success: true,
      message:
        "Class archived successfully",
    });
  };