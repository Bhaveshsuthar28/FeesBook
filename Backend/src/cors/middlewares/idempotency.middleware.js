import { cacheRedis } from "../cache/redis.client.js";

export default async function idempotencyMiddleware(request, reply) {
  const idempotencyKey = request.headers["x-idempotency-key"];
  if (!idempotencyKey) return;

  try {
    const cached = await cacheRedis.get(`idempotency:${idempotencyKey}`);
    if (cached) {
      const parsed = JSON.parse(cached);
      return reply
        .code(parsed.status)
        .header("Content-Type", "application/json; charset=utf-8")
        .send(parsed.body);
    }
    // Flag request to be cached in the onSend hook
    request.idempotencyKey = idempotencyKey;
  } catch (err) {
    request.log.error(err, "Idempotency preHandler error checking cache");
  }
}

export function registerIdempotencyHook(fastifyInstance) {
  fastifyInstance.addHook("onSend", async (request, reply, payload) => {
    const idempotencyKey = request.idempotencyKey;
    if (!idempotencyKey) return payload;

    try {
      let parsedBody = payload;
      if (typeof payload === "string") {
        try {
          parsedBody = JSON.parse(payload);
        } catch {
          // not JSON, keep as raw string
        }
      }

      const cacheData = {
        status: reply.statusCode,
        body: parsedBody,
      };

      if (reply.statusCode >= 200 && reply.statusCode < 300) {
        await cacheRedis.set(
          `idempotency:${idempotencyKey}`,
          JSON.stringify(cacheData),
          "EX",
          86400
        );
      }
    } catch (err) {
      request.log.error(err, "Idempotency onSend error saving response to Redis");
    }

    return payload;
  });
}
