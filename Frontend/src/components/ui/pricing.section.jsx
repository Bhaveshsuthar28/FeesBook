import { useEffect, useRef, useState } from "react";
import { Check, ShieldCheck, Heart } from "lucide-react";

export default function PricingSection() {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const freeText = "FREE FREE FREE";

  const benefits = [
    "Unlimited Students & Classes",
    "Full WhatsApp Webhook Integrations",
    "Digital Fee Reminders & Status Trackers",
    "Automated Receipt PDF Generation",
    "Real-time Dashboard Analytics",
    "Premium Support & Future Updates",
  ];

  return (
    <section
      id="pricing"
      ref={containerRef}
      className="py-20 lg:py-28 bg-[#fafafa] relative overflow-hidden"
    >
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-100/30 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6">
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[#4F46E5] font-semibold tracking-wider text-sm uppercase px-3 py-1 bg-indigo-50 rounded-full">
            Pricing
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-4 text-slate-900 tracking-tight">
            Simple & Transparent Pricing
          </h2>
          <p className="text-slate-500 mt-4 text-lg">
            FeeGo is built to empower educational institutions. We don't hide features behind paywalls.
          </p>
        </div>

        {/* PRICING CARD GRID */}
        <div className="mt-16 max-w-4xl mx-auto grid md:grid-cols-1 gap-8 justify-center">
          <div className="relative bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-3xl p-8 lg:p-12 shadow-xl shadow-slate-100 flex flex-col md:flex-row gap-8 items-center max-w-3xl w-full mx-auto transition-transform hover:scale-[1.01]">
            
            {/* Banner/Badge for Free */}
            <div className="absolute -top-4 right-8 bg-[#4F46E5] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Lifetime Free
            </div>

            {/* LEFT SIDE: PRICE DISPLAY */}
            <div className="flex-1 text-center md:text-left">
              <span className="text-slate-400 font-bold text-xs uppercase tracking-wider block">
                Standard School Plan
              </span>
              
              {/* LARGE ANIMATED FREE FREE FREE */}
              <div className="mt-4 flex flex-col items-center md:items-start min-h-[90px]">
                <div className="flex flex-wrap justify-center md:justify-start gap-x-2 text-4xl lg:text-6xl font-black tracking-tighter text-[#4F46E5] select-none">
                  {freeText.split(" ").map((word, wIdx) => (
                    <span key={wIdx} className="inline-block whitespace-nowrap">
                      {word.split("").map((char, cIdx) => {
                        const globalIndex = wIdx * 5 + cIdx; // Approximate index for delay mapping
                        return (
                          <span
                            key={cIdx}
                            className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#4F46E5] to-indigo-500 ${
                              isInView ? "animate-letter-reveal" : "opacity-0"
                            }`}
                            style={{
                              animationDelay: `${globalIndex * 0.08}s`,
                            }}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-slate-500 leading-relaxed text-sm lg:text-base">
                FeeGo is 100% free. No credit card required. No hidden billing. Just sign up and digitize your institution.
              </p>

              <div className="mt-6 flex flex-wrap gap-4 items-center justify-center md:justify-start">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-4 h-4" /> No Credit Card Required
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full">
                  <Heart className="w-4 h-4 fill-current" /> Supported by Community
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: LIST OF FEATURES Included */}
            <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-8">
              <h4 className="text-slate-800 font-bold text-sm tracking-wide uppercase">
                What's Included:
              </h4>
              <ul className="mt-4 space-y-3">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-slate-600 text-sm">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
