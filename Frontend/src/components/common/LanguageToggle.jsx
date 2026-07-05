import React from "react";
import { useAppContext } from "../../context/user.context.jsx";

export default function LanguageToggle() {
  const { language, setLanguage } = useAppContext();

  return (
    <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200 shadow-inner">
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
          language === "en"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage("hi")}
        className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
          language === "hi"
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
            : "text-slate-500 hover:text-slate-800"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
