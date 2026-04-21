"use client";

import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Dumbbell, Flame, Weight, History } from "lucide-react";
import { db } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "YYYY-MM-DD" → Date at local noon */
function parseDate(s: string): Date {
  return new Date(s + "T12:00:00");
}

/** Date → "YYYY-MM-DD" local */
function dateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Monday of the ISO week containing d */
function weekStart(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg).toLocaleString()} kg`;
}

function formatDate(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="flex-1 min-w-0 rounded-2xl bg-card border border-border p-4 flex flex-col gap-2">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center", accent ?? "bg-primary/10")}>
        <Icon className={cn("h-4 w-4", accent ? "text-white" : "text-primary")} />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground tabular-nums leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">{sub}</p>}
      </div>
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    </div>
  );
}

function SessionRow({ date, volume, dayName }: { date: string; volume: number | null; dayName: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Dumbbell className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{dayName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(date)}</p>
      </div>
      <div className="shrink-0 text-right">
        {volume !== null && volume > 0 ? (
          <p className="text-sm font-semibold text-foreground tabular-nums">{formatVolume(volume)}</p>
        ) : (
          <p className="text-xs text-muted-foreground">—</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-0.5">volume</p>
      </div>
    </div>
  );
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useStatsData() {
  const today = todayString();

  const allSessions = useLiveQuery(
    () => db.workoutSessions.where("endTime").above(0).toArray(),
    []
  );

  const activePlan = useLiveQuery(async () => {
    const profile = await db.userProfile.get(1);
    if (!profile?.activePlanId) return undefined;
    return db.workoutPlans.get(profile.activePlanId);
  }, []);

  const stats = useMemo(() => {
    if (!allSessions) return null;

    // Only completed sessions (endTime set)
    const completed = allSessions
      .filter((s) => s.endTime !== null)
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

    // ── This week's sessions ──────────────────────────────────────────────────
    const mon = weekStart(new Date());
    const weekSessions = completed.filter(
      (s) => parseDate(s.date).getTime() >= mon.getTime()
    );
    const workoutsThisWeek = weekSessions.length;
    const volumeThisWeek = weekSessions.reduce(
      (sum, s) => sum + (s.totalVolume ?? 0),
      0
    );

    // ── Streak ───────────────────────────────────────────────────────────────
    // A streak day = any day with a completed session that was a planned workout day.
    // Walk backwards from today; break on first missing day.
    const completedDates = new Set(completed.map((s) => s.date));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);

    // Get workout days from active plan (days with type "workout")
    const workoutDows = new Set<number>(
      activePlan?.days
        .filter((d) => d.type === "workout")
        .map((d) => d.dayOfWeek) ?? []
    );

    // Walk back up to 365 days
    for (let i = 0; i < 365; i++) {
      const ds = dateStr(cursor);
      const dow = cursor.getDay();
      const isPlanned = workoutDows.size === 0 || workoutDows.has(dow);

      if (isPlanned) {
        // This was supposed to be a workout day
        if (completedDates.has(ds)) {
          streak++;
        } else if (ds === today) {
          // Today hasn't happened yet — skip without breaking
        } else {
          break; // Missed a planned workout day
        }
      }
      // Rest days don't break the streak
      cursor.setDate(cursor.getDate() - 1);
    }

    // ── Last 5 sessions ───────────────────────────────────────────────────────
    const last5 = completed.slice(0, 5);

    return { workoutsThisWeek, volumeThisWeek, streak, last5 };
  }, [allSessions, activePlan, today]);

  const loading = allSessions === undefined || activePlan === undefined;

  return { stats, loading };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StatsView() {
  const { stats, loading } = useStatsData();

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-6 space-y-4 max-w-lg mx-auto">
        <div className="h-7 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="flex gap-3">
          <div className="flex-1 h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="flex-1 h-28 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 h-28 rounded-2xl bg-muted animate-pulse" />
          <div className="flex-1 h-28 rounded-2xl bg-muted animate-pulse" />
        </div>
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  const { workoutsThisWeek, volumeThisWeek, streak, last5 } = stats!;

  const noData = last5.length === 0;

  return (
    <div className="px-4 pt-6 pb-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stats</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your progress at a glance</p>
      </div>

      {/* Stat cards — 2 × 2 grid */}
      <div className="flex gap-3">
        <StatCard
          icon={Dumbbell}
          label="This week"
          value={String(workoutsThisWeek)}
          sub={workoutsThisWeek === 1 ? "workout" : "workouts"}
        />
        <StatCard
          icon={Flame}
          label="Current streak"
          value={String(streak)}
          sub={streak === 1 ? "day" : "days"}
          accent={streak >= 3 ? "bg-orange-500" : undefined}
        />
      </div>
      <div className="flex gap-3">
        <StatCard
          icon={Weight}
          label="Volume this week"
          value={volumeThisWeek > 0 ? formatVolume(volumeThisWeek) : "—"}
          sub={volumeThisWeek > 0 ? "lifted" : "no data yet"}
        />
        <StatCard
          icon={History}
          label="Total sessions"
          value={String(last5.length >= 5 ? "5+" : last5.length)}
          sub="recorded"
        />
      </div>

      {/* Recent sessions */}
      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">Recent Sessions</span>
          <span className="text-xs text-muted-foreground">Last 5</span>
        </div>

        {noData ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center px-6">
            <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No completed workouts yet.</p>
            <p className="text-xs text-muted-foreground/60">Finish your first session to see it here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {last5.map((s) => (
              <li key={s.id}>
                <SessionRow date={s.date} volume={s.totalVolume} dayName={s.dayName} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
