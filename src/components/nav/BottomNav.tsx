"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, CalendarDays, BarChart2, History, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/today", label: "Today", icon: Dumbbell },
  { href: "/plans", label: "Plans", icon: CalendarDays },
  { href: "/stats", label: "Stats", icon: BarChart2 },
  { href: "/history", label: "History", icon: History },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-around px-2 max-w-lg mx-auto">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className={cn("font-medium", active && "font-semibold")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
