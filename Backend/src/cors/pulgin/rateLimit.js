import rateLimit from "@fastify/rate-limit";

export default async function rateLimitPlugin(app) {
  await app.register(rateLimit, {
    global: true,

    max: 300,

    timeWindow: "1 minute",

    keyGenerator: (request) => request.userId || request.ip,

    errorResponseBuilder: function (_, context) {
      return {
        success: false,
        message: "Too many requests",
        statusCode: 429,
        retryAfter: context.after,
      };
    },
  });
}

export const heavyRateLimit = {
  max: 10,
  timeWindow: "1 minute",
};