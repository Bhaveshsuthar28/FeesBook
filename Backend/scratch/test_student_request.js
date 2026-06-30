import Fastify from "fastify";
import * as authMiddleware from "../src/modules/auth/auth.middleware.js";

// Mock the auth middleware before importing app.js
authMiddleware.requireAuthenticatedUser = async (request, reply) => {
  request.userId = "user_test_123";
  request.user = { clerkUserId: "user_test_123", schoolId: "user_test_123" };
  return true;
};

import app from "../app.js";
import { db } from "../src/cors/database/DB.Connect.js";
import { studentsTable } from "../src/cors/schema/students.schema.js";

async function run() {
  console.log("=== Testing Student Request Inject ===");

  const [student] = await db.select().from(studentsTable).limit(1);
  if (!student) {
    console.log("No student found");
    process.exit(0);
  }

  // Pre-set user context on request directly
  app.addHook("onRequest", async (request) => {
    request.userId = "user_test_123";
    request.user = { clerkUserId: "user_test_123", schoolId: "user_test_123" };
  });

  const res = await app.inject({
    method: "GET",
    url: `/api/v1/students/${student.id}`,
  });

  console.log("Status Code:", res.statusCode);
  console.log("Response Body:", res.body);
  process.exit(0);
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
