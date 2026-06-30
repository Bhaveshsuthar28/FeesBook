import { SignInButton } from "@clerk/clerk-react";
import AuthLoginButton from "../common/AuthLoginButton.jsx";
import { Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-10 bg-gray-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 lg:p-12 shadow-xl shadow-blue-100 flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Background decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-2xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl -z-10 pointer-events-none" />

          <div className="space-y-3 text-center md:text-left max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-current" /> Instant Setup
            </span>
            <h3 className="text-2xl lg:text-3.5xl font-extrabold text-white tracking-tight leading-tight">
              Ready to Simplify Fee Management?
            </h3>
            <p className="text-blue-100 text-sm lg:text-base leading-relaxed">
              Digitize your school fee ledger, automate parent reminders, and run billing securely. Get started in less than a minute.
            </p>
          </div>

          <div className="shrink-0">
            <SignInButton mode="modal">
              <AuthLoginButton variant="solid" className="!bg-white !text-blue-600 !border-white hover:!bg-blue-50 hover:!text-blue-700 shadow-lg" />
            </SignInButton>
          </div>

        </div>
      </div>
    </section>
  );
}
