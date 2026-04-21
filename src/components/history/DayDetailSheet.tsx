"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { X } from "lucide-react";
import { db } from "@/lib/db";
import type { WorkoutSession, LoggedExercise, Exercise } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${Math.round(kg).toLocaleString()} kg`;
}

// ─── Completed workout detail ─────────────────────────────────────────────────

function CompletedDetail({
  session,
  loggedExercises,
  exerciseMap,
}: {
  session: WorkoutSession;
  loggedExercises: LoggedExercise[];
  exerciseMap: Map<string, Exercise>;
}) {
  return (
    <div className="space-y-4">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-sm font-bold text-foreground">
            {session.duration ? formatDuration(session.duration) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
            Duration
          </p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-sm font-bold text-foreground">
            {session.totalVolume ? formatVolume(session.totalVolume) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
            Volume
          </p>
        </div>
        <div className="rounded-xl bg-muted p-3 text-center">
          <p className="text-sm font-bold text-foreground">{loggedExercises.length}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">
            Exercises
          </p>
        </div>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {loggedExercises.map((le) => {
          const ex = exerciseMap.get(le.exerciseId);
          const setsWithWork = le.loggedSets.filter((s) => s.reps > 0);
          return (
            <div key={le.id} className="rounded-xl bg-muted p-3">
              <p className="text-sm font-semibold text-foreground mb-2">
                {ex?.name ?? le.exerciseId}
              </p>
              {setsWithWork.length === 0 ? (
                <p className="text-xs text-muted-foreground">No sets logged</p>
              ) : (
                <div className="space-y-1">
                  {setsWithWork.map((set, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-10 text-muted-foreground font-medium">
                        Set {i + 1}
                      </span>
                      <span className="text-foreground">
                        {set.weight > 0
                          ? `${set.weight} kg × ${set.reps}`
                          : `${set.reps} reps`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {le.notes ? (
                <p className="text-xs text-muted-foreground mt-2 italic">{le.notes}</p>
              ) : null}
            </div>
          );
        })}
      </div>

      {session.notes ? (
        <div className="rounded-xl bg-muted p-3">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
          <p className="text-xs text-foreground">{session.notes}</p>
        </div>
      ) : null}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  dateStr: string;
  session: WorkoutSession | null;
  isWorkoutDay: boolean;
  planDayName: string;
  onClose: () => void;
  onLogRetroactively?: () => void;
}

export function DayDetailSheet({
  dateStr,
  session,
  isWorkoutDay,
  planDayName,
  onClose,
  onLogRetroactively,
}: Props) {
  const loggedExercises = useLiveQuery(
    async (): Promise<LoggedExercise[]> => {
      if (!session) return [];
      return db.loggedExercises.where("sessionId").equals(session.id).toArray();
    },
    [session?.id]
  );

  const exercises = useLiveQuery(async (): Promise<Exercise[]> => db.exercises.toArray(), []);

  const exerciseMap = new Map((exercises ?? []).map((e) => [e.id, e]));

  const displayDate = new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-card border-t border-border max-h-[82vh] flex flex-col">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-0 shrink-0">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 pb-10 pt-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-foreground">{displayDate}</h2>
              {session && (
                <p className="text-sm text-muted-foreground mt-0.5">{session.dayName}</p>
              )}
              {!session && isWorkoutDay && (
                <p className="text-sm text-muted-foreground mt-0.5">{planDayName}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-lg hover:bg-muted text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {!isWorkoutDay ? (
            /* Rest day */
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="text-4xl">🧘</span>
              <p className="text-sm font-semibold text-foreground">Rest Day</p>
              <p className="text-xs text-muted-foreground">Recovery is part of the process.</p>
            </div>
          ) : session ? (
            /* Completed workout */
            <CompletedDetail
              session={session}
              loggedExercises={loggedExercises ?? []}
              exerciseMap={exerciseMap}
            />
          ) : (
            /* Missed workout */
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="text-4xl">❌</span>
              <p className="text-sm font-semibold text-foreground">
                Missed — {planDayName}
              </p>
              <p className="text-xs text-muted-foreground">
                This workout wasn&apos;t logged.
              </p>
              {onLogRetroactively ? (
                <button
                  onClick={onLogRetroactively}
                  className="mt-1 rounded-xl bg-primary text-primary-foreground px-5 py-2.5 text-sm font-semibold active:opacity-80"
                >
                  Log retroactively
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
