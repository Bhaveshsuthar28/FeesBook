import { FaInstagram, FaLinkedinIn, FaGithub } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import Logo from "../common/logo.components.jsx";
import AuthLoginButton from "../common/AuthLoginButton.jsx";
import footerLinks from "./footer.js";
import { SignInButton } from "@clerk/clerk-react";
import { useAppContext } from "../../context/user.context.jsx";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { setContactOpen, setHelpOpen } = useAppContext();
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  const renderLink = (item) => {
    if (item.action) {
      return (
        <button
          onClick={(e) => {
            e.preventDefault();
            if (item.action === "contact") setContactOpen(true);
            if (item.action === "help") setHelpOpen(true);
          }}
          className="text-blue-100 hover:text-white transition text-sm text-left font-normal"
        >
          {item.label}
        </button>
      );
    }

    if (item.href.startsWith("#")) {
      return (
        <a
          href={isHomePage ? item.href : `/${item.href}`}
          className="text-blue-100 hover:text-white transition text-sm"
        >
          {item.label}
        </a>
      );
    }

    return (
      <Link
        to={item.href}
        className="text-blue-100 hover:text-white transition text-sm"
      >
        {item.label}
      </Link>
    );
  };

  return (
    <footer className="bg-[#032055] text-white">
      <div
        className="
          max-w-7xl mx-auto
          px-4 lg:px-6
          py-8 lg:py-16
        "
      >
        {/* GRID */}
        <div
          className="
            grid
            gap-8 lg:gap-10
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-5
          "
        >
          {/* BRAND */}
          <div>
            <Logo />
            <p
              className="
                mt-3
                text-blue-100
                leading-6
                text-sm
              "
            >
              The smart way to manage
              school fees, students,
              and payments.
            </p>

            {/* SOCIALS */}
            <div
              className="
                hidden sm:flex
                items-center gap-3
                mt-5
              "
            >
              <a
                href="https://github.com/Bhaveshsuthar28"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-9 h-9
                  rounded-full
                  bg-white/10
                  flex items-center justify-center
                  hover:bg-white/20
                  transition
                "
              >
                <FaGithub className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/bhaveshjangid"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-9 h-9
                  rounded-full
                  bg-white/10
                  flex items-center justify-center
                  hover:bg-white/20
                  transition
                "
              >
                <FaLinkedinIn className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/bhavesh.s.k.28?igsh=d2JjOWdyejV6Nnpq"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  w-9 h-9
                  rounded-full
                  bg-white/10
                  flex items-center justify-center
                  hover:bg-white/20
                  transition
                "
              >
                <FaInstagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* PRODUCT */}
          <div>
            <h3
              className="
                text-base lg:text-lg
                font-semibold
              "
            >
              Product
            </h3>
            <ul
              className="
                mt-3
                flex flex-wrap gap-3
                lg:block
              "
            >
              {footerLinks.product.map((item, idx) => (
                <li key={idx} className="lg:mb-3 w-full">
                  {renderLink(item)}
                </li>
              ))}
            </ul>
          </div>

          {/* COMPANY */}
          <div>
            <h3
              className="
                text-base lg:text-lg
                font-semibold
              "
            >
              Company
            </h3>
            <ul
              className="
                mt-3
                flex flex-wrap gap-3
                lg:block
              "
            >
              {footerLinks.company.map((item, idx) => (
                <li key={idx} className="lg:mb-3 w-full">
                  {renderLink(item)}
                </li>
              ))}
            </ul>
          </div>

          {/* SUPPORT */}
          <div>
            <h3
              className="
                text-base lg:text-lg
                font-semibold
              "
            >
              Support
            </h3>
            <ul
              className="
                mt-3
                flex flex-wrap gap-3
                lg:block
              "
            >
              {footerLinks.support.map((item, idx) => (
                <li key={idx} className="lg:mb-3 w-full">
                  {renderLink(item)}
                </li>
              ))}
            </ul>
          </div>

          {/* CTA */}
          <div>
            <h3
              className="
                text-base lg:text-lg
                font-semibold
              "
            >
              Get Started
            </h3>
            <div className="mt-3">
              <SignInButton mode="modal">
                <AuthLoginButton variant="solid" />
              </SignInButton>
            </div>
            <p
              className="
                mt-2
                text-blue-100
                text-sm
                leading-6
              "
            >
              One click login.
              No passwords to remember.
            </p>
          </div>
        </div>

        {/* BOTTOM */}
        <div
          className="
            mt-8 lg:mt-12
            pt-5
            border-t border-white/10
            text-center
          "
        >
          <p
            className="
              text-xs lg:text-sm
              text-blue-100
            "
          >
            © {currentYear} SchoolFee Manager. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
