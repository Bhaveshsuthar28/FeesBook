import Logo from "../common/logo.components.jsx";
import AuthLoginButton from "../common/AuthLoginButton.jsx";
import navLinks from "../common/navlink.components.jsx";

import {
  SignInButton,
} from "@clerk/clerk-react";

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
            <AuthLoginButton />
          </SignInButton>

        </div>
      </nav>
    </header>
  );
};

export default Navbar;
