import { X, Send, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ContactDrawer({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) return;
    
    setLoading(true);
    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000/api/v1";
      const endpoint = baseUrl.replace("/api/v1", "/api/whatsapp/webhook/contact-email");
      
      await axios.post(endpoint, {
        email,
        message,
        type: "contact",
      });

      toast.success("Support request sent successfully!");
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setMessage("");
        setSubmitted(false);
        onClose();
      }, 2500);
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send support request. Please try again.");
    } finally {
      setLoading(false);
    }
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
            <h3 className="text-xl font-bold text-slate-900">Contact Support</h3>
            <p className="text-slate-500 text-xs mt-0.5">We respond in under 2 hours</p>
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
          {submitted ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Message Sent!</h4>
              <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
                Thank you for reaching out. Bhavesh has been notified. We will email you back shortly!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  Your Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. principal@school.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none transition"
                />
              </div>

              <div className="space-y-2">
                <label className="text-slate-700 font-semibold text-sm flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  How can we help?
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Describe your issue or query here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-slate-200 focus:border-blue-500 focus:ring focus:ring-blue-100 rounded-xl px-4 py-3 text-slate-800 text-sm outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:shadow-xl transition-all duration-200"
              >
                <Send className="w-4 h-4" />
                {loading ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
