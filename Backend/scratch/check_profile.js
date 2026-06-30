import { db } from "../src/cors/database/DB.Connect.js";
import { principals } from "../src/modules/auth/auth.schema.js";
import { eq } from "drizzle-orm";
import { checkProfileCompletion } from "../src/cors/utils/profile.js";

async function run() {
  console.log("=== Checking School Profile completeness ===");

  const [principal] = await db.select().from(principals).where(eq(principals.clerkId, "user_test_123"));
  if (!principal) {
    console.log("No principal found for user_test_123");
    process.exit(0);
  }

  console.log("Principal values:", JSON.stringify(principal, null, 2));
  console.log("checkProfileCompletion result:", checkProfileCompletion(principal));
  process.exit(0);
}

run();
