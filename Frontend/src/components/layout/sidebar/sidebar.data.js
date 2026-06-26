import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Wallet,
  Settings,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export const sidebarItems = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
  },

  {
    label: "Classes",
    path: "/classes",
    icon: GraduationCap,
  },

  {
    label: "Students",
    path: "/students",
    icon: Users,
  },

  {
    label: "Fees",
    path: "/fees",
    icon: Wallet,
  },

  {
    label: "Reminders",
    path: "/reminders",
    icon: FaWhatsapp,
  },

  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];