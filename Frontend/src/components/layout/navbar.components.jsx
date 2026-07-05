import Logo from "../common/logo.components.jsx";
import AuthLoginButton from "../common/AuthLoginButton.jsx";
import navLinks from "../common/navlink.components.jsx";
import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { HelpCircle } from "lucide-react";
import { useAppContext } from "../../context/user.context.jsx";

import {
  SignInButton,
} from "@clerk/clerk-react";

const Navbar = () => {
  const [lastLogin, setLastLogin] = useState(null);
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { language, setLanguage, setHelpOpen } = useAppContext();

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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <Logo />

        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={isHomePage ? link.href : `/${link.href}`}
              className="text-sm font-medium text-gray-700 hover:text-[#4F46E5] transition"
            >
              {link.label}
            </a>
          ))}

          {/* Support link */}
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-[#4F46E5] transition"
          >
            <HelpCircle size={15} />
            Support
          </button>
        </div>

        <div className="flex items-center gap-3">

          {/* Language Toggle Pill */}
          <div className="hidden sm:flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`rounded-full px-2.5 py-1 transition-all duration-200 ${
                language === "en"
                  ? "bg-[#4F46E5] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("hi")}
              className={`rounded-full px-2.5 py-1 transition-all duration-200 ${
                language === "hi"
                  ? "bg-[#4F46E5] text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              हिं
            </button>
          </div>

          {lastLogin ? (
            <SignInButton mode="modal" strategy={lastLogin.method === "Google" ? "oauth_google" : undefined}>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl p-1.5 bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition">
                <img
                  src={lastLogin.avatarUrl}
                  alt={lastLogin.name}
                  className="w-7 h-7 rounded-full object-cover border border-slate-100"
                />
                <span className="text-xs font-semibold text-slate-700 pr-1">
                  Sign in as {lastLogin.name.split(" ")[0]}
                </span>
                {lastLogin.method === "Google" && (
                  <svg className="h-3.5 w-3.5 ml-0.5 shrink-0" viewBox="0 0 24 24">
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
                )}
              </div>
            </SignInButton>
          ) : (
            <SignInButton mode="modal">
              <AuthLoginButton />
            </SignInButton>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
