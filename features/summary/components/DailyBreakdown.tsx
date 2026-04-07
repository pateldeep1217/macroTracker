"use client";

import { Text } from "@/app/components/text";
import { formatDate } from "@/features/shared/utils/formatting";

interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface DailyBreakdownProps {
  readonly weekData: readonly DayStats[];
}

export function DailyBreakdown({ weekData }: DailyBreakdownProps) {
  if (weekData.length === 0) return null;

  const maxCalories = Math.max(...weekData.map((d) => d.calories), 1);

  return (
    <div className="mt-6 space-y-3">
      <Text className="text-xs font-semibold uppercase tracking-widest text-zinc-500 px-1">
        Daily Breakdown
      </Text>
      <div className="space-y-1.5">
        {weekData.map((day) => {
          const pct = Math.min((day.calories / maxCalories) * 100, 100);
          return (
            <div
              key={day.date}
              className="group relative rounded-xl bg-zinc-900 border border-zinc-800/60 px-4 py-3 overflow-hidden hover:border-zinc-700 transition-colors duration-150"
            >
              {/* Background bar showing relative calories */}
              <div
                className="absolute inset-y-0 left-0 bg-zinc-800/50 rounded-xl transition-all duration-500"
                style={{ width: `${pct}%` }}
              />

              {/* Content */}
              <div className="relative flex items-center justify-between gap-4">
                <Text className="text-sm font-medium text-zinc-300 shrink-0 w-20">
                  {formatDate(day.date)}
                </Text>
                <div className="flex items-center gap-4 text-xs flex-wrap justify-end">
                  <span className="font-semibold text-white tabular-nums">
                    {Math.round(day.calories).toLocaleString()} cal
                  </span>
                  <span className="text-zinc-500">
                    P: <span className="text-blue-400 font-medium">{Math.round(day.protein)}g</span>
                  </span>
                  <span className="text-zinc-500">
                    C: <span className="text-emerald-400 font-medium">{Math.round(day.carbs)}g</span>
                  </span>
                  <span className="text-zinc-500">
                    F: <span className="text-amber-400 font-medium">{Math.round(day.fat)}g</span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}