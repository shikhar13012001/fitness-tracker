"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CheckCircle2,
  Circle,
  Dumbbell,
  Moon,
  ChevronRight,
  Droplets,
  Zap,
} from "lucide-react";
import { db } from "@/lib/db";
import type { ActionItem, Exercise, PlannedExercise } from "@/lib/db";
import { todayString, formatDayHeader } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

// ─── Data loading ─────────────────────────────────────────────────────────────

function useTodayData() {
  const today = todayString();
  const dow = new Date().getDay(); // 0=Sun … 6=Sat

  const profile = useLiveQuery(() => db.userProfile.get(1));

  const activePlan = useLiveQuery(
    () =>
      profile?.activePlanId
        ? db.workoutPlans.get(profile.activePlanId)
        : undefined,
    [profile?.activePlanId]
  );

  const allExercises = useLiveQuery(() => db.exercises.toArray());

  const allActionItems = useLiveQuery(() => db.actionItems.toArray());

  const todayLogs = useLiveQuery(
    () => db.actionItemLogs.where("date").equals(today).toArray(),
    [today]
  );

  const todayProteinEntries = useLiveQuery(
    () => db.proteinEntries.where("date").equals(today).toArray(),
    [today]
  );

  const todaySession = useLiveQuery(
    () => db.workoutSessions.where("date").equals(today).first(),
    [today]
  );

  const todayPlan = activePlan?.days[dow];
  const isWorkoutDay = todayPlan?.type === "workout";

  const todayActionItems = useMemo(
    () =>
      (allActionItems ?? []).filter(
        (item) =>
          item.schedule === "daily" ||
          (item.schedule === "training_days" && isWorkoutDay) ||
          (item.schedule === "rest_days" && !isWorkoutDay)
      ),
    [allActionItems, isWorkoutDay]
  );

  const completedItemIds = useMemo(
    () => new Set((todayLogs ?? []).map((l) => l.actionItemId)),
    [todayLogs]
  );

  const exerciseMap = useMemo(
    () => new Map((allExercises ?? []).map((e) => [e.id, e])),
    [allExercises]
  );

  const totalProteinToday = useMemo(
    () => (todayProteinEntries ?? []).reduce((s, e) => s + e.grams, 0),
    [todayProteinEntries]
  );

  const loading =
    profile === undefined ||
    activePlan === undefined ||
    allExercises === undefined ||
    allActionItems === undefined;

  return {
    today,
    profile,
    activePlan,
    todayPlan,
    isWorkoutDay,
    todayActionItems,
    completedItemIds,
    exerciseMap,
    totalProteinToday,
    todaySession,
    loading,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function repRangeLabel(pe: PlannedExercise): string {
  if (pe.isTimed) return `${pe.targetRepMin}s`;
  if (pe.targetRepMin === pe.targetRepMax) return `${pe.targetRepMin}`;
  return `${pe.targetRepMin}–${pe.targetRepMax}`;
}

function proteinBarColor(pct: number): string {
  if (pct >= 1) return "bg-green-500";
  if (pct >= 0.8) return "bg-blue-400";
  if (pct >= 0.5) return "bg-yellow-400";
  return "bg-red-400";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProteinCard({
  total,
  target,
}: {
  total: number;
  target: number;
}) {
  const pct = Math.min(total / target, 1);
  const barPct = Math.round(pct * 100);

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-medium text-foreground">
            Protein Today
          </span>
        </div>
        <span
          className={cn(
            "text-sm font-semibold tabular-nums",
            pct >= 1 ? "text-green-400" : "text-foreground"
          )}
        >
          {total}
          <span className="text-muted-foreground font-normal">
            {" "}
            / {target} g
          </span>
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            proteinBarColor(pct)
          )}
          style={{ width: `${barPct}%` }}
        />
      </div>
      {pct < 1 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {target - total} g to go
        </p>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function actionItemIcon(item: ActionItem) {
  if (item.id === "water-intake") return <Droplets className="h-4 w-4" />;
  if (item.type === "supplement") return <Zap className="h-4 w-4" />;
  return <Circle className="h-4 w-4" />;
}

function SupplementChecklist({
  items,
  completedIds,
  onToggle,
}: {
  items: ActionItem[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <span className="text-sm font-medium text-foreground">
          Today&apos;s Checklist
        </span>
      </div>
      <ul className="divide-y divide-border">
        {items.map((item) => {
          const done = completedIds.has(item.id);
          return (
            <li key={item.id}>
              <button
                onClick={() => onToggle(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-muted",
                  done ? "opacity-60" : ""
                )}
              >
                <span
                  className={cn(
                    "shrink-0 transition-colors",
                    done ? "text-green-400" : "text-muted-foreground"
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      done
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    )}
                  >
                    {item.name}
                  </span>
                  {item.dose && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {item.dose}
                    </span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {item.suggestedTime}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ExerciseRow({
  pe,
  exercise,
  index,
}: {
  pe: PlannedExercise;
  exercise: Exercise | undefined;
  index: number;
}) {
  const name = exercise?.name ?? pe.exerciseId;
  const muscle = exercise?.muscleGroups[0] ?? "";

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0 text-right">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{name}</p>
        {muscle && (
          <p className="text-xs text-muted-foreground mt-0.5">{muscle}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-foreground tabular-nums">
          {pe.targetSets} × {repRangeLabel(pe)}
        </p>
        {pe.targetWeight !== null ? (
          <p className="text-xs text-muted-foreground">
            {pe.targetWeight} kg
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">— kg</p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TodayView() {
  const router = useRouter();
  const {
    today,
    profile,
    activePlan,
    todayPlan,
    isWorkoutDay,
    todayActionItems,
    completedItemIds,
    exerciseMap,
    totalProteinToday,
    todaySession,
    loading,
  } = useTodayData();

  async function toggleActionItem(itemId: string) {
    const existing = (
      await db.actionItemLogs
        .where("date")
        .equals(today)
        .filter((l) => l.actionItemId === itemId)
        .first()
    );
    if (existing) {
      await db.actionItemLogs.delete(existing.id);
    } else {
      await db.actionItemLogs.add({
        id: crypto.randomUUID(),
        actionItemId: itemId,
        date: today,
        completedAt: Date.now(),
      });
    }
  }

  async function handleStartWorkout() {
    if (!activePlan || !todayPlan || todayPlan.type !== "workout") return;

    // Resume existing session if one exists without an end time
    if (todaySession) {
      router.push(`/session/${todaySession.id}`);
      return;
    }

    const sessionId = crypto.randomUUID();
    await db.transaction(
      "rw",
      [db.workoutSessions, db.loggedExercises],
      async () => {
        await db.workoutSessions.add({
          id: sessionId,
          date: today,
          planId: activePlan.id,
          dayName: todayPlan.name,
          startTime: Date.now(),
          endTime: null,
          duration: null,
          totalVolume: null,
          notes: "",
        });

        await db.loggedExercises.bulkAdd(
          todayPlan.plannedExercises.map((pe) => ({
            id: crypto.randomUUID(),
            sessionId,
            exerciseId: pe.exerciseId,
            loggedSets: [],
            notes: "",
            completed: false,
          }))
        );
      }
    );

    router.push(`/session/${sessionId}`);
  }

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="h-7 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="h-20 rounded-2xl bg-muted animate-pulse" />
        <div className="h-36 rounded-2xl bg-muted animate-pulse" />
        <div className="h-64 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  const proteinTarget = profile?.proteinTargetG ?? 130;
  const exerciseCount = todayPlan?.plannedExercises.length ?? 0;
  const sessionLabel = todaySession
    ? todaySession.endTime
      ? "View Workout"
      : "Resume Workout"
    : "Start Workout";

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-6 pb-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {formatDayHeader(new Date())}
        </p>
        <h1 className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
          {isWorkoutDay ? (
            <>
              <Dumbbell className="h-6 w-6 text-primary" />
              {todayPlan?.name} Day
            </>
          ) : (
            <>
              <Moon className="h-6 w-6 text-muted-foreground" />
              Rest Day
            </>
          )}
        </h1>
        {isWorkoutDay && (
          <p className="text-sm text-muted-foreground mt-0.5">
            {exerciseCount} exercises · {activePlan?.name}
          </p>
        )}
      </div>

      {/* Protein counter */}
      <ProteinCard total={totalProteinToday} target={proteinTarget} />

      {/* Supplement checklist */}
      <SupplementChecklist
        items={todayActionItems}
        completedIds={completedItemIds}
        onToggle={toggleActionItem}
      />

      {/* Workout card */}
      {isWorkoutDay && todayPlan ? (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              Today&apos;s Exercises
            </span>
            <span className="text-xs text-muted-foreground">
              Sets × Reps
            </span>
          </div>
          <ul className="divide-y divide-border">
            {todayPlan.plannedExercises
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((pe, i) => (
                <li key={pe.exerciseId + i}>
                  <ExerciseRow
                    pe={pe}
                    exercise={exerciseMap.get(pe.exerciseId)}
                    index={i}
                  />
                </li>
              ))}
          </ul>

          <div className="px-4 py-4 border-t border-border">
            <button
              onClick={handleStartWorkout}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-4 text-base font-semibold transition-colors",
                todaySession && !todaySession.endTime
                  ? "bg-yellow-500 hover:bg-yellow-400 text-black"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              )}
            >
              <Dumbbell className="h-5 w-5" />
              {sessionLabel}
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-card border border-border p-8 flex flex-col items-center gap-3 text-center">
          <Moon className="h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Rest &amp; recover today
          </p>
          <p className="text-xs text-muted-foreground max-w-[22ch]">
            Hit your protein and supplement targets — that&apos;s today&apos;s job.
          </p>
        </div>
      )}
    </div>
  );
}
