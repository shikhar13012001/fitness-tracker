"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";
import type { WorkoutSession } from "@/lib/db";
import { CalendarGrid } from "./CalendarGrid";
import { DayDetailSheet } from "./DayDetailSheet";
import { ExerciseHistoryView } from "./ExerciseHistoryView";

// ─── Legend pill ─────────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HistoryView() {
  const today = todayString();
  const now = new Date();
  const router = useRouter();

  const [view, setView] = useState<"calendar" | "exercise">("calendar");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth()); // 0-indexed
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────
  const allSessions = useLiveQuery(() => db.workoutSessions.toArray(), []);
  const allExercises = useLiveQuery(
    async () => db.exercises.toArray(),
    []
  );
  const activePlan = useLiveQuery(async () => {
    const profile = await db.userProfile.get(1);
    if (!profile?.activePlanId) return null;
    return db.workoutPlans.get(profile.activePlanId) ?? null;
  }, []);

  const sessionsByDate = useMemo(() => {
    const map = new Map<string, WorkoutSession>();
    if (!allSessions) return map;
    for (const s of allSessions) {
      if (s.endTime !== null) map.set(s.date, s);
    }
    return map;
  }, [allSessions]);

  const workoutDows = useMemo(() => {
    if (!activePlan) return new Set<number>();
    return new Set<number>(
      activePlan.days.filter((d) => d.type === "workout").map((d) => d.dayOfWeek)
    );
  }, [activePlan]);

  // ── Month navigation ──────────────────────────────────────────────────────
  const isAtCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (isAtCurrentMonth) return;
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // ── Selected day derived state ────────────────────────────────────────────
  const selectedSession = selectedDate ? (sessionsByDate.get(selectedDate) ?? null) : null;

  const selectedDow = selectedDate
    ? new Date(selectedDate + "T12:00:00").getDay()
    : -1;

  const selectedIsWorkoutDay = selectedDow >= 0 && workoutDows.has(selectedDow);

  const selectedPlanDayName =
    activePlan?.days.find((d) => d.dayOfWeek === selectedDow)?.name ?? "Workout";

  // ── Retroactive session creation ──────────────────────────────────────────
  const handleLogRetroactively = async () => {
    if (!selectedDate || !activePlan) return;
    const planDay = activePlan.days.find((d) => d.dayOfWeek === selectedDow);
    if (!planDay) return;

    const id = crypto.randomUUID();
    await db.workoutSessions.add({
      id,
      date: selectedDate,
      planId: activePlan.id,
      dayName: planDay.name,
      startTime: Date.now(),
      endTime: null,
      duration: null,
      totalVolume: null,
      notes: "",
    });
    router.push(`/session/${id}`);
  };

  // Show retroactive button only for past missed workout days
  const showRetroButton =
    selectedDate !== null &&
    selectedIsWorkoutDay &&
    !selectedSession &&
    selectedDate < today;

  // ── Loading ───────────────────────────────────────────────────────────────
  const loading = allSessions === undefined || activePlan === undefined;

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-6 space-y-4 max-w-lg mx-auto">
        <div className="h-7 w-32 rounded-lg bg-muted animate-pulse" />
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
        <div className="h-80 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">History</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Your workout log</p>
      </div>

      {/* Tab toggle */}
      <div className="flex bg-muted rounded-xl p-1 gap-1">
        {(["calendar", "exercise"] as const).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v);
              setSelectedDate(null);
            }}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-colors",
              view === v
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            {v === "calendar" ? "Calendar" : "By Exercise"}
          </button>
        ))}
      </div>

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground active:opacity-70"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold text-foreground">{monthLabel}</span>
            <button
              onClick={nextMonth}
              disabled={isAtCurrentMonth}
              className={cn(
                "p-1.5 rounded-lg text-muted-foreground active:opacity-70",
                !isAtCurrentMonth ? "hover:bg-muted" : "opacity-25 cursor-default"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 px-4 py-2 border-b border-border">
            <LegendItem color="bg-green-500" label="Done" />
            <LegendItem color="bg-red-500" label="Missed" />
            <LegendItem color="bg-muted-foreground/30" label="Rest" />
            <LegendItem
              color="border border-muted-foreground/30 bg-transparent"
              label="Upcoming"
            />
          </div>

          {/* Grid */}
          <div className="p-3">
            <CalendarGrid
              year={year}
              month={month}
              today={today}
              sessionsByDate={sessionsByDate}
              workoutDows={workoutDows}
              selectedDate={selectedDate}
              onDayPress={(ds) =>
                setSelectedDate((prev) => (prev === ds ? null : ds))
              }
            />
          </div>
        </div>
      )}

      {/* By Exercise view */}
      {view === "exercise" && (
        <ExerciseHistoryView
          allExercises={allExercises ?? []}
          allSessions={allSessions ?? []}
        />
      )}

      {/* Day detail bottom sheet */}
      {selectedDate && view === "calendar" && (
        <DayDetailSheet
          dateStr={selectedDate}
          session={selectedSession}
          isWorkoutDay={selectedIsWorkoutDay}
          planDayName={selectedPlanDayName}
          onClose={() => setSelectedDate(null)}
          onLogRetroactively={showRetroButton ? handleLogRetroactively : undefined}
        />
      )}
    </div>
  );
}
