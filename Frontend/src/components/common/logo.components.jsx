import { NotebookText } from "lucide-react";

const Logo = ({ size = "default" }) => {
  const sizeClass = size === "small" ? "h-8 w-8" : "h-9 w-9";

  return (
    <div className="flex items-center gap-2">
      <div className="rounded-xl">
        <NotebookText className={`text-blue-600 ${sizeClass}`} />
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