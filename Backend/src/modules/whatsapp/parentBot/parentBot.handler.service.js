import {
  getParentSession,
  initParentSession,
  setActiveSchool,
  refreshSession,
} from "./parentBot.session.service.js";
import {
  formatBotConnected,
  formatSchoolSelection,
  formatFeeSummary,
} from "../whatsapp.messageFormatter.js";
import { getStudentDetailService } from "../../students/students.service.js";
import { cacheRedis } from "../../../cors/cache/redis.client.js";

/**
 * Handles incoming messages from parent phone numbers.
 * Orchestrates session discovery/selection, routing, and command handling.
 */
export async function handleParentMessage({ phoneNumber, messageText }) {
  try {
    const input = (messageText || "").trim();

    // STEP A — Load or initialize session
    let session = await getParentSession({ phoneNumber });

    if (!session) {
      const initResult = await initParentSession({ phoneNumber });
      if (!initResult.found) {
        return {
          reply: "Your number is not registered with any school on FeeGo. Please contact your school office.",
        };
      }
      session = initResult.session;
    }

    // STEP B — Parent has multiple schools, needs to pick
    if (session.step === "awaiting_school_selection") {
      const choice = parseInt(input, 10);
      if (!isNaN(choice)) {
        const activeSchool = await setActiveSchool({ phoneNumber, index: choice });
        if (activeSchool) {
          // A school has been selected successfully. Send the welcome menu.
          const welcome = formatBotConnected({
            schoolName: activeSchool.schoolName,
            schoolCity: activeSchool.schoolCity,
          });
          return { reply: welcome };
        } else {
          return { reply: "Please reply with a valid number from the list." };
        }
      } else {
        // Show selection menu again
        const schools = session.linkedSchools.map((s, idx) => ({
          index: idx + 1,
          schoolName: s.schoolName,
          schoolCity: s.schoolCity,
          studentName: s.studentName,
          className: s.className,
        }));
        return { reply: formatSchoolSelection({ schools }) };
      }
    }

    // STEP C — Session is ready with active school
    const activeSchool = session.linkedSchools[session.activeSchoolIndex];
    if (!activeSchool) {
      // Fail-safe: if active school index is corrupted, restart session initialization
      await initParentSession({ phoneNumber });
      return {
        reply: "Something went wrong. Please try again.",
      };
    }

    // Refresh sliding window session in background
    await refreshSession({ phoneNumber });

    const normalizedCmd = input.toLowerCase();

    // Route by message text
    if (["fees", "fee", "pending", "balance"].includes(normalizedCmd)) {
      const details = await getStudentDetailService({
        schoolId: activeSchool.schoolId,
        studentId: activeSchool.studentId,
      });

      let totalFee = 0;
      let paidAmount = 0;
      let pendingAmount = 0;
      if (details.fees && details.fees.length > 0) {
        details.fees.forEach((f) => {
          totalFee += Number(f.amount || 0);
          paidAmount += Number(f.paidAmount || 0);
          pendingAmount += Number(f.dueAmount || 0);
        });
      }

      let lastPaymentDate = "Not recorded";
      if (details.payments && details.payments.length > 0) {
        const sorted = [...details.payments].sort((a, b) => b.paidAt - a.paidAt);
        if (sorted[0]?.paidAt) {
          lastPaymentDate = new Date(sorted[0].paidAt).toLocaleDateString("en-IN");
        }
      }

      const reply = formatFeeSummary({
        schoolName: activeSchool.schoolName,
        schoolCity: activeSchool.schoolCity,
        studentName: activeSchool.studentName,
        className: activeSchool.className,
        sectionName: activeSchool.sectionName,
        totalFee,
        paidAmount,
        pendingAmount,
        lastPaymentDate,
      });

      return { reply };
    }

    if (["paid", "payment", "history"].includes(normalizedCmd)) {
      const details = await getStudentDetailService({
        schoolId: activeSchool.schoolId,
        studentId: activeSchool.studentId,
      });

      const sortedPayments = [...(details.payments || [])]
        .sort((a, b) => b.paidAt - a.paidAt)
        .slice(0, 3);

      const formattedSchoolName = (activeSchool.schoolName || "").toUpperCase();
      let reply = `🏫 *${formattedSchoolName}, ${activeSchool.schoolCity || ""}*\n━━━━━━━━━━━━━━━━━━━━\n`;

      if (sortedPayments.length === 0) {
        reply += "No payments recorded yet.";
      } else {
        reply += "Receipt History:\n\n";
        sortedPayments.forEach((p, index) => {
          const dateStr = new Date(p.paidAt).toLocaleDateString("en-IN");
          reply += `${index + 1}. Date: ${dateStr}\n` +
            `   Amount: ₹${p.amount}\n` +
            `   Mode: ${p.paymentMode || "Cash"}\n` +
            (p.receiptNo ? `   Receipt No: ${p.receiptNo}\n` : "") +
            `\n`;
        });
        reply = reply.trim();
      }

      return { reply };
    }

    if (["receipt", "pdf"].includes(normalizedCmd)) {
      const details = await getStudentDetailService({
        schoolId: activeSchool.schoolId,
        studentId: activeSchool.studentId,
      });

      const sortedPayments = [...(details.payments || [])]
        .sort((a, b) => b.paidAt - a.paidAt);

      const formattedSchoolName = (activeSchool.schoolName || "").toUpperCase();
      const header = `🏫 *${formattedSchoolName}, ${activeSchool.schoolCity || ""}*\n━━━━━━━━━━━━━━━━━━━━\n`;

      if (sortedPayments.length === 0) {
        return {
          reply: header + "No receipt found. No payment has been recorded yet for this student.",
        };
      }

      const latestPayment = sortedPayments[0];
      const { getStudentPaymentReceiptPdfService } = await import("../../students/students.service.js");
      const pdfDetails = await getStudentPaymentReceiptPdfService({
        schoolId: activeSchool.schoolId,
        studentId: activeSchool.studentId,
        paymentId: latestPayment.id,
      });

      const receiptMessage = `${header}Dear Parent, please find the fee receipt for ₹${latestPayment.amount} paid on ${new Date(latestPayment.paidAt).toLocaleDateString("en-IN")}.`;

      return {
        reply: receiptMessage,
        pdfUrl: pdfDetails.buffer, // Return the dynamic pdf Buffer
        fileName: pdfDetails.fileName || `receipt-${latestPayment.receiptNo}.pdf`,
      };
    }

    if (["switch", "change", "change school"].includes(normalizedCmd)) {
      if (session.linkedSchools.length === 1) {
        return {
          reply: `Your number is only linked to one school:\n*${activeSchool.schoolName}*, ${activeSchool.schoolCity || ""}. No switch needed.`,
        };
      }

      // Reset selection in session
      session.activeSchoolIndex = null;
      session.step = "awaiting_school_selection";
      const sessionKey = `parentsession:${phoneNumber}`;
      await cacheRedis.set(sessionKey, JSON.stringify(session), "EX", 86400);

      const schools = session.linkedSchools.map((s, idx) => ({
        index: idx + 1,
        schoolName: s.schoolName,
        schoolCity: s.schoolCity,
        studentName: s.studentName,
        className: s.className,
      }));

      return { reply: formatSchoolSelection({ schools }) };
    }

    if (["hi", "hello", "help", "start", "menu"].includes(normalizedCmd)) {
      return {
        reply: formatBotConnected({
          schoolName: activeSchool.schoolName,
          schoolCity: activeSchool.schoolCity,
        }),
      };
    }

    // Unrecognized input fallback
    const formattedSchoolName = (activeSchool.schoolName || "").toUpperCase();
    return {
      reply: `🏫 *${formattedSchoolName}, ${activeSchool.schoolCity || ""}*\n━━━━━━━━━━━━━━━━━━━━\n` +
        `I didn't understand that.\n\n` +
        `You can ask:\n` +
        `• *fees* — pending balance\n` +
        `• *paid* — payment history\n` +
        `• *receipt* — last receipt PDF\n` +
        `• *switch* — change school`,
    };
  } catch (error) {
    console.error(`[parentBotHandler] Error handling parent message from ${phoneNumber}:`, error);
    return {
      reply: "Something went wrong. Please try again in a moment.",
    };
  }
}
