"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

export interface ProgressionPoint {
  date: string;   // "MMM d" display label
  weight: number; // kg
  isPR: boolean;
}

interface Props {
  data: ProgressionPoint[];
  unit?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as ProgressionPoint;
  return (
    <div className="rounded-xl bg-card border border-border px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-foreground">{d.date}</p>
      <p className="text-muted-foreground mt-0.5">
        {d.weight} kg{d.isPR ? " 🏆 PR" : ""}
      </p>
    </div>
  );
}

export function ProgressionLineChart({ data, unit = "kg" }: Props) {
  if (data.length === 0) return null;

  const prPoints = data.filter((d) => d.isPR);

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(240 3.7% 15.9%)"
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: "hsl(240 5% 64.9%)", fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          unit={` ${unit}`}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(240 5% 64.9%)", strokeWidth: 1 }} />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="hsl(0 0% 98%)"
          strokeWidth={2}
          dot={{ r: 3, fill: "hsl(0 0% 98%)", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "hsl(0 0% 98%)", strokeWidth: 0 }}
        />
        {prPoints.map((p) => (
          <ReferenceDot
            key={p.date}
            x={p.date}
            y={p.weight}
            r={5}
            fill="hsl(38 92% 50%)"
            stroke="hsl(240 10% 3.9%)"
            strokeWidth={1.5}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
