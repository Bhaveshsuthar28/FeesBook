// src/cors/pulgin/helmet.js

import helmet from "@fastify/helmet";

export default async function helmetPlugin(app) {

  await app.register(helmet, {

    global: true,

    contentSecurityPolicy: false,

    crossOriginEmbedderPolicy: false,

    crossOriginResourcePolicy: false,
  });
}