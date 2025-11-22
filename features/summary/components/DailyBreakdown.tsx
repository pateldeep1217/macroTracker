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
  if (weekData.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <Text className="text-sm font-medium">Daily Breakdown</Text>
      <div className="mt-3 space-y-2">
        {weekData.map((day) => (
          <div
            key={day.date}
            className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
          >
            <Text className="text-sm font-medium">{formatDate(day.date)}</Text>
            <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <span>{Math.round(day.calories)} cal</span>
              <span>P: {Math.round(day.protein)}g</span>
              <span>C: {Math.round(day.carbs)}g</span>
              <span>F: {Math.round(day.fat)}g</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
