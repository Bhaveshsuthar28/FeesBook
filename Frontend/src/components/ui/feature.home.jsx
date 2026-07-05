// feature.home.jsx

import {
  Receipt,
  MessageCircle,
  FileText,
  BarChart3,
  Users,
  GraduationCap,
  Shield,
  Cloud,
} from "lucide-react";

const features = [
  {
    title: "Track Fees Easily",

    description:
      "Record full or partial payments and track balance in real-time.",

    mobileDescription:
      "Track payments easily.",

    icon: Receipt,
    iconColor: "text-[#4F46E5]",
    bgColor: "bg-indigo-50",
  },

  {
    title: "WhatsApp Reminders",

    description:
      "Send fee reminders and receipts to parents in one click.",

    mobileDescription:
      "Send reminders fast.",

    icon: MessageCircle,
    iconColor: "text-[#4F46E5]",
    bgColor: "bg-indigo-50",
  },

  {
    title: "Auto Receipts",

    description:
      "Generate professional fee receipts and share instantly.",

    mobileDescription:
      "Generate receipts.",

    icon: FileText,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
  },

  {
    title: "Reports & Exports",

    description:
      "Get detailed reports and export data to Excel anytime.",

    mobileDescription:
      "Export reports anytime.",

    icon: BarChart3,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50",
  },

  {
    title: "Promote Students",

    description:
      "Promote all students to next class in one click at year end.",

    mobileDescription:
      "Promote students fast.",

    icon: Users,
    iconColor: "text-[#4F46E5]",
    bgColor: "bg-indigo-50",
  },

  {
    title: "Alumni Management",

    description:
      "Final class students move to alumni automatically.",

    mobileDescription:
      "Manage alumni easily.",

    icon: GraduationCap,
    iconColor: "text-[#4F46E5]",
    bgColor: "bg-indigo-50",
  },

  {
    title: "Secure & Private",

    description:
      "Your data is 100% secure and accessible only to you.",

    mobileDescription:
      "100% secure data.",

    icon: Shield,
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
  },

  {
    title: "Cloud Based",

    description:
      "Access your data from anywhere, anytime.",

    mobileDescription:
      "Access anywhere.",

    icon: Cloud,
    iconColor: "text-violet-600",
    bgColor: "bg-violet-50",
  },
];

export default features;