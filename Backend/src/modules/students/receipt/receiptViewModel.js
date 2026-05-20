import { clerkClient } from "@clerk/fastify";

import { getActiveAcademicYearService } from "../../settings/settings.service.js";
import { getImageDataUrl } from "./receiptImages.js";
import {
  clean,
  displayText,
  formatMoney,
  formatReceiptDate,
  formatReceiptDateTime,
  getPaymentRemark,
  getTransactionId,
  numberToWords,
} from "./receiptFormatters.js";

const iconLocation = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s7-4.5 7-11a7 7 0 1 0-14 0c0 6.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>`;
const iconPhone = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.89.32 1.76.6 2.6a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.48-1.17a2 2 0 0 1 2.11-.45c.84.28 1.71.48 2.6.6A2 2 0 0 1 22 16.92z"/></svg>`;
const iconMail = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>`;

const isReceiptAssetEnabled = (flag) =>
  flag === false || flag === 0 ? false : true;

const resolvePrincipalEmail = async ({
  profile,
  schoolId,
}) => {
  const stored = clean(profile?.email);

  if (stored && !stored.endsWith("@feesbook.local")) {
    return stored;
  }

  try {
    const user = await clerkClient.users.getUser(schoolId);
    const clerkEmail =
      user.emailAddresses?.[0]?.emailAddress;

    if (clerkEmail) {
      return clerkEmail;
    }
  } catch {
    /* ignore */
  }

  return stored || "-";
};

export const buildPaymentReceiptViewModel = async ({
  payment,
  detail,
  profile,
  schoolId,
}) => {
  const fees = detail.fees || [];
  const paidFee =
    fees.find((fee) => fee.id === payment.studentFeeId) || null;

  const totalAmount = fees.reduce(
    (sum, fee) => sum + Number(fee.amount || 0),
    0
  );
  const paidAmount = fees.reduce(
    (sum, fee) => sum + Number(fee.paidAmount || 0),
    0
  );
  const dueAmount = fees.reduce(
    (sum, fee) => sum + Number(fee.dueAmount || 0),
    0
  );

  const feeBalanceAfter = Number(paidFee?.dueAmount || 0);
  const isPartialPayment =
    feeBalanceAfter > 0 ||
    Number(payment.amount || 0) < Number(paidFee?.amount || 0);

  const paymentStatus = isPartialPayment
    ? "PARTIAL"
    : dueAmount === 0
      ? "PAID"
      : paidAmount > 0
        ? "PARTIAL"
        : "UNPAID";

  const academicYear =
    payment.receiptAcademicYear ||
    (await getActiveAcademicYearService({ schoolId }));

  const [logoSrc, stampSrc, signatureSrc, principalEmail] =
    await Promise.all([
      getImageDataUrl(profile.logoUrl),
      isReceiptAssetEnabled(profile.receiptStamp)
        ? getImageDataUrl(profile.stampUrl)
        : null,
      isReceiptAssetEnabled(profile.receiptSignature)
        ? getImageDataUrl(profile.principalSignatureUrl)
        : null,
      resolvePrincipalEmail({ profile, schoolId }),
    ]);

  const remark = getPaymentRemark(payment);
  const transactionId = getTransactionId(payment);
  const classSection = `${detail.class?.name || "-"} ${detail.section?.name || ""}`.trim();

  const notesList = isPartialPayment
    ? [
        "This is a partial fee payment receipt.",
        "Remaining balance must be paid separately.",
        remark
          ? `Remark: ${remark}`
          : "Remark: Partial payment received — balance remains due.",
        "Please retain this receipt for future reference.",
        "Fees once paid will not be refunded.",
      ]
    : [
        "This is a computer generated receipt.",
        "No signature is required.",
        ...(remark ? [`Remark: ${remark}`] : []),
        "Please retain this receipt for future reference.",
        "Fees once paid will not be refunded.",
      ];

  const footerMessage =
    clean(profile.receiptFooter) ||
    "Thank you for your timely payment!";

  return {
    isPartialPayment,
    receiptTitle: isPartialPayment
      ? "PARTIAL FEE RECEIPT"
      : "FEE RECEIPT",
    paymentStatus,
    schoolName: displayText(profile.schoolName || "School Name"),
    address: displayText(profile.address),
    mobile: displayText(profile.mobile),
    email: displayText(principalEmail),
    receiptNo: displayText(payment.receiptNo || payment.id),
    receiptDate: formatReceiptDate(payment.paidAt),
    logoSrc,
    stampSrc,
    signatureSrc,
    studentDetails: [
      ["Student Name", displayText(detail.student?.fullName)],
      ["Admission No.", displayText(detail.student?.schoolRegisterNo)],
      ["Class & Section", displayText(classSection)],
      ["Roll No.", displayText(detail.student?.rollNumber)],
      ["Father's Name", displayText(detail.student?.fatherName)],
    ],
    paymentDetails: isPartialPayment
      ? [
          ["Fee Type", displayText(paidFee?.feeTypeName || "Fee")],
          ["This Payment", `₹ ${formatMoney(payment.amount)}`],
          ["Balance on Fee", `₹ ${formatMoney(feeBalanceAfter)}`],
          ["Payment Mode", displayText(payment.paymentMode || "Cash")],
          ["Transaction ID", displayText(transactionId)],
          ["Payment Date", displayText(formatReceiptDateTime(payment.paidAt))],
          ["Academic Year", displayText(academicYear)],
        ]
      : [
          ["Payment Mode", displayText(payment.paymentMode || "Cash")],
          ["Transaction ID", displayText(transactionId)],
          ["Payment Date", displayText(formatReceiptDate(payment.paidAt))],
          ["Academic Year", displayText(academicYear)],
        ],
    feeRows: isPartialPayment
      ? [
          {
            index: 1,
            description: displayText(paidFee?.feeTypeName || "Fee"),
            currentPayment: formatMoney(payment.amount),
            totalPaid: formatMoney(paidFee?.paidAmount || 0),
          },
        ]
      : fees.map((fee, index) => ({
          index: index + 1,
          description: displayText(fee.feeTypeName || "Fee"),
          dueAmount: formatMoney(fee.dueAmount),
          paidAmount: formatMoney(fee.paidAmount),
        })),
    amountInWords: numberToWords(payment.amount),
    totalDueAmount: formatMoney(totalAmount),
    totalPaidAmount: formatMoney(paidAmount),
    balanceAmount: formatMoney(dueAmount),
    notesList,
    footerMessage,
    icons: {
      location: iconLocation,
      phone: iconPhone,
      mail: iconMail,
    },
  };
};
