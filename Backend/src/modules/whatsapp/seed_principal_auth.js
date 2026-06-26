import { createClient } from "@libsql/client";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../../../.env") });

const client = createClient({
  url: process.env.DATABASE_URL,
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

async function main() {
  const phone = process.argv[2] || "919876543210";
  const rawCode = process.argv[3] || "123456";

  console.log(`Seeding Principal Bot Auth...`);
  console.log(`Phone: ${phone}`);
  console.log(`Code: ${rawCode}`);

  // 1. Fetch first principal to get schoolId (clerk_id)
  const principalResult = await client.execute("SELECT clerk_id, school_name FROM principals LIMIT 1");
  if (principalResult.rows.length === 0) {
    console.error("Error: No principal/school found in database. Please register a school first.");
    process.exit(1);
  }

  const schoolId = principalResult.rows[0].clerk_id;
  const schoolName = principalResult.rows[0].school_name;
  console.log(`Found School: ${schoolName} (ID: ${schoolId})`);

  // 2. Hash secret code
  const hashedCode = await bcrypt.hash(rawCode, 10);

  // 3. Delete existing auth if exists for phone
  await client.execute({
    sql: "DELETE FROM principal_bot_auth WHERE phone = ?",
    args: [phone]
  });

  // 4. Insert principal bot credentials
  const id = randomUUID();
  await client.execute({
    sql: `
      INSERT INTO principal_bot_auth (id, school_id, phone, secret_code, failed_attempts, blocked_until, created_at)
      VALUES (?, ?, ?, ?, 0, NULL, ?)
    `,
    args: [id, schoolId, phone, hashedCode, Date.now()]
  });

  console.log("✅ Principal Bot Auth seeded successfully!");
  client.close();
}

main().catch((err) => {
  console.error(err);
  if (client) client.close();
});
