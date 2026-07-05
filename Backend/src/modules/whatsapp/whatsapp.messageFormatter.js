/**
 * @file whatsapp.messageFormatter.js
 * @description Centralized message formatting module for all parent-facing WhatsApp communication.
 */

export function formatFeeReminder({ schoolName, schoolCity, studentName, className, sectionName, pendingAmount, dueDate }) {
  const formattedSchoolName = (schoolName || "").toUpperCase();
  return `🏫 *${formattedSchoolName}, ${schoolCity || ""}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Dear Parent,\n` +
    `${studentName} (${className} - ${sectionName || ""}) has pending fees of ₹${pendingAmount}.\n` +
    (dueDate ? `Due date: ${dueDate}.\n` : "") +
    `Please deposit at the earliest.\n` +
    `— ${schoolName}`;
}

export function formatPaymentConfirmation({ schoolName, schoolCity, studentName, className, sectionName, paidAmount, paymentDate, receiptNumber }) {
  const formattedSchoolName = (schoolName || "").toUpperCase();
  return `🏫 *${formattedSchoolName}, ${schoolCity || ""}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `✅ Payment Received\n` +
    `${studentName} (${className} - ${sectionName || ""})\n` +
    `Amount: ₹${paidAmount}\n` +
    `Date: ${paymentDate}\n` +
    `Receipt No: ${receiptNumber}\n` +
    `Thank you!\n` +
    `— ${schoolName}`;
}

export function formatOverdueReminder({ schoolName, schoolCity, studentName, className, sectionName, pendingAmount, overdueAmount, overdueDetails }) {
  const formattedSchoolName = (schoolName || "").toUpperCase();
  return `🏫 *${formattedSchoolName}, ${schoolCity || ""}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `⚠️ Overdue Fee Alert\n` +
    `${studentName} (${className} - ${sectionName || ""})\n` +
    `Current pending: ₹${pendingAmount}\n` +
    `Overdue amount: ₹${overdueAmount}\n` +
    (overdueDetails ? `${overdueDetails}\n` : "") +
    `Please contact school immediately.\n` +
    `— ${schoolName}`;
}

export function formatBotConnected({ schoolName, schoolCity }) {
  return `✅ Connected to *${schoolName}*\n` +
    `📍 ${schoolCity || ""}\n\n` +
    `You can ask:\n` +
    `• *fees* — pending balance\n` +
    `• *paid* — payment history\n` +
    `• *receipt* — last receipt PDF\n` +
    `• *switch* — change school\n\n` +
    `Reply with any of the above.`;
}

export function formatSchoolSelection({ schools }) {
  let reply = `Hi! Your number is linked to ${schools.length} schools:\n\n`;
  schools.forEach((s) => {
    reply += `${s.index}️⃣ *${s.schoolName}*, ${s.schoolCity || ""}\n` +
      `   👤 ${s.studentName} — ${s.className || ""}\n`;
  });
  reply += `\nReply *1* or *2* (or the number) to continue.`;
  return reply;
}

export function formatFeeSummary({ schoolName, schoolCity, studentName, className, sectionName, totalFee, paidAmount, pendingAmount, lastPaymentDate }) {
  const formattedSchoolName = (schoolName || "").toUpperCase();
  const secPart = sectionName ? ` ${sectionName}` : "";
  return `🏫 *${formattedSchoolName}, ${schoolCity || ""}*\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📚 ${studentName} — ${className || ""}${secPart}\n` +
    `──────────────────────\n` +
    `Total Fee:    ₹${totalFee}\n` +
    `Paid:         ₹${paidAmount}\n` +
    `Pending:      ₹${pendingAmount}\n` +
    `Last Payment: ${lastPaymentDate || 'Not recorded'}\n` +
    `──────────────────────\n` +
    (pendingAmount > 0
      ? `Type *receipt* for last payment PDF.`
      : `✅ All fees paid!`);
}
