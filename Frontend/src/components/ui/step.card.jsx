// StepCard.jsx

const StepCard = ({
  title,
  description,
  icon: Icon,
  bgColor,
}) => {
  return (
    <div
      className="
        flex flex-col items-center
        text-center
      "
    >
      
      {/* ICON */}
      <div
        className={`
          w-16 h-16
          rounded-full
          flex items-center justify-center
          shadow-lg
          ${bgColor}
        `}
      >
        <Icon className="w-8 h-8 text-white" />
      </div>

      {/* TITLE */}
      <h3
        className="
          mt-4
          text-lg lg:text-xl
          font-semibold
          text-white
        "
      >
        {title}
      </h3>

      {/* DESCRIPTION */}
      <p
        className="
          mt-2
          text-sm lg:text-base
          text-blue-100
          leading-6
          max-w-xs
        "
      >
        {description}
      </p>

    </div>
  );
};

export default StepCard;