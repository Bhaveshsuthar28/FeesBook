import "dotenv/config";

export default {
  schema: [
    "./src/cors/schema/**/*.js",
    "./src/modules/**/*.schema.js"
  ],

  out: "./drizzle",

  dialect: "turso",

  dbCredentials: {
    url:
      process.env.DATABASE_URL,

    authToken:
      process.env
        .DATABASE_AUTH_TOKEN,
  },
};