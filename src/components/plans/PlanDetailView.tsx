'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronLeft,
  Pencil,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { db } from '@/lib/db';
import type { Exercise, PlannedDayRow, PlannedExerciseRow } from '@/lib/db';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;

const DOW_ABBR: Record<number, string> = {
  0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
};

const MAX_DOTS = 10;

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-2 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
        <div className="h-6 w-48 rounded-lg bg-muted animate-pulse" />
        <div className="ml-auto h-8 w-14 rounded-lg bg-muted animate-pulse" />
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// ─── ExerciseDots ─────────────────────────────────────────────────────────────

function ExerciseDots({ count }: { count: number }) {
  const dots = Math.min(count, MAX_DOTS);
  const overflow = count - MAX_DOTS;

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} className="h-2 w-2 rounded-full bg-emerald-500/70 shrink-0" />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground font-medium leading-none">
          +{overflow}
        </span>
      )}
    </div>
  );
}

// ─── ExerciseItem ─────────────────────────────────────────────────────────────

function ExerciseItem({
  ex,
  exercise,
  index,
}: {
  ex: PlannedExerciseRow;
  exercise: Exercise | undefined;
  index: number;
}) {
  const name = exercise?.name ?? ex.exerciseId;

  const repLabel = ex.isTimed
    ? `${ex.targetSets} sets · ${ex.targetRepMin}s`
    : ex.targetRepMin === ex.targetRepMax
    ? `${ex.targetSets} sets · ${ex.targetRepMin} reps`
    : `${ex.targetSets} sets · ${ex.targetRepMin}–${ex.targetRepMax} reps`;

  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="text-xs font-mono text-muted-foreground w-4 shrink-0 text-right mt-[3px]">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0">
        {/* Name row */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-semibold text-foreground truncate">
            {name}
          </span>
          {exercise?.tutorialUrl && (
            <a
              href={exercise.tutorialUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Tutorial for ${name}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Targets row */}
        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1 flex-wrap">
          <span>{repLabel}</span>
          <span className="opacity-40">·</span>
          {ex.targetWeight !== null ? (
            <span className="tabular-nums">{ex.targetWeight} kg</span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <span className="text-muted-foreground/50">— kg</span>
              <span className="text-[10px] bg-muted text-muted-foreground/70 px-1.5 py-0.5 rounded leading-tight">
                set on first session
              </span>
            </span>
          )}
        </p>
      </div>
    </li>
  );
}

// ─── ExerciseList ─────────────────────────────────────────────────────────────

function ExerciseList({
  exercises,
  exerciseMap,
  planId,
  dayId,
}: {
  exercises: PlannedExerciseRow[];
  exerciseMap: Map<string, Exercise>;
  planId: string;
  dayId: number;
}) {
  const router = useRouter();

  return (
    <div className="border-t border-border/60">
      {exercises.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted-foreground">
          No exercises added yet.
        </p>
      ) : (
        <ul className="px-5 divide-y divide-border/40">
          {exercises.map((ex, i) => (
            <ExerciseItem
              key={ex.id ?? i}
              ex={ex}
              exercise={exerciseMap.get(ex.exerciseId)}
              index={i}
            />
          ))}
        </ul>
      )}

      {/* Edit this day footer */}
      <div className="px-5 py-3 border-t border-border/40">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/plans/${planId}/day/${dayId}/edit`);
          }}
          className="text-sm text-primary hover:underline font-medium flex items-center gap-1 active:opacity-70"
        >
          Edit this day →
        </button>
      </div>
    </div>
  );
}

// ─── DayRow ───────────────────────────────────────────────────────────────────

function DayRow({
  dow,
  day,
  exercises,
  exerciseMap,
  planId,
  isToday,
  isExpanded,
  onToggle,
}: {
  dow: number;
  day: PlannedDayRow | undefined;
  exercises: PlannedExerciseRow[];
  exerciseMap: Map<string, Exercise>;
  planId: string;
  isToday: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isWorkout = day?.type === 'workout';

  return (
    <div
      className={cn(
        'rounded-xl overflow-hidden border',
        isToday ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-border bg-card',
      )}
    >
      {/* Row header */}
      <button
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 text-left focus:outline-none transition-colors',
          isWorkout ? 'active:bg-muted/40' : 'cursor-default',
        )}
        onClick={isWorkout ? onToggle : undefined}
        aria-expanded={isWorkout ? isExpanded : undefined}
        disabled={!isWorkout}
      >
        {/* Day abbreviation */}
        <span
          className={cn(
            'text-xs font-bold tracking-wider w-8 shrink-0',
            isToday ? 'text-emerald-400' : 'text-muted-foreground',
          )}
        >
          {DOW_ABBR[dow]}
        </span>

        {/* Day name / REST */}
        {isWorkout ? (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight">
              {day?.name ?? 'Workout'}
            </p>
            <div className="mt-1">
              <ExerciseDots count={exercises.length} />
            </div>
          </div>
        ) : (
          <span className="flex-1 text-sm font-medium text-muted-foreground/40 tracking-widest">
            — REST —
          </span>
        )}

        {/* TODAY pill */}
        {isToday && (
          <span className="shrink-0 text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-semibold">
            TODAY
          </span>
        )}

        {/* Expand chevron */}
        {isWorkout && (
          <span className="shrink-0 text-muted-foreground">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </span>
        )}
      </button>

      {/* Animated accordion body — CSS grid-template-rows trick */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-250 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          {isWorkout && day?.id != null && (
            <ExerciseList
              exercises={exercises}
              exerciseMap={exerciseMap}
              planId={planId}
              dayId={day.id}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PlanDetailView ───────────────────────────────────────────────────────────

export function PlanDetailView({ planId }: { planId: string }) {
  const router = useRouter();
  const [expandedDow, setExpandedDow] = useState<number | null>(null);
  const todayDow = new Date().getDay();

  // ── Data ──────────────────────────────────────────────────────────────────

  const plan = useLiveQuery(() => db.workoutPlans.get(planId), [planId]);

  const allDays = useLiveQuery(
    () => db.plannedDays.where('planId').equals(planId).toArray(),
    [planId],
  );

  const allExerciseRows = useLiveQuery(async () => {
    if (!allDays?.length) return [];
    const dayIds = allDays.map((d) => d.id!);
    return db.plannedExercises.where('plannedDayId').anyOf(dayIds).toArray();
  }, [allDays]);

  const exerciseMap = useLiveQuery(async () => {
    const exs = await db.exercises.toArray();
    return new Map(exs.map((e) => [e.id, e]));
  });

  const loading =
    plan === undefined ||
    allDays === undefined ||
    allExerciseRows === undefined ||
    exerciseMap === undefined;

  if (loading) return <Skeleton />;

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-6">
        <p className="text-sm text-muted-foreground">Plan not found.</p>
        <button className="text-sm text-primary underline" onClick={() => router.back()}>
          Go back
        </button>
      </div>
    );
  }

  // Dev-mode persistence check — logs plan + days + exercises on mount/change
  if (process.env.NODE_ENV === 'development') {
    console.log('[PlanDetailView] persisted plan:', plan.name, {
      days: allDays?.length,
      exercises: allExerciseRows?.length,
    });
  }

  // ── Build dayId → sorted exercises map ────────────────────────────────────

  const exercisesByDay = new Map<number, PlannedExerciseRow[]>();
  for (const row of allExerciseRows ?? []) {
    const bucket = exercisesByDay.get(row.plannedDayId) ?? [];
    bucket.push(row);
    exercisesByDay.set(row.plannedDayId, bucket);
  }
  exercisesByDay.forEach((v, k) => {
    exercisesByDay.set(k, [...v].sort((a, b) => a.order - b.order));
  });

  function toggle(dow: number) {
    setExpandedDow((prev) => (prev === dow ? null : dow));
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="px-4 pt-4 pb-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors active:scale-95 shrink-0"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <h1 className="flex-1 text-lg font-bold text-foreground truncate">
          {plan.name}
        </h1>

        <button
          onClick={() => router.push(`/plans/${planId}/edit`)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:bg-muted transition-colors active:scale-95 shrink-0"
          aria-label="Edit plan"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </button>
      </div>

      {/* Day rows */}
      <div className="space-y-2">
        {DOW_ORDER.map((dow) => {
          const day = allDays.find((d) => d.dayOfWeek === dow);
          const dayExercises = day?.id != null ? (exercisesByDay.get(day.id) ?? []) : [];

          return (
            <DayRow
              key={dow}
              dow={dow}
              day={day}
              exercises={dayExercises}
              exerciseMap={exerciseMap ?? new Map()}
              planId={planId}
              isToday={dow === todayDow}
              isExpanded={expandedDow === dow}
              onToggle={() => toggle(dow)}
            />
          );
        })}
      </div>
    </div>
  );
}
