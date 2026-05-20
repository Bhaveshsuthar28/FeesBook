import {
  ZodError,
} from "zod";

import {
  settingsPreferencesSchema,
  updateSchoolProfileSchema,
  academicYearSchema,
} from "./settings.validation.js";

const parseBody =
  (schema, body) => {
    try {
      return schema.parse(
        body || {}
      );
    } catch (error) {
      if (
        error instanceof
        ZodError
      ) {
        const validationError =
          new Error(
            error.errors[0]
              ?.message ||
              "Validation failed"
          );
        validationError.statusCode = 400;
        throw validationError;
      }

      throw error;
    }
  };

import {
  archiveAcademicYearService,
  createAcademicYearService,
  getAcademicYearsService,
  getSchoolProfileService,
  getSettingsPreferencesService,
  setActiveAcademicYearService,
  updateSettingsPreferencesService,
  updateSchoolProfileService,
} from "./settings.service.js";

export const getSchoolProfileController =
  async (request, reply) => {
    const result =
      await getSchoolProfileService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getAcademicYearsController =
  async (request, reply) => {
    const result =
      await getAcademicYearsService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const getSettingsPreferencesController =
  async (request, reply) => {
    const result =
      await getSettingsPreferencesService({
        schoolId:
          request.user.schoolId,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateSettingsPreferencesController =
  async (request, reply) => {
    const parsed =
      parseBody(
        settingsPreferencesSchema,
        request.body
      );

    const result =
      await updateSettingsPreferencesService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const createAcademicYearController =
  async (request, reply) => {
    const parsed =
      parseBody(
        academicYearSchema,
        request.body
      );

    const result =
      await createAcademicYearService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply
      .code(201)
      .send({
        success: true,
        data: result,
      });
  };

export const setActiveAcademicYearController =
  async (request, reply) => {
    const parsed =
      parseBody(
        academicYearSchema.pick({
          year: true,
        }),
        request.body
      );

    const result =
      await setActiveAcademicYearService({
        schoolId:
          request.user.schoolId,
        year:
          parsed.year,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const promoteAcademicYearController =
  async (request, reply) => {
    const year =
      String(
        request.params.year || ""
      );
    const parsed =
      parseBody(
        academicYearSchema.partial(),
        {
          ...(request.body || {}),
          year,
        }
      );

    const result =
      await createAcademicYearService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const archiveAcademicYearController =
  async (request, reply) => {
    const result =
      await archiveAcademicYearService({
        schoolId:
          request.user.schoolId,
        year:
          request.params.year,
        archived:
          Boolean(
            request.body?.archived
          ),
      });

    return reply.send({
      success: true,
      data: result,
    });
  };

export const updateSchoolProfileController =
  async (request, reply) => {
    const parsed =
      parseBody(
        updateSchoolProfileSchema,
        request.body
      );

    const result =
      await updateSchoolProfileService({
        schoolId:
          request.user.schoolId,
        data:
          parsed,
      });

    return reply.send({
      success: true,
      data: result,
    });
  };
