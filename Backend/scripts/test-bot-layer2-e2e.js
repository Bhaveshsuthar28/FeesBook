// WARNING: This script makes HTTP calls to http://localhost:5000 and modifies test database data.
// Ensure your local server is running on port 5000 before starting this test.

import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
import { db } from "../src/cors/database/DB.Connect.js";
import { principalBotCredentialsTable } from "../src/cors/schema/principalBotCredentials.schema.js";
import { studentsTable } from "../src/cors/schema/students.schema.js";
import { classesTable } from "../src/cors/schema/classes.schema.js";
import { cacheRedis } from "../src/cors/cache/redis.client.js";
import { eq, like } from "drizzle-orm";
import { getSession as getPrincipalSession } from "../src/modules/whatsapp/principalBot/principalBot.session.service.js";
import { saveBotCredentialsService } from "../src/modules/whatsapp/principalBot/principalBot.credentials.service.js";

const PORT = process.env.PORT || 5000;
const WEBHOOK_URL = `http://localhost:${PORT}/api/whatsapp/webhook/whatsapp`;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, label) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`\x1b[32m✅ PASS: ${label}\x1b[0m`);
  } else {
    failedTests++;
    console.log(`\x1b[31m❌ FAIL: ${label}\x1b[0m`);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function cleanup() {
  console.log("Cleaning up test database rows...");
  await db
    .delete(principalBotCredentialsTable)
    .where(like(principalBotCredentialsTable.schoolId, "test-%"));

  await db
    .delete(studentsTable)
    .where(like(studentsTable.schoolId, "test-%"));

  await db
    .delete(classesTable)
    .where(like(classesTable.schoolId, "test-%"));

  console.log("Cleaning up test Redis sessions...");
  if (cacheRedis) {
    const keys = await cacheRedis.keys("botsession:91900000*");
    const parentKeys = await cacheRedis.keys("parentsession:91900000*");
    const allKeys = [...keys, ...parentKeys];
    if (allKeys.length > 0) {
      await cacheRedis.del(allKeys);
    }
  }
}

// Construct Meta Webhook Payload
function makeMetaPayload(phone, messageText) {
  const timestamp = Math.floor(Date.now() / 1000);
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "TEST_WABA_ID",
      changes: [{
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "910000000000",
            phone_number_id: "TEST_PHONE_ID"
          },
          contacts: [{ profile: { name: "Test User" }, wa_id: phone }],
          messages: [{
            from: phone,
            id: `wamid.test${timestamp}`,
            timestamp: String(timestamp),
            text: { body: messageText },
            type: "text"
          }]
        },
        field: "messages"
      }]
    }]
  };
}

async function runE2ETests() {
  try {
    await cleanup();

    console.log("\nSetting up test database records...");
    
    // Set up Principal credentials
    await saveBotCredentialsService({
      schoolId: "test-school-1",
      activationCommand: "testlogin123",
      password: "TestPass@123",
    });
    // Activate it
    await db
      .update(principalBotCredentialsTable)
      .set({ isActive: true })
      .where(eq(principalBotCredentialsTable.schoolId, "test-school-1"));

    // Set up parent students
    await db.insert(classesTable).values({
      id: "test-class-1",
      schoolId: "test-school-1",
      name: "10th Grade",
      sequence: 1,
      academicYear: "2026-2027",
    });

    await db.insert(studentsTable).values([
      {
        id: "test-student-1",
        schoolId: "test-school-1",
        classId: "test-class-1",
        sectionId: "test-section-1",
        schoolRegisterNo: "REG-001",
        rollNumber: 1,
        firstName: "Aarav",
        fullName: "Aarav Kumar",
        gender: "Male",
        dob: "2010-01-01",
        phone: "919000000020",
        fatherName: "Rajesh Kumar",
        createdAt: Date.now(),
      },
      {
        id: "test-student-2",
        schoolId: "test-school-1",
        classId: "test-class-1",
        sectionId: "test-section-1",
        schoolRegisterNo: "REG-002",
        rollNumber: 2,
        firstName: "Diya",
        fullName: "Diya Kumar",
        gender: "Female",
        dob: "2012-05-05",
        phone: "919000000020",
        fatherName: "Rajesh Kumar",
        createdAt: Date.now(),
      }
    ]);

    console.log("Waiting for database commits to fully propagate...");
    let committed = false;
    for (let i = 0; i < 15; i++) {
      const creds = await db
        .select()
        .from(principalBotCredentialsTable)
        .where(eq(principalBotCredentialsTable.schoolId, "test-school-1"));
      const studs = await db
        .select()
        .from(studentsTable)
        .where(eq(studentsTable.schoolId, "test-school-1"));
      
      if (creds.length > 0 && creds[0].isActive && studs.length === 2) {
        committed = true;
        break;
      }
      await sleep(1000);
    }
    if (!committed) {
      throw new Error("Database writes did not commit in time.");
    }
    console.log("Database records verified in DB.");

    // =========================================================================
    // SECTION 1: Principal Bot Webhook Flow
    // =========================================================================
    console.log("\n--- SECTION 1: Principal Bot End-to-End ---");

    const phonePrincipal = "919000000021";

    // 1. Send activation command
    console.log("Sending activation command...");
    await axios.post(WEBHOOK_URL, makeMetaPayload(phonePrincipal, "testlogin123"));

    let session1 = null;
    for (let i = 0; i < 10; i++) {
      session1 = await getPrincipalSession({ phoneNumber: phonePrincipal });
      if (session1 && session1.step === "awaiting_password") break;
      await sleep(1000);
    }
    assert(
      session1 && session1.step === "awaiting_password" && session1.schoolId === "test-school-1",
      "Principal: Activation command creates pending session"
    );

    // 2. Send wrong password
    console.log("Sending incorrect password...");
    await axios.post(WEBHOOK_URL, makeMetaPayload(phonePrincipal, "wrong-password-1"));

    let session2 = null;
    for (let i = 0; i < 10; i++) {
      session2 = await getPrincipalSession({ phoneNumber: phonePrincipal });
      if (session2 && session2.failedAttempts === 1) break;
      await sleep(1000);
    }
    console.log("DEBUG: session2 =", session2);
    assert(
      session2 && session2.failedAttempts === 1,
      "Principal: Incorrect password increments failedAttempts"
    );

    // 3. Send correct password
    console.log("Sending correct password...");
    await axios.post(WEBHOOK_URL, makeMetaPayload(phonePrincipal, "TestPass@123"));

    let session3 = null;
    for (let i = 0; i < 10; i++) {
      session3 = await getPrincipalSession({ phoneNumber: phonePrincipal });
      if (session3 && session3.authenticated === true) break;
      await sleep(1000);
    }
    console.log("DEBUG: session3 =", session3);
    assert(
      session3 && session3.authenticated === true && session3.step === "logged_in",
      "Principal: Correct password logs in and authenticates session"
    );

    const [dbRow] = await db
      .select()
      .from(principalBotCredentialsTable)
      .where(eq(principalBotCredentialsTable.schoolId, "test-school-1"));
    assert(
      dbRow && dbRow.phoneNumber === phonePrincipal,
      "Principal: Phone number is successfully bound in database"
    );

    // =========================================================================
    // SECTION 2: Parent Bot Webhook Flow
    // =========================================================================
    console.log("\n--- SECTION 2: Parent Bot End-to-End ---");

    const phoneParent = "919000000020";

    // 1. Send initial query message
    console.log("Sending parent fee query...");
    await axios.post(WEBHOOK_URL, makeMetaPayload(phoneParent, "check fees"));

    const parentSessionKey = `parentsession:${phoneParent}`;
    let parentSession1 = null;
    for (let i = 0; i < 10; i++) {
      const parentSession1Raw = await cacheRedis.get(parentSessionKey);
      if (parentSession1Raw) {
        parentSession1 = JSON.parse(parentSession1Raw);
        break;
      }
      await sleep(1000);
    }
    console.log("DEBUG: parentSession1 =", parentSession1);
    assert(
      parentSession1 && parentSession1.step === "select_child" && parentSession1.studentIds.length === 2,
      "Parent: Initial query triggers student options selection session"
    );

    // 2. Select option index 1 (Aarav Kumar)
    console.log("Sending parent selection option '1'...");
    await axios.post(WEBHOOK_URL, makeMetaPayload(phoneParent, "1"));

    let parentSession2Raw = "";
    for (let i = 0; i < 10; i++) {
      parentSession2Raw = await cacheRedis.get(parentSessionKey);
      if (parentSession2Raw === null) break;
      await sleep(1000);
    }
    console.log("DEBUG: parentSession2Raw =", parentSession2Raw);
    assert(
      parentSession2Raw === null,
      "Parent: Selection choice consumes and terminates the session successfully"
    );

    await cleanup();

    console.log("\n--- E2E VERIFICATION SUMMARY ---");
    console.log(`Total HTTP/E2E Tests Run: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.log("\n❌ SOME E2E TESTS FAILED.");
      process.exit(1);
    } else {
      console.log("\n🎉 ALL E2E HTTP TESTS PASSED SUCCESSFULLY.");
      process.exit(0);
    }
  } catch (err) {
    console.error("E2E testing aborted with error:", err.message);
    await cleanup();
    process.exit(1);
  }
}

runE2ETests();
