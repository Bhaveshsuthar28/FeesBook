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

const sql1 = `
CREATE TABLE IF NOT EXISTS \`principal_bot_credentials\` (
	\`id\` text PRIMARY KEY NOT NULL,
	\`school_id\` text NOT NULL UNIQUE,
	\`activation_command\` text NOT NULL UNIQUE,
	\`password_hash\` text NOT NULL,
	\`phone_number\` text,
	\`failed_attempts\` integer DEFAULT 0,
	\`locked_until\` text,
	\`created_at\` text DEFAULT (CURRENT_TIMESTAMP),
	\`updated_at\` text DEFAULT (CURRENT_TIMESTAMP)
);
`;

const sql2 = `
CREATE UNIQUE INDEX IF NOT EXISTS \`idx_activation_command\` ON \`principal_bot_credentials\` (\`activation_command\`);
`;

const sql3 = `
CREATE UNIQUE INDEX IF NOT EXISTS \`idx_principal_bot_school\` ON \`principal_bot_credentials\` (\`school_id\`);
`;

async function run() {
  try {
    console.log("Executing SQL1...");
    await client.execute(sql1);
    console.log("Executing SQL2...");
    await client.execute(sql2);
    console.log("Executing SQL3...");
    await client.execute(sql3);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.close();
  }
}

run();
