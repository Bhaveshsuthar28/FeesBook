import fp from "fastify-plugin";
import { clerkPlugin } from "@clerk/fastify";

import { env } from "../config/env.js";

async function clerkAuthPlugin(app) {
  await app.register(clerkPlugin, {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey: env.CLERK_PUBLISHABLE_KEY,
  });
}

export default fp(clerkAuthPlugin);
