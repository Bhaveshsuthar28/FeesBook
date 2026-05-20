import Fastify from "fastify";
import corsPlugin from "./src/cors/pulgin/cors.js";
import helmetPlugin from "./src/cors/pulgin/helmet.js";
import rateLimitPlugin from "./src/cors/pulgin/rateLimit.js";
import sensiblePlugin from "./src/cors/pulgin/sensible.js";
import clerkAuthPlugin from "./src/cors/pulgin/clerk.js";
import healthRoutes from "./src/cors/utils/health.js";
import { env } from "./src/cors/config/env.js";
import authRoutes from "./src/modules/auth/auth.routes.js";
import classRoutes from "./src/modules/classes/class.routes.js";
import feesRouter from "./src/modules/fees/fees.router.js";
import {
  ensureFeeColumns,
} from "./src/modules/fees/fees.service.js";
import settingsRoutes from "./src/modules/settings/settings.routes.js";
import sectionRoutes from "./src/modules/sections/section.routes.js";
import studentRoutes from "./src/modules/students/students.routes.js";
import cron from "node-cron";
import {
  ensureStudentLifecycleColumns,
  runMayAcademicYearAutomationService,
} from "./src/modules/students/students.service.js";
import {
  ensureSettingsColumns,
} from "./src/modules/settings/settings.service.js";

const app = Fastify({
  logger: {
    transport:
        process.env.NODE_ENV !== "production"
            ? {
                target: "pino-pretty",
                options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
                },
            }
        : undefined,
  },

  trustProxy: true,

  bodyLimit: 10 * 1024 * 1024,
});

app.addHook(
  "preHandler",
  async (request) => {

    request.user = {
      clerkUserId:
        "user_test_123",

      schoolId:
        "user_test_123",
    };
  }
);


await app.register(corsPlugin);

await app.register(helmetPlugin);

await app.register(rateLimitPlugin);

await app.register(sensiblePlugin);

await app.register(clerkAuthPlugin);



app.addHook("onRequest", async (request) => {
  request.log.info({
    method: request.method,
    url: request.url,
    ip: request.ip,
  });
});


app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  const statusCode = error.statusCode || 500;

  return reply.status(statusCode).send({
    success: false,

    code:
      error.code,

    message:
      process.env.NODE_ENV === "production" &&
      statusCode >= 500
        ? "Internal Server Error"
        : error.message,

    details:
      error.details,
  });
});


app.setNotFoundHandler((request, reply) => {
  return reply.status(404).send({
    success: false,
    message: `Route ${request.method} ${request.url} not found`,
  });
});


await app.register(authRoutes , {
  prefix : "/api/v1/auth"
})

await app.register(classRoutes, {
  prefix: "/api/v1/classes",
});

await app.register(feesRouter , {
  prefix : "/api/v1/fees"
})

await app.register(settingsRoutes, {
  prefix: "/api/v1/settings",
});

await app.register(sectionRoutes, {
  prefix: "/api/v1/sections",
});

await app.register(studentRoutes, {
  prefix: "/api/v1/students",
});

await app.register(healthRoutes, {
  prefix: "/api/v1/health",
});

app.log.info({ BASE_URL: env.BASE_URL, PORT: env.PORT }, "Loaded env");

await ensureStudentLifecycleColumns();

await ensureSettingsColumns();

await ensureFeeColumns();

cron.schedule(
  "0 0 1 5 *",
  async () => {
    try {
      const result =
        await runMayAcademicYearAutomationService();

      app.log.info(
        {
          result,
        },
        "May academic year movement completed"
      );
    } catch (error) {
      app.log.error(
        error,
        "May academic year movement failed"
      );
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

export default app;
