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
import settingsRoutes from "./src/modules/settings/settings.routes.js";
import sectionRoutes from "./src/modules/sections/section.routes.js";
import studentRoutes from "./src/modules/students/students.routes.js";
import enrollmentRoutes from "./src/modules/enrollments/enrollments.routes.js";
import promotionRoutes from "./src/modules/promotion/promotion.routes.js";
import whatsappRoutes from "./src/modules/whatsapp/whatsapp.routes.js";
import "./src/utils/reminder.cron.js";
import {
  requireAuthenticatedUser,
} from "./src/modules/auth/auth.middleware.js";
import cron from "node-cron";
import {
  runMayAcademicYearAutomationService,
} from "./src/modules/students/students.service.js";
import {
  getSchoolProfileService,
} from "./src/modules/settings/settings.service.js";
import { db } from "./src/cors/database/DB.Connect.js";
import { principals } from "./src/modules/auth/auth.schema.js";
import { cleanupUnusedClassesService } from "./src/modules/classes/class.service.js";
import { getActiveAcademicYearService } from "./src/modules/settings/settings.service.js";
import { registerIdempotencyHook } from "./src/cors/middlewares/idempotency.middleware.js";
import sanitizeBody from "./src/cors/middlewares/sanitize.middleware.js";

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

await app.register(corsPlugin);

await app.register(helmetPlugin);

await app.register(rateLimitPlugin);

await app.register(sensiblePlugin);

await app.register(clerkAuthPlugin);

registerIdempotencyHook(app);

app.addHook(
  "preHandler",
  async (request, reply) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return;
    }

    const path =
      request.url.split("?")[0];

    if (
      path.startsWith(
        "/api/v1/health"
      ) ||
      path.startsWith(
        "/api/whatsapp/webhook"
      )
    ) {
      return;
    }

    const authenticated =
      await requireAuthenticatedUser(
        request,
        reply
      );

    if (!authenticated) {
      return reply;
    }

    const schoolId = request.userId;
    if (schoolId) {
      try {
        const profile = await getSchoolProfileService({ schoolId });
        if (profile && !profile.isProfileComplete) {
          const isWhitelisted =
            path.startsWith("/api/v1/settings") ||
            path.startsWith("/api/v1/auth") ||
            path.startsWith("/api/v1/health") ||
            path.startsWith("/api/whatsapp/webhook");

          if (!isWhitelisted) {
            reply.status(403).send({
              success: false,
              error: "PROFILE_INCOMPLETE",
              message: "Please complete your school profile and fee receipt settings first to access other features."
            });
            return reply;
          }
        }
      } catch (profileErr) {
        // If profile check fails, allow the request through rather than blocking everything
        request.log.warn({ err: profileErr }, "Profile completeness check failed, allowing request");
      }
    }
  }
);

app.addHook("preHandler", sanitizeBody);

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

await app.register(enrollmentRoutes, {
  prefix: "/api/v1/enrollments",
});

await app.register(promotionRoutes, {
  prefix: "/api/v1/promotion",
});

await app.register(whatsappRoutes, {
  prefix: "/api/whatsapp",
});

await app.register(healthRoutes, {
  prefix: "/api/v1/health",
});

app.log.info({ BASE_URL: env.BASE_URL, PORT: env.PORT }, "Loaded env");

// Schema is managed via Drizzle migrations in /drizzle/*.sql
// ensure*() boot-time PRAGMA checks have been removed — run: npm run db:push

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

cron.schedule(
  "0 2 * * *",
  async () => {
    const startTime = Date.now();
    app.log.info("Starting scheduled cleanup of unused classes...");
    try {
      const schools = await db
        .select({ clerkId: principals.clerkId })
        .from(principals);

      for (const school of schools) {
        const schoolId = school.clerkId;
        if (!schoolId) continue;
        try {
          const academicYear = await getActiveAcademicYearService({ schoolId });
          const cleanedCount = await cleanupUnusedClassesService({ schoolId, academicYear });
          app.log.info(
            { schoolId, academicYear, cleanedCount },
            `Cleaned ${cleanedCount} unused classes for school ${schoolId}`
          );
        } catch (schoolErr) {
          app.log.error(
            { schoolId, err: schoolErr },
            `Failed to cleanup unused classes for school ${schoolId}`
          );
        }
      }
    } catch (err) {
      app.log.error(err, "Failed to fetch schools for cleanup job");
    } finally {
      const duration = Date.now() - startTime;
      app.log.info({ duration }, `Completed scheduled cleanup of unused classes in ${duration}ms`);
    }
  },
  {
    timezone: "Asia/Kolkata",
  }
);

export default app;
