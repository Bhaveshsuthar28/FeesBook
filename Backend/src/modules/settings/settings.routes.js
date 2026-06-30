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
  saveBotCredentialsController,
  getBotCredentialsStatusController,
  revokeBotAccessController,
  sendSupportEmailController,
  toggleBotActiveStatusController,
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

  fastify.post("/whatsapp-bot/credentials", saveBotCredentialsController);
  fastify.get("/whatsapp-bot/status", getBotCredentialsStatusController);
  fastify.post("/whatsapp-bot/revoke", revokeBotAccessController);
  fastify.post("/whatsapp-bot/active", toggleBotActiveStatusController);
  fastify.post("/support/help", sendSupportEmailController);
}
