import dotenv from "dotenv";

dotenv.config();

export const env = {
  PORT: process.env.PORT || 8000,

  NODE_ENV: process.env.NODE_ENV,

  DATABASE_URL: process.env.DATABASE_URL,
  DATABASE_AUTH_TOKEN: process.env.DATABASE_AUTH_TOKEN,

  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  BASE_URL:process.env.BASE_URL,

  IMAGEKIT_PUBLIC_KEY: process.env.IMAGEKIT_PUBLIC_KEY,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,

  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
  WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
  WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN || 'feego_webhook_secret',
  WHATSAPP_API_VERSION: process.env.WHATSAPP_API_VERSION || 'v19.0',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  CACHE_REDIS_URL: process.env.CACHE_REDIS_URL || 'redis://localhost:6379',
  QUEUE_REDIS_URL: process.env.QUEUE_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379',
  WHATSAPP_DRY_RUN: process.env.WHATSAPP_DRY_RUN || 'false',
};

if (!process.env.CACHE_REDIS_URL) {
  console.warn("[Env Warning] CACHE_REDIS_URL is not set. Cache operations will fall back to local/default Redis server.");
}
if (!process.env.QUEUE_REDIS_URL && !process.env.REDIS_URL) {
  console.warn("[Env Warning] QUEUE_REDIS_URL (or REDIS_URL) is not set. Queue operations will fall back to local/default Redis server.");
}

