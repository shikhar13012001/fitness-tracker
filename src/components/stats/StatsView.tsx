"use client";

import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Dumbbell, Flame, Weight, History, ChevronDown } from "lucide-react";
import { db } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { PRLog } from "@/lib/db";
import { ProgressionLineChart } from "@/components/charts/ProgressionLineChart";
import type { ProgressionPoint } from "@/components/charts/ProgressionLineChart";
import { VolumeBarChart } from "@/components/charts/VolumeBarChart";
import type { VolumeWeek } from "@/components/charts/VolumeBarChart";
import { MuscleGroupPieChart } from "@/components/charts/MuscleGroupPieChart";
import type { MuscleSlice } from "@/components/charts/MuscleGroupPieChart";

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
  const day = d.getDay();
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

function formatDate(ds: string): string {
  return parseDate(ds).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** Short label for chart x-axis: "Jan 3" */
function shortDate(ds: string): string {
  return parseDate(ds).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Muscle-group bucketing ───────────────────────────────────────────────────

const PUSH_GROUPS = new Set([
  "Chest", "Upper Chest", "Shoulders", "Side Delts", "Triceps",
]);
const PULL_GROUPS = new Set([
  "Lats", "Rhomboids", "Rear Delts", "Biceps", "Brachialis", "Upper Back",
]);
const LEGS_GROUPS = new Set([
  "Quads", "Glutes", "Hamstrings", "Calves", "Lower Back",
]);
const CORE_GROUPS = new Set([
  "Core", "Abs", "Obliques",
]);

function bucketMuscleGroup(mg: string): "Push" | "Pull" | "Legs" | "Core" | null {
  if (PUSH_GROUPS.has(mg)) return "Push";
  if (PULL_GROUPS.has(mg)) return "Pull";
  if (LEGS_GROUPS.has(mg)) return "Legs";
  if (CORE_GROUPS.has(mg)) return "Core";
  return null;
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

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Data hook ────────────────────────────────────────────────────────────────

function useStatsData() {
  const today = todayString();

  const allSessions = useLiveQuery(() => db.workoutSessions.toArray(), []);
  const allLoggedExercises = useLiveQuery(() => db.loggedExercises.toArray(), []);
  const allExercises = useLiveQuery(() => db.exercises.toArray(), []);
  const allPRLogs = useLiveQuery(async (): Promise<PRLog[]> => db.prLogs.toArray(), []);

  const activePlan = useLiveQuery(async () => {
    const profile = await db.userProfile.get(1);
    if (!profile?.activePlanId) return undefined;
    return db.workoutPlans.get(profile.activePlanId);
  }, []);

  // ── Core stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!allSessions) return null;

    const completed = allSessions
      .filter((s) => s.endTime !== null)
      .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());

    const mon = weekStart(new Date());
    const weekSessions = completed.filter(
      (s) => parseDate(s.date).getTime() >= mon.getTime()
    );
    const workoutsThisWeek = weekSessions.length;
    const volumeThisWeek = weekSessions.reduce((sum, s) => sum + (s.totalVolume ?? 0), 0);

    const completedDates = new Set(completed.map((s) => s.date));
    let streak = 0;
    const cursor = new Date();
    cursor.setHours(12, 0, 0, 0);
    const workoutDows = new Set<number>(
      activePlan?.days.filter((d) => d.type === "workout").map((d) => d.dayOfWeek) ?? []
    );
    for (let i = 0; i < 365; i++) {
      const ds = dateStr(cursor);
      const dow = cursor.getDay();
      const isPlanned = workoutDows.size === 0 || workoutDows.has(dow);
      if (isPlanned) {
        if (completedDates.has(ds)) {
          streak++;
        } else if (ds === today) {
          // skip
        } else {
          break;
        }
      }
      cursor.setDate(cursor.getDate() - 1);
    }

    const last5 = completed.slice(0, 5);
    return { workoutsThisWeek, volumeThisWeek, streak, last5 };
  }, [allSessions, activePlan, today]);

  // ── 3.2 — Per-exercise progression (last 12 weeks) ───────────────────────
  const progressionData = useMemo(() => {
    if (!allSessions || !allLoggedExercises || !allExercises || !allPRLogs) return null;

    const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

    const sessionById = new Map(
      allSessions.filter((s) => s.endTime !== null).map((s) => [s.id!, s])
    );

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 84);
    cutoff.setHours(0, 0, 0, 0);

    const exerciseIds: string[] = Array.from(
      new Set(allLoggedExercises.map((le) => le.exerciseId))
    );

    const byExercise: Record<string, Map<string, number>> = {};
    for (const le of allLoggedExercises) {
      const session = sessionById.get(le.sessionId!);
      if (!session) continue;
      if (parseDate(session.date).getTime() < cutoff.getTime()) continue;
      const weights = le.loggedSets.filter((s) => s.weight > 0).map((s) => s.weight);
      if (weights.length === 0) continue;
      const maxW = Math.max(...weights);
      if (!byExercise[le.exerciseId]) byExercise[le.exerciseId] = new Map();
      const prev = byExercise[le.exerciseId].get(session.date) ?? 0;
      if (maxW > prev) byExercise[le.exerciseId].set(session.date, maxW);
    }

    const options = exerciseIds
      .filter((id) => (byExercise[id]?.size ?? 0) >= 2)
      .map((id) => ({ id, name: exerciseMap.get(id)?.name ?? id }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const prDatesByExercise: Record<string, Set<string>> = {};
    for (const pr of allPRLogs) {
      const session = allSessions.find(
        (s) =>
          s.endTime !== null &&
          pr.achievedAt >= s.startTime &&
          pr.achievedAt <= (s.endTime ?? pr.achievedAt)
      );
      if (!session) continue;
      if (!prDatesByExercise[pr.exerciseId]) prDatesByExercise[pr.exerciseId] = new Set();
      prDatesByExercise[pr.exerciseId].add(session.date);
    }

    return { byExercise, options, prDatesByExercise };
  }, [allSessions, allLoggedExercises, allExercises, allPRLogs]);

  // ── 3.3 — Weekly volume (last 12 weeks) ───────────────────────────────────
  const weeklyVolumeData = useMemo((): VolumeWeek[] => {
    if (!allSessions) return [];

    const completed = allSessions.filter((s) => s.endTime !== null);

    const now = new Date();
    const weeks: { start: Date; label: string; isCurrent: boolean }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const ws = weekStart(d);
      const isCurrent = i === 0;
      const label = isCurrent
        ? "Now"
        : ws.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      weeks.push({ start: ws, label, isCurrent });
    }

    return weeks.map(({ start, label, isCurrent }) => {
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const volume = completed
        .filter((s) => {
          const t = parseDate(s.date).getTime();
          return t >= start.getTime() && t < end.getTime();
        })
        .reduce((sum, s) => sum + (s.totalVolume ?? 0), 0);
      return { label, volume, isCurrent };
    });
  }, [allSessions]);

  // ── 3.4 — Muscle group distribution (last 7 days) ─────────────────────────
  const muscleGroupData = useMemo((): MuscleSlice[] => {
    if (!allSessions || !allLoggedExercises || !allExercises) {
      return [
        { name: "Push", volume: 0 },
        { name: "Pull", volume: 0 },
        { name: "Legs", volume: 0 },
        { name: "Core", volume: 0 },
      ];
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    cutoff.setHours(0, 0, 0, 0);

    const recentSessionIds = new Set(
      allSessions
        .filter((s) => s.endTime !== null && parseDate(s.date).getTime() >= cutoff.getTime())
        .map((s) => s.id!)
    );

    const exerciseMap = new Map(allExercises.map((e) => [e.id, e]));

    const buckets: Record<string, number> = { Push: 0, Pull: 0, Legs: 0, Core: 0 };

    for (const le of allLoggedExercises) {
      if (!recentSessionIds.has(le.sessionId!)) continue;
      const ex = exerciseMap.get(le.exerciseId);
      if (!ex) continue;

      const totalVol = le.loggedSets.reduce((s, set) => s + set.weight * set.reps, 0);
      if (totalVol === 0) continue;

      let bucket: string | null = null;
      for (const mg of ex.muscleGroups) {
        const b = bucketMuscleGroup(mg);
        if (b) { bucket = b; break; }
      }
      if (!bucket) {
        const allMGs = Array.from(new Set([...ex.muscleGroups, ...ex.secondaryMuscleGroups]));
        for (const mg of allMGs) {
          const b = bucketMuscleGroup(mg);
          if (b) { bucket = b; break; }
        }
      }
      if (bucket) buckets[bucket] += totalVol;
    }

    return [
      { name: "Push", volume: Math.round(buckets.Push) },
      { name: "Pull", volume: Math.round(buckets.Pull) },
      { name: "Legs", volume: Math.round(buckets.Legs) },
      { name: "Core", volume: Math.round(buckets.Core) },
    ];
  }, [allSessions, allLoggedExercises, allExercises]);

  const loading =
    allSessions === undefined ||
    allLoggedExercises === undefined ||
    allExercises === undefined ||
    activePlan === undefined;

  return { stats, loading, progressionData, weeklyVolumeData, muscleGroupData };
}

// ─── Main component ───────────────────────────────────────────────────────────

export function StatsView() {
  const { stats, loading, progressionData, weeklyVolumeData, muscleGroupData } = useStatsData();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");

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
        <div className="h-56 rounded-2xl bg-muted animate-pulse" />
        <div className="h-56 rounded-2xl bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  const { workoutsThisWeek, volumeThisWeek, streak, last5 } = stats!;
  const noData = last5.length === 0;

  // Progression chart: active exercise
  const exerciseOptions = progressionData?.options ?? [];
  const activeExerciseId = selectedExerciseId || (exerciseOptions[0]?.id ?? "");

  let progressionPoints: ProgressionPoint[] = [];
  if (activeExerciseId && progressionData) {
    const dateWeightMap = progressionData.byExercise[activeExerciseId];
    const prDates = progressionData.prDatesByExercise[activeExerciseId] ?? new Set<string>();
    if (dateWeightMap) {
      progressionPoints = Array.from(dateWeightMap.entries())
        .sort((a, b) => parseDate(a[0]).getTime() - parseDate(b[0]).getTime())
        .map(([date, weight]) => ({
          date: shortDate(date),
          weight,
          isPR: prDates.has(date),
        }));
    }
  }

  // Volume chart: trim leading zero weeks
  const firstNonZeroIdx = weeklyVolumeData.findIndex((w) => w.volume > 0);
  const trimmedVolumeData =
    firstNonZeroIdx > 0
      ? weeklyVolumeData.slice(Math.max(0, firstNonZeroIdx - 1))
      : weeklyVolumeData;
  const showVolumeChart = weeklyVolumeData.some((w) => w.volume > 0);

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

      {/* ── 3.2 — Per-exercise progression ───────────────────────────────── */}
      <ChartCard title="Exercise Progression" subtitle="Max working weight per session · last 12 weeks">
        {exerciseOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            Complete at least 2 sessions with the same exercise to see progression.
          </p>
        ) : (
          <>
            <div className="relative mb-4">
              <select
                value={activeExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="w-full appearance-none rounded-xl bg-muted border border-border text-sm text-foreground px-3 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {exerciseOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            {progressionPoints.length > 0 ? (
              <>
                <ProgressionLineChart data={progressionPoints} />
                {progressionPoints.some((p) => p.isPR) && (
                  <p className="text-[10px] text-muted-foreground mt-2 text-center">
                    🏆 Gold dots = PR sessions
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">No data for this exercise yet.</p>
            )}
          </>
        )}
      </ChartCard>

      {/* ── 3.3 — Weekly volume bar chart ────────────────────────────────── */}
      <ChartCard title="Weekly Volume" subtitle="Total weight lifted per week · last 12 weeks">
        {!showVolumeChart ? (
          <p className="text-xs text-muted-foreground text-center py-8">No completed sessions yet.</p>
        ) : (
          <VolumeBarChart data={trimmedVolumeData} />
        )}
      </ChartCard>

      {/* ── 3.4 — Muscle group distribution pie chart ────────────────────── */}
      <ChartCard title="Muscle Focus" subtitle="Volume split by group · last 7 days">
        {muscleGroupData.every((d) => d.volume === 0) ? (
          <p className="text-xs text-muted-foreground text-center py-8">No sessions in the last 7 days.</p>
        ) : (
          <MuscleGroupPieChart data={muscleGroupData} />
        )}
      </ChartCard>

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
