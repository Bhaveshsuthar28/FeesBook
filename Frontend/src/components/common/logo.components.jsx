import { NotebookText } from "lucide-react";

const Logo = () => {
  return (
    <div className="flex items-center">
      <div className="rounded-xl">
        <NotebookText className="text-blue-600 w-8 h-8" />
      </div>

      <div className="leading-tight">
        <h1 className="font-bold text-lg">
          <span className="text-blue-600">Fees</span>
          <span className="text-orange-500">Book</span>
        </h1>
      </div>
    </div>
  );
};

export default Logo;