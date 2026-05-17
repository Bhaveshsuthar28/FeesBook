import { successResponse } from "./response.js";

export default async function healthRoutes(app) {
  app.get("/health", async () => {
    return successResponse({
      message: "Server running successfully",
    });
  });
}