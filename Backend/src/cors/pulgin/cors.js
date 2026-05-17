import cors from "@fastify/cors";
import fp from "fastify-plugin";
import { env } from "../config/env.js";

async function corsPlugin(app) {
  const allowed = [
    env.BASE_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
  ];

  await app.register(cors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowed.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked origin: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 200,
  });
}

export default fp(corsPlugin);