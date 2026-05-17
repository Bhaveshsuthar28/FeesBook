// HowItWorksSection.jsx

import { ArrowRight } from "lucide-react";

import steps from "./steps.js";

import StepCard from "./step.card.jsx";

import { Swiper, SwiperSlide } from "swiper/react";

import {
  Pagination,
  Autoplay,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const HowItWorksSection = () => {
  return (
    <section
      id="how-it-works"
      className="
        py-12 lg:py-16
        bg-[#032055]
      "
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* TOP TEXT */}
        <div className="text-center">

          <h2
            className="
              text-2xl lg:text-4xl
              font-bold
              text-white
            "
          >
            How It Works
          </h2>

          <p
            className="
              mt-3
              text-blue-100
              text-sm lg:text-lg
            "
          >
            Get started in 3 simple steps
          </p>

        </div>

        {/* DESKTOP */}
        <div
          className="
            hidden lg:flex
            items-center justify-between
            mt-12
          "
        >
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="
                flex items-center
                flex-1
              "
            >
              
              <StepCard {...step} />

              {index !== steps.length - 1 && (
                <div
                  className="
                    flex-1
                    flex justify-center
                  "
                >
                  <ArrowRight
                    className="
                      text-blue-200
                      w-8 h-8
                    "
                  />
                </div>
              )}

            </div>
          ))}
        </div>

        {/* MOBILE SLIDER */}
        <div className="lg:hidden mt-10">

          <Swiper
            modules={[Pagination, Autoplay]}

            centeredSlides={true}

            loop={true}

            autoplay={{
              delay: 2500,
              disableOnInteraction: false,
            }}

            pagination={{
              clickable: true,
            }}

            spaceBetween={16}

            slidesPerView={1.1}
          >
            {steps.map((step) => (
              <SwiperSlide key={step.id}>

                <div
                  className="
                    bg-white
                    rounded-3xl
                    p-5
                    min-h-[220px]
                  "
                >
                  
                  <div
                    className={`
                      w-14 h-14
                      rounded-2xl
                      flex items-center justify-center
                      ${step.bgColor}
                    `}
                  >
                    <step.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3
                    className="
                      mt-5
                      text-xl
                      font-semibold
                      text-gray-900
                    "
                  >
                    {step.title}
                  </h3>

                  <p
                    className="
                      mt-3
                      text-gray-600
                      leading-6
                      text-sm
                    "
                  >
                    {step.description}
                  </p>

                </div>

              </SwiperSlide>
            ))}
          </Swiper>

        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;