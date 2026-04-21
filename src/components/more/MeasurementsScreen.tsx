"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, Ruler, Plus, Trash2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { db } from "@/lib/db";
import type { BodyMeasurement } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { cn } from "@/lib/utils";

// ─── Field metadata ──────────────────────────────────────────────────────────

type MeasurementKey = keyof Omit<BodyMeasurement, "id" | "date">;

const FIELDS: { key: MeasurementKey; label: string; color: string }[] = [
  { key: "chest",     label: "Chest",      color: "hsl(217 91% 60%)" },
  { key: "waist",     label: "Waist",      color: "hsl(0 72% 51%)" },
  { key: "leftArm",   label: "Left Arm",   color: "hsl(38 92% 50%)" },
  { key: "rightArm",  label: "Right Arm",  color: "hsl(38 60% 60%)" },
  { key: "leftThigh", label: "Left Thigh", color: "hsl(280 65% 60%)" },
  { key: "rightThigh",label: "Right Thigh",color: "hsl(300 55% 65%)" },
];

function parseLocalDate(s: string): Date {
  return new Date(s + "T12:00:00");
}

function shortDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(s: string): string {
  return parseLocalDate(s).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Mini trend chart per field ──────────────────────────────────────────────

function MiniTrendChart({
  entries,
  fieldKey,
  color,
}: {
  entries: BodyMeasurement[];
  fieldKey: MeasurementKey;
  color: string;
}) {
  const data = useMemo(() => {
    return entries
      .filter((e) => e[fieldKey] !== null)
      .map((e) => ({
        label: shortDate(e.date),
        value: e[fieldKey] as number,
      }));
  }, [entries, fieldKey]);

  if (data.length < 2) return null;

  const vals = data.map((d) => d.value);
  const minV = Math.floor(Math.min(...vals) - 0.5);
  const maxV = Math.ceil(Math.max(...vals) + 0.5);

  return (
    <ResponsiveContainer width="100%" height={120}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 3.7% 15.9%)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minV, maxV]}
          tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 9 }}
          tickLine={false}
          axisLine={false}
          unit="cm"
          width={44}
        />
        <Tooltip
          contentStyle={{
            background: "hsl(240 10% 3.9%)",
            border: "1px solid hsl(240 3.7% 15.9%)",
            borderRadius: 10,
            fontSize: 11,
          }}
          labelStyle={{ color: "hsl(0 0% 98%)", fontWeight: 600 }}
          itemStyle={{ color }}
          formatter={(v) => [`${v} cm`, ""]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function MeasurementsScreen() {
  const router = useRouter();
  const today = todayString();

  // Form state — one input per field
  const [form, setForm] = useState<Record<MeasurementKey, string>>({
    chest: "", waist: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const allEntries = useLiveQuery(
    async (): Promise<BodyMeasurement[]> =>
      db.bodyMeasurements.orderBy("date").toArray(),
    []
  );

  const todayEntry = useMemo(
    () => allEntries?.find((e) => e.date === today),
    [allEntries, today]
  );

  // Check if we should prompt (Sunday or 7+ days since last entry)
  const shouldPrompt = useMemo(() => {
    if (!allEntries) return false;
    if (allEntries.some((e) => e.date === today)) return false;
    const dow = new Date().getDay();
    if (dow === 0) return true;
    if (allEntries.length === 0) return true;
    const lastDate = allEntries[allEntries.length - 1].date;
    const daysSince =
      (parseLocalDate(today).getTime() - parseLocalDate(lastDate).getTime()) /
      (24 * 3600 * 1000);
    return daysSince >= 7;
  }, [allEntries, today]);

  function updateField(key: MeasurementKey, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setError("");
  }

  async function handleSave() {
    const parsed: Partial<Record<MeasurementKey, number | null>> = {};
    let anyFilled = false;
    for (const { key } of FIELDS) {
      const v = form[key].trim();
      if (v === "") {
        parsed[key] = null;
      } else {
        const n = parseFloat(v);
        if (isNaN(n) || n < 1 || n > 200) {
          setError(`${FIELDS.find((f) => f.key === key)?.label} must be between 1–200 cm`);
          return;
        }
        parsed[key] = n;
        anyFilled = true;
      }
    }
    if (!anyFilled) {
      setError("Fill in at least one measurement");
      return;
    }
    setSaving(true);
    try {
      const entry: BodyMeasurement = {
        id: todayEntry?.id ?? crypto.randomUUID(),
        date: today,
        ...(parsed as Record<MeasurementKey, number | null>),
      };
      if (todayEntry) {
        await db.bodyMeasurements.put(entry);
      } else {
        await db.bodyMeasurements.add(entry);
      }
      setForm({ chest: "", waist: "", leftArm: "", rightArm: "", leftThigh: "", rightThigh: "" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    await db.bodyMeasurements.delete(id);
  }

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
        <Ruler className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold text-foreground">Measurements</h1>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-8 space-y-5 max-w-lg mx-auto">

          {/* Log form — always visible (or highlighted if prompt) */}
          <div className={cn(
            "rounded-2xl bg-card border overflow-hidden",
            shouldPrompt ? "border-primary/40" : "border-border"
          )}>
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">
                {todayEntry ? "Update today's measurements" : shouldPrompt ? "📏 Weekly Check-in" : "Log measurements"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">All fields optional — in cm</p>
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {FIELDS.map(({ key, label }) => (
                  <div key={key}>
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1 block">
                      {label}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={form[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder={
                          todayEntry?.[key]
                            ? String(todayEntry[key])
                            : "—"
                        }
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 pr-8 text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                        cm
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold disabled:opacity-40 active:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {todayEntry ? "Update" : "Save measurements"}
              </button>
            </div>
          </div>

          {/* Trend charts — one per field that has ≥2 data points */}
          {allEntries && allEntries.length >= 2 && (
            <div className="space-y-3">
              {FIELDS.map(({ key, label, color }) => {
                const hasData = allEntries.filter((e) => e[key] !== null).length >= 2;
                if (!hasData) return null;
                return (
                  <div key={key} className="rounded-2xl bg-card border border-border overflow-hidden">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-foreground">{label}</p>
                    </div>
                    <div className="p-4">
                      <MiniTrendChart entries={allEntries} fieldKey={key} color={color} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* History list */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">History</span>
              <span className="text-xs text-muted-foreground">{allEntries?.length ?? 0} entries</span>
            </div>

            {!allEntries || allEntries.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center px-6">
                <Ruler className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No measurements yet.</p>
                <p className="text-xs text-muted-foreground/60">
                  Log your first measurements above.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {[...allEntries].reverse().map((entry) => {
                  const filledFields = FIELDS.filter((f) => entry[f.key] !== null);
                  return (
                    <li key={entry.id} className="px-4 py-3.5 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <p className="text-sm font-semibold text-foreground">
                            {formatFullDate(entry.date)}
                          </p>
                          {entry.date === today && (
                            <span className="text-[10px] bg-primary/10 text-primary rounded-full px-2 py-0.5 font-semibold">
                              Today
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                          {filledFields.map(({ key, label }) => (
                            <span key={key} className="text-xs text-muted-foreground">
                              {label}: <span className="text-foreground font-medium">{entry[key]} cm</span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 mt-0.5"
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
