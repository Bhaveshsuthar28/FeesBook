import {
  archiveAcademicYearController,
  createAcademicYearController,
  getAcademicYearsController,
  getSchoolProfileController,
  getSettingsPreferencesController,
  promoteAcademicYearController,
  setActiveAcademicYearController,
  updateSettingsPreferencesController,
  updateSchoolProfileController,
} from "./settings.controllers.js";

export default async function (
  fastify
) {
  fastify.get(
    "/profile",
    getSchoolProfileController
  );

  fastify.patch(
    "/profile",
    updateSchoolProfileController
  );

  fastify.get(
    "/preferences",
    getSettingsPreferencesController
  );

  fastify.patch(
    "/preferences",
    updateSettingsPreferencesController
  );

  fastify.get(
    "/academic-years",
    getAcademicYearsController
  );

  fastify.post(
    "/academic-years",
    createAcademicYearController
  );

  fastify.patch(
    "/academic-years/active",
    setActiveAcademicYearController
  );

  fastify.post(
    "/academic-years/:year/promote",
    promoteAcademicYearController
  );

  fastify.patch(
    "/academic-years/:year/archive",
    archiveAcademicYearController
  );
}
