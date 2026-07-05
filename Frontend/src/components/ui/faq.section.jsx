import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      q: "Is it really free? Are there any hidden charges?",
      a: "Yes, FeeGo is 100% free! You don't need to enter any credit card info. There are no limits on how many classes, students, or reminders you can manage.",
    },
    {
      q: "Why is it free? What is the catch?",
      a: "No catch! We built FeeGo as an open-source community project to help local schools move away from paper records and expensive software. We run on donations and voluntary contributions.",
    },
    {
      q: "Can parents check details on WhatsApp without installing any app?",
      a: "Exactly! Parents don't need to download anything. They just send a WhatsApp message to your school's WhatsApp bot number, and they instantly get their child's fee details on their regular WhatsApp app.",
    },
    {
      q: "Is our school's student data safe?",
      a: "Absolutely. Your data is stored securely and encrypted. We do not sell or share student or parent records with any third-party marketing companies.",
    },
    {
      q: "What if I get stuck or need help setting up our school?",
      a: "Don't worry! You can use our built-in Help Center or send a message directly from the 'Contact Us' box on our homepage. We will guide you step-by-step to upload your student list.",
    },
    {
      q: "Do I need technical skills to use this?",
      a: "Not at all! If you can use a smartphone, you can use FeeGo. We have designed a clean, easy-to-use clerk dashboard that handles everything with simple clicks.",
    },
  ];

  const toggle = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="pt-8 pb-20 lg:pt-12 lg:pb-28 bg-white relative"
    >
      <div className="max-w-4xl mx-auto px-6">
        
        {/* HEADER */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-[#4F46E5] font-semibold tracking-wider text-sm uppercase px-3 py-1 bg-indigo-50 rounded-full">
            Common Questions
          </span>
          <h2 className="text-3xl lg:text-5xl font-bold mt-4 text-slate-900 tracking-tight">
            Got Questions? We've Got Answers!
          </h2>
          <p className="text-slate-500 mt-4 text-lg">
            Here are simple answers to things you might be wondering about.
          </p>
        </div>

        {/* FAQ ACCORDION */}
        <div className="mt-16 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`border rounded-2xl transition-all duration-200 ${
                  isOpen
                    ? "border-indigo-200 bg-indigo-50/20 shadow-md shadow-indigo-50/50"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 font-semibold text-slate-800 lg:text-lg focus:outline-none"
                >
                  <span className="flex items-center gap-3">
                    <HelpCircle className={`w-5 h-5 shrink-0 ${isOpen ? "text-[#4F46E5]" : "text-slate-400"}`} />
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? "rotate-180 text-[#4F46E5]" : ""
                    }`}
                  />
                </button>

                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-[500px]" : "max-h-0"
                  }`}
                >
                  <p className="px-6 pb-6 text-slate-600 leading-relaxed text-sm lg:text-base border-t border-slate-100/50 pt-4">
                    {faq.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
