// src/pages/profilepage.jsx

import { UserProfile } from "@clerk/clerk-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full space-y-6 pb-24 lg:pb-0">
      <div className="flex items-center gap-2 text-sm font-bold text-slate-500 px-1">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={17} />
          Go Back
        </button>
      </div>

      <div className="w-full">
        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full max-w-none !shadow-none !border-none !rounded-none !bg-transparent",
              cardBox: "w-full max-w-none !shadow-none !border-none !rounded-none !bg-transparent",
              card: "w-full max-w-none !shadow-none border border-slate-200 rounded-2xl bg-white",
              navbar: "border-r border-slate-200 bg-slate-50/50 w-[220px] shrink-0",
              contentBox: "w-full max-w-none flex-1",
              pageScrollBox: "w-full max-w-none p-6 md:p-10",
            },
          }}
        />
      </div>
    </div>
  );
}
