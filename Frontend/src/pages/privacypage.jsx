import Navbar from "../components/layout/navbar.components.jsx";
import Footer from "../components/ui/footer.jsx";
import ContactDrawer from "../components/ui/contact.drawer.jsx";
import HelpCenterDrawer from "../components/ui/helpcenter.drawer.jsx";
import { useAppContext } from "../context/user.context.jsx";
import { Shield, Eye, Lock, FileText, CheckCircle } from "lucide-react";

export default function PrivacyPage() {
  const { contactOpen, setContactOpen, helpOpen, setHelpOpen } = useAppContext();

  const sections = [
    {
      icon: <Shield className="w-6 h-6 text-blue-500" />,
      title: "Data Protection & Privacy First",
      text: "At FeeGo, we prioritize student and parent data protection. We implement industry-standard database encryption and secure JWT access tokens. We do not store plain-text passwords or credentials.",
    },
    {
      icon: <Eye className="w-6 h-6 text-blue-500" />,
      title: "No Selling of Data",
      text: "We guarantee that school, student, and parent records are never sold, rented, or shared with third-party advertisers. All collected data is exclusively used to facilitate school fee management and WhatsApp reminders.",
    },
    {
      icon: <Lock className="w-6 h-6 text-blue-500" />,
      title: "Secure Session Controls",
      text: "WhatsApp Bot queries utilize secure temporary Redis sessions with a strict 10-minute time-to-live (TTL) expiration. If a parent is inactive, their query session is destroyed immediately, preventing unauthorized secondary requests.",
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      title: "Metadata & Webhooks",
      text: "We process Meta WhatsApp webhook payloads securely. Incoming phone numbers and messages are processed asynchronously through clean background workers, and dry-runs do not execute active WhatsApp billing charges.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-880 flex flex-col font-sans">
      <Navbar />

      <main className="flex-1 py-16 lg:py-24 max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-blue-600 font-semibold tracking-wider text-sm uppercase px-3 py-1 bg-blue-50 rounded-full">
            Security & Trust
          </span>
          <h1 className="text-3xl lg:text-5xl font-bold mt-4 text-slate-900 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-500 mt-4 text-lg">
            We value your trust. Learn how we secure your school records and ensure total privacy.
          </p>
        </div>

        {/* POLICY GRID */}
        <div className="mt-16 space-y-8">
          {sections.map((section, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 flex gap-6 items-start shadow-sm"
            >
              <div className="p-3 bg-blue-50 rounded-2xl shrink-0">
                {section.icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-slate-900">
                  {section.title}
                </h3>
                <p className="text-slate-600 leading-relaxed text-sm lg:text-base">
                  {section.text}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* BOTTOM CONFIRMATION */}
        <div className="mt-12 p-8 bg-emerald-50/50 border border-emerald-100 rounded-3xl flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <CheckCircle className="w-8 h-8 text-emerald-500 shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900">GDPR & Data Safety Compliant</h4>
            <p className="text-slate-500 text-sm mt-1">
              Your data is stored in secure regional databases with strict read/write access policies configured at both Drizzle ORM and Turso database layers.
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
