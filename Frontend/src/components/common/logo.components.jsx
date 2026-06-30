import { FaBook } from "react-icons/fa";

const Logo = ({ size = "default" }) => {
  const sizeClass = size === "small" ? "h-7 w-7" : "h-8 w-8";

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl">
        <FaBook className={`text-blue-600 ${sizeClass}`} />
      </div>
      {size !== "small" && (
        <div className="leading-tight">
          <h1 className="font-bold text-lg">
            <span className="text-blue-600">Fees</span>
            <span className="text-orange-500">Book</span>
          </h1>
        </div>
      )}
    </div>
  );
};

export default Logo;