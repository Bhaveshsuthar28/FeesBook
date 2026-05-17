import {
  Facebook,
  Instagram,
  Youtube,
  Chrome,
} from "lucide-react";

import Logo from "../common/logo.components.jsx";

import footerLinks from "./footer.js";

import { SignInButton } from "@clerk/clerk-react";

const Footer = () => {
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

              <button
                className="
                  w-9 h-9
                  rounded-full
                  bg-white/10
                  flex items-center justify-center
                  hover:bg-white/20
                  transition
                "
              >
                <Facebook className="w-4 h-4" />
              </button>

              <button
                className="
                  w-9 h-9
                  rounded-full
                  bg-white/10
                  flex items-center justify-center
                  hover:bg-white/20
                  transition
                "
              >
                <Instagram className="w-4 h-4" />
              </button>

              <button
                className="
                  w-9 h-9
                  rounded-full
                  bg-white/10
                  flex items-center justify-center
                  hover:bg-white/20
                  transition
                "
              >
                <Youtube className="w-4 h-4" />
              </button>

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

              {footerLinks.product.map((item) => (
                <li
                  key={item}
                  className="lg:mb-3"
                >
                  <a
                    href="#"
                    className="
                      text-blue-100
                      hover:text-white
                      transition
                      text-sm
                    "
                  >
                    {item}
                  </a>
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

              {footerLinks.company.map((item) => (
                <li
                  key={item}
                  className="lg:mb-3"
                >
                  <a
                    href="#"
                    className="
                      text-blue-100
                      hover:text-white
                      transition
                      text-sm
                    "
                  >
                    {item}
                  </a>
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

              {footerLinks.support.map((item) => (
                <li
                  key={item}
                  className="lg:mb-3"
                >
                  <a
                    href="#"
                    className="
                      text-blue-100
                      hover:text-white
                      transition
                      text-sm
                    "
                  >
                    {item}
                  </a>
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

                <button
                  className="
                    flex items-center gap-2
                    bg-blue-600 hover:bg-blue-700
                    text-white text-sm font-medium
                    px-4 py-2.5
                    rounded-xl
                    transition
                    shadow-sm
                  "
                >
                  <div className="bg-white/20 p-1 rounded-full">
                    <Chrome className="w-4 h-4" />
                  </div>

                  <span>Login with Google</span>
                </button>

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
            © 2025 SchoolFee Manager.
            All rights reserved.
          </p>
        </div>

      </div>

    </footer>
  );
};

export default Footer;