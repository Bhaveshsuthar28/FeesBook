import Navbar from "../components/layout/navbar.components.jsx";
import Footer from "../components/ui/footer.jsx";
import ContactDrawer from "../components/ui/contact.drawer.jsx";
import HelpCenterDrawer from "../components/ui/helpcenter.drawer.jsx";
import { useAppContext } from "../context/user.context.jsx";
import { AlertCircle, BookOpen } from "lucide-react";

export default function TermsPage() {
  const { contactOpen, setContactOpen, helpOpen, setHelpOpen } = useAppContext();

  const terms = [
    {
      title: "1. Acceptance of Terms",
      text: "By creating an account on FeesBook, you agree to comply with our usage policies and database guidelines. This application is free to use for valid educational institutions."
    },
    {
      title: "2. User Registration & Clerk Authentication",
      text: "We use Clerk for passwordless login authentication. You are responsible for ensuring that only authorized school clerks or principals gain administrative login access."
    },
    {
      title: "3. WhatsApp Notification Guidelines",
      text: "Any WhatsApp messages triggered by our webhook integration are subject to Meta's developer terms. Standard rate limits and usage rules apply. You must not send promotional spam to parent phone numbers."
    },
    {
      title: "4. Disclaimer of Warranties",
      text: "FeesBook is provided 'as is' without warranty of any kind, express or implied. While we strive to ensure 100% database availability via Turso and Upstash, we are not liable for transient network disruptions."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24 max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase px-3 py-1 bg-blue-50 rounded-full">
            Legal Terms
          </span>
          <h1 className="text-3xl lg:text-5xl font-bold mt-4 text-slate-900 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-slate-500 mt-4 text-lg">
            Please read these terms carefully before managing your school records on FeesBook.
          </p>
        </div>

        {/* POLICY GRID */}
        <div className="mt-16 bg-white border border-slate-200 rounded-3xl p-8 lg:p-12 shadow-sm space-y-8">
          
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-slate-900">Standard School Agreement</h3>
          </div>

          <div className="space-y-8">
            {terms.map((term, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-lg font-bold text-slate-850">
                  {term.title}
                </h4>
                <p className="text-slate-650 leading-relaxed text-sm lg:text-base">
                  {term.text}
                </p>
              </div>
            ))}
          </div>

        </div>

        {/* BOTTOM CONFIRMATION */}
        <div className="mt-12 p-8 bg-blue-50/50 border border-blue-100 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <AlertCircle className="w-8 h-8 text-blue-500 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900">Modifications to Service</h4>
            <p className="text-slate-500 text-sm mt-1">
              We reserve the right to improve, modify, or extend Features and WhatsApp Webhook systems to comply with Meta Developer Guidelines.
            </p>
          </div>
        </div>

      </main>

      <Footer />

      <ContactDrawer 
        isOpen={contactOpen} 
        onClose={() => setContactOpen(false)} 
      />
      <HelpCenterDrawer 
        isOpen={helpOpen} 
        onClose={() => setHelpOpen(false)} 
        onOpenContact={() => setContactOpen(true)}
      />
    </div>
  );
}
