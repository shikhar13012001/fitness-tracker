"use client";

import Link from "next/link";
import { Scale, ChevronRight, Settings, BookOpen, Ruler, Calculator } from "lucide-react";

interface MenuRow {
  href: string;
  icon: React.ElementType;
  label: string;
  sub: string;
  iconBg: string;
  iconColor: string;
}

const sections: { title: string; rows: MenuRow[] }[] = [
  {
    title: "Tracking",
    rows: [
      {
        href: "/more/bodyweight",
        icon: Scale,
        label: "Bodyweight",
        sub: "Log weight · lean bulk tracker",
        iconBg: "bg-blue-500/10",
        iconColor: "text-blue-400",
      },
      {
        href: "/more/measurements",
        icon: Ruler,
        label: "Measurements",
        sub: "Chest, waist, arms, thighs",
        iconBg: "bg-purple-500/10",
        iconColor: "text-purple-400",
      },
      {
        href: "/more/plates",
        icon: Calculator,
        label: "Plate Calculator",
        sub: "Barbell loading made easy",
        iconBg: "bg-orange-500/10",
        iconColor: "text-orange-400",
      },
    ],
  },
  {
    title: "App",
    rows: [
      {
        href: "/more/settings",
        icon: Settings,
        label: "Settings",
        sub: "Profile, units, targets",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      },
      {
        href: "/more/exercises",
        icon: BookOpen,
        label: "Exercise Library",
        sub: "Browse & add custom exercises",
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
      },
    ],
  },
];

export default function MorePage() {
  return (
    <div className="px-4 pt-6 pb-8 space-y-6 max-w-lg mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">More</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tracking, library &amp; settings</p>
      </div>

      {sections.map((section) => (
        <div key={section.title}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            {section.title}
          </p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <ul className="divide-y divide-border">
              {section.rows.map((row) => (
                <li key={row.href}>
                  <Link
                    href={row.href}
                    className="flex items-center gap-3 px-4 py-4 hover:bg-muted/40 active:bg-muted/60 transition-colors"
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${row.iconBg}`}>
                      <row.icon className={`h-5 w-5 ${row.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{row.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{row.sub}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}
