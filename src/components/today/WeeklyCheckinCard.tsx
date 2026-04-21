"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Scale, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

const TARGET_WEEKLY_MIN = 0.25; // kg/week
const TARGET_WEEKLY_MAX = 0.5;

function parseLocalDate(s: string): Date {
  return new Date(s + "T12:00:00");
}

// Compute feedback message and color based on delta (kg this week vs prior avg)
function getFeedback(deltaKg: number): { msg: string; color: string } {
  if (deltaKg < TARGET_WEEKLY_MIN) {
    return {
      msg: "Gaining too slowly. Try adding 200 kcal/day.",
      color: "text-yellow-400",
    };
  }
  if (deltaKg > TARGET_WEEKLY_MAX) {
    return {
      msg: "Gaining fast — might be adding fat. Consider pulling 200 kcal.",
      color: "text-orange-400",
    };
  }
  return {
    msg: "On track — keep going! 💪",
    color: "text-green-400",
  };
}

export function WeeklyCheckinCard() {
  const today = todayString();
  const dow = new Date().getDay(); // 0 = Sunday

  const allEntries = useLiveQuery(
    async () => db.bodyweightEntries.orderBy("date").toArray(),
    []
  );

  const [inputVal, setInputVal] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ msg: string; color: string } | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Decide whether to show the card
  const shouldShow = useMemo(() => {
    if (allEntries === undefined) return false; // still loading
    if (dismissed) return false;

    // Already logged today
    if (allEntries.some((e) => e.date === today)) return false;

    // Show on Sundays OR if last entry was 7+ days ago (or no entries)
    if (dow === 0) return true;
    if (allEntries.length === 0) return true;
    const lastDate = allEntries[allEntries.length - 1].date;
    const daysSince =
      (parseLocalDate(today).getTime() - parseLocalDate(lastDate).getTime()) /
      (24 * 3600 * 1000);
    return daysSince >= 7;
  }, [allEntries, today, dow, dismissed]);

  if (!shouldShow || feedback !== null) {
    // Show feedback message after logging
    if (feedback) {
      return (
        <div className="rounded-2xl bg-card border border-border p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Weight logged!</p>
            <p className={cn("text-xs mt-1", feedback.color)}>{feedback.msg}</p>
          </div>
        </div>
      );
    }
    return null;
  }

  async function handleSubmit() {
    const kg = parseFloat(inputVal);
    if (isNaN(kg) || kg < 20 || kg > 300) {
      setError("Enter a valid weight (20–300 kg)");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await db.bodyweightEntries.add({
        id: crypto.randomUUID(),
        date: today,
        weight: kg,
      });

      // Compute delta vs average of entries from 7–14 days ago (prior week)
      const sorted = [...(allEntries ?? [])].sort((a, b) =>
        a.date.localeCompare(b.date)
      );
      const todayMs = parseLocalDate(today).getTime();
      const priorWindow = sorted.filter((e) => {
        const ms = parseLocalDate(e.date).getTime();
        const daysAgo = (todayMs - ms) / (24 * 3600 * 1000);
        return daysAgo >= 7 && daysAgo <= 14;
      });

      if (priorWindow.length > 0) {
        const avg =
          priorWindow.reduce((s, e) => s + e.weight, 0) / priorWindow.length;
        const delta = kg - avg;
        setFeedback(getFeedback(delta));
      } else if (sorted.length > 0) {
        // Fallback: compare to most recent prior entry
        const prior = sorted[sorted.length - 1];
        const weeksElapsed =
          (todayMs - parseLocalDate(prior.date).getTime()) /
          (7 * 24 * 3600 * 1000);
        const weeklyDelta = weeksElapsed > 0 ? (kg - prior.weight) / weeksElapsed : 0;
        setFeedback(getFeedback(weeklyDelta));
      } else {
        setFeedback({ msg: "First entry saved — check back next week!", color: "text-muted-foreground" });
      }

      setInputVal("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center">
          <Scale className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Weekly Check-in</p>
          <p className="text-xs text-muted-foreground">Log this week&apos;s weight</p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-muted-foreground/50 hover:text-muted-foreground px-1 py-0.5"
        >
          Skip
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="number"
            inputMode="decimal"
            step="0.1"
            value={inputVal}
            onChange={(e) => {
              setInputVal(e.target.value);
              setError("");
            }}
            placeholder="e.g. 65.5"
            className="w-full rounded-xl border border-input bg-background px-4 py-2.5 pr-9 text-sm font-semibold tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            kg
          </span>
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || !inputVal}
          className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 active:opacity-70"
        >
          Save
        </button>
      </div>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
