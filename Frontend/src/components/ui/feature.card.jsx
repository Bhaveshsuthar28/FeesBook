// feature.card.jsx

const FeatureCard = ({
  title,
  description,
  mobileDescription,
  icon: Icon,
  iconColor,
  bgColor,
}) => {
  return (
    <div
      className="
        bg-white
        rounded-2xl lg:rounded-3xl
        border border-gray-100
        p-4 lg:p-8
        shadow-sm
        transition-all duration-300
      "
    >
      
      {/* ICON */}
      <div
        className={`
          w-10 h-10 lg:w-14 lg:h-14
          rounded-xl lg:rounded-2xl
          flex items-center justify-center
          ${bgColor}
        `}
      >
        <Icon
          className={`
            w-5 h-5 lg:w-7 lg:h-7
            ${iconColor}
          `}
        />
      </div>

      {/* TITLE */}
      <h3
        className="
          mt-3 lg:mt-6
          text-sm lg:text-xl
          font-semibold
          text-gray-900
          leading-snug
        "
      >
        {title}
      </h3>

      {/* MOBILE DESCRIPTION */}
      <p
        className="
          mt-2
          text-xs
          text-gray-600
          leading-5
          lg:hidden
        "
      >
        {mobileDescription}
      </p>

      {/* DESKTOP DESCRIPTION */}
      <p
        className="
          hidden lg:block
          mt-3
          text-gray-600
          leading-7
        "
      >
        {description}
      </p>

    </div>
  );
};

export default FeatureCard;