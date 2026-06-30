import { createClient } from "@libsql/client";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function run() {
  try {
    console.log("Altering table principal_bot_credentials to add is_active...");
    await client.execute("ALTER TABLE principal_bot_credentials ADD COLUMN is_active INTEGER NOT NULL DEFAULT 0");
    console.log("Table altered successfully!");
  } catch (err) {
    console.error("Alter failed:", err);
  } finally {
    client.close();
  }
}

run();
