// features.section.jsx

import features from "./feature.home.jsx";
import FeatureCard from "./feature.card.jsx";

const FeaturesSection = () => {
  return (
    <section
      id="features"
      className="py-16 lg:py-24 bg-gray-50"
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
            Powerful Features
          </p>

          <h2
            className="
              mt-3
              text-2xl lg:text-4xl
              font-bold
              text-gray-900
              leading-tight
            "
          >
            Everything You Need to
            Manage School Fees
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

        {/* GRID */}
        <div
          className="
            mt-12 lg:mt-16
            grid
            grid-cols-2
            lg:grid-cols-4
            gap-4 lg:gap-8
          "
        >
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              {...feature}
            />
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;