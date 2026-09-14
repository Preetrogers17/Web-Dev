"use client";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface CardProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-[#0f0f0f] border border-white/5 rounded-xl p-4",
        onClick && "cursor-pointer hover:border-white/10 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn("text-xs font-semibold text-white/40 uppercase tracking-widest mb-3", className)}>{children}</h3>;
}
