"use client";

import { Pause, Play, SkipForward } from "lucide-react";
import { useRestTimer } from "@/context/RestTimerContext";
import { cn } from "@/lib/utils";

// ─── Tiny SVG arc ─────────────────────────────────────────────────────────────

function ArcProgress({
  remaining,
  total,
  urgent,
}: {
  remaining: number;
  total: number;
  urgent: boolean;
}) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const fraction = total > 0 ? Math.min(remaining / total, 1) : 0;
  const offset = circ * (1 - fraction);

  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 40 40"
      className="-rotate-90 shrink-0"
    >
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="hsl(var(--muted))"
        strokeWidth="3.5"
      />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke={urgent ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        className="transition-[stroke-dashoffset] duration-300 ease-linear"
      />
    </svg>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FloatingRestTimer() {
  const { active, paused, remaining, total, pause, resume, stop, addTime } =
    useRestTimer();

  if (!active) return null;

  const urgent = remaining <= 10 && !paused;
  const mm = Math.floor(remaining / 60)
    .toString()
    .padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const label = remaining >= 60 ? `${mm}:${ss}` : String(remaining);

  return (
    <div
      className={cn(
        // Sit above BottomNav (z-50) and session overlay (z-60) so it's always visible
        "fixed z-[65] bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.5rem)]",
        "left-1/2 -translate-x-1/2",
        "flex items-center gap-2 px-3 py-1.5 rounded-2xl",
        "border shadow-xl shadow-black/50 backdrop-blur-md",
        "transition-colors duration-300",
        urgent
          ? "bg-red-950/95 border-red-500/40"
          : "bg-zinc-900/95 border-border"
      )}
    >
      {/* Arc + countdown */}
      <div className="relative flex items-center justify-center">
        <ArcProgress remaining={remaining} total={total} urgent={urgent} />
        <span
          className={cn(
            "absolute text-[11px] font-mono font-bold tabular-nums leading-none",
            urgent ? "text-red-400" : "text-foreground"
          )}
        >
          {label}
        </span>
      </div>

      {/* Label */}
      <span
        className={cn(
          "text-xs font-semibold uppercase tracking-widest",
          urgent ? "text-red-400" : "text-muted-foreground",
          paused && "opacity-50"
        )}
      >
        {paused ? "Paused" : "Rest"}
      </span>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-0.5" />

      {/* +30s */}
      <button
        onClick={() => addTime(30)}
        className="h-8 px-2 rounded-lg text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-white/10 active:bg-white/5 transition-colors tabular-nums"
        aria-label="Add 30 seconds"
      >
        +30s
      </button>

      {/* Pause / Resume */}
      <button
        onClick={paused ? resume : pause}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 active:bg-white/5 transition-colors"
        aria-label={paused ? "Resume rest timer" : "Pause rest timer"}
      >
        {paused ? (
          <Play className="h-3.5 w-3.5" />
        ) : (
          <Pause className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Skip */}
      <button
        onClick={stop}
        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 active:bg-white/5 transition-colors"
        aria-label="Skip rest"
      >
        <SkipForward className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
