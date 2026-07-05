import { X, ChevronRight, BookOpen, Send, CheckCircle2, MessageSquare, Mail } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function HelpCenterDrawer({ isOpen, onClose }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [ticketEmail, setTicketEmail] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const topics = [
    {
      id: "whatsapp",
      title: "Setting up WhatsApp Reminders",
      question: "How do I configure WhatsApp reminders?",
      answer: "To set up WhatsApp reminders, go to Settings > WhatsApp Config. Save your Meta Phone Number ID and Access Token. Parents can then check fee details by messaging your bot phone number.",
    },
    {
      id: "students",
      title: "Importing Student Lists",
      question: "How do I import student records?",
      answer: "You can import students by downloading the sample Excel template in the Students tab, pasting your records, and uploading it as a CSV. You can also add students manually one-by-one.",
    },
    {
      id: "fees",
      title: "Tracking School Fees",
      question: "How do I track paid and pending fees?",
      answer: "In the Fees tab, click 'Record Payment' to enter manual cash/cheque payments. FeeGo automatically calculates pending balances and updates status dashboards.",
    },
  ];

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (!ticketEmail || !ticketMessage) return;

    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1";
      const endpoint = baseUrl.replace("/api/v1", "/api/whatsapp/webhook/contact-email");
      
      const fullMessage = selectedTopic 
        ? `Topic: ${selectedTopic.title}\n\nQuery:\n${ticketMessage}`
        : `Custom Help Query:\n${ticketMessage}`;

      await axios.post(endpoint, {
        email: ticketEmail,
        message: fullMessage,
        type: "help",
      });

      toast.success("Help support ticket submitted successfully!");
      setTicketSubmitted(true);
      setTimeout(() => {
        setTicketEmail("");
        setTicketMessage("");
        setTicketSubmitted(false);
        setSelectedTopic(null);
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Failed to submit ticket:", err);
      toast.error("Failed to submit ticket. Please check your internet connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
  };

  return (
    <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
      {/* BACKDROP */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* DRAWER CONTAINER */}
      <div 
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Conversational Help</h3>
            <p className="text-slate-500 text-xs mt-0.5">Let's solve your query together</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6">
          {selectedTopic ? (
            /* TOPIC DETAILS & CONVERSATIONAL FORM */
            <div className="space-y-6">
              <button 
                onClick={handleBack}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 focus:outline-none"
              >
                ← Back to Help Topics
              </button>

              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 space-y-3">
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500" />
                  {selectedTopic.question}
                </h4>
                <p className="text-slate-600 text-sm leading-relaxed">
                  {selectedTopic.answer}
                </p>
              </div>

              {/* TICKET FORM */}
              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h5 className="font-bold text-slate-800 text-sm">Did this not solve your problem?</h5>
                
                {ticketSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-800">Support Ticket Created!</p>
                    <p className="text-[11px] text-emerald-655 mt-1">We will contact you back shortly.</p>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. principal@school.com"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-xl px-4 py-2.5 text-slate-800 text-sm outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Send a message about {selectedTopic.title}
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write additional details about what you need help with..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none transition resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? "Submitting..." : "Submit Help Ticket"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            /* CONVERSATIONAL TOPIC SELECTION */
            <div className="space-y-8">
              <div className="bg-blue-50 rounded-2xl p-4 text-center border border-blue-100">
                <p className="text-slate-800 font-extrabold text-lg">
                  👋 Hello! What can I help you with today?
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  Select a common topic below or submit a direct ticket.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Popular Support Guide categories
                </h4>
                
                <div className="space-y-2">
                  {topics.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTopic(t)}
                      className="w-full bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 rounded-xl p-4 flex items-center justify-between text-left group transition focus:outline-none"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition">
                          {t.title}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {t.question}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform duration-200 group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </div>

              {/* DIRECT SUPPORT TICKET */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Create a custom help ticket
                </h4>
                {ticketSubmitted ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-emerald-800">Support Ticket Created!</p>
                  </div>
                ) : (
                  <form onSubmit={handleTicketSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        Your Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. principal@school.com"
                        value={ticketEmail}
                        onChange={(e) => setTicketEmail(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-xl px-4 py-2.5 text-slate-800 text-sm outline-none transition"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        Describe your query
                      </label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write your custom issue here..."
                        value={ticketMessage}
                        onChange={(e) => setTicketMessage(e.target.value)}
                        className="w-full border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none transition resize-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <Send className="w-4 h-4" />
                      {loading ? "Submitting..." : "Submit Custom Ticket"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
