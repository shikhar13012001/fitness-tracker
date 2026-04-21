"use client";

import { cn } from "@/lib/utils";
import type { WorkoutSession } from "@/lib/db";

const DOW_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  year: number;
  month: number; // 0-indexed
  today: string;
  sessionsByDate: Map<string, WorkoutSession>;
  workoutDows: Set<number>;
  selectedDate: string | null;
  onDayPress: (ds: string) => void;
}

export function CalendarGrid({
  year,
  month,
  today,
  sessionsByDate,
  workoutDows,
  selectedDate,
  onDayPress,
}: Props) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Mon-first grid: Mon=0 … Sun=6
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((l) => (
          <div
            key={l}
            className="text-center text-[10px] font-medium text-muted-foreground py-1"
          >
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="h-12" />;

          const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isFuture = ds > today;
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const session = sessionsByDate.get(ds);
          const dow = new Date(year, month, day).getDay();
          const isWorkoutDay = workoutDows.has(dow);

          // Dot element
          let dot: React.ReactNode = null;
          if (isFuture) {
            if (isWorkoutDay) {
              dot = (
                <span className="block w-1.5 h-1.5 rounded-full border border-muted-foreground/30 mx-auto mt-0.5" />
              );
            }
          } else if (session) {
            dot = (
              <span className="block w-1.5 h-1.5 rounded-full bg-green-500 mx-auto mt-0.5" />
            );
          } else if (isWorkoutDay) {
            dot = (
              <span className="block w-1.5 h-1.5 rounded-full bg-red-500 mx-auto mt-0.5" />
            );
          } else {
            dot = (
              <span className="block w-1.5 h-1.5 rounded-full bg-muted-foreground/25 mx-auto mt-0.5" />
            );
          }

          return (
            <button
              key={ds}
              onClick={() => onDayPress(ds)}
              className={cn(
                "flex flex-col items-center justify-center h-12 rounded-xl transition-colors",
                isSelected && "bg-primary/15",
                !isSelected && isToday && "ring-1 ring-inset ring-primary/60",
                !isSelected && !isToday && "hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "text-xs font-medium leading-none",
                  isToday ? "text-primary font-bold" : "text-foreground",
                  isFuture && !isToday && "text-muted-foreground/40"
                )}
              >
                {day}
              </span>
              {dot}
            </button>
          );
        })}
      </div>
    </div>
  );
}
