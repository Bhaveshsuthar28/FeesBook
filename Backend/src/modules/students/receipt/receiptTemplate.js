import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import { escapeHtml } from "./receiptFormatters.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const el = "motion".replace("motion", "div");

let cachedStyles = null;

const getStyles = () => {
  if (!cachedStyles) {
    cachedStyles = readFileSync(
      join(__dirname, "receipt.css"),
      "utf8"
    );
  }

  return cachedStyles;
};

const renderDetailRows = (rows) =>
  rows
    .map(
      ([label, value]) =>
        `<${el} class="detail-row">
          <span class="detail-label">${escapeHtml(label)}</span>
          <span class="detail-colon">:</span>
          <span class="detail-value">${escapeHtml(value)}</span>
        </${el}>`
    )
    .join("");

const renderFullTable = (feeRows) =>
  feeRows
    .map(
      (row) => `
      <tr>
        <td class="num">${row.index}</td>
        <td class="desc">${escapeHtml(row.description)}</td>
        <td class="amount">${escapeHtml(row.dueAmount)}</td>
        <td class="amount">${escapeHtml(row.paidAmount)}</td>
      </tr>`
    )
    .join("");

const renderPartialTable = (feeRows) =>
  feeRows
    .map(
      (row) => `
      <tr>
        <td class="num">${row.index}</td>
        <td class="desc">${escapeHtml(row.description)}</td>
        <td class="amount">${escapeHtml(row.currentPayment)}</td>
        <td class="amount">${escapeHtml(row.totalPaid)}</td>
      </tr>`
    )
    .join("");

const statusClass = (status) => {
  if (status === "PAID") {
    return "status-badge--paid";
  }

  if (status === "PARTIAL") {
    return "status-badge--partial";
  }

  return "status-badge--unpaid";
};

export const renderReceiptHtml = (vm) => {
  const schoolNameClass = vm.isPartialPayment
    ? "school-name school-name--partial"
    : "school-name school-name--full";

  const metaTitleClass = vm.isPartialPayment
    ? "receipt-meta-title receipt-meta-title--partial"
    : "receipt-meta-title";

  const logoHtml = vm.logoSrc
    ? `<img class="receipt-logo" src="${vm.logoSrc}" alt="School logo" />`
    : `<${el} class="receipt-logo-placeholder"></${el}>`;

  const stampHtml = vm.stampSrc
    ? `<${el} class="footer-img-box"><img class="footer-img" src="${vm.stampSrc}" alt="School stamp" /></${el}>`
    : `<${el} class="footer-img-placeholder"></${el}>`;

  const signatureHtml = vm.signatureSrc
    ? `<${el} class="footer-img-box"><img class="footer-img" src="${vm.signatureSrc}" alt="Signature" /></${el}>`
    : `<${el} class="footer-img-placeholder"></${el}>`;

  const tableSection = vm.isPartialPayment
    ? `
    <table class="fee-table fee-table--partial">
      <thead>
        <tr>
          <th class="num">#</th>
          <th>DESCRIPTION</th>
          <th class="amount">CURRENT PAYMENT AMOUNT</th>
          <th class="amount">TOTAL PAID TO DATE</th>
        </tr>
      </thead>
      <tbody>
        ${renderPartialTable(vm.feeRows)}
      </tbody>
    </table>`
    : `
    <table class="fee-table">
      <thead>
        <tr>
          <th class="num">#</th>
          <th>PARTICULARS</th>
          <th class="amount">DUE AMOUNT (₹)</th>
          <th class="amount">PAID AMOUNT (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${renderFullTable(vm.feeRows)}
      </tbody>
    </table>`;

  const notesHtml = vm.notesList
    .map((note) => `<li>${escapeHtml(note)}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap" rel="stylesheet" />
  <style>${getStyles()}</style>
</head>
<body>
  <${el} class="receipt-page">
    <header class="receipt-header">
      ${logoHtml}
      <${el} class="school-info">
        <h1 class="${schoolNameClass}">${escapeHtml(vm.schoolName)}</h1>
        <${el} class="school-contact">
          <${el} class="school-contact-row">
            ${vm.icons.location}
            <span>${escapeHtml(vm.address)}</span>
          </${el}>
          <${el} class="school-contact-row">
            ${vm.icons.phone}
            <span>${escapeHtml(vm.mobile)}</span>
          </${el}>
          <${el} class="school-contact-row">
            ${vm.icons.mail}
            <span>${escapeHtml(vm.email)}</span>
          </${el}>
        </${el}>
      </${el}>
      <${el} class="receipt-meta-box">
        <${el} class="${metaTitleClass}">${escapeHtml(vm.receiptTitle)}</${el}>
        <${el} class="receipt-meta-row">
          <span class="receipt-meta-label">Receipt No.</span>
          <span class="receipt-meta-value">${escapeHtml(vm.receiptNo)}</span>
        </${el}>
        <${el} class="receipt-meta-row">
          <span class="receipt-meta-label">Date</span>
          <span class="receipt-meta-value">${escapeHtml(vm.receiptDate)}</span>
        </${el}>
        <span class="status-badge ${statusClass(vm.paymentStatus)}">${escapeHtml(vm.paymentStatus)}</span>
      </${el}>
    </header>

    <section class="details-section">
      <${el} class="details-column">
        <${el} class="details-heading">STUDENT DETAILS</${el}>
        ${renderDetailRows(vm.studentDetails)}
      </${el}>
      <${el} class="details-column">
        <${el} class="details-heading">PAYMENT DETAILS</${el}>
        ${renderDetailRows(vm.paymentDetails)}
      </${el}>
    </section>

    ${tableSection}

    <section class="summary-section">
      <${el} class="amount-words">
        <${el} class="amount-words-label">Amount in Words:</${el}>
        <${el} class="amount-words-value">${escapeHtml(vm.amountInWords)}</${el}>
      </${el}>
      <${el} class="summary-box">
        <${el} class="summary-row">
          <span class="summary-row-label">Total Due Amount</span>
          <span class="summary-row-value">: ${escapeHtml(vm.totalDueAmount)}</span>
        </${el}>
        <${el} class="summary-row">
          <span class="summary-row-label">Total Paid Amount</span>
          <span class="summary-row-value">: ${escapeHtml(vm.totalPaidAmount)}</span>
        </${el}>
        <${el} class="summary-balance">
          <span>Balance Amount</span>
          <span class="summary-balance-value">₹ ${escapeHtml(vm.balanceAmount)}</span>
        </${el}>
      </${el}>
    </section>

    <section class="notes-section">
      <${el} class="notes-heading">NOTES</${el}>
      <ul class="notes-list">
        ${notesHtml}
      </ul>
    </section>

    <footer class="footer-signatures">
      <${el} class="footer-spacer"></${el}>
      <${el} class="footer-stamp">
        ${stampHtml}
        <${el} class="footer-label">School Stamp</${el}>
      </${el}>
      <${el} class="footer-signature">
        ${signatureHtml}
        <${el} class="footer-label">Authorized Signatory</${el}>
        <${el} class="footer-school-name">${escapeHtml(vm.schoolName)}</${el}>
      </${el}>
    </footer>

    <${el} class="receipt-footer-message">
      <p class="receipt-footer-text">${escapeHtml(vm.footerMessage)}</p>
    </${el}>
  </${el}>
</body>
</html>`;
};
