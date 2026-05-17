// steps.js

import {
  Users,
  Wallet,
  MessageCircle,
} from "lucide-react";

const steps = [
  {
    id: 1,

    title: "Create Classes & Students",

    description:
      "Add your classes and students in seconds.",

    icon: Users,

    bgColor: "bg-blue-500",
  },

  {
    id: 2,

    title: "Record Fees & Payments",

    description:
      "Record monthly fees and payments easily.",

    icon: Wallet,

    bgColor: "bg-orange-500",
  },

  {
    id: 3,

    title: "Send Reminders",

    description:
      "Send WhatsApp reminders and receipts in one click.",

    icon: MessageCircle,

    bgColor: "bg-green-500",
  },
];

export default steps;