"use client";

import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { MacroCard } from "@/features/shared/components/MacroCard";
import { DailyBreakdown } from "./DailyBreakdown";

interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface WeeklySummaryProps {
  readonly weekData: readonly DayStats[];
}

export function WeeklySummary({ weekData }: WeeklySummaryProps) {
  const weekTotals = weekData.reduce(
    (acc, day) => ({
      calories: acc.calories + day.calories,
      protein: acc.protein + day.protein,
      carbs: acc.carbs + day.carbs,
      fat: acc.fat + day.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const daysCount = weekData.length || 1;
  const weekAverages = {
    calories: Math.round(weekTotals.calories / daysCount),
    protein: Math.round((weekTotals.protein / daysCount) * 10) / 10,
    carbs: Math.round((weekTotals.carbs / daysCount) * 10) / 10,
    fat: Math.round((weekTotals.fat / daysCount) * 10) / 10,
  };

  return (
    <>
      {/* Averages */}
      <div className="mt-6">
        <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Daily Averages
        </Text>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border-2 border-blue-200 p-4 dark:border-blue-800">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              Avg Calories
            </Text>
            <Text className="mt-1 text-2xl font-semibold">
              {weekAverages.calories}
            </Text>
          </div>

          <div className="rounded-lg border-2 border-green-200 p-4 dark:border-green-800">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              Avg Protein
            </Text>
            <Text className="mt-1 text-2xl font-semibold">
              {weekAverages.protein}g
            </Text>
          </div>

          <div className="rounded-lg border-2 border-orange-200 p-4 dark:border-orange-800">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              Avg Carbs
            </Text>
            <Text className="mt-1 text-2xl font-semibold">
              {weekAverages.carbs}g
            </Text>
          </div>

          <div className="rounded-lg border-2 border-purple-200 p-4 dark:border-purple-800">
            <Text className="text-sm text-zinc-600 dark:text-zinc-400">
              Avg Fat
            </Text>
            <Text className="mt-1 text-2xl font-semibold">
              {weekAverages.fat}g
            </Text>
          </div>
        </div>
      </div>

      {/* Daily Breakdown */}
      <DailyBreakdown weekData={weekData} />
    </>
  );
}
