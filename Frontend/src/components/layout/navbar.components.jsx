import Logo from "../common/logo.components.jsx";
import navLinks from "../common/navlink.components.jsx";
import {Chrome} from "lucide-react"

import {
  SignInButton,
} from "@clerk/clerk-react";

import {
  Moon,
} from "lucide-react";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        
        <Logo />

        <div className="hidden lg:flex items-center gap-10">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="flex items-center">

          <SignInButton mode="modal">
            <button
                className="
                flex items-center
                text-blue-600 text-sm font-medium
                px-2 py-1
                rounded-xl border-2 border-blue-600
                shadow-sm
                "
            >
                <div className="bg-white/15 p-1 rounded-full">
                <Chrome className="w-4 h-4" />
                </div>

                <span>Login with Google</span>
            </button>
          </SignInButton>

        </div>
      </nav>
    </header>
  );
};

export default Navbar;