import { useState } from "react";
import {
  HelpCircle,
  LayoutDashboard,
  GraduationCap,
  Users,
  Wallet,
  Settings,
  Send,
  MessageSquare,
  BookOpen,
  Info,
  ChevronDown,
  LoaderCircle,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { sendSupportRequest } from "../lib/api/settingsapi.js";
import { notify } from "../lib/toast.js";
import { motion, AnimatePresence } from "framer-motion";

export default function HelpPage() {
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    const queryText = question.trim();
    if (!queryText) {
      notify.error(null, "Please type your question before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      await sendSupportRequest(queryText);
      notify.success("Support ticket sent to developer email successfully!");
      setQuestion("");
    } catch (err) {
      console.error(err);
      notify.error(err, "Could not send support request.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const userGuideSections = [
    {
      title: "Dashboard Overview",
      icon: LayoutDashboard,
      color: "bg-blue-50 text-blue-600",
      description:
        "The command center of your institution. View total collections, outstanding dues, concession charts, and student registration counts at a glance.",
    },
    {
      title: "Class & Section Setup",
      icon: GraduationCap,
      color: "bg-indigo-50 text-indigo-600",
      description:
        "Create classes and map sections to organize school classrooms. Archive old configurations easily to maintain focus on the active academic year.",
    },
    {
      title: "Student Lifecycle & Enrollment",
      icon: Users,
      color: "bg-emerald-50 text-emerald-600",
      description:
        "Manage admissions, profile fields, active academic enrollments, promotions, roll numbers, and parent details.",
    },
    {
      title: "Fee Management & Concessions",
      icon: Wallet,
      color: "bg-amber-50 text-amber-600",
      description:
        "Configure custom fee types, assign fee rates by class, record student payments (Cash, UPI, Card, Bank Transfer, Cheque), and apply student-specific concessions.",
    },
    {
      title: "WhatsApp Reminders & Bot",
      icon: FaWhatsapp,
      color: "bg-green-50 text-green-600",
      description:
        "Trigger automated fee reminder broadcasts, auto-generate PDF receipts, and link the WhatsApp Principal Bot for mobile remote authentication.",
    },
    {
      title: "System Settings",
      icon: Settings,
      color: "bg-slate-50 text-slate-600",
      description:
        "Update school details (logo, stamp, signature), add new academic years, choose active years, toggle collection modes, and manage bot settings.",
    },
  ];

  const faqs = [
    {
      question: "How do I configure the WhatsApp Principal Bot?",
      answer:
        "Go to Settings -> WhatsApp Bot tab. Enter an 'Activation Command' (alphanumeric, 6-30 chars) and a secure 'Bot Password'. Save them. On your phone, message the activation command to the school's WhatsApp Business number, followed by your password when prompted, to authenticate the session.",
    },
    {
      question: "How does the sliding session expiration work?",
      answer:
        "Once successfully authenticated, your WhatsApp Principal Bot session remains active for 10 minutes. Each command you send automatically extends the session for another 10 minutes. If no messages are sent for 10 minutes, the session expires, and you must message your activation command to log back in.",
    },
    {
      question: "What happens if I type the password incorrectly?",
      answer:
        "You are allowed 3 consecutive failed password attempts. Upon the 3rd failure, the bot session will be locked out for 15 minutes to prevent unauthorized access. The lockout is enforced on both the active Redis session and the database log.",
    },
    {
      question: "Can I log in from a different phone number?",
      answer:
        "For security, the bot binds to the first phone number that successfully authenticates. Login attempts from other numbers will be blocked. To link a new phone number, go to the Settings -> WhatsApp Bot page and click 'Revoke Bot Access' to clear the current phone binding.",
    },
    {
      question: "How do I configure automatic PDF receipts?",
      answer:
        "Under Settings -> Receipt Settings tab, configure your default Receipt Prefix (e.g. FB) and upload signature/stamp images. Toggle signature or stamp checkboxes. Receipts are generated automatically in PDF format on recording any student payment.",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300">
            <BookOpen size={14} />
            User Manual
          </span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Help Center & Support
          </h1>
          <p className="text-sm font-medium text-blue-100 sm:text-base">
            Learn how FeesBook operates, explore step-by-step documentation, or
            contact support directly to resolve account problems.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 items-center justify-center opacity-15 lg:flex">
          <HelpCircle size={180} className="text-white" />
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="text-indigo-600" size={20} />
          <h2 className="text-lg font-extrabold text-slate-900">
            Feature Guidelines
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {userGuideSections.map((sec, idx) => {
            const IconComponent = sec.icon;
            return (
              <div
                key={idx}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-100 hover:shadow-md transition duration-200"
              >
                <div className={`w-fit rounded-xl p-3 ${sec.color}`}>
                  <IconComponent size={24} />
                </div>
                <h3 className="mt-4 text-base font-extrabold text-slate-900">
                  {sec.title}
                </h3>
                <p className="mt-2 text-xs font-semibold text-slate-500 leading-relaxed flex-1">
                  {sec.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ & Support Section */}
      <div className="grid gap-6 md:grid-cols-5">
        {/* FAQs */}
        <div className="space-y-4 md:col-span-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-indigo-600" size={20} />
            <h2 className="text-lg font-extrabold text-slate-900 font-sans">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="flex w-full items-center justify-between gap-4 p-4 text-left font-bold text-slate-900 hover:bg-slate-50/50"
                  >
                    <span className="text-sm font-extrabold text-slate-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      size={18}
                      className={`text-slate-400 shrink-0 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                      >
                        <div className="border-t border-slate-100 bg-slate-50/50 p-4 text-xs font-medium text-slate-600 leading-relaxed">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Support Request Form */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-indigo-600" size={20} />
            <h2 className="text-lg font-extrabold text-slate-900">
              Submit Help Ticket
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-4 leading-relaxed">
              Describe your issue, question, or feature request in detail. We
              will retrieve your school and principal profile automatically and email the developer.
            </p>

            <form onSubmit={handleSubmitSupport} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-2">
                  What do you need help with?
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Describe your issue..."
                  disabled={submitting}
                  className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 resize-y"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 text-sm font-extrabold text-white shadow-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {submitting ? (
                  <LoaderCircle size={18} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Submit Support Request
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
