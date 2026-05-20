const clean = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

export const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export const displayText = (value) => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "-";
  }

  return String(value);
};

export const formatReceiptDate = (value) =>
  new Date(Number(value || Date.now())).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

export const formatReceiptDateTime = (value) =>
  new Date(Number(value || Date.now())).toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

export const formatMoney = (amount) =>
  Number(amount || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const numberToWords = (value) => {
  const number = Math.floor(Number(value || 0));
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const belowHundred = (amount) =>
    amount < 20
      ? ones[amount]
      : `${tens[Math.floor(amount / 10)]} ${ones[amount % 10]}`.trim();

  const belowThousand = (amount) => {
    if (amount < 100) {
      return belowHundred(amount);
    }

    return `${ones[Math.floor(amount / 100)]} Hundred ${belowHundred(amount % 100)}`.trim();
  };

  if (number === 0) {
    return "Rupees Zero Only";
  }

  const crore = Math.floor(number / 10000000);
  const lakh = Math.floor((number % 10000000) / 100000);
  const thousand = Math.floor((number % 100000) / 1000);
  const rest = number % 1000;
  const parts = [];

  if (crore) {
    parts.push(`${belowThousand(crore)} Crore`);
  }

  if (lakh) {
    parts.push(`${belowThousand(lakh)} Lakh`);
  }

  if (thousand) {
    parts.push(`${belowThousand(thousand)} Thousand`);
  }

  if (rest) {
    parts.push(belowThousand(rest));
  }

  return `Rupees ${parts.join(" ")} Only`;
};

export const getPaymentRemark = (payment) =>
  clean(payment?.remark) ||
  clean(payment?.note) ||
  "";

export const getTransactionId = (payment) => {
  const ref = clean(payment?.transactionRef);

  if (ref) {
    return ref;
  }

  const id = clean(payment?.id);

  if (id) {
    return id.length > 12 ? id.slice(0, 8).toUpperCase() : id;
  }

  return "-";
};

export const buildReceiptFileName = ({
  studentName,
  paidAt,
}) => {
  const raw =
    String(studentName || "Student")
      .trim()
      .normalize("NFKC") || "Student";

  let safeName = raw
    .replace(/[<>:"/\\|?*\x00-\x1f"]/g, "")
    .replace(/\s+/g, "")
    .replace(/^\.+/, "")
    .slice(0, 80);

  if (!safeName) {
    safeName = "Student";
  }

  const paidDate = new Date(
    Number(paidAt || Date.now())
  );
  const dateStr =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).format(paidDate);

  return `${safeName}.${dateStr}.Fees.pdf`;
};

export { clean };
