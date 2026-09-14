import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "COMEBACK — Personal Command Center",
  description: "Track your entire personal comeback journey in one place.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#050505] text-white antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
