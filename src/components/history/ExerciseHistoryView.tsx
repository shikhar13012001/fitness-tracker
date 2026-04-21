"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronDown, Dumbbell } from "lucide-react";
import { db } from "@/lib/db";
import type { Exercise, WorkoutSession, LoggedExercise } from "@/lib/db";

interface Props {
  allExercises: Exercise[];
  allSessions: WorkoutSession[];
}

function formatVolume(sets: LoggedExercise["loggedSets"]): string {
  const v = sets.reduce((s, set) => s + set.weight * set.reps, 0);
  if (v === 0) return "";
  if (v >= 1000) return `${(v / 1000).toFixed(1)} t`;
  return `${Math.round(v).toLocaleString()} kg`;
}

export function ExerciseHistoryView({ allExercises, allSessions }: Props) {
  const [selectedId, setSelectedId] = useState("");

  const sortedExercises = useMemo(
    () => [...allExercises].sort((a, b) => a.name.localeCompare(b.name)),
    [allExercises]
  );

  const activeId = selectedId || (sortedExercises[0]?.id ?? "");

  const sessionById = useMemo(() => {
    const map = new Map<string, WorkoutSession>();
    for (const s of allSessions) {
      if (s.endTime !== null) map.set(s.id, s);
    }
    return map;
  }, [allSessions]);

  const loggedForExercise = useLiveQuery(
    async (): Promise<LoggedExercise[]> => {
      if (!activeId) return [];
      return db.loggedExercises.where("exerciseId").equals(activeId).toArray();
    },
    [activeId]
  );

  // Join with sessions, filter to completed, sort newest first
  const entries = useMemo(() => {
    if (!loggedForExercise) return null; // loading
    return loggedForExercise
      .map((le) => ({ le, session: sessionById.get(le.sessionId) }))
      .filter((x): x is { le: LoggedExercise; session: WorkoutSession } =>
        x.session !== undefined
      )
      .sort((a, b) => b.session.date.localeCompare(a.session.date));
  }, [loggedForExercise, sessionById]);

  return (
    <div className="space-y-4">
      {/* Exercise selector */}
      <div className="relative">
        <select
          value={activeId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full appearance-none rounded-xl bg-muted border border-border text-sm text-foreground px-3 py-2.5 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {sortedExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {/* Entries */}
      {entries === null ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <Dumbbell className="h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No sessions logged for this exercise yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(({ le, session }) => {
            const workSets = le.loggedSets.filter((s) => s.reps > 0);
            const vol = formatVolume(workSets);
            const maxWeight = Math.max(...workSets.map((s) => s.weight), 0);

            return (
              <div
                key={le.id}
                className="rounded-2xl bg-card border border-border p-4"
              >
                {/* Session header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {session.dayName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(session.date + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { weekday: "short", month: "short", day: "numeric", year: "numeric" }
                      )}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {maxWeight > 0 && (
                      <p className="text-xs font-semibold text-foreground">
                        Top: {maxWeight} kg
                      </p>
                    )}
                    {vol && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">{vol}</p>
                    )}
                  </div>
                </div>

                {/* Sets */}
                {workSets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No completed sets</p>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {workSets.map((set, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs"
                      >
                        <span className="w-10 text-muted-foreground">Set {i + 1}</span>
                        <span className="font-medium text-foreground">
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
      )}
    </div>
  );
}
