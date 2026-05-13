import dotenv from "dotenv";

dotenv.config();

const parsePort = (value, fallback) => {
  const port = Number.parseInt(value, 10);
  return Number.isNaN(port) ? fallback : port;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parsePort(process.env.PORT ?? "3000", 3000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
  turso: {
    url: process.env.TURSO_DATABASE_URL ?? "file:./turso.db",
    authToken: process.env.TURSO_AUTH_TOKEN ?? ""
  }
};
