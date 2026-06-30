import {
  verifyWebhookController,
  handleWebhookController,
  sendPersonalController,
  sendBroadcastController,
  getWhatsappSettingsController,
  updateWhatsappSettingsController,
  getWhatsappHistoryController,
  triggerFeesRemindersController,
  handlePublicContactEmailController,
} from "./whatsapp.controller.js";

export default async function (fastify) {
  // Webhook endpoints for Meta API (Verify and receive webhook events)
  fastify.get("/webhook/whatsapp", verifyWebhookController);
  fastify.post("/webhook/whatsapp", handleWebhookController);

  // Public support email route
  fastify.post("/webhook/contact-email", handlePublicContactEmailController);

  // API endpoints for sending messages
  fastify.post("/send-personal", sendPersonalController);
  fastify.post("/broadcast", sendBroadcastController);

  // API endpoints for settings and monitoring
  fastify.get("/settings", getWhatsappSettingsController);
  fastify.post("/settings", updateWhatsappSettingsController);
  fastify.get("/history", getWhatsappHistoryController);
  fastify.post("/trigger-fees-reminders", triggerFeesRemindersController);
}
