"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Scale, TrendingUp, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const STARTING_WEIGHT = 65;
const TARGET_WEEKLY_MIN = 0.25;
const TARGET_WEEKLY_MAX = 0.5;

function parseLocalDate(s: string): Date {
  return new Date(s + "T12:00:00");
}

function formatEntryDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function weeksSince(from: string, to: string): number {
  const ms = parseLocalDate(to).getTime() - parseLocalDate(from).getTime();
  return ms / (7 * 24 * 3600 * 1000);
}

export function BodyweightScreen() {
  const router = useRouter();
  const today = todayString();

  const [inputVal, setInputVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const entries = useLiveQuery(
    () => db.bodyweightEntries.orderBy("date").reverse().limit(10).toArray(),
    []
  );

  const allEntries = useLiveQuery(
    () => db.bodyweightEntries.orderBy("date").toArray(),
    []
  );

  // Derived stats
  const stats = useMemo(() => {
    if (!allEntries || allEntries.length === 0) return null;
    const sorted = [...allEntries].sort((a, b) => a.date.localeCompare(b.date));
    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const totalGain = latest.weight - first.weight;
    const weeks = weeksSince(first.date, latest.weight === first.weight ? today : latest.date);
    const weeklyRate = weeks > 0 ? totalGain / weeks : 0;
    const onTrack = weeklyRate >= TARGET_WEEKLY_MIN && weeklyRate <= TARGET_WEEKLY_MAX;
    return { first, latest, totalGain, weeklyRate, onTrack };
  }, [allEntries, today]);

  // Today's entry (if already logged)
  const todayEntry = useMemo(
    () => entries?.find((e) => e.date === today),
    [entries, today]
  );

  async function handleLog() {
    const kg = parseFloat(inputVal);
    if (isNaN(kg) || kg < 20 || kg > 300) {
      setError("Enter a valid weight between 20–300 kg");
      return;
    }
    setError("");
    setSaving(true);
    try {
      if (todayEntry) {
        await db.bodyweightEntries.update(todayEntry.id, { weight: kg });
      } else {
        await db.bodyweightEntries.add({
          id: crypto.randomUUID(),
          date: today,
          weight: kg,
        });
      }
      setInputVal("");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await db.bodyweightEntries.delete(id);
  }

  const latestWeight = stats?.latest.weight ?? STARTING_WEIGHT;

  return (
    <div className="flex flex-col min-h-svh bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border shrink-0">
        <button
          onClick={() => router.back()}
          className="text-muted-foreground hover:text-foreground p-1 -ml-1 transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <Scale className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Bodyweight</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-8 space-y-5 max-w-lg mx-auto">

          {/* Current weight hero */}
          <div className="rounded-2xl bg-card border border-border p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                {todayEntry ? "Today" : "Last logged"}
              </p>
              <p className="text-4xl font-bold text-foreground tabular-nums">
                {latestWeight.toFixed(1)}
                <span className="text-lg font-normal text-muted-foreground ml-1">kg</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Started at {STARTING_WEIGHT} kg · Target +{TARGET_WEEKLY_MIN}–{TARGET_WEEKLY_MAX} kg/wk
              </p>
            </div>
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Scale className="h-8 w-8 text-primary" />
            </div>
          </div>

          {/* Progress stats */}
          {stats && (
            <div className="flex gap-3">
              <div className="flex-1 rounded-2xl bg-card border border-border p-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total gain</p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  stats.totalGain >= 0 ? "text-green-400" : "text-red-400"
                )}>
                  {stats.totalGain >= 0 ? "+" : ""}{stats.totalGain.toFixed(1)} kg
                </p>
              </div>
              <div className="flex-1 rounded-2xl bg-card border border-border p-4">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Per week</p>
                </div>
                <p className={cn(
                  "text-2xl font-bold tabular-nums",
                  stats.onTrack ? "text-green-400" : "text-yellow-400"
                )}>
                  {stats.weeklyRate >= 0 ? "+" : ""}{stats.weeklyRate.toFixed(2)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">kg</span>
                </p>
                <p className={cn(
                  "text-[11px] mt-0.5 font-medium",
                  stats.onTrack ? "text-green-400" : "text-yellow-400"
                )}>
                  {stats.onTrack ? "On track ✓" : `Target: +${TARGET_WEEKLY_MIN}–${TARGET_WEEKLY_MAX}`}
                </p>
              </div>
            </div>
          )}

          {/* Log today */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <p className="text-sm font-semibold text-foreground mb-3">
              {todayEntry ? "Update today's weight" : "Log today's weight"}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={inputVal}
                  onChange={(e) => { setInputVal(e.target.value); setError(""); }}
                  placeholder={todayEntry ? String(todayEntry.weight) : `e.g. ${latestWeight.toFixed(1)}`}
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">
                  kg
                </span>
              </div>
              <button
                onClick={handleLog}
                disabled={saving || !inputVal}
                className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity active:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {todayEntry ? "Update" : "Log"}
              </button>
            </div>
            {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          </div>

          {/* Last 10 entries */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">History</span>
              <span className="text-xs text-muted-foreground">Last 10 entries</span>
            </div>

            {!entries || entries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-6">
                <Scale className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No entries yet.</p>
                <p className="text-xs text-muted-foreground/60">
                  Log your first weight above.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {entries.map((entry, i) => {
                  const prev = entries[i + 1];
                  const delta = prev ? entry.weight - prev.weight : null;
                  const isToday = entry.date === today;
                  return (
                    <li key={entry.id} className="flex items-center gap-3 px-4 py-3.5">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground tabular-nums">
                            {entry.weight.toFixed(1)} kg
                          </span>
                          {delta !== null && (
                            <span className={cn(
                              "text-xs font-medium tabular-nums",
                              delta > 0 ? "text-green-400" : delta < 0 ? "text-red-400" : "text-muted-foreground"
                            )}>
                              {delta > 0 ? "▲" : delta < 0 ? "▼" : "—"}
                              {delta !== 0 ? ` ${Math.abs(delta).toFixed(1)}` : ""}
                            </span>
                          )}
                          {isToday && (
                            <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatEntryDate(entry.date)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
