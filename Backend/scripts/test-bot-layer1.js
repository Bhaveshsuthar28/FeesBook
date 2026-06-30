// WARNING: This script writes and deletes test data. Do not run against production DATABASE_URL or CACHE_REDIS_URL.

import dotenv from "dotenv";
dotenv.config();

import { db } from "../src/cors/database/DB.Connect.js";
import { principalBotCredentialsTable } from "../src/cors/schema/principalBotCredentials.schema.js";
import { studentsTable } from "../src/cors/schema/students.schema.js";
import { classesTable } from "../src/cors/schema/classes.schema.js";
import { cacheRedis } from "../src/cors/cache/redis.client.js";
import { eq, like } from "drizzle-orm";
import {
  handleIncomingMessage,
  logoutCommand,
} from "../src/modules/whatsapp/principalBot/principalBot.auth.middleware.js";
import {
  saveBotCredentialsService,
} from "../src/modules/whatsapp/principalBot/principalBot.credentials.service.js";
import {
  destroySession,
} from "../src/modules/whatsapp/principalBot/principalBot.session.service.js";
import {
  handleParentIncomingMessage,
} from "../src/modules/whatsapp/parentBot.service.js";

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

async function runTests() {
  try {
    await cleanup();

    // Helper to create test credentials and activate it
    const setupSchoolCredentials = async (schoolId, activationCommand) => {
      await saveBotCredentialsService({
        schoolId,
        activationCommand,
        password: "TestPass@123",
      });
      await db
        .update(principalBotCredentialsTable)
        .set({ isActive: true })
        .where(eq(principalBotCredentialsTable.schoolId, schoolId));
    };

    // --- SCENARIO A — Happy path full login ---
    console.log("\n--- SCENARIO A: Happy path full login ---");
    await setupSchoolCredentials("test-school-1", "testlogin1");
    
    const replyA1 = await handleIncomingMessage({
      phoneNumber: "919000000001",
      messageText: "testlogin1",
    });
    assert(
      replyA1.reply && replyA1.reply.toLowerCase().includes("password"),
      "Scenario A - Step 1: Prompt for password"
    );

    const replyA2 = await handleIncomingMessage({
      phoneNumber: "919000000001",
      messageText: "TestPass@123",
    });
    assert(
      replyA2.reply &&
        (replyA2.reply.includes("✅") || replyA2.reply.toLowerCase().includes("logged in")),
      "Scenario A - Step 2: Login confirmation"
    );

    const replyA3 = await handleIncomingMessage({
      phoneNumber: "919000000001",
      messageText: "help",
    });
    assert(
      replyA3.authenticated === true && replyA3.schoolId === "test-school-1",
      "Scenario A - Step 3: Run authenticated command"
    );

    // --- SCENARIO B — Wrong password then correct password ---
    console.log("\n--- SCENARIO B: Wrong password then correct password ---");
    await setupSchoolCredentials("test-school-2", "testlogin2");
    
    await handleIncomingMessage({
      phoneNumber: "919000000002",
      messageText: "testlogin2",
    });
    const replyB1 = await handleIncomingMessage({
      phoneNumber: "919000000002",
      messageText: "wrongpass1",
    });
    assert(
      replyB1.reply &&
        (replyB1.reply.toLowerCase().includes("incorrect") ||
          replyB1.reply.toLowerCase().includes("wrong")) &&
        replyB1.reply.includes("attempt"),
      "Scenario B - Step 1: Incorrect password warning"
    );

    const replyB2 = await handleIncomingMessage({
      phoneNumber: "919000000002",
      messageText: "TestPass@123",
    });
    assert(
      replyB2.reply &&
        (replyB2.reply.includes("✅") || replyB2.reply.toLowerCase().includes("logged in")),
      "Scenario B - Step 2: Correct password login successful"
    );

    // --- SCENARIO C — Lockout after 3 failed attempts ---
    console.log("\n--- SCENARIO C: Lockout after 3 failed attempts ---");
    await setupSchoolCredentials("test-school-3", "testlogin3");
    
    await handleIncomingMessage({
      phoneNumber: "919000000003",
      messageText: "testlogin3",
    });
    
    // 1st failed attempt
    await handleIncomingMessage({
      phoneNumber: "919000000003",
      messageText: "wrong-1",
    });
    // 2nd failed attempt
    await handleIncomingMessage({
      phoneNumber: "919000000003",
      messageText: "wrong-2",
    });
    // 3rd failed attempt
    const replyC3 = await handleIncomingMessage({
      phoneNumber: "919000000003",
      messageText: "wrong-3",
    });
    assert(
      replyC3.reply && replyC3.reply.toLowerCase().includes("locked"),
      "Scenario C - Step 1: 3rd wrong password locks account"
    );

    const replyC4 = await handleIncomingMessage({
      phoneNumber: "919000000003",
      messageText: "TestPass@123",
    });
    assert(
      replyC4.reply &&
        (replyC4.reply.toLowerCase().includes("locked") ||
          replyC4.reply.toLowerCase().includes("failed attempts") ||
          replyC4.reply.toLowerCase().includes("minutes")),
      "Scenario C - Step 2: Block login during lockout"
    );

    // --- SCENARIO D — Invalid activation command ---
    console.log("\n--- SCENARIO D: Invalid activation command ---");
    
    const replyD = await handleIncomingMessage({
      phoneNumber: "919000000004",
      messageText: "doesnotexist999",
    });
    assert(
      replyD.reply === null,
      "Scenario D - Step 1: Ignore invalid activation command silently"
    );

    // --- SCENARIO E — Session expiry simulation ---
    console.log("\n--- SCENARIO E: Session expiry simulation ---");
    await setupSchoolCredentials("test-school-5", "testlogin5");
    
    await handleIncomingMessage({
      phoneNumber: "919000000005",
      messageText: "testlogin5",
    });
    await handleIncomingMessage({
      phoneNumber: "919000000005",
      messageText: "TestPass@123",
    });
    
    // Simulate TTL expiry
    await destroySession({ phoneNumber: "919000000005" });
    
    const replyE = await handleIncomingMessage({
      phoneNumber: "919000000005",
      messageText: "help",
    });
    assert(
      !replyE.authenticated,
      "Scenario E - Step 1: Block command execution after session destruction"
    );

    // --- SCENARIO F — Logout command ---
    console.log("\n--- SCENARIO F: Logout command ---");
    await setupSchoolCredentials("test-school-6", "testlogin6");
    
    await handleIncomingMessage({
      phoneNumber: "919000000006",
      messageText: "testlogin6",
    });
    await handleIncomingMessage({
      phoneNumber: "919000000006",
      messageText: "TestPass@123",
    });
    
    const replyF1 = await logoutCommand({ phoneNumber: "919000000006" });
    assert(
      replyF1.reply && replyF1.reply.toLowerCase().includes("logged out"),
      "Scenario F - Step 1: Logout command response"
    );

    const replyF2 = await handleIncomingMessage({
      phoneNumber: "919000000006",
      messageText: "help",
    });
    assert(
      !replyF2.authenticated,
      "Scenario F - Step 2: Block commands after logging out"
    );

    // --- SCENARIO G — Parent Bot Multi-Child Query ---
    console.log("\n--- SCENARIO G: Parent Bot Multi-Child Query ---");
    
    // 1. Insert mock class
    await db.insert(classesTable).values({
      id: "test-class-1",
      schoolId: "test-school-7",
      name: "5th Grade",
      sequence: 1,
      academicYear: "2026-2027",
    });

    // 2. Insert mock students with same phone number
    await db.insert(studentsTable).values([
      {
        id: "test-student-1",
        schoolId: "test-school-7",
        classId: "test-class-1",
        sectionId: "test-section-1",
        schoolRegisterNo: "REG-001",
        rollNumber: 10,
        firstName: "Aarav",
        fullName: "Aarav Kumar",
        gender: "Male",
        dob: "2015-05-10",
        phone: "919000000007",
        fatherName: "Rajesh Kumar",
        createdAt: Date.now(),
      },
      {
        id: "test-student-2",
        schoolId: "test-school-7",
        classId: "test-class-1",
        sectionId: "test-section-1",
        schoolRegisterNo: "REG-002",
        rollNumber: 15,
        firstName: "Diya",
        fullName: "Diya Kumar",
        gender: "Female",
        dob: "2012-08-22",
        phone: "919000000007",
        fatherName: "Rajesh Kumar",
        createdAt: Date.now(),
      }
    ]);

    // 3. Test initial message checks parent list
    const parentReply1 = await handleParentIncomingMessage("919000000007", "check fees");
    assert(
      parentReply1.reply &&
        parentReply1.reply.toLowerCase().includes("multiple children") &&
        parentReply1.reply.includes("Aarav Kumar") &&
        parentReply1.reply.includes("Diya Kumar"),
      "Scenario G - Step 1: Detect multiple children and offer option list"
    );

    // 4. Test selecting Option 1 (Aarav Kumar)
    const parentReply2 = await handleParentIncomingMessage("919000000007", "1");
    assert(
      parentReply2.reply &&
        parentReply2.reply.includes("Aarav Kumar") &&
        parentReply2.reply.includes("Fee Summary"),
      "Scenario G - Step 2: Select child index option and return fee profile details"
    );

    await cleanup();

    console.log("\n--- FINAL TEST SUMMARY ---");
    console.log(`Total Tests Run: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);

    if (failedTests > 0) {
      console.log("\n❌ SOME TESTS FAILED.");
      process.exit(1);
    } else {
      console.log("\n🎉 ALL TESTS PASSED.");
      process.exit(0);
    }
  } catch (err) {
    console.error("Test execution aborted with error:", err);
    await cleanup();
    process.exit(1);
  }
}

runTests();
