"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

export interface MuscleSlice {
  name: string;   // "Push" | "Pull" | "Legs" | "Core"
  volume: number;
}

const COLORS: Record<string, string> = {
  Push: "hsl(217 91% 60%)",
  Pull: "hsl(142 71% 45%)",
  Legs: "hsl(38 92% 50%)",
  Core: "hsl(280 65% 60%)",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as MuscleSlice;
  const pct = payload[0].percent != null ? `${(payload[0].percent * 100).toFixed(0)}%` : "";
  return (
    <div className="rounded-xl bg-card border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{d.name}</p>
      <p className="text-muted-foreground mt-0.5">{pct} of volume</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  if (!payload) return null;
  return (
    <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-2">
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any) => (
        <li key={entry.value} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: entry.color }} />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export function MuscleGroupPieChart({ data }: { data: MuscleSlice[] }) {
  const nonZero = data.filter((d) => d.volume > 0);
  if (nonZero.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={nonZero}
          dataKey="volume"
          nameKey="name"
          cx="50%"
          cy="45%"
          innerRadius={48}
          outerRadius={72}
          paddingAngle={3}
          strokeWidth={0}
        >
          {nonZero.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "hsl(240 5% 64.9%)"} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
