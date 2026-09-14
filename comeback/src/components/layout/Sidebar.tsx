"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  Dumbbell,
  Target,
  BarChart3,
  Clock,
  CheckSquare,
  Zap,
  BookMarked,
  TrendingUp,
  Settings,
  Flame,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/today", icon: CalendarDays, label: "Today" },
  { href: "/study", icon: BookOpen, label: "Study" },
  { href: "/gate", icon: BookMarked, label: "GATE 2027" },
  { href: "/fitness", icon: Dumbbell, label: "Fitness" },
  { href: "/habits", icon: CheckSquare, label: "Habits" },
  { href: "/goals", icon: Target, label: "Goals" },
  { href: "/deepwork", icon: Zap, label: "Deep Work" },
  { href: "/screentime", icon: Clock, label: "Screen Time" },
  { href: "/review", icon: BookOpen, label: "Daily Review" },
  { href: "/timeline", icon: TrendingUp, label: "My Comeback" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-0 h-screen w-60 bg-[#080808] border-r border-white/5 z-40">
      {/* Logo */}
      <div className="p-5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Flame className="text-indigo-400" size={20} />
          <span className="text-lg font-black tracking-[0.15em] text-white">COMEBACK</span>
        </div>
        <p className="text-[10px] text-white/25 mt-1 uppercase tracking-widest">Personal Command Center</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                active
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/15"
                  : "text-white/40 hover:text-white/80 hover:bg-white/3"
              )}
            >
              <Icon size={16} className={active ? "text-indigo-400" : ""} />
              <span className={cn("font-medium", active ? "text-indigo-300" : "")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/5">
        <p className="text-[10px] text-white/15 text-center uppercase tracking-widest">Consistency &gt; Motivation</p>
      </div>
    </aside>
  );
}
