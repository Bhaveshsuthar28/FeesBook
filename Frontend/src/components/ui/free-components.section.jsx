import { Zap, ShieldCheck, Heart, Sparkles, Languages, Check } from "lucide-react";
import { useAppContext } from "../../context/user.context.jsx";

const FreeComponentsSection = () => {
  const { t } = useAppContext();

  const freeItems = [
    {
      title: t("freeItem1Title") || "Unlimited Classrooms",
      description: t("freeItem1Desc") || "Create and organize as many classes and section mappings as your school needs.",
      icon: Sparkles
    },
    {
      title: t("freeItem2Title") || "Automatic WhatsApp Alerts",
      description: t("freeItem2Desc") || "Schedule and broadcast automated fee reminders directly to parent contacts.",
      icon: Zap
    },
    {
      title: t("freeItem3Title") || "Official Stamp & Signature",
      description: t("freeItem3Desc") || "Upload custom signature and school stamp images to apply onto receipts.",
      icon: ShieldCheck
    },
    {
      title: t("freeItem4Title") || "Principal Query Bot",
      description: t("freeItem4Desc") || "Access and search school records remotely via WhatsApp commands.",
      icon: Heart
    },
    {
      title: t("freeItem5Title") || "Dual-Language Support",
      description: t("freeItem5Desc") || "Instantly switch the entire dashboard and receipts between English and Hindi.",
      icon: Languages
    }
  ];

  return (
    <section className="py-16 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Header Block */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-[#4F46E5]">
            <Check size={12} />
            {t("freeBadge") || "100% Free & Open Source"}
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-[#111827] tracking-tight">
            {t("freeComponentsTitle") || "Fully Featured, No Paid Paywalls"}
          </h2>
          <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">
            {t("freeComponentsSubtitle") || "FeeGo provides all premium institution-management components completely free of charge."}
          </p>
        </div>

        {/* Grid Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {freeItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] transition-all duration-300 hover:shadow-[0_4px_16px_-3px_rgba(79,70,229,0.12)] hover:border-[#4F46E5] active:scale-[0.98]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-[#4F46E5] group-hover:bg-[#4F46E5] group-hover:text-white transition-colors duration-300">
                  <Icon size={20} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-[#111827]">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-[#6B7280] leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default FreeComponentsSection;
