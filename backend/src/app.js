import cors from "cors";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import healthRouter from "./modules/health/health.routes.js";

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false
  })
);

app.use("/api", healthRouter);

app.use((request, response) => {
  response.status(404).json({
    error: "Not Found",
    path: request.originalUrl
  });
});

app.use((error, _request, response, _next) => {
  if (env.nodeEnv !== "production") {
    console.error(error);
  } else {
    console.error(error?.message ?? "Unknown error");
  }
  response.status(500).json({
    error: "Internal Server Error"
  });
});

export default app;
