import { clerkPlugin } from "@clerk/fastify";

import { env } from "../config/env.js";

export default async function clerkAuthPlugin(app) {

  await app.register(clerkPlugin, {
    secretKey: env.CLERK_SECRET_KEY,
    publishableKey : env.CLERK_PUBLISHABLE_KEY
  });
}