import {
  ShieldCheck,
  Play,
} from "lucide-react";
import {
  SignInButton,
} from "@clerk/clerk-react";
import AuthLoginButton from "../common/AuthLoginButton.jsx";
import dashboardPreview from "../../../assest/dashboard.preview.png";
import { useState, useEffect } from "react";

const HeroSection = () => {
  const [lastLogin, setLastLogin] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("feego_last_login");
    if (saved) {
      try {
        setLastLogin(JSON.parse(saved));
      } catch (e) {
        // Ignore
      }
    }
  }, []);

  return (
    <section className="w-full bg-white">
      <div
        className="
          max-w-7xl mx-auto
          px-6
          py-16 lg:py-24
          grid lg:grid-cols-2
          gap-14
          items-center
        "
      >
        
        {/* LEFT SIDE */}
        <div>

          {/* BADGE */}
          <div
            className="
              inline-flex items-center gap-2
              bg-indigo-50
              text-[#4F46E5]
              px-4 py-2
              rounded-full
              text-sm font-medium
            "
          >
            <ShieldCheck className="w-4 h-4" />

            <span>Trusted by 500+ Schools</span>
          </div>

          {/* HEADING */}
          <h1
            className="
              mt-6
              text-4xl lg:text-6xl
              font-bold
              leading-tight
              text-gray-900
            "
          >
            Smart Fee Management
            <br />

            for{" "}
            <span className="text-[#4F46E5]">
              Modern Schools
            </span>
          </h1>

          {/* DESCRIPTION */}
          <p
            className="
              mt-6
              text-gray-600
              text-lg
              leading-8
              max-w-xl
            "
          >
            Digitalize your school fee records,
            track payments, send WhatsApp
            reminders and manage students
            effortlessly — all in one place.
          </p>

          {/* LAST LOGIN HINT */}
          {lastLogin && (
            <SignInButton mode="modal" strategy={lastLogin.method === "Google" ? "oauth_google" : undefined}>
              <div 
                className="mt-6 flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 cursor-pointer shadow-sm max-w-sm transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={lastLogin.avatarUrl}
                    alt={lastLogin.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-100"
                  />
                  <div className="leading-tight text-left">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">
                      Sign in as {lastLogin.name.split(" ")[0]}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-0.5">
                      {lastLogin.email}
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </p>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  {lastLogin.method === "Google" ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  ) : (
                    <span className="text-[10px] font-bold text-[#4F46E5] bg-indigo-50 px-2 py-1 rounded-md uppercase">
                      Email
                    </span>
                  )}
                </div>
              </div>
            </SignInButton>
          )}

          {/* BUTTONS */}
          <div className="mt-8 flex flex-wrap items-center gap-5">

            <SignInButton mode="modal">
              <AuthLoginButton />
            </SignInButton>

            <button
              className="
                flex items-center gap-2
                text-[#4F46E5]
                font-semibold
                hover:text-indigo-700
                transition
              "
            >
              <div
                className="
                  w-9 h-9
                  rounded-full
                  bg-indigo-100
                  flex items-center justify-center
                "
              >
                <Play className="w-4 h-4 fill-current" />
              </div>

              <span>Watch Demo</span>
            </button>

          </div>

          {/* SMALL TEXT */}
          <div
            className="
              mt-6
              flex items-center gap-2
              text-sm text-gray-500
            "
          >
            <ShieldCheck className="w-4 h-4" />

            <span>
              One click login. No passwords to remember!
            </span>
          </div>

        </div>

        {/* RIGHT SIDE */}
        <div className="relative">

          <img
            src={dashboardPreview}
            alt="Dashboard Preview"
            className="
              w-full
            "
          />

        </div>

      </div>
    </section>
  );
};

export default HeroSection;
