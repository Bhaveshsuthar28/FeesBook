import {
  LayoutDashboard,
  GraduationCap,
  Users,
  ArrowUpCircle,
  Wallet,
  Settings,
} from "lucide-react";

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
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];