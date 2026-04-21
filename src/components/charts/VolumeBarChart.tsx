"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export interface VolumeWeek {
  label: string;  // "Wk 1", "Wk 2", …
  volume: number; // total kg
  isCurrent: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as VolumeWeek;
  const vol = d.volume >= 1000
    ? `${(d.volume / 1000).toFixed(1)} t`
    : `${Math.round(d.volume).toLocaleString()} kg`;
  return (
    <div className="rounded-xl bg-card border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{d.label}{d.isCurrent ? " (current)" : ""}</p>
      <p className="text-muted-foreground mt-0.5">{vol}</p>
    </div>
  );
}

export function VolumeBarChart({ data }: { data: VolumeWeek[] }) {
  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barSize={14}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(240 3.7% 15.9%)"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={44}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}t` : `${v}`
          }
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(240 3.7% 15.9%)" }} />
        <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell
              key={idx}
              fill={entry.isCurrent ? "hsl(0 0% 98%)" : "hsl(240 3.7% 25%)"}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
