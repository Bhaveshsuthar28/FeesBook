import bcrypt from "bcrypt";
import { db } from "../../cors/database/DB.Connect.js";
import { botSessions, principalBotAuth } from "./whatsapp.schema.js";
import { studentFeesTable } from "../../cors/schema/studentFees.schema.js";
import { studentsTable } from "../../cors/schema/students.schema.js";
import { classesTable } from "../../cors/schema/classes.schema.js";
import { sectionsTable } from "../../cors/schema/sections.schema.js";
import { studentPaymentsTable } from "../../cors/schema/studentPayments.schema.js";
import { principals } from "../auth/auth.schema.js";
import { and, eq, lte, like, or } from "drizzle-orm";
import { sendTextMessage } from "./whatsapp.service.js";
import { recordStudentPaymentService } from "../students/students.service.js";

// Session lifespan: 30 minutes
const SESSION_EXPIRY = 30 * 60 * 1000;

// Fetch/validate session
export async function getSession(phone) {
  const [session] = await db
    .select()
    .from(botSessions)
    .where(eq(botSessions.phone, phone));

  if (!session) return null;

  if (session.expiresAt && session.expiresAt < Date.now()) {
    // Expired: delete session
    await db.delete(botSessions).where(eq(botSessions.phone, phone));
    return null;
  }

  // Extend session lifespan
  await db
    .update(botSessions)
    .set({ expiresAt: Date.now() + SESSION_EXPIRY })
    .where(eq(botSessions.phone, phone));

  return {
    ...session,
    context: JSON.parse(session.context || "{}"),
  };
}

// Update session step/context
async function updateSession(phone, updates) {
  const dbUpdates = { ...updates };
  if (updates.context) {
    dbUpdates.context = JSON.stringify(updates.context);
  }
  await db
    .update(botSessions)
    .set(dbUpdates)
    .where(eq(botSessions.phone, phone));
}

// 1. Check if number is principal
export async function isPrincipalNumber(phone) {
  const [auth] = await db
    .select()
    .from(principalBotAuth)
    .where(eq(principalBotAuth.phone, phone));
  return !!auth;
}

// Main Menu Text
const MAIN_MENU_TEXT = `Welcome 👋
FeesBook School Manager

1️⃣ School Summary
2️⃣ Fee Collection Report  
3️⃣ Pending Fees List
4️⃣ Search Student
5️⃣ Register Fee Payment
0️⃣ Exit

Reply with option number (0-5) to select:`;

// Process incoming principal bot messages
export async function processBotMessage(phone, text) {
  let session = await getSession(phone);
  const input = text?.trim();

  // If no session exists, start auth flow
  if (!session) {
    const [authRecord] = await db
      .select()
      .from(principalBotAuth)
      .where(eq(principalBotAuth.phone, phone));

    if (!authRecord) {
      await sendTextMessage(phone, "You are not authorized to use the Principal Bot.");
      return;
    }

    // Check block list
    if (authRecord.blockedUntil && authRecord.blockedUntil > Date.now()) {
      const remainingMin = Math.ceil((authRecord.blockedUntil - Date.now()) / 60000);
      await sendTextMessage(phone, `Your bot access is blocked. Please try again after ${remainingMin} minutes.`);
      return;
    }

    // Create session
    await db.insert(botSessions).values({
      phone,
      schoolId: authRecord.schoolId,
      currentStep: "AWAITING_AUTH",
      context: JSON.stringify({}),
      authenticated: false,
      expiresAt: Date.now() + SESSION_EXPIRY,
    });

    await sendTextMessage(phone, "🔐 Enter your secret code to log in:");
    return;
  }

  // Handle Authentication Step
  if (session.currentStep === "AWAITING_AUTH") {
    const [authRecord] = await db
      .select()
      .from(principalBotAuth)
      .where(eq(principalBotAuth.phone, phone));

    const isMatch = await bcrypt.compare(input, authRecord.secretCode);

    if (isMatch) {
      await updateSession(phone, {
        authenticated: true,
        currentStep: "MAIN_MENU",
        failedAttempts: 0,
        context: {},
      });
      await sendTextMessage(phone, MAIN_MENU_TEXT);
    } else {
      const attempts = (authRecord.failedAttempts || 0) + 1;
      if (attempts >= 3) {
        // Block principal for 1 hour
        await db
          .update(principalBotAuth)
          .set({
            failedAttempts: 0,
            blockedUntil: Date.now() + 60 * 60 * 1000,
          })
          .where(eq(principalBotAuth.phone, phone));

        await db.delete(botSessions).where(eq(botSessions.phone, phone));
        await sendTextMessage(phone, "❌ Too many failed attempts. Your access is blocked for 1 hour.");
      } else {
        await db
          .update(principalBotAuth)
          .set({ failedAttempts: attempts })
          .where(eq(principalBotAuth.phone, phone));

        await sendTextMessage(phone, `⚠️ Invalid code. ${3 - attempts} attempts remaining. Please enter your secret code:`);
      }
    }
    return;
  }

  const context = session.context || {};
  const schoolId = session.schoolId;

  // Option 0: Exit at any time
  if (input === "0") {
    await db.delete(botSessions).where(eq(botSessions.phone, phone));
    await sendTextMessage(phone, "Session ended. Goodbye! 👋");
    return;
  }

  // Handle Main Menu Navigation
  if (session.currentStep === "MAIN_MENU") {
    if (input === "1") {
      // 1️⃣ School Summary
      await sendTextMessage(phone, "Querying school metrics... ⏳");
      const summary = await getSchoolSummaryReport(schoolId);
      await sendTextMessage(phone, `${summary}\n\nReply with menu option (0-5) or type any message to see menu:`);
    } else if (input === "2") {
      // 2️⃣ Fee Collection Report (Show Submenu)
      await updateSession(phone, { currentStep: "REPORT_MENU" });
      await sendTextMessage(
        phone,
        `📊 Fee Collection Report
Select range:
1️⃣ This Month
2️⃣ This Quarter
3️⃣ This Year
0️⃣ Back`
      );
    } else if (input === "3") {
      // 3️⃣ Pending Fees List (Show Submenu)
      await updateSession(phone, { currentStep: "PENDING_MENU" });
      await sendTextMessage(
        phone,
        `🚨 Pending Fees
Select filter:
1️⃣ By Class
2️⃣ All Defaulters
0️⃣ Back`
      );
    } else if (input === "4") {
      // 4️⃣ Search Student
      await updateSession(phone, { currentStep: "SEARCH_AWAITING_INPUT" });
      await sendTextMessage(phone, "🔍 Enter student name or roll number:");
    } else if (input === "5") {
      // 5️⃣ Register Fee Payment
      await updateSession(phone, { currentStep: "PAYMENT_AWAITING_ROLL" });
      await sendTextMessage(phone, "💵 Enter student Roll Number:");
    } else {
      await sendTextMessage(phone, MAIN_MENU_TEXT);
    }
    return;
  }

  // Step Handler: Fee Collection Report Menu
  if (session.currentStep === "REPORT_MENU") {
    if (input === "1" || input === "2" || input === "3") {
      const range = input === "1" ? "month" : input === "2" ? "quarter" : "year";
      const report = await getCollectionReport(schoolId, range);
      await updateSession(phone, { currentStep: "MAIN_MENU" });
      await sendTextMessage(phone, `${report}\n\n${MAIN_MENU_TEXT}`);
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU" });
      await sendTextMessage(phone, MAIN_MENU_TEXT);
    }
    return;
  }

  // Step Handler: Pending Fees Menu
  if (session.currentStep === "PENDING_MENU") {
    if (input === "1") {
      await updateSession(phone, { currentStep: "PENDING_AWAITING_CLASS" });
      await sendTextMessage(phone, "🏫 Enter Class Name (e.g. 4th, 5th, 10th):");
    } else if (input === "2") {
      // Defaulters List
      const report = await getDefaultersList(schoolId, null, 0);
      await updateSession(phone, {
        currentStep: "PENDING_DEFAULTERS_LIST",
        context: { listOffset: 0, lastClass: null },
      });
      await sendTextMessage(phone, report);
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU" });
      await sendTextMessage(phone, MAIN_MENU_TEXT);
    }
    return;
  }

  // Step Handler: Pending Awaiting Class Name
  if (session.currentStep === "PENDING_AWAITING_CLASS") {
    const report = await getDefaultersList(schoolId, input, 0);
    await updateSession(phone, {
      currentStep: "PENDING_DEFAULTERS_LIST",
      context: { listOffset: 0, lastClass: input },
    });
    await sendTextMessage(phone, report);
    return;
  }

  // Step Handler: Pending Defaulters Pagination
  if (session.currentStep === "PENDING_DEFAULTERS_LIST") {
    if (input.toLowerCase() === "next") {
      const nextOffset = (context.listOffset || 0) + 20;
      const report = await getDefaultersList(schoolId, context.lastClass, nextOffset);
      await updateSession(phone, {
        context: { ...context, listOffset: nextOffset },
      });
      await sendTextMessage(phone, report);
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
      await sendTextMessage(phone, MAIN_MENU_TEXT);
    }
    return;
  }

  // Step Handler: Student Search Input
  if (session.currentStep === "SEARCH_AWAITING_INPUT") {
    const results = await searchStudents(schoolId, input);
    if (results.length === 0) {
      await updateSession(phone, { currentStep: "MAIN_MENU" });
      await sendTextMessage(phone, `No students found matching "${input}".\n\n${MAIN_MENU_TEXT}`);
    } else if (results.length === 1) {
      const detail = await getStudentProfileDetails(schoolId, results[0].id);
      await updateSession(phone, { currentStep: "MAIN_MENU" });
      await sendTextMessage(phone, `${detail}\n\n${MAIN_MENU_TEXT}`);
    } else {
      // Multiple matches: show numbered options
      let list = `Found multiple students matching "${input}":\n\n`;
      results.slice(0, 10).forEach((s, idx) => {
        list += `${idx + 1}️⃣ ${s.fullName} (Roll: ${s.rollNumber}, Class: ${s.className})\n`;
      });
      list += `\nReply with number (1-${Math.min(10, results.length)}) to select:`;
      await updateSession(phone, {
        currentStep: "SEARCH_SELECT_STUDENT",
        context: { searchResults: results.slice(0, 10).map((r) => r.id) },
      });
      await sendTextMessage(phone, list);
    }
    return;
  }

  // Step Handler: Student Search Select
  if (session.currentStep === "SEARCH_SELECT_STUDENT") {
    const selectionIdx = parseInt(input, 10) - 1;
    const studentIds = context.searchResults || [];
    const studentId = studentIds[selectionIdx];

    if (studentId) {
      const detail = await getStudentProfileDetails(schoolId, studentId);
      await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
      await sendTextMessage(phone, `${detail}\n\n${MAIN_MENU_TEXT}`);
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
      await sendTextMessage(phone, `Invalid selection.\n\n${MAIN_MENU_TEXT}`);
    }
    return;
  }

  // Step Handler: Payment Roll Input
  if (session.currentStep === "PAYMENT_AWAITING_ROLL") {
    const results = await db
      .select({
        id: studentsTable.id,
        fullName: studentsTable.fullName,
        className: classesTable.name,
      })
      .from(studentsTable)
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
      .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.rollNumber, parseInt(input, 10) || 0)));

    if (results.length === 0) {
      await updateSession(phone, { currentStep: "MAIN_MENU" });
      await sendTextMessage(phone, `No active student found with Roll Number: ${input}.\n\n${MAIN_MENU_TEXT}`);
    } else if (results.length === 1) {
      await promptForPaymentFeeItem(phone, schoolId, results[0]);
    } else {
      // Multiple students share same roll number (across different classes)
      let list = `Multiple students with Roll Number ${input} found:\n\n`;
      results.forEach((s, idx) => {
        list += `${idx + 1}️⃣ ${s.fullName} (Class: ${s.className})\n`;
      });
      list += `\nReply with number (1-${results.length}) to select:`;
      await updateSession(phone, {
        currentStep: "PAYMENT_SELECT_STUDENT",
        context: { searchResults: results.map((r) => r.id) },
      });
      await sendTextMessage(phone, list);
    }
    return;
  }

  // Step Handler: Payment Select Student
  if (session.currentStep === "PAYMENT_SELECT_STUDENT") {
    const selectionIdx = parseInt(input, 10) - 1;
    const studentIds = context.searchResults || [];
    const studentId = studentIds[selectionIdx];

    if (studentId) {
      const [student] = await db
        .select({
          id: studentsTable.id,
          fullName: studentsTable.fullName,
          className: classesTable.name,
        })
        .from(studentsTable)
        .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
        .where(eq(studentsTable.id, studentId));

      await promptForPaymentFeeItem(phone, schoolId, student);
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
      await sendTextMessage(phone, `Invalid selection.\n\n${MAIN_MENU_TEXT}`);
    }
    return;
  }

  // Step Handler: Payment Select Fee Item
  if (session.currentStep === "PAYMENT_SELECT_FEE_ITEM") {
    const selectionIdx = parseInt(input, 10) - 1;
    const feeItemIds = context.feeItemIds || [];
    const studentFeeId = feeItemIds[selectionIdx];

    if (studentFeeId) {
      const [fee] = await db
        .select()
        .from(studentFeesTable)
        .where(eq(studentFeesTable.id, studentFeeId));

      await updateSession(phone, {
        currentStep: "PAYMENT_AWAITING_AMOUNT",
        context: { ...context, studentFeeId, dueAmount: fee.dueAmount },
      });
      await sendTextMessage(phone, `Due Amount: ₹${fee.dueAmount}. Enter the amount received:`);
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
      await sendTextMessage(phone, `Invalid selection.\n\n${MAIN_MENU_TEXT}`);
    }
    return;
  }

  // Step Handler: Payment Awaiting Amount
  if (session.currentStep === "PAYMENT_AWAITING_AMOUNT") {
    const amount = parseFloat(input);
    const dueAmount = context.dueAmount || 0;

    if (isNaN(amount) || amount <= 0 || amount > dueAmount) {
      await sendTextMessage(phone, `⚠️ Invalid amount. Must be between ₹1 and ₹${dueAmount}. Re-enter amount:`);
      return;
    }

    await updateSession(phone, {
      currentStep: "PAYMENT_CONFIRM",
      context: { ...context, paymentAmount: amount },
    });

    await sendTextMessage(
      phone,
      `Confirm registration of payment:
Student ID: ${context.selectedStudentName}
Amount: ₹${amount}

Reply "YES" to confirm or "NO" to cancel:`
    );
    return;
  }

  // Step Handler: Payment Confirmation
  if (session.currentStep === "PAYMENT_CONFIRM") {
    if (input.toUpperCase() === "YES") {
      try {
        await sendTextMessage(phone, "Registering payment... ⏳");
        
        const result = await recordStudentPaymentService({
          schoolId,
          studentId: context.selectedStudentId,
          data: {
            studentFeeId: context.studentFeeId,
            amount: context.paymentAmount,
            paymentMode: "Cash",
            paidAt: Date.now(),
            note: "WhatsApp Bot Quick Payment",
          },
        });

        await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
        await sendTextMessage(phone, `✅ Payment registered successfully!\nReceipt No: ${result.receipt?.receiptNo}\n\n${MAIN_MENU_TEXT}`);
      } catch (err) {
        console.error("WhatsApp Bot payment log error:", err);
        await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
        await sendTextMessage(phone, `❌ Failed to log payment: ${err.message}\n\n${MAIN_MENU_TEXT}`);
      }
    } else {
      await updateSession(phone, { currentStep: "MAIN_MENU", context: {} });
      await sendTextMessage(phone, `Payment registration cancelled.\n\n${MAIN_MENU_TEXT}`);
    }
    return;
  }

  // Catch-all
  await sendTextMessage(phone, MAIN_MENU_TEXT);
}

// Prompt principal with pending fee items for selected student
async function promptForPaymentFeeItem(phone, schoolId, student) {
  const pendingFees = await db
    .select({
      id: studentFeesTable.id,
      dueAmount: studentFeesTable.dueAmount,
    })
    .from(studentFeesTable)
    .where(and(eq(studentFeesTable.studentId, student.id), eq(studentFeesTable.status, "pending")));

  if (pendingFees.length === 0) {
    await db.delete(botSessions).where(eq(botSessions.phone, phone));
    await sendTextMessage(phone, `No pending fees found for ${student.fullName} (Class: ${student.className}).\n\n${MAIN_MENU_TEXT}`);
    return;
  }

  let list = `Select fee item to pay for ${student.fullName}:\n\n`;
  pendingFees.forEach((fee, idx) => {
    list += `${idx + 1}️⃣ Due amount: ₹${fee.dueAmount}\n`;
  });
  list += `\nReply with number (1-${pendingFees.length}) to select:`;

  await updateSession(phone, {
    currentStep: "PAYMENT_SELECT_FEE_ITEM",
    context: {
      selectedStudentId: student.id,
      selectedStudentName: student.fullName,
      feeItemIds: pendingFees.map((f) => f.id),
    },
  });

  await sendTextMessage(phone, list);
}

// ─────────────────────────────────────────────────────────────────────────────
// BOT QUERIES & DATA REPORTS
// ─────────────────────────────────────────────────────────────────────────────

// Summary Report (Option 1)
async function getSchoolSummaryReport(schoolId) {
  try {
    const activeStudents = await db
      .select()
      .from(studentsTable)
      .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.status, "active")));

    const totalStudents = activeStudents.length;

    const allFees = await db
      .select({
        amount: studentFeesTable.amount,
        paidAmount: studentFeesTable.paidAmount,
        dueAmount: studentFeesTable.dueAmount,
        studentId: studentFeesTable.studentId,
        status: studentFeesTable.status,
      })
      .from(studentFeesTable)
      .where(eq(studentFeesTable.schoolId, schoolId));

    const totalFeesCollected = allFees.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
    const totalFeesPending = allFees.reduce((sum, f) => sum + (Number(f.dueAmount) || 0), 0);

    const defaultersSet = new Set(
      allFees.filter((f) => f.status === "pending" && Number(f.dueAmount) > 0).map((f) => f.studentId)
    );

    return `🏫 School Summary Report
------------------------
Active Students: ${totalStudents}
Total Defaulters: ${defaultersSet.size}
Total Collected: ₹${totalFeesCollected.toLocaleString("en-IN")}
Total Pending: ₹${totalFeesPending.toLocaleString("en-IN")}`;
  } catch (error) {
    return `⚠️ Error generating report: ${error.message}`;
  }
}

// Collection Report (Option 2)
async function getCollectionReport(schoolId, range) {
  try {
    const now = new Date();
    let startTime = 0;

    if (range === "month") {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    } else if (range === "quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startTime = new Date(now.getFullYear(), currentQuarter * 3, 1).getTime();
    } else {
      startTime = new Date(now.getFullYear(), 0, 1).getTime();
    }

    const payments = await db
      .select({
        amount: studentPaymentsTable.amount,
        studentId: studentPaymentsTable.studentId,
        className: classesTable.name,
      })
      .from(studentPaymentsTable)
      .leftJoin(studentsTable, eq(studentPaymentsTable.studentId, studentsTable.id))
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
      .where(and(eq(studentPaymentsTable.schoolId, schoolId), lte(startTime, studentPaymentsTable.paidAt)));

    // Aggregate by Class
    const classMap = {};
    let grandTotal = 0;

    payments.forEach((p) => {
      const className = p.className || "Unknown Class";
      classMap[className] = (classMap[className] || 0) + Number(p.amount);
      grandTotal += Number(p.amount);
    });

    let report = `📊 Collection Report (${range.toUpperCase()})\n------------------------\n`;
    Object.entries(classMap).forEach(([cls, amt]) => {
      report += `• ${cls}: ₹${amt.toLocaleString("en-IN")}\n`;
    });
    report += `------------------------\nTotal: ₹${grandTotal.toLocaleString("en-IN")}`;

    return report;
  } catch (error) {
    return `⚠️ Error generating collection report: ${error.message}`;
  }
}

// Defaulters List (Option 3)
async function getDefaultersList(schoolId, className = null, offset = 0) {
  try {
    let query = db
      .select({
        studentId: studentsTable.id,
        fullName: studentsTable.fullName,
        rollNumber: studentsTable.rollNumber,
        className: classesTable.name,
        dueAmount: studentFeesTable.dueAmount,
      })
      .from(studentFeesTable)
      .innerJoin(studentsTable, eq(studentFeesTable.studentId, studentsTable.id))
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
      .where(and(eq(studentFeesTable.schoolId, schoolId), eq(studentFeesTable.status, "pending")))
      .orderBy(studentsTable.fullName);

    let allDefaulters = await query;

    // Filter by class name if specified
    if (className) {
      const searchCls = className.toLowerCase();
      allDefaulters = allDefaulters.filter((d) => d.className?.toLowerCase().includes(searchCls));
    }

    // Deduplicate student entries (take sum of due amount)
    const dedupedMap = {};
    allDefaulters.forEach((d) => {
      if (!dedupedMap[d.studentId]) {
        dedupedMap[d.studentId] = { ...d };
      } else {
        dedupedMap[d.studentId].dueAmount += d.dueAmount;
      }
    });

    const dedupedList = Object.values(dedupedMap).filter((d) => d.dueAmount > 0);
    const paginated = dedupedList.slice(offset, offset + 20);

    if (paginated.length === 0) {
      return "No defaulters found.";
    }

    let report = `🚨 Defaulters List${className ? ` (${className})` : ""}\nShowing ${offset + 1}-${Math.min(offset + 20, dedupedList.length)} of ${dedupedList.length}:\n\n`;

    paginated.forEach((d, idx) => {
      report += `${offset + idx + 1}. ${d.fullName} (Roll: ${d.rollNumber}, Class: ${d.className}) - Due: ₹${d.dueAmount}\n`;
    });

    if (dedupedList.length > offset + 20) {
      report += `\nReply "NEXT" for more defaulters.`;
    }

    return report;
  } catch (error) {
    return `⚠️ Error querying defaulters: ${error.message}`;
  }
}

// Search Students (Option 4)
async function searchStudents(schoolId, keyword) {
  try {
    const isNum = /^\d+$/.test(keyword);
    const parsedNum = isNum ? parseInt(keyword, 10) : null;

    let students = [];
    if (isNum) {
      students = await db
        .select({
          id: studentsTable.id,
          fullName: studentsTable.fullName,
          rollNumber: studentsTable.rollNumber,
          className: classesTable.name,
        })
        .from(studentsTable)
        .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
        .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.rollNumber, parsedNum)));
    } else {
      students = await db
        .select({
          id: studentsTable.id,
          fullName: studentsTable.fullName,
          rollNumber: studentsTable.rollNumber,
          className: classesTable.name,
        })
        .from(studentsTable)
        .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
        .where(and(eq(studentsTable.schoolId, schoolId), like(studentsTable.fullName, `%${keyword}%`)));
    }

    return students;
  } catch (error) {
    console.error("Student search error:", error);
    return [];
  }
}

// Student Details Profile (Option 4 Select / Option 5 Details)
async function getStudentProfileDetails(schoolId, studentId) {
  try {
    const [student] = await db
      .select({
        id: studentsTable.id,
        fullName: studentsTable.fullName,
        rollNumber: studentsTable.rollNumber,
        fatherName: studentsTable.fatherName,
        phone: studentsTable.phone,
        status: studentsTable.status,
        className: classesTable.name,
        sectionName: sectionsTable.name,
      })
      .from(studentsTable)
      .leftJoin(classesTable, eq(studentsTable.classId, classesTable.id))
      .leftJoin(sectionsTable, eq(studentsTable.sectionId, sectionsTable.id))
      .where(and(eq(studentsTable.schoolId, schoolId), eq(studentsTable.id, studentId)));

    if (!student) return "Student not found.";

    const fees = await db
      .select()
      .from(studentFeesTable)
      .where(and(eq(studentFeesTable.studentId, studentId), eq(studentFeesTable.schoolId, schoolId)));

    const totalFees = fees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
    const paidFees = fees.reduce((sum, f) => sum + (Number(f.paidAmount) || 0), 0);
    const pendingFees = fees.reduce((sum, f) => sum + (Number(f.dueAmount) || 0), 0);

    return `👤 Student Details
Name: ${student.fullName}
Roll Number: ${student.rollNumber}
Class & Section: ${student.className} (${student.sectionName || "N/A"})
Father's Name: ${student.fatherName || "N/A"}
Phone: ${student.phone}
Status: ${student.status}

Fee Summary:
• Total Fee: ₹${totalFees}
• Paid Amount: ₹${paidFees}
• Pending Balance: ₹${pendingFees}`;
  } catch (error) {
    return `⚠️ Error retrieving student details: ${error.message}`;
  }
}
