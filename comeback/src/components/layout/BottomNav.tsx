"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Dumbbell,
  BarChart3,
} from "lucide-react";

const mobileNav = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/today", icon: CalendarDays, label: "Today" },
  { href: "/study", icon: BookOpen, label: "Study" },
  { href: "/fitness", icon: Dumbbell, label: "Fitness" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#080808] border-t border-white/5 z-40 safe-area-bottom">
      <div className="flex items-center justify-around py-2">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-all",
                active ? "text-indigo-400" : "text-white/30"
              )}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
