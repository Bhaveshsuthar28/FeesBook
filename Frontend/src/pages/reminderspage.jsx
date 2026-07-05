import { useEffect, useState, useRef, useMemo } from "react";
import { 
  Clock, 
  Play, 
  Save, 
  MessageSquareCode, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Smartphone,
  Plus,
  Pencil,
  Trash2,
  X,
  Sparkles,
  Check,
  Paperclip,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { 
  getWhatsappSettings, 
  updateWhatsappSettings, 
  getWhatsappHistory, 
  triggerFeesReminders 
} from "../lib/api/studentapi.js";
import { notify } from "../lib/toast.js";
import { PageLoadingSkeleton } from "../components/skeleton/PageSkeletons.jsx";
import {
  WhatsAppRemindersIllustration,
  EmptyStateIllustration
} from "../components/common/SchoolIllustrations.jsx";
import { useAppContext } from "../context/user.context.jsx";

// ─── Static constants: instant, zero-latency suggestions ───────────

// Single bracket {variable} → text data
const TEMPLATE_VARIABLES = [
  { key: "full_name",       label: "Student's full name" },
  { key: "parent_name",     label: "Parent / guardian name" },
  { key: "class_name",      label: "Class name (e.g. 10th A)" },
  { key: "school_name",     label: "School name" },
  { key: "pending_fees",    label: "Outstanding current class fee amount (₹)" },
  { key: "overdue_fees",    label: "Total overdue fees from previous classes" },
  { key: "overdue_details", label: "Details of overdue fees (class & academic year)" },
  { key: "remaining_fees",  label: "Total remaining fees (current + overdue)" },
  { key: "due_date",        label: "Payment due date" },
  { key: "paid_amount",     label: "Amount already paid" },
  { key: "total_fees",      label: "Total assigned fees" },
  { key: "phone_number",    label: "Parent's phone number" },
  { key: "receipt_number",  label: "Last payment receipt number" },
];

// Double bracket {{media}} → file / media attachments
const TEMPLATE_MEDIA = [
  { key: "pdf",             label: "PDF document attachment" },
  { key: "image",           label: "Image attachment (JPG/PNG)" },
  { key: "ppt",             label: "PowerPoint presentation" },
  { key: "receipt_pdf",     label: "Auto-generated fee receipt PDF" },
  { key: "report_card",     label: "Student report card document" },
  { key: "document",        label: "General document (DOC/DOCX)" },
  { key: "excel",           label: "Excel spreadsheet (XLS/XLSX)" },
  { key: "video",           label: "Video attachment (MP4)" },
];

// Default templates that ship with the system
const DEFAULT_TEMPLATES = [
  {
    name: "fees_reminder",
    body: "Dear {full_name}, fees of ₹{pending_fees} for {class_name} is pending since {due_date}. Please contact school — {school_name}",
    status: "Approved",
    isDefault: true,
  },
  {
    name: "overdue_reminder",
    body: "Dear {parent_name}, your child {full_name} (Class {class_name}) has a pending fee of ₹{pending_fees} and overdue fees of ₹{overdue_fees} ({overdue_details}). Please deposit it soon. Regards, {school_name} school administration.",
    status: "Approved",
    isDefault: true,
  },
  {
    name: "fees_receipt",
    body: "Dear {parent_name}, thank you for the payment of ₹{receipt_amount} for your child {full_name} (Class {class_name}). Receipt no: {receipt_no}. Regards, {school_name} school administration.",
    status: "Approved",
    isDefault: true,
  },
];

// ─── Smart Textarea Component ──────────────────────────────────────
function SmartTextarea({ value, onChange, placeholder, rows = 5, disabled }) {
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const [braceStartPos, setBraceStartPos] = useState(-1);
  const [isMediaMode, setIsMediaMode] = useState(false); // false = {var}, true = {{media}}

  // Hindi Transliteration States
  const [isHindiMode, setIsHindiMode] = useState(false);
  const [hindiSuggestions, setHindiSuggestions] = useState([]);
  const [activeHindiWord, setActiveHindiWord] = useState("");
  const [hindiWordStart, setHindiWordStart] = useState(-1);
  const [hindiHighlightIdx, setHindiHighlightIdx] = useState(0);

  const sourceList = isMediaMode ? TEMPLATE_MEDIA : TEMPLATE_VARIABLES;
  const filtered = sourceList.filter(v =>
    v.key.toLowerCase().includes(filterText.toLowerCase())
  );

  // Detect `{` or `{{` and filter as user types, or handle Hindi translit typing
  const handleChange = (e) => {
    const newVal = e.target.value;
    const cursorPos = e.target.selectionStart;
    onChange(newVal);

    const textBeforeCursor = newVal.slice(0, cursorPos);

    // Check for double brace {{ first (media mode)
    const lastDoubleOpen = textBeforeCursor.lastIndexOf("{{");
    const lastDoubleClose = textBeforeCursor.lastIndexOf("}}");

    if (lastDoubleOpen > -1 && lastDoubleOpen > lastDoubleClose) {
      const partial = textBeforeCursor.slice(lastDoubleOpen + 2);
      if (!/\s/.test(partial) && !/\}/.test(partial)) {
        setBraceStartPos(lastDoubleOpen);
        setFilterText(partial);
        setIsMediaMode(true);
        setShowDropdown(true);
        setHighlightIdx(0);
        return;
      }
    }

    // Check for single brace { (variable mode)
    // But make sure it's not part of a {{ 
    const lastSingleOpen = textBeforeCursor.lastIndexOf("{");
    const lastSingleClose = textBeforeCursor.lastIndexOf("}");

    if (lastSingleOpen > -1 && lastSingleOpen > lastSingleClose) {
      // Check it's not a double brace
      const charBefore = lastSingleOpen > 0 ? textBeforeCursor[lastSingleOpen - 1] : "";
      const charAfter = lastSingleOpen < textBeforeCursor.length - 1 ? textBeforeCursor[lastSingleOpen + 1] : "";
      
      if (charBefore !== "{" && charAfter !== "{") {
        const partial = textBeforeCursor.slice(lastSingleOpen + 1);
        if (!/\s/.test(partial) && !/\}/.test(partial)) {
          setBraceStartPos(lastSingleOpen);
          setFilterText(partial);
          setIsMediaMode(false);
          setShowDropdown(true);
          setHighlightIdx(0);
          return;
        }
      }
    }

    // If variables dropdown is NOT active, handle Hindi translit
    setShowDropdown(false);
    
    if (isHindiMode) {
      const match = textBeforeCursor.match(/([a-zA-Z]+)$/);
      if (match) {
        const word = match[1];
        setActiveHindiWord(word);
        setHindiWordStart(textBeforeCursor.length - word.length);
      } else {
        setActiveHindiWord("");
        setHindiSuggestions([]);
      }
    } else {
      setActiveHindiWord("");
      setHindiSuggestions([]);
    }
  };

  // Fetch suggestions when activeHindiWord changes (with a small debounce)
  useEffect(() => {
    if (!activeHindiWord || !isHindiMode || showDropdown) {
      setHindiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://inputtools.google.com/request?text=${encodeURIComponent(
            activeHindiWord
          )}&itc=hi-t-i0-und&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8&app=test`
        );
        if (res.ok) {
          const data = await res.json();
          if (
            data &&
            data[0] === "SUCCESS" &&
            data[1] &&
            data[1][0] &&
            data[1][0][1]
          ) {
            const list = data[1][0][1];
            setHindiSuggestions([...list, activeHindiWord]);
            setHindiHighlightIdx(0);
          }
        }
      } catch (err) {
        console.error("Transliteration API failed", err);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeHindiWord, isHindiMode, showDropdown]);

  const selectHindiSuggestion = (hindiWord, appendChar = "") => {
    if (hindiWordStart < 0 || !textareaRef.current) return;
    const text = value;
    const cursorPos = textareaRef.current.selectionStart;

    const before = text.slice(0, hindiWordStart);
    const after = text.slice(cursorPos);

    const replacement = hindiWord + appendChar;
    const newValue = before + replacement + after;
    onChange(newValue);

    setHindiSuggestions([]);
    setActiveHindiWord("");

    // Restore cursor position right after the replaced word
    requestAnimationFrame(() => {
      const newPos = before.length + replacement.length;
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(newPos, newPos);
    });
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (showDropdown && filtered.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx(i => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx(i => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        selectVariable(filtered[highlightIdx]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
      return;
    }

    if (isHindiMode && hindiSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHindiHighlightIdx(i => (i + 1) % hindiSuggestions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHindiHighlightIdx(i => (i - 1 + hindiSuggestions.length) % hindiSuggestions.length);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        const selected = hindiSuggestions[hindiHighlightIdx] || hindiSuggestions[0];
        selectHindiSuggestion(selected, e.key === " " ? " " : "\n");
      } else if (e.key === "Escape") {
        setHindiSuggestions([]);
        setActiveHindiWord("");
      }
    }
  };

  // Insert selected variable or media
  const selectVariable = (variable) => {
    const textarea = textareaRef.current;
    if (!textarea || braceStartPos < 0) return;

    const before = value.slice(0, braceStartPos);
    const after = value.slice(textarea.selectionStart);

    // Single brace for variables, double for media
    const inserted = isMediaMode
      ? `{{${variable.key}}}`
      : `{${variable.key}}`;

    const newValue = before + inserted + after;
    onChange(newValue);
    setShowDropdown(false);

    // Restore cursor position after the inserted token
    requestAnimationFrame(() => {
      const newPos = before.length + inserted.length;
      textarea.focus();
      textarea.setSelectionRange(newPos, newPos);
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll highlighted item into view
  useEffect(() => {
    if (!showDropdown || !dropdownRef.current) return;
    const item = dropdownRef.current.children[highlightIdx];
    if (item) item.scrollIntoView({ block: "nearest" });
  }, [highlightIdx, showDropdown]);

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Draft Area
        </span>
        <button
          type="button"
          onClick={() => {
            setIsHindiMode(!isHindiMode);
            if (textareaRef.current) textareaRef.current.focus();
          }}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition active:scale-95 ${
            isHindiMode
              ? "bg-indigo-600 border-indigo-700 text-white shadow-sm"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          <Sparkles size={10} className={isHindiMode ? "animate-pulse" : ""} />
          {isHindiMode ? "Hindi Keyboard ON" : "हि / EN Keyboard"}
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 resize-none animate-all"
      />

      {/* Hindi Suggestions popup */}
      {isHindiMode && hindiSuggestions.length > 0 && (
        <div className="absolute left-0 right-0 z-50 -bottom-10 flex flex-wrap gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 p-2 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <span className="text-[9px] font-bold text-indigo-650 uppercase tracking-wider self-center mr-1">
            Suggestions:
          </span>
          {hindiSuggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectHindiSuggestion(s, " ")}
              className={`rounded-lg px-2 py-0.5 text-xs font-bold transition active:scale-95 ${
                idx === hindiHighlightIdx
                  ? "bg-indigo-600 text-white"
                  : "bg-white text-slate-700 hover:bg-indigo-50 border border-indigo-100"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Spacing for suggestions list when open */}
      {isHindiMode && hindiSuggestions.length > 0 && <div className="h-6" />}

      {showDropdown && filtered.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute left-0 right-0 z-50 mt-1 max-h-[220px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          {/* Dropdown header */}
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b px-3 py-2 text-[10px] font-bold uppercase tracking-wider border-indigo-100 bg-indigo-50 text-indigo-700">
            {isMediaMode ? (
              <><Paperclip size={11} /> Media Attachments — {`{{media}}`}</>
            ) : (
              <><MessageSquareCode size={11} /> Text Variables — {`{variable}`}</>
            )}
          </div>

          {filtered.map((v, idx) => (
            <button
              key={v.key}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                selectVariable(v);
              }}
              onMouseEnter={() => setHighlightIdx(idx)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                idx === highlightIdx
                  ? "bg-indigo-600 text-white"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className={`rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                idx === highlightIdx
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}>
                {isMediaMode ? `{{${v.key}}}` : `{${v.key}}`}
              </span>
              <span className="text-xs font-medium text-slate-500 truncate">
                {v.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Preview: renders {variable} and {{media}} as styled chips ─
function TemplatePreview({ body }) {
  if (!body || !body.trim()) return null;

  // Split text by {variable} and {{media}} tokens
  const parts = body.split(/(\{\{[a-z_]+\}\}|\{[a-z_]+\})/g);

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-3">
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        Live Preview
      </p>
      <p className="text-sm font-medium leading-relaxed text-slate-700 flex flex-wrap items-center gap-y-1">
        {parts.map((part, i) => {
          // Double brace → media chip (indigo)
          if (/^\{\{[a-z_]+\}\}$/.test(part)) {
            const mediaName = part.slice(2, -2);
            return (
              <span
                key={i}
                className="mx-0.5 inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700"
              >
                <Paperclip size={10} />
                {mediaName}
              </span>
            );
          }
          // Single brace → variable chip (indigo)
          if (/^\{[a-z_]+\}$/.test(part)) {
            const varName = part.slice(1, -1);
            return (
              <span
                key={i}
                className="mx-0.5 inline-flex items-center rounded-md bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700"
              >
                {varName}
              </span>
            );
          }
          return <span key={i}>{part}</span>;
        })}
      </p>
    </div>
  );
}

// ─── Template Modal (Create / Edit) ────────────────────────────────
function TemplateModal({ template, onSave, onClose }) {
  const [name, setName] = useState(template?.name || "");
  const [body, setBody] = useState(template?.body || "");
  const isEditing = !!template;

  const handleSubmit = () => {
    if (!name.trim() || !body.trim()) {
      notify.error(null, "Template Name and Message Body are required");
      return;
    }
    onSave({
      name: name.trim(),
      body: body.trim(),
      status: template?.status || "Approved",
      isDefault: template?.isDefault || false,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              {isEditing ? "Edit Template" : "Create Template"}
            </h3>
            <p className="mt-0.5 text-xs font-semibold text-slate-500">
              Type <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-indigo-700">{"{"}</span> for variables, <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-indigo-700">{"{{"}</span> for media
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-4 p-5 max-h-[70vh] overflow-y-auto">
          {/* Template Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Template Name</label>
            <input
              type="text"
              placeholder="e.g. fees_reminder, holiday_notice"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEditing}
              className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>

          {/* Smart Textarea */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase text-slate-500">Message Body</label>
            <SmartTextarea
              value={body}
              onChange={setBody}
              placeholder={`e.g. Dear {full_name}, your fees of ₹{pending_fees} for {class_name} are due. {{receipt_pdf}}`}
              rows={5}
            />
            {/* Helper chips */}
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                <span className="font-mono">{"{var}"}</span> Text data
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                <Paperclip size={9} />
                <span className="font-mono">{"{{media}}"}</span> File attachment
              </span>
            </div>
          </div>

          {/* Live Preview */}
          <TemplatePreview body={body} />
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-1/2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow hover:bg-indigo-700 active:scale-95 transition"
          >
            {isEditing ? "Update Template" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirmation Inline ────────────────────────────────────
function DeleteConfirm({ onConfirm, onCancel }) {
  return (
    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-red-100">
      <p className="text-xs font-bold text-red-600 flex-1">Delete this template?</p>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition"
      >
        No
      </button>
      <button
        type="button"
        onClick={onConfirm}
        className="rounded-lg bg-red-500 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-red-600 transition"
      >
        Yes, Delete
      </button>
    </div>
  );
}

// ─── Main Page Component ───────────────────────────────────────────
export default function RemindersPage() {
  const { t } = useAppContext();
  const [settings, setSettings] = useState({
    reminderIntervalDays: 90,
    reminderTime: "09:00",
    autoSendEnabled: false,
    templates: []
  });
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [showTriggerConfirm, setShowTriggerConfirm] = useState(false);

  // Filtering and pagination state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter]);

  const uniqueTypes = useMemo(() => {
    return [...new Set(history.map((h) => h.messageType).filter(Boolean))];
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesSearch =
        (item.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.recipientPhone || "").includes(searchQuery);

      const matchesStatus =
        !statusFilter || item.status === statusFilter;

      const matchesType =
        !typeFilter || item.messageType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [history, searchQuery, statusFilter, typeFilter]);

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage) || 1;
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredHistory, currentPage]);

  // Template modal state
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingIdx, setEditingIdx] = useState(-1);
  const [deletingIdx, setDeletingIdx] = useState(-1);

  // Merge default + custom templates
  const allTemplates = [...DEFAULT_TEMPLATES, ...(settings.templates || [])];

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [settingsData, historyData] = await Promise.all([
          getWhatsappSettings(),
          getWhatsappHistory(1000)
        ]);
        if (settingsData) setSettings(settingsData);
        if (historyData) setHistory(historyData);
      } catch (err) {
        console.error(err);
        notify.error(err, "Failed to load WhatsApp configurations");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Real-time polling when there are pending reminders
  useEffect(() => {
    const hasPending = history.some((h) => h.status === "PENDING");
    if (!hasPending) return;

    const interval = setInterval(async () => {
      try {
        const historyData = await getWhatsappHistory(1000);
        setHistory(historyData);
      } catch (err) {
        console.error("Failed to poll WhatsApp history:", err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [history]);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateWhatsappSettings(settings);
      notify.success("WhatsApp settings updated successfully!");
    } catch (err) {
      console.error(err);
      notify.error(err, "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerManualSend = async () => {
    try {
      setTriggering(true);
      setShowTriggerConfirm(false);
      const res = await triggerFeesReminders();
      notify.success(`Successfully queued ${res.queued} pending reminders!`);
      const historyData = await getWhatsappHistory(1000);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      notify.error(err, "Failed to trigger manual dispatch");
    } finally {
      setTriggering(false);
    }
  };

  // ── Template CRUD ──
  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setEditingIdx(-1);
    setTemplateModalOpen(true);
  };

  const handleOpenEdit = (template, globalIdx) => {
    setEditingTemplate({ ...template });
    setEditingIdx(globalIdx);
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = (templateData) => {
    if (editingIdx >= 0 && editingIdx < DEFAULT_TEMPLATES.length) {
      // Editing a default template — we can't modify DEFAULT_TEMPLATES const,
      // so we save the override into settings.templates with a special flag
      const customTemplates = [...(settings.templates || [])];
      // Check if override already exists
      const overrideIdx = customTemplates.findIndex(
        t => t.name === templateData.name && t.isDefault
      );
      if (overrideIdx >= 0) {
        customTemplates[overrideIdx] = templateData;
      } else {
        customTemplates.push({ ...templateData, isDefault: true });
      }
      setSettings(curr => ({ ...curr, templates: customTemplates }));
      notify.success("Default template updated!");
    } else if (editingIdx >= DEFAULT_TEMPLATES.length) {
      // Editing a custom template
      const customIdx = editingIdx - DEFAULT_TEMPLATES.length;
      const customTemplates = [...(settings.templates || [])];
      customTemplates[customIdx] = templateData;
      setSettings(curr => ({ ...curr, templates: customTemplates }));
      notify.success("Template updated!");
    } else {
      // Creating new
      const customTemplates = [...(settings.templates || []), templateData];
      setSettings(curr => ({ ...curr, templates: customTemplates }));
      notify.success("Template created!");
    }

    setTemplateModalOpen(false);
    setEditingTemplate(null);
    setEditingIdx(-1);
  };

  const handleDeleteTemplate = (globalIdx) => {
    if (globalIdx < DEFAULT_TEMPLATES.length) return; // Can't delete defaults
    const customIdx = globalIdx - DEFAULT_TEMPLATES.length;
    const customTemplates = [...(settings.templates || [])];
    customTemplates.splice(customIdx, 1);
    setSettings(curr => ({ ...curr, templates: customTemplates }));
    setDeletingIdx(-1);
    notify.success("Template deleted!");
  };

  // Build display list: defaults (with overrides applied) + custom
  const getDisplayTemplates = () => {
    const customTemplates = settings.templates || [];
    
    // Build defaults with possible overrides
    const defaults = DEFAULT_TEMPLATES.map(dt => {
      const override = customTemplates.find(
        t => t.name === dt.name && t.isDefault
      );
      return override || dt;
    });

    // Custom templates (non-default)
    const custom = customTemplates.filter(t => !t.isDefault);

    return [...defaults, ...custom];
  };

  const displayTemplates = getDisplayTemplates();

  // ── Stats ──
  const stats = {
    sent: history.filter(h => h.status === "SENT" || h.status === "DELIVERED").length,
    pending: history.filter(h => h.status === "PENDING").length,
    failed: history.filter(h => h.status === "FAILED").length
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <PageLoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-650">
            <WhatsAppRemindersIllustration className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-950">{t("whatsappRemindersTitle")}</h1>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {t("whatsappRemindersSubtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowTriggerConfirm(true)}
          disabled={triggering}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow hover:bg-indigo-700 transition disabled:opacity-60 active:scale-95 shrink-0"
        >
          {triggering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play size={16} />
          )}
          {t("triggerBatch")}
        </button>
      </div>

      {/* Stats Section */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-green-200 bg-[#DCFCE7]/40 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#DCFCE7] p-2 text-[#16A34A]">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-green-800 uppercase tracking-wide">{t("delivered")}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-green-950">{stats.sent}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-[#FEF3C7]/40 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#FEF3C7] p-2 text-[#D97706]">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">{t("pending")}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-amber-950">{stats.pending}</h3>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 bg-[#FEE2E2]/40 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-[#FEE2E2] p-2 text-[#DC2626]">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-red-800 uppercase tracking-wide">{t("failed")}</p>
              <h3 className="mt-1 text-2xl font-extrabold text-red-950">{stats.failed}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Message Flow Diagram */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="text-indigo-655" size={18} />
          {t("deliveryFlowTitle")}
        </h2>
        
        <div className="mt-6 grid gap-6 md:grid-cols-4 relative">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition relative group">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 shadow-inner group-hover:scale-110 transition">
              <Play size={20} className="fill-indigo-650 ml-0.5" />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">{t("step1Title")}</h4>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 max-w-[200px]">
              {t("step1Desc")}
            </p>
            {/* Connector Line (Desktop only) */}
            <div className="hidden md:block absolute top-10 -right-3 w-6 h-0.5 bg-slate-200 z-10" />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition relative group">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3 shadow-inner group-hover:scale-110 transition">
              <Clock size={20} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">{t("step2Title")}</h4>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 max-w-[200px]">
              {t("step2Desc")}
            </p>
            {/* Connector Line (Desktop only) */}
            <div className="hidden md:block absolute top-10 -right-3 w-6 h-0.5 bg-slate-200 z-10" />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition relative group">
            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 shadow-inner group-hover:scale-110 transition">
              <FaWhatsapp size={22} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">{t("step3Title")}</h4>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 max-w-[200px]">
              {t("step3Desc")}
            </p>
            {/* Connector Line (Desktop only) */}
            <div className="hidden md:block absolute top-10 -right-3 w-6 h-0.5 bg-slate-200 z-10" />
          </div>

          {/* Step 4 */}
          <div className="flex flex-col items-center text-center p-4 rounded-xl hover:bg-slate-50 transition relative group">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-inner group-hover:scale-110 transition">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-sm font-extrabold text-slate-800">{t("step4Title")}</h4>
            <p className="mt-1.5 text-xs font-semibold text-slate-500 max-w-[200px]">
              {t("step4Desc")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Scheduler Settings */}
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Clock className="text-slate-500" size={18} />
            Auto-Reminder Schedule Settings
          </h2>

          <div className="flex flex-col gap-4">
            {/* Toggle */}
            <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div>
                <p className="text-sm font-bold text-slate-800">Enable Automated Dispatch</p>
                <p className="text-xs text-slate-500 mt-0.5">Daily checks will send reminders automatically on schedule.</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSendEnabled}
                onChange={(e) => setSettings(curr => ({ ...curr, autoSendEnabled: e.target.checked }))}
                className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            {/* Time Dispatch */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Dispatch Time (IST)</label>
              <input
                type="time"
                value={settings.reminderTime}
                onChange={(e) => setSettings(curr => ({ ...curr, reminderTime: e.target.value }))}
                className="rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              />
            </div>

            {/* Frequency Interval */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase text-slate-500">Reminder Interval (Days)</label>
              <select
                value={settings.reminderIntervalDays}
                onChange={(e) => setSettings(curr => ({ ...curr, reminderIntervalDays: parseInt(e.target.value, 10) }))}
                className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50"
              >
                <option value={15}>Every 15 Days</option>
                <option value={30}>Every 30 Days (Monthly)</option>
                <option value={45}>Every 45 Days</option>
                <option value={60}>Every 60 Days (2 Months)</option>
                <option value={90}>Every 90 Days (3 Months)</option>
                <option value={180}>Every 180 Days (6 Months)</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveSettings}
            disabled={saving}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white shadow hover:bg-indigo-700 transition active:scale-95 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-300" />
            ) : (
              <Save size={16} />
            )}
            Save Configuration
          </button>
        </div>

        {/* Templates Control */}
        <div className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquareCode className="text-slate-500" size={18} />
              Message Templates
            </h2>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="flex items-center gap-1 rounded-lg bg-indigo-50 px-2.5 py-1.5 text-xs font-bold text-indigo-650 hover:bg-indigo-100 transition active:scale-95"
            >
              <Plus size={14} />
              New Template
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-600">
              <span className="font-mono">{"{var}"}</span> Text variable
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 border border-indigo-100 px-2 py-1 text-[10px] font-bold text-indigo-600">
              <Paperclip size={9} />
              <span className="font-mono">{"{{media}}"}</span> File attachment
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
            {displayTemplates.map((t, idx) => {
              const isDefault = t.isDefault;
              const isCustom = !isDefault;
              const canDelete = isCustom;

              return (
                <div key={`${t.name}-${idx}`} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-800">{t.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                        {t.status}
                      </span>
                      {isDefault && (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                          DEFAULT
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(t, idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition"
                        title="Edit template"
                      >
                        <Pencil size={14} />
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => setDeletingIdx(deletingIdx === idx ? -1 : idx)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                          title="Delete template"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Template body with inline preview */}
                  <div className="mt-2 border-t border-slate-100 pt-2">
                    <TemplatePreview body={t.body} />
                  </div>

                  {deletingIdx === idx && canDelete && (
                    <DeleteConfirm
                      onConfirm={() => handleDeleteTemplate(idx)}
                      onCancel={() => setDeletingIdx(-1)}
                    />
                  )}
                </div>
              );
            })}

            {/* Empty custom state */}
            {(!settings.templates || settings.templates.filter(t => !t.isDefault).length === 0) && (
              <div className="flex flex-col items-center gap-2 py-6 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <EmptyStateIllustration className="h-10 w-10 text-slate-400" />
                <p className="text-xs font-extrabold text-slate-800">
                  No custom templates yet
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Click "New Template" to create custom notification templates.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Sent Messages Log */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Smartphone className="text-slate-500" size={18} />
            Outgoing Messages Log
          </h2>
        </div>

        {/* Filters */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={16} />
            </span>
            <input
              type="text"
              placeholder="Search student or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 py-2 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 placeholder:text-slate-400 placeholder:font-normal"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="SENT">Sent</option>
              <option value="DELIVERED">Delivered</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 bg-white"
            >
              <option value="">All Message Types</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-bold uppercase text-slate-400">
                <th className="py-3 px-2">Recipient Phone</th>
                <th className="py-3 px-2">Student Name</th>
                <th className="py-3 px-2">Type</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-semibold text-slate-700">
              {paginatedHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                      <EmptyStateIllustration className="mb-3 h-16 w-16" />
                      <p className="text-sm font-extrabold text-slate-900">No Outgoing Messages Found</p>
                      <p className="mt-1 text-xs text-slate-500 max-w-xs">
                        No reminders match the current filters. Dispatched notifications will appear in this log.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedHistory.map((h) => {
                  let statusColor = "bg-slate-100 text-slate-700";
                  if (h.status === "SENT" || h.status === "DELIVERED") statusColor = "bg-[#DCFCE7] text-[#16A34A]";
                  if (h.status === "FAILED") statusColor = "bg-[#FEE2E2] text-[#DC2626]";
                  if (h.status === "PENDING") statusColor = "bg-[#FEF3C7] text-[#D97706]";

                  return (
                    <tr key={h.id}>
                      <td className="py-3 px-2">{h.recipientPhone}</td>
                      <td className="py-3 px-2">{h.studentName || "N/A"}</td>
                      <td className="py-3 px-2">
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5">
                          {h.messageType}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`text-xs font-bold rounded-md px-2 py-0.5 ${statusColor}`}>
                          {h.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-slate-400 text-xs">
                        {new Date(Number(h.createdAt)).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredHistory.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 pt-4 text-xs font-bold text-slate-500">
            <div>
              Showing {Math.min(filteredHistory.length, (currentPage - 1) * itemsPerPage + 1)} to{" "}
              {Math.min(filteredHistory.length, currentPage * itemsPerPage)} of {filteredHistory.length} entries
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                .filter(page => {
                  return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                })
                .map((page, index, array) => {
                  const showEllipsis = index > 0 && page - array[index - 1] > 1;
                  return (
                    <div key={page} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`rounded-lg px-2.5 py-1 text-xs font-extrabold transition ${
                          currentPage === page
                            ? "bg-indigo-600 text-white shadow shadow-indigo-100"
                            : "border border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}

              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50 transition disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Template Create/Edit Modal */}
      {templateModalOpen && (
        <TemplateModal
          template={editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => {
            setTemplateModalOpen(false);
            setEditingTemplate(null);
            setEditingIdx(-1);
          }}
        />
      )}

      {showTriggerConfirm && (
        <div
          className="
            fixed
            inset-0
            z-[110]
            flex
            items-center
            justify-center
            bg-slate-900/40
            p-4
            backdrop-blur-sm
          "
        >
          <div
            className="
              w-full
              max-w-md
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-6
              shadow-2xl
              animate-in
              fade-in
              zoom-in-95
              duration-200
            "
          >
            <div
              className="
                flex
                items-center
                justify-between
                border-b
                border-slate-100
                pb-4
              "
            >
              <h2
                className="
                  text-base
                  font-extrabold
                  text-slate-900
                "
              >
                Trigger Outgoing Batch
              </h2>

              <button
                onClick={() => setShowTriggerConfirm(false)}
                className="
                  rounded-lg
                  p-1.5
                  text-slate-400
                  hover:bg-slate-100
                  hover:text-slate-600
                  transition
                "
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p
                className="
                  text-sm
                  font-bold
                  text-slate-700
                "
              >
                What happens when you trigger this batch?
              </p>
              
              <ul className="list-disc pl-5 text-xs font-semibold text-slate-500 space-y-2">
                <li>
                  The system will scan the database for <span className="text-slate-700 font-bold">all students</span> with outstanding dues (dueAmount &gt; 0) across all classes.
                </li>
                <li>
                  It will compile a personalized fee reminder message for each student using their actual name and outstanding balance.
                </li>
                <li>
                  These reminders will be immediately queued to be sent to parents' registered WhatsApp numbers, bypassing any scheduled next reminder intervals.
                </li>
              </ul>
            </div>

            <div
              className="
                mt-6
                flex
                gap-3
              "
            >
              <button
                onClick={() => setShowTriggerConfirm(false)}
                className="
                  flex-1
                  rounded-xl
                  border
                  border-slate-200
                  py-3
                  text-sm
                  font-bold
                  text-slate-700
                  hover:bg-slate-50
                  active:scale-95
                  transition
                "
              >
                Cancel
              </button>

              <button
                onClick={handleTriggerManualSend}
                className="
                  flex-1
                  rounded-xl
                  bg-indigo-600
                  hover:bg-indigo-700
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow
                  active:scale-95
                  transition
                "
              >
                Confirm & Trigger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
