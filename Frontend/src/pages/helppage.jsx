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
  Play
} from "lucide-react";
import { FaWhatsapp, FaYoutube } from "react-icons/fa";
import { sendSupportRequest } from "../lib/api/settingsapi.js";
import { notify } from "../lib/toast.js";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../context/user.context.jsx";
import { EmptyStateIllustration } from "../components/common/SchoolIllustrations.jsx";
import videoGuides from "../config/videos.json";

export default function HelpPage() {
  const { t } = useAppContext();
  const [question, setQuestion] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  
  // Video guide modal simulation
  const [activeVideoGuide, setActiveVideoGuide] = useState(null);

  const handleSubmitSupport = async (e) => {
    e.preventDefault();
    const queryText = question.trim();
    if (!queryText) {
      notify.error(null, t("pleaseTypeQuestion") || "Please type your question before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      await sendSupportRequest(queryText);
      notify.success(t("supportTicketSent") || "Support ticket sent successfully!");
      setQuestion("");
    } catch (err) {
      console.error(err);
      notify.error(err, t("couldNotSendSupport") || "Could not send support request.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const userGuideSections = [
    {
      title: t("dashboardOverview") || "Dashboard Overview",
      icon: LayoutDashboard,
      color: "bg-indigo-50 text-indigo-600",
      description: t("dashboardOverviewDesc") || "The command center of your institution. View total collections, outstanding dues, and registrations at a glance."
    },
    {
      title: t("classSectionSetup") || "Class & Section Setup",
      icon: GraduationCap,
      color: "bg-indigo-50 text-indigo-600",
      description: t("classSectionSetupDesc") || "Create classes and map sections to organize school classrooms. Archive old years to maintain active focus."
    },
    {
      title: t("studentLifecycle") || "Student Lifecycle & Enrollment",
      icon: Users,
      color: "bg-indigo-50 text-indigo-600",
      description: t("studentLifecycleDesc") || "Manage student admissions, active enrollments, roll numbers, class promotions, and parent profiles."
    },
    {
      title: t("feeManagementConcessions") || "Fee Management & Concessions",
      icon: Wallet,
      color: "bg-indigo-50 text-indigo-600",
      description: t("feeManagementDesc") || "Configure fee types, assign default rates by class, apply concessions, and record payments."
    },
    {
      title: t("whatsappRemindersBot") || "WhatsApp Reminders & Bot",
      icon: FaWhatsapp,
      color: "bg-indigo-50 text-indigo-600",
      description: t("whatsappBotDesc") || "Trigger automated fee alerts, configure message templates, and link the Principal Bot for remote WhatsApp queries."
    },
    {
      title: t("systemSettingsGuide") || "System Settings & Profile",
      icon: Settings,
      color: "bg-slate-50 text-slate-600",
      description: t("systemSettingsDesc") || "Update school info (logo, stamp, signature), add academic years, select active years, and toggle payment channels."
    }
  ];

  const faqs = [
    {
      question: t("faq1Q") || "How do I configure the WhatsApp Principal Bot?",
      answer: t("faq1A") || "Go to Settings -> WhatsApp Bot tab. Enter an 'Activation Command' (6-30 chars) and a secure 'Bot Password'. Save them. On your phone, message the activation command to the school's WhatsApp number, followed by your password when prompted, to authenticate."
    },
    {
      question: t("faq2Q") || "How does the sliding session expiration work?",
      answer: t("faq2A") || "Once authenticated, your bot session remains active for 10 minutes. Each command you send automatically extends the session for another 10 minutes. If no messages are sent for 10 minutes, the session expires, and you must message your activation command to log back in."
    },
    {
      question: t("faq3Q") || "What happens if I type the password incorrectly?",
      answer: t("faq3A") || "You are allowed 3 consecutive failed password attempts. Upon the 3rd failure, the bot session will be locked out for 15 minutes to prevent unauthorized access. The lockout is enforced on both the Redis session and database log."
    },
    {
      question: t("faq4Q") || "Can I log in from a different phone number?",
      answer: t("faq4A") || "For security, the bot binds to the first phone number that successfully authenticates. Login attempts from other numbers will be blocked. To link a new phone number, go to the Settings -> WhatsApp Bot page and click 'Revoke Bot Access' to clear the current phone binding."
    },
    {
      question: t("faq5Q") || "How do I configure automatic PDF receipts?",
      answer: t("faq5A") || "Under Settings -> Receipt Settings tab, configure your default Receipt Prefix (e.g. FB) and upload signature/stamp images. Toggle signature or stamp checkboxes. Receipts are generated automatically in PDF format on recording any student payment."
    }
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-10 p-4 sm:p-6 lg:p-8">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-indigo-900 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-indigo-200">
            <BookOpen size={14} />
            {t("userManual") || "User Manual"}
          </span>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {t("helpCenterTitle") || "Help Center & Support"}
          </h1>
          <p className="text-sm font-medium text-indigo-100 sm:text-base leading-relaxed">
            {t("helpCenterSubtitle") || "Learn how FeeGo operates, explore step-by-step documentation, watch guided video manuals, or contact support directly."}
          </p>
        </div>
        <div className="absolute right-0 bottom-0 top-0 hidden w-1/3 items-center justify-center opacity-10 lg:flex">
          <HelpCircle size={180} className="text-white" />
        </div>
      </div>

      {/* Video Guidance Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Play className="text-indigo-600 fill-indigo-50" size={20} />
          <h2 className="text-lg font-extrabold text-slate-900">
            {t("videoGuidanceTitle") || "Interactive Video Walkthroughs"}
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {videoGuides.map((guide) => (
            <div
              key={guide.id}
              onClick={() => setActiveVideoGuide(guide)}
              className="group cursor-pointer flex flex-col rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:border-indigo-300 hover:shadow-md transition duration-200"
            >
              {/* Thumbnail Simulation */}
              <div className="relative h-40 bg-slate-950 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20 z-10" />
                <div className="h-12 w-12 rounded-full bg-white/95 flex items-center justify-center text-indigo-600 shadow-lg group-hover:scale-110 transition z-20">
                  <Play size={20} className="fill-indigo-600 ml-0.5" />
                </div>
                <span className="absolute bottom-2 right-2 z-20 text-[10px] font-bold text-white bg-black/60 px-2 py-0.5 rounded">
                  {guide.duration}
                </span>
                {/* SVG background representation */}
                <div className="absolute inset-0 opacity-40 flex items-center justify-center">
                  <EmptyStateIllustration className="h-28 w-28 text-slate-700" />
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-indigo-600 transition">
                  {guide.title}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed flex-1">
                  {guide.description}
                </p>
                <span className="mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                  {t("watchGuideBtn") || "Click to view guide steps →"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Guidelines Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Info className="text-indigo-600" size={20} />
          <h2 className="text-lg font-extrabold text-slate-900">
            {t("featureGuidelines") || "Feature Guidelines"}
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
                  <IconComponent size={22} />
                </div>
                <h3 className="mt-4 text-sm font-extrabold text-slate-900">
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

      {/* FAQs & Support Form */}
      <div className="grid gap-8 md:grid-cols-5">
        {/* FAQs */}
        <div className="space-y-4 md:col-span-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-indigo-600" size={20} />
            <h2 className="text-lg font-extrabold text-slate-900">
              {t("frequentlyAskedQuestions") || "Frequently Asked Questions"}
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
                    <span className="text-xs font-extrabold text-slate-900">
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

        {/* Support Ticket Form */}
        <div className="space-y-4 md:col-span-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="text-indigo-600" size={20} />
            <h2 className="text-lg font-extrabold text-slate-900">
              {t("submitHelpTicket") || "Submit Help Ticket"}
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 mb-4 leading-relaxed">
              {t("submitHelpTicketDesc") || "Describe your issue or query below. We will fetch your school profile automatically and contact the developers."}
            </p>

            <form onSubmit={handleSubmitSupport} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-600 mb-2">
                  {t("whatHelpNeed") || "What do you need help with?"}
                </label>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={t("describeIssuePlaceholder") || "Describe your issue..."}
                  disabled={submitting}
                  className="min-h-[140px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 resize-y animate-all"
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
                {t("submitSupportRequest") || "Submit Support Request"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Video Guide Walkthrough Dialog Overlay */}
      <AnimatePresence>
        {activeVideoGuide && (
          <div
            role="presentation"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 animate-all"
            onClick={() => setActiveVideoGuide(null)}
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-indigo-750">
                  {activeVideoGuide.title}
                </h3>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded">
                  {activeVideoGuide.duration}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                {activeVideoGuide.description}
              </p>

              {activeVideoGuide.embedId && (
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-inner border border-slate-100">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${activeVideoGuide.embedId}?autoplay=1`}
                    title={activeVideoGuide.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              
              {/* Play Guide steps representation */}
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
                <span className="block text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                  {t("walkthroughGuideSteps") || "Guided Step-by-Step Instructions:"}
                </span>
                <ul className="space-y-2 text-xs font-semibold text-slate-700">
                  {activeVideoGuide.steps.map((step, sIdx) => (
                    <li key={sIdx} className="leading-relaxed">{step}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                {activeVideoGuide.url && (
                  <a
                    href={activeVideoGuide.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-700 hover:bg-red-100 transition active:scale-95"
                  >
                    <FaYoutube size={15} className="text-red-600" />
                    Watch on YouTube
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setActiveVideoGuide(null)}
                  className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95"
                >
                  {t("closeBtn") || "Done & Close"}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
