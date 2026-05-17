import {
  Quote,
  Star,
} from "lucide-react";

const TestimonialCard = ({
  name,
  role,
  image,
  review,
  rating,
}) => {
  return (
    <div
      className="
        bg-white
        rounded-3xl
        border border-gray-100
        shadow-sm

        p-6 lg:p-8

        h-full
      "
    >
      
      {/* TOP */}
      <div className="flex items-center justify-between">

        <div
          className="
            w-12 h-12
            rounded-2xl
            bg-blue-50
            flex items-center justify-center
          "
        >
          <Quote className="w-6 h-6 text-blue-600" />
        </div>

        <div className="flex items-center gap-1">
          {Array.from({ length: rating }).map((_, index) => (
            <Star
              key={index}
              className="
                w-4 h-4
                text-yellow-400
                fill-yellow-400
              "
            />
          ))}
        </div>

      </div>

      {/* REVIEW */}
      <p
        className="
          mt-6
          text-gray-700
          leading-7
          text-sm lg:text-base
        "
      >
        {review}
      </p>

      {/* PROFILE */}
      <div
        className="
          mt-8
          flex items-center gap-4
        "
      >
        
        <img
          src={image}
          alt={name}
          className="
            w-14 h-14
            rounded-full
            object-cover
          "
        />

        <div>

          <h4
            className="
              text-base lg:text-lg
              font-semibold
              text-gray-900
            "
          >
            {name}
          </h4>

          <p
            className="
              text-sm
              text-gray-500
            "
          >
            {role}
          </p>

        </div>

      </div>

    </div>
  );
};

export default TestimonialCard;