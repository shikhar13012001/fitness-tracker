"use client";

import { useState, useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { kgToDisplay, displayToKg } from "@/lib/units";
import type { Unit } from "@/lib/units";

// ─── Plate math ────────────────────────────────────────────────────────────

const DEFAULT_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

interface PlateResult {
  platesPerSide: { weight: number; count: number }[];
  totalLoaded: number; // includes bar
  remainder: number;   // weight that couldn't be loaded (should be 0)
}

function calculatePlates(
  targetKg: number,
  barKg: number,
  availableKg: number[]
): PlateResult {
  const sorted = [...availableKg].sort((a, b) => b - a);
  let remaining = (targetKg - barKg) / 2;
  const platesPerSide: { weight: number; count: number }[] = [];

  for (const plate of sorted) {
    if (remaining <= 0) break;
    const count = Math.floor(remaining / plate);
    if (count > 0) {
      platesPerSide.push({ weight: plate, count });
      remaining -= plate * count;
    }
  }

  const loaded = barKg + platesPerSide.reduce((s, p) => s + p.weight * p.count * 2, 0);
  return {
    platesPerSide,
    totalLoaded: loaded,
    remainder: Math.round(remaining * 100) / 100,
  };
}

// ─── Plate colour map ────────────────────────────────────────────────────────

function plateColor(kg: number): string {
  if (kg >= 25) return "bg-red-500";
  if (kg >= 20) return "bg-blue-500";
  if (kg >= 15) return "bg-yellow-500";
  if (kg >= 10) return "bg-green-500";
  if (kg >= 5) return "bg-white text-black";
  if (kg >= 2.5) return "bg-zinc-400 text-black";
  return "bg-zinc-600";
}

// ─── Visual plate stack ──────────────────────────────────────────────────────

function PlateStack({
  platesPerSide,
  unit,
}: {
  platesPerSide: { weight: number; count: number }[];
  unit: Unit;
}) {
  if (platesPerSide.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Just the bar.
      </p>
    );
  }

  const allPlates = platesPerSide.flatMap(({ weight, count }) =>
    Array(count).fill(weight)
  );

  return (
    <div className="flex items-center gap-1 flex-wrap justify-center py-3">
      {/* Bar end */}
      <div className="h-4 w-8 rounded-sm bg-zinc-500 shrink-0" />
      {/* Plates */}
      {allPlates.map((w, i) => {
        const displayW = unit === "lbs" ? Math.round(w * 2.20462 * 10) / 10 : w;
        const colorClass = plateColor(w);
        const heightClass =
          w >= 25
            ? "h-16"
            : w >= 20
            ? "h-14"
            : w >= 15
            ? "h-12"
            : w >= 10
            ? "h-10"
            : w >= 5
            ? "h-8"
            : "h-6";
        return (
          <div
            key={i}
            className={`${heightClass} w-6 rounded-sm flex items-center justify-center ${colorClass} shrink-0`}
          >
            <span className="text-[9px] font-bold leading-none rotate-90">
              {displayW}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PlateCalculator() {
  const profile = useLiveQuery(() => db.userProfile.get(1));
  const unit: Unit = profile?.units ?? "kg";

  // Inputs in display units
  const [targetInput, setTargetInput] = useState("");
  const [barInput, setBarInput] = useState(
    String(kgToDisplay(20, unit === "lbs" ? "lbs" : "kg"))
  );
  const [customPlates, setCustomPlates] = useState<string>(
    DEFAULT_PLATES_KG.join(", ")
  );
  const [showCustomPlates, setShowCustomPlates] = useState(false);

  // Sync bar default when unit changes
  const defaultBarDisplay = unit === "lbs" ? "44" : "20";

  const availablePlatesKg = useMemo(() => {
    return customPlates
      .split(",")
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v) && v > 0)
      .map((v) => (unit === "lbs" ? v * 0.453592 : v));
  }, [customPlates, unit]);

  const result = useMemo<PlateResult | null>(() => {
    const target = parseFloat(targetInput);
    const bar = parseFloat(barInput || defaultBarDisplay);
    if (isNaN(target) || isNaN(bar) || target <= bar) return null;

    const targetKg = displayToKg(target, unit);
    const barKg = displayToKg(bar, unit);

    return calculatePlates(targetKg, barKg, availablePlatesKg);
  }, [targetInput, barInput, defaultBarDisplay, availablePlatesKg, unit]);

  const perSideKg = result
    ? result.platesPerSide.reduce((s, p) => s + p.weight * p.count, 0)
    : 0;

  return (
    <div className="min-h-svh bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/more" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <Calculator size={18} className="text-primary" />
        <h1 className="text-lg font-semibold">Plate Calculator</h1>
      </div>

      <div className="px-4 pt-5 space-y-5 max-w-lg mx-auto">
        {/* Inputs */}
        <div className="bg-card rounded-2xl border border-border divide-y divide-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <label className="text-sm text-foreground">Target weight ({unit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={unit === "lbs" ? "225" : "100"}
              className="w-24 text-right bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-4 py-3.5">
            <label className="text-sm text-foreground">Bar weight ({unit})</label>
            <input
              type="number"
              inputMode="decimal"
              value={barInput}
              onChange={(e) => setBarInput(e.target.value)}
              placeholder={defaultBarDisplay}
              className="w-24 text-right bg-transparent text-sm font-semibold text-foreground focus:outline-none"
            />
          </div>
          <div className="px-4 py-3">
            <button
              onClick={() => setShowCustomPlates((v) => !v)}
              className="text-xs text-primary font-medium"
            >
              {showCustomPlates ? "▲ Hide" : "▼ Edit"} available plates ({unit})
            </button>
            {showCustomPlates && (
              <div className="mt-2">
                <p className="text-xs text-muted-foreground mb-1">
                  Comma-separated plate sizes in {unit}:
                </p>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customPlates}
                  onChange={(e) => setCustomPlates(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {result && result.platesPerSide.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">
                Plates per side
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total on bar:{" "}
                <span className="font-semibold text-foreground">
                  {kgToDisplay(result.totalLoaded, unit).toFixed(1)} {unit}
                </span>
                {result.remainder > 0.01 && (
                  <span className="ml-2 text-yellow-400">
                    (±{kgToDisplay(result.remainder, unit).toFixed(2)} {unit} remainder)
                  </span>
                )}
              </p>
            </div>

            {/* Plate visual */}
            <div className="px-4 py-2 border-b border-border bg-muted/20 overflow-x-auto">
              <PlateStack platesPerSide={result.platesPerSide} unit={unit} />
            </div>

            {/* Breakdown text */}
            <div className="px-4 py-3 space-y-2">
              {result.platesPerSide.map(({ weight, count }) => {
                const displayW =
                  unit === "lbs" ? Math.round(weight * 2.20462 * 10) / 10 : weight;
                return (
                  <div key={weight} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-5 w-5 rounded-sm ${plateColor(weight)} flex items-center justify-center`}
                      >
                        <span className="text-[8px] font-bold leading-none">
                          {displayW}
                        </span>
                      </div>
                      <span className="text-sm text-foreground">
                        {displayW} {unit}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      × {count}
                    </span>
                  </div>
                );
              })}

              {/* Per-side summary */}
              <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Per side:{" "}
                  <span className="font-semibold text-foreground">
                    {kgToDisplay(perSideKg, unit).toFixed(1)} {unit}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {result.platesPerSide
                    .map(({ weight, count }) => {
                      const w =
                        unit === "lbs" ? Math.round(weight * 2.20462 * 10) / 10 : weight;
                      return count > 1 ? `${count}×${w}` : `${w}`;
                    })
                    .join(" + ")}{" "}
                  = {kgToDisplay(perSideKg, unit).toFixed(1)} {unit}/side
                </p>
              </div>
            </div>
          </div>
        ) : targetInput && parseFloat(targetInput) > 0 ? (
          <div className="bg-card rounded-2xl border border-border p-4">
            <p className="text-sm text-muted-foreground text-center">
              {parseFloat(targetInput) <= parseFloat(barInput || defaultBarDisplay)
                ? "Target must be greater than bar weight."
                : result?.remainder !== undefined && result.remainder > 0.01
                ? `Can't load exactly — closest is ${kgToDisplay(result.totalLoaded, unit).toFixed(1)} ${unit}`
                : "Enter a target weight to calculate."}
            </p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-3 text-center">
            <Calculator size={32} className="text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Enter a target weight above to calculate which plates to load.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
