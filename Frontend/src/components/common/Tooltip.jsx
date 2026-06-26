import React from 'react';

export default function Tooltip({ children, content }) {
  if (!content) return children;

  return (
    <div className="relative group inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 z-50 mb-2.5 pointer-events-none whitespace-nowrap rounded-xl border border-slate-200/80 bg-white/95 backdrop-blur-md px-3 py-1.5 text-xs font-bold text-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-200 ease-out transform -translate-x-1/2 translate-y-1.5 scale-95 opacity-0 group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <span className="relative z-10">{content}</span>
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[5px] border-[5px] border-transparent border-t-slate-200/80">
          <div className="absolute -top-[6px] -left-[4px] border-4 border-transparent border-t-white/95"></div>
        </div>
      </div>
    </div>
  );
}

