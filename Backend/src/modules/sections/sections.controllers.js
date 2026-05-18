import {
  createSectionSchema,
  updateSectionSchema,
} from "./sections.validation.js";

import {
  createSectionService,
  updateSectionService,
  getSectionsByClassService,
  archiveSectionService,
  unarchiveSectionService,
  getSectionCatalogService,
  getSectionStatsService,
} from "./sections.service.js";

export const createSectionController =
  async (request, reply) => {

    const parsed =
      createSectionSchema.parse(
        request.body
      );

    const result =
      await createSectionService({
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

export const updateSectionController =
  async (request, reply) => {

    const parsed =
      updateSectionSchema.parse(
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

    await updateSectionService({
      schoolId:
        request.user.schoolId,

      sectionId:
        request.params.id,

      data: parsed,
    });

    return reply.send({
      success: true,
      message:
        "Section updated successfully",
    });
  };

export const getSectionsByClassController =
  async (request, reply) => {

    const result =
      await getSectionsByClassService({
        schoolId:
          request.user.schoolId,

        classId:
          request.params.classId,

        status:
          request.query?.status ||
          "active",
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const archiveSectionController =
  async (request, reply) => {

    await archiveSectionService({
      schoolId:
        request.user.schoolId,

      sectionId:
        request.params.id,
    });

    return reply.send({
      success: true,
      message:
        "Section archived successfully",
    });
  };

export const getSectionCatalogController =
  async (request, reply) => {

    const result =
      await getSectionCatalogService({
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

export const getSectionStatsController =
  async (request, reply) => {

    const result =
      await getSectionStatsService({
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

export const unarchiveSectionController =
  async (request, reply) => {

    const result =
      await unarchiveSectionService({
        schoolId:
          request.user.schoolId,

        sectionId:
          request.params.id,
      });

    return reply.send({
      success: true,
      message:
        "Section restored successfully",
      data: result,
    });
  };
