import { X, Chrome } from "lucide-react";
import { FaBook } from "react-icons/fa";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";

export default function CustomLoginModal({ isOpen, onClose, lastLogin }) {
  if (!isOpen || !lastLogin) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      {/* Modal Card */}
      <div className="relative w-full max-w-[400px] rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mt-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 mb-3">
            <FaBook className="h-6 w-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Sign in to FeeGo</h2>
          <p className="text-sm text-slate-500 mt-1.5">Welcome back! Please sign in to continue</p>
        </div>

        {/* Content */}
        <div className="mt-8 space-y-4">
          {/* Primary One-Tap Login Selector */}
          <SignInButton mode="modal" strategy={lastLogin.method === "Google" ? "oauth_google" : undefined}>
            <div 
              onClick={onClose}
              className="flex items-center justify-between border border-slate-200 rounded-xl p-3 bg-white hover:bg-slate-50 cursor-pointer shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <img
                  src={lastLogin.avatarUrl}
                  alt={lastLogin.name}
                  className="w-9 h-9 rounded-full object-cover border border-slate-100"
                />
                <div className="leading-tight text-left">
                  <p className="text-sm font-semibold text-slate-800">
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
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">
                    Email
                  </span>
                )}
              </div>
            </div>
          </SignInButton>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="h-px bg-slate-100 flex-1"></div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Or continue with</span>
            <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          {/* Fallback Standard Sign In */}
          <SignInButton mode="modal">
            <button 
              onClick={onClose}
              className="w-full flex items-center justify-center gap-2.5 border border-slate-200 rounded-xl py-2.5 px-4 font-bold text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              <Chrome className="h-4 w-4 text-blue-600" />
              <span>Use another account</span>
            </button>
          </SignInButton>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{" "}
            <SignUpButton mode="modal">
              <span onClick={onClose} className="font-semibold text-blue-600 hover:text-blue-700 cursor-pointer">
                Sign up
              </span>
            </SignUpButton>
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] text-slate-400 font-medium">
            <span>Secured by</span>
            <svg className="w-12 h-auto text-slate-400" viewBox="0 0 54 16" fill="currentColor">
              <path d="M5.5 12h-2c-.3 0-.5-.2-.5-.5v-7c0-.3.2-.5.5-.5h2c1.7 0 3 1.1 3 2.7v1.6c0 1.6-1.3 2.7-3 2.7zm.5-5.2c0-.5-.4-.8-1-.8h-1v3.5h1c.6 0 1-.3 1-.8v-1.9zM15 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM23.5 12h-1c-.3 0-.5-.2-.5-.5v-7c0-.3.2-.5.5-.5h1c.3 0 .5.2.5.5v7c0 .3-.2.5-.5.5zM31 12c-2.2 0-4-1.8-4-4s1.8-4 4-4c1.8 0 3.2 1.2 3.8 2.8.1.3 0 .5-.2.6l-.9.4c-.2.1-.5 0-.6-.2-.4-.9-1.2-1.6-2.1-1.6-1.1 0-2 .9-2 2s.9 2 2 2c.9 0 1.7-.7 2.1-1.6.1-.2.4-.3.6-.2l.9.4c.2.1.3.3.2.6-.6 1.6-2 2.8-3.8 2.8zM42.5 12c-1.5 0-2.5-1-2.9-2.2l-2.4 2c-.2.2-.5.1-.6-.1l-.6-.8c-.2-.2-.1-.5.1-.6l2.3-1.9c-.8-.9-1.4-2.1-1.4-3.4 0-2.2 1.8-4 4-4s4 1.8 4 4c0 3-2.5 5.5-5.5 5.5zm0-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM52.5 12h-1c-.3 0-.5-.2-.5-.5v-7c0-.3.2-.5.5-.5h1c.3 0 .5.2.5.5v7c0 .3-.2.5-.5.5z" />
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}
