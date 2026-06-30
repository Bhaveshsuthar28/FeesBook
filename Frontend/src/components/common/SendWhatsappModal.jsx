import { useState, useEffect } from "react";
import { X, Send, Loader2, Sparkles, Paperclip, Trash2, FileText, Plus } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { sendPersonalWhatsapp, sendBroadcastWhatsapp, getWhatsappSettings, getStudentDetail, downloadStudentPaymentReceipt } from "../../lib/api/studentapi.js";
import { useHindiInput } from "../../lib/hooks/useHindiInput.js";
import { notify } from "../../lib/toast.js";

// System default templates to fall back on if settings fetch fails or templates are empty
const DEFAULT_TEMPLATES = [
  {
    name: "fees_reminder",
    body: "Dear Parent, fees of ₹{pending_fees} for {full_name} ({class_name}) is pending. Please deposit it soon. - School",
  },
  {
    name: "overdue_reminder",
    body: "Dear {parent_name}, your child {full_name} (Class {class_name}) has a pending fee of ₹{pending_fees} and overdue fees of ₹{overdue_fees} ({overdue_details}). Please deposit it soon. Regards, {school_name} school administration.",
  },
  {
    name: "general_notice",
    body: "Dear Parent, this is to inform you regarding {full_name}. Please check the latest update. - School",
  },
  {
    name: "fees_receipt",
    body: "Dear {parent_name}, thank you for the payment of ₹{receipt_amount} for your child {full_name} (Class {class_name}). Receipt no: {receipt_no}. Regards, {school_name} school administration.",
  }
];

// Helper function to replace variables in templates
const replaceTemplateVariables = (templateText, student) => {
  if (!templateText || !student) return "";
  
  // For broadcast targets, leave variables unresolved so that the backend can resolve them for each parent dynamically.
  if (student.isClassBroadcast || student.isBroadcast || student.isSchoolBroadcast) {
    return templateText;
  }

  let text = templateText;
  
  // Normalize properties since different pages might return different shapes
  const fullName = student.fullName || student.name || "";
  const fatherName = student.fatherName || student.parentName || "";
  const className = student.className || (student.class ? student.class.name : "") || "";
  const pendingFees = student.pendingFees !== undefined ? student.pendingFees : (student.dueAmount !== undefined ? student.dueAmount : 0);
  const paidAmount = student.paidAmount !== undefined ? student.paidAmount : (student.collectedFees !== undefined ? student.collectedFees : 0);
  const totalFees = student.totalFees !== undefined ? student.totalFees : 0;
  const phone = student.phone || student.phoneNumber || "";
  const overdueFees = student.overdueFees !== undefined ? student.overdueFees : 0;
  const overdueDetails = student.overdueDetails || "None";
  
  const data = {
    full_name: fullName,
    parent_name: fatherName,
    class_name: className,
    school_name: "our school",
    pending_fees: pendingFees,
    remaining_fees: Number(pendingFees) + Number(overdueFees),
    overdue_amount: overdueFees,
    overdue_fees: overdueFees,
    overdue_details: overdueDetails,
    due_date: student.dueDate || "due date",
    paid_amount: paidAmount,
    total_fees: totalFees,
    phone_number: phone,
  };

  Object.entries(data).forEach(([key, val]) => {
    const regex = new RegExp(`{${key}}`, "g");
    text = text.replace(regex, val);
  });

  return text;
};

const resolveReceiptMessage = (templateText, student, payment) => {
  if (!templateText || !student || !payment) return "";
  let resolved = replaceTemplateVariables(templateText, student);
  resolved = resolved.replace(/{receipt_no}/g, payment.receiptNo || "N/A");
  resolved = resolved.replace(/{receipt_amount}/g, (payment.amount || 0).toString());
  return resolved;
};

const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result.split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function SendWhatsappModal({ isOpen, onClose, student, onSent }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isFeesReminder, setIsFeesReminder] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(student);
  const [selectedPaymentIds, setSelectedPaymentIds] = useState([]);
  const [fetchingReceipt, setFetchingReceipt] = useState(false);

  useEffect(() => {
    setCurrentStudent(student);
    setSelectedPaymentIds([]);
  }, [student]);

  const [attachment, setAttachment] = useState(null); // { fileData: base64, fileName: string, fileType: string, fileSize: number }
  const [readingFile, setReadingFile] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (15MB)
    const limit = 15 * 1024 * 1024;
    if (file.size > limit) {
      notify.error(null, "File is too large. Choose a file smaller than 15MB.");
      return;
    }

    setReadingFile(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target.result;
      const base64Data = result.split(",")[1];
      setAttachment({
        fileData: base64Data,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      setReadingFile(false);
    };
    reader.onerror = () => {
      notify.error(null, "Failed to read the file");
      setReadingFile(false);
    };
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  // Bind the Hindi Transliteration hook to our message input state
  const {
    textareaRef,
    isHindiMode,
    setIsHindiMode,
    suggestions,
    highlightIdx,
    handleTextareaChange,
    handleTextareaSelect,
    handleKeyDown,
    selectSuggestion,
  } = useHindiInput({
    value: message,
    onChange: setMessage,
    enabled: isOpen,
  });

  // Fetch templates when opening modal
  useEffect(() => {
    if (!isOpen || !student) return;
    
    async function loadTemplates() {
      try {
        setLoadingTemplates(true);
        
        let liveStudent = student;
        const isBroadcast = student.isClassBroadcast || student.isBroadcast || student.isSchoolBroadcast;
        
        // Fetch live student details to ensure real-time pending & overdue accuracy
        if (!isBroadcast && student.id) {
          try {
            const detail = await getStudentDetail(student.id);
            if (detail?.student) {
              liveStudent = {
                ...student,
                ...detail.student,
                payments: detail.payments || [],
              };
              setCurrentStudent(liveStudent);
            }
          } catch (err) {
            console.error("Failed to fetch live student detail", err);
          }
        }

        const settings = await getWhatsappSettings();
        const customTemplates = settings?.templates || [];
        
        // Merge system defaults and custom templates
        const merged = [...DEFAULT_TEMPLATES];
        customTemplates.forEach(ct => {
          const index = merged.findIndex(m => m.name === ct.name);
          if (index > -1) {
            merged[index] = ct; // override default template with user's customized version
          } else {
            merged.push(ct);
          }
        });
        
        // Differentiate dues and determine shown templates
        const pendingVal = liveStudent.pendingFees !== undefined ? liveStudent.pendingFees : (liveStudent.dueAmount !== undefined ? liveStudent.dueAmount : 0);
        const overdueVal = liveStudent.overdueFees !== undefined ? liveStudent.overdueFees : 0;
        
        const hasDues = Number(pendingVal) > 0 || Number(overdueVal) > 0;
        const hasOverdue = Number(overdueVal) > 0;
        const hasPayments = liveStudent.payments && liveStudent.payments.length > 0;
        
        let finalTemplates = merged;
        if (!isBroadcast) {
          if (!hasPayments) {
            finalTemplates = finalTemplates.filter(t => t.name !== "fees_receipt");
          }
          if (!hasDues) {
            // Hide both current fees reminder and overdue reminder templates if no dues exist
            finalTemplates = finalTemplates.filter(t => t.name !== "fees_reminder" && t.name !== "overdue_reminder");
          } else if (!hasOverdue) {
            // Hide overdue reminder template if student has no overdue from previous years
            finalTemplates = finalTemplates.filter(t => t.name !== "overdue_reminder");
          }
        } else {
          finalTemplates = finalTemplates.filter(t => t.name !== "fees_receipt");
        }

        setTemplates(finalTemplates);
        
        // Pre-select template
        let initialTemplate = null;
        if (!isBroadcast) {
          if (hasOverdue) {
            initialTemplate = finalTemplates.find(t => t.name === "overdue_reminder") || finalTemplates[0];
          } else if (hasDues) {
            initialTemplate = finalTemplates.find(t => t.name === "fees_reminder") || finalTemplates[0];
          } else {
            initialTemplate = finalTemplates.find(t => t.name === "general_notice") || finalTemplates[0];
          }
        } else {
          initialTemplate = finalTemplates.find(t => t.name === "fees_reminder") || finalTemplates[0];
        }
          
        if (initialTemplate) {
          setSelectedTemplateName(initialTemplate.name);
          setIsFeesReminder(initialTemplate.name === "fees_reminder" || initialTemplate.name === "overdue_reminder" || isBroadcast);
          if (initialTemplate.name === "fees_receipt" && liveStudent.payments?.length > 0) {
            setSelectedPaymentIds([liveStudent.payments[0].id]);
            setMessage(resolveReceiptMessage(initialTemplate.body, liveStudent, liveStudent.payments[0]));
          } else {
            setMessage(replaceTemplateVariables(initialTemplate.body, liveStudent));
          }
        }
      } catch (err) {
        console.error("Failed to load templates", err);
        // Fail silently and use basic defaults
        setTemplates(DEFAULT_TEMPLATES);
        setSelectedTemplateName("fees_reminder");
        setIsFeesReminder(true);
        setMessage(replaceTemplateVariables(DEFAULT_TEMPLATES[0].body, student));
      } finally {
        setLoadingTemplates(false);
      }
    }

    loadTemplates();
  }, [isOpen, student]);

  // Auto-attach PDF receipt if exactly one receipt is selected
  useEffect(() => {
    const autoAttachReceipt = async () => {
      const isBroadcast = currentStudent?.isClassBroadcast || currentStudent?.isBroadcast || currentStudent?.isSchoolBroadcast;
      if (selectedTemplateName === "fees_receipt" && selectedPaymentIds.length === 1 && !isBroadcast && currentStudent?.payments) {
        const paymentId = selectedPaymentIds[0];
        const payment = currentStudent.payments.find(p => p.id === paymentId);
        if (!payment) return;

        try {
          setFetchingReceipt(true);
          const res = await downloadStudentPaymentReceipt({
            studentId: currentStudent.id,
            paymentId: payment.id
          });
          const base64Data = await blobToBase64(res.blob);
          setAttachment({
            fileData: base64Data,
            fileName: res.fileName || `fee-receipt-${payment.receiptNo}.pdf`,
            fileType: "application/pdf",
            fileSize: res.blob.size
          });
        } catch (err) {
          console.error("Failed to auto-attach receipt PDF", err);
          notify.error(err, "Failed to load receipt PDF");
        } finally {
          setFetchingReceipt(false);
        }
      } else if (selectedTemplateName === "fees_receipt" && (selectedPaymentIds.length !== 1 || isBroadcast)) {
        setAttachment(null);
      }
    };

    autoAttachReceipt();
  }, [selectedPaymentIds, selectedTemplateName, currentStudent]);

  if (!isOpen || !currentStudent) return null;

  const selectedTemplate = templates.find(t => t.name === selectedTemplateName);
  const requiresMedia = false; // Make media attachments optional for all templates

  const handleTemplateChange = (templateName) => {
    setSelectedTemplateName(templateName);
    setIsFeesReminder(templateName === "fees_reminder" || templateName === "overdue_reminder");
    setAttachment(null);
    const selected = templates.find(t => t.name === templateName);
    if (selected) {
      if (templateName === "fees_receipt" && currentStudent?.payments?.length > 0) {
        const latestId = currentStudent.payments[0].id;
        setSelectedPaymentIds([latestId]);
        setMessage(resolveReceiptMessage(selected.body, currentStudent, currentStudent.payments[0]));
      } else {
        setSelectedPaymentIds([]);
        setMessage(replaceTemplateVariables(selected.body, currentStudent));
      }
    }
  };

  const handlePaymentCheckboxChange = (paymentId) => {
    setSelectedPaymentIds((prev) => {
      const next = prev.includes(paymentId)
        ? prev.filter((id) => id !== paymentId)
        : [...prev, paymentId];
      
      const selectedTemplate = templates.find(t => t.name === selectedTemplateName);
      if (selectedTemplate) {
        if (next.length === 1) {
          const p = currentStudent.payments.find(x => x.id === next[0]);
          if (p) {
            setMessage(resolveReceiptMessage(selectedTemplate.body, currentStudent, p));
          }
        } else if (next.length > 1) {
          setMessage(`[Multiple receipts selected: a separate receipt message and PDF attachment will be sent for each selected receipt]\n\nTemplate:\n${selectedTemplate.body}`);
        } else {
          setMessage(selectedTemplate.body);
        }
      }
      return next;
    });
  };

  const handleSend = async () => {
    if (!message.trim()) {
      notify.error(null, "Message cannot be empty");
      return;
    }

    const isBroadcast = currentStudent.isSchoolBroadcast || currentStudent.isClassBroadcast || currentStudent.isBroadcast;

    if (selectedTemplateName === "fees_receipt" && !isBroadcast) {
      if (selectedPaymentIds.length === 0) {
        notify.error(null, "Please select at least one receipt to send");
        return;
      }
    } else {
      if (requiresMedia && !attachment) {
        notify.error(null, "A media file attachment is required for this template");
        return;
      }
    }
    
    try {
      setSending(true);
      
      if (selectedTemplateName === "fees_receipt" && !isBroadcast) {
        // Send selected receipts sequentially
        for (const paymentId of selectedPaymentIds) {
          const payment = currentStudent.payments.find(p => p.id === paymentId);
          if (!payment) continue;

          const rawTemplate = templates.find(t => t.name === "fees_receipt")?.body || message;
          const resolvedMsg = resolveReceiptMessage(rawTemplate, currentStudent, payment);

          const res = await downloadStudentPaymentReceipt({
            studentId: currentStudent.id,
            paymentId: paymentId
          });

          const base64Data = await blobToBase64(res.blob);
          const className = currentStudent.className || (currentStudent.class?.name) || "";

          await sendPersonalWhatsapp({
            studentId: currentStudent.id,
            message: resolvedMsg,
            isFeesReminder: false,
            fileData: base64Data,
            fileName: res.fileName || `fee-receipt-${payment.receiptNo}.pdf`,
            fileType: "application/pdf",
            templateName: "fees_receipt",
            variables: [
              "{parent_name}",
              String(payment.amount),
              "{full_name}",
              "{class_name}",
              String(payment.receiptNo),
              "{school_name}"
            ]
          });
        }
        notify.success(`Successfully queued ${selectedPaymentIds.length} receipt(s)!`);
      } else {
        const payload = {
          message: message.trim(),
          isFeesReminder,
          templateName: selectedTemplateName,
          variables: selectedTemplateName === "fees_reminder" 
            ? ["{parent_name}", "{pending_fees}", "{full_name}", "{class_name}", "today", "School"]
            : selectedTemplateName === "overdue_reminder"
            ? ["{parent_name}", "{full_name}", "{class_name}", "{pending_fees}", "{overdue_fees}", "{overdue_details}", "{school_name}"]
            : selectedTemplateName === "general_notice"
            ? ["{full_name}", message.trim(), "School"]
            : [message.trim()],
          ...(attachment ? {
            fileData: attachment.fileData,
            fileName: attachment.fileName,
            fileType: attachment.fileType
          } : {})
        };

        if (currentStudent.isSchoolBroadcast) {
          await sendBroadcastWhatsapp({
            targetType: "SCHOOL",
            ...payload
          });
          notify.success("WhatsApp school broadcast queued successfully!");
        } else if (currentStudent.isClassBroadcast) {
          await sendBroadcastWhatsapp({
            targetType: "CLASS",
            targetId: currentStudent.classId,
            ...payload
          });
          notify.success("WhatsApp class broadcast queued successfully!");
        } else if (currentStudent.isBroadcast) {
          await sendBroadcastWhatsapp({
            targetType: "SECTION",
            targetId: currentStudent.sectionId,
            ...payload
          });
          notify.success("WhatsApp section broadcast queued successfully!");
        } else {
          await sendPersonalWhatsapp({
            studentId: currentStudent.id,
            ...payload
          });
          notify.success("WhatsApp message queued successfully!");
        }
      }
      
      if (onSent) onSent();
      onClose();
      setAttachment(null);
    } catch (err) {
      console.error(err);
      notify.error(
        err, 
        isBroadcast
          ? "Failed to queue broadcast" 
          : "Failed to send WhatsApp message"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <FaWhatsapp size={22} className="fill-[#25D366]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Send WhatsApp Message
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                {currentStudent.isSchoolBroadcast ? (
                  <>Broadcast to <span className="text-slate-800 font-bold">Entire School</span> ({currentStudent.phone})</>
                ) : currentStudent.isClassBroadcast ? (
                  <>Broadcast to <span className="text-slate-800 font-bold">{currentStudent.fullName}</span> ({currentStudent.phone})</>
                ) : currentStudent.isBroadcast ? (
                  <>Broadcast to <span className="text-slate-800 font-bold">{currentStudent.fullName}</span> ({currentStudent.phone})</>
                ) : (
                  <>To Parent of <span className="text-slate-800 font-bold">{currentStudent.fullName || currentStudent.name}</span> ({currentStudent.phone || currentStudent.phoneNumber})</>
                )}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal content grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-5 max-h-[calc(85vh-130px)] overflow-y-auto">
          
          {/* Left Column: Template Selection & Receipts selection */}
          <div className="flex flex-col gap-4">
            {/* Template selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Select Message Template
              </label>
              <select
                value={selectedTemplateName}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50"
                disabled={loadingTemplates}
              >
                {loadingTemplates ? (
                  <option>Loading templates...</option>
                ) : (
                  templates.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name.replace(/_/g, " ").toUpperCase()}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Receipt selector if fees_receipt template is selected */}
            {selectedTemplateName === "fees_receipt" && currentStudent.payments && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                  Select Receipts to Send:
                </label>
                {currentStudent.payments.length === 0 ? (
                  <p className="text-xs text-slate-500 font-semibold">No receipts/payments found for this student.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {currentStudent.payments.map((p) => {
                      const dateStr = new Date(Number(p.paidAt)).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      });
                      return (
                        <label key={p.id} className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer transition select-none">
                          <input
                            type="checkbox"
                            checked={selectedPaymentIds.includes(p.id)}
                            onChange={() => handlePaymentCheckboxChange(p.id)}
                            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800">
                              Receipt #{p.receiptNo || "N/A"}: <span className="text-emerald-600">₹{p.amount.toLocaleString("en-IN")}</span>
                            </p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                              {p.feeTypeName || "Fee"} • {dateStr}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Broadcast info notice */}
            {(currentStudent.isSchoolBroadcast || currentStudent.isClassBroadcast || currentStudent.isBroadcast) && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <p className="text-[11px] font-bold text-blue-600 leading-relaxed">
                  <strong>Broadcast Mode:</strong> Variable tags like <code>{`{full_name}`}</code>, <code>{`{pending_fees}`}</code>, <code>{`{remaining_fees}`}</code>, <code>{`{overdue_amount}`}</code>, and <code>{`{class_name}`}</code> will be resolved individually for each parent upon sending.
                </p>
              </div>
            )}

            {/* Fees Reminder Filter Checkbox */}
            {(currentStudent.isSchoolBroadcast || currentStudent.isClassBroadcast || currentStudent.isBroadcast) && (
              <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-xl border border-slate-100 bg-slate-50/50 p-3 hover:bg-slate-50 transition animate-in fade-in slide-in-from-top-1 duration-200">
                <input
                  type="checkbox"
                  checked={isFeesReminder}
                  onChange={(e) => setIsFeesReminder(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                    Fees Reminder Mode
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                    Only target parents of students with outstanding dues (dueAmount &gt; 0)
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Right Column: Message Input & Media Attachments */}
          <div className="flex flex-col gap-4">
            {/* Textarea Label and Hindi Keyboard Toggle */}
            <div className="flex flex-col gap-1.5 relative">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Message Content
                </label>
                
                {/* Premium Hindi Keyboard Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    setIsHindiMode(!isHindiMode);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold shadow-sm border transition-all active:scale-95 ${
                    isHindiMode
                      ? "bg-orange-500 border-orange-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Sparkles size={11} className={isHindiMode ? "animate-pulse" : ""} />
                  {isHindiMode ? "हिन्दी Keyboard ON" : "हि / EN Keyboard"}
                </button>
              </div>

              {/* Smart textarea with Hindi Support */}
              <textarea
                ref={textareaRef}
                value={message}
                onChange={handleTextareaChange}
                onSelect={handleTextareaSelect}
                onKeyDown={handleKeyDown}
                rows={5}
                disabled={sending}
                placeholder="Type your message here..."
                className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 resize-none transition"
              />

              {/* Hindi suggestions list */}
              {isHindiMode && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-[120] -bottom-10 flex flex-wrap gap-1.5 rounded-xl border border-orange-200 bg-orange-50 p-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider self-center mr-1">
                    Suggestions:
                  </span>
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectSuggestion(s, " ")}
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all active:scale-95 ${
                        idx === highlightIdx
                          ? "bg-orange-500 text-white"
                          : "bg-white text-slate-700 hover:bg-orange-100 border border-orange-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Spacing for suggestions list when open */}
            {isHindiMode && suggestions.length > 0 && <div className="h-6" />}

            {/* Media Attachment Selection */}
            <div className="flex flex-col gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip size={13} />
                  Media Attachment {requiresMedia || selectedTemplateName === "fees_receipt" ? <span className="text-red-500 font-extrabold">(Required)</span> : "(Optional)"}
                </span>
                {!attachment && selectedTemplateName !== "fees_receipt" && (
                  <label className="cursor-pointer inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-extrabold text-emerald-700 hover:bg-emerald-100 transition border border-emerald-200 active:scale-95">
                    <Plus size={12} className="text-emerald-600" />
                    Choose File
                    <input
                      type="file"
                      accept="image/*,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,video/mp4"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={sending || readingFile}
                    />
                  </label>
                )}
              </div>

              {readingFile && (
                <div className="flex items-center gap-2 py-1 text-xs font-semibold text-slate-500 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
                  Reading file content...
                </div>
              )}

              {fetchingReceipt && (
                <div className="flex items-center gap-2 py-1 text-xs font-bold text-slate-500 animate-pulse">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500 animate-pulse" />
                  Generating and auto-attaching PDF receipt...
                </div>
              )}

              {selectedTemplateName === "fees_receipt" && selectedPaymentIds.length > 1 && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 shadow-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-800">
                      {selectedPaymentIds.length} Receipt PDFs Auto-Attached
                    </p>
                    <p className="text-[10px] font-bold text-emerald-600">
                      A separate message and PDF will be sent for each selected receipt.
                    </p>
                  </div>
                </div>
              )}

              {attachment && (
                <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {attachment.fileName}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {(attachment.fileSize / 1024).toFixed(1)} KB · {attachment.fileType.split("/")[1]?.toUpperCase() || "FILE"}
                      </p>
                    </div>
                  </div>
                  {selectedTemplateName !== "fees_receipt" && (
                    <button
                      type="button"
                      onClick={removeAttachment}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition active:scale-95"
                      title="Remove attachment"
                      disabled={sending}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 bg-slate-50/50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
            disabled={sending}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !message.trim() || (selectedTemplateName === "fees_receipt" ? selectedPaymentIds.length === 0 : (requiresMedia && !attachment)) }
            className="w-1/2 flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {sending ? "Sending..." : "Send Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
