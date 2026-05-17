import testimonials from "./testimonial.js";

import TestimonialCard from "./testimonial.card.jsx";

import { Swiper, SwiperSlide } from "swiper/react";

import {
  Pagination,
  Autoplay,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/pagination";

const TestimonialsSection = () => {
  return (
    <section
      id="testimonials"
      className="
        py-16 lg:py-24
        bg-gray-50
      "
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">

        {/* TOP TEXT */}
        <div className="text-center">

          <p
            className="
              text-blue-600
              font-semibold
              text-sm lg:text-base
            "
          >
            Testimonials
          </p>

          <h2
            className="
              mt-3
              text-2xl lg:text-4xl
              font-bold
              text-gray-900
            "
          >
            Loved by Principals
          </h2>

          <div
            className="
              w-16 h-1
              bg-orange-400
              rounded-full
              mx-auto
              mt-5
            "
          />

        </div>

        {/* SLIDER */}
        <div className="mt-14">

          <Swiper
            modules={[Pagination, Autoplay]}

            centeredSlides={true}

            loop={true}

            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
            }}

            pagination={{
              clickable: true,
            }}

            spaceBetween={24}

            breakpoints={{
              0: {
                slidesPerView: 1.1,
              },

              768: {
                slidesPerView: 1.5,
              },

              1024: {
                slidesPerView: 2.2,
              },
            }}
          >
            {testimonials.map((testimonial) => (
              <SwiperSlide key={testimonial.id}>
                <TestimonialCard {...testimonial} />
              </SwiperSlide>
            ))}
          </Swiper>

        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;