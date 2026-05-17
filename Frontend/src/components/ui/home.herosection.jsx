import {
  ShieldCheck,
  Play,
  Chrome,
} from "lucide-react";
import dashboardPreview from "../../../assest/dashboard.preview.png";

const HeroSection = () => {
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
              bg-blue-50
              text-blue-600
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
            <span className="text-blue-600">
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

          {/* BUTTONS */}
          <div className="mt-8 flex flex-wrap items-center gap-5">

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

            <button
              className="
                flex items-center gap-2
                text-blue-600
                font-semibold
                hover:text-blue-700
                transition
              "
            >
              <div
                className="
                  w-9 h-9
                  rounded-full
                  bg-blue-100
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
              rounded-3xl
              shadow-2xl
              border
            "
          />

        </div>

      </div>
    </section>
  );
};

export default HeroSection;