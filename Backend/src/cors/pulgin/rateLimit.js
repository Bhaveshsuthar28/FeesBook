import rateLimit from "@fastify/rate-limit";

export default async function rateLimitPlugin(app) {
  await app.register(rateLimit, {
    global: true,

    max: 100,

    timeWindow: "1 minute",

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