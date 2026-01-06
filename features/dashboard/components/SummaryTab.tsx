"use client";

import { useState } from "react";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { sumMacros, calculateMealMacros } from "@/features/shared/utils/macors";
import { MacroStatsGrid } from "@/features/shared/components/MacroStatsGrid";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { MEAL_TYPES } from "@/features/shared/utils/constatns";
import { MealBreakdown } from "@/features/meals/components/MealBreakdown";

interface SummaryTabProps {
  readonly userId: string;
  readonly userName: string;
  readonly selectedDate: string;
  readonly meals: readonly MealEntryWithDetails[];
}

export function SummaryTab({ userName, selectedDate, meals }: SummaryTabProps) {
  const [copied, setCopied] = useState(false);

  const todayTotals = sumMacros(meals as MealEntryWithDetails[]);

  const handleCopySummary = async () => {
    const summaryText = generateSummaryText();
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const generateSummaryText = () => {
    const groupedMeals = MEAL_TYPES.map(
      (type) => [type, meals.filter((m) => m.meal_type === type)] as const
    );

    const mealsList = groupedMeals
      .flatMap(([mealType, mealEntries]) => {
        if (mealEntries.length === 0) return [];
        return [
          `\n${mealType.toUpperCase()}:`,
          ...mealEntries.map((meal) => {
            const name =
              meal.food_items?.name || meal.recipes?.name || "Unknown";
            const macros = calculateMealMacros(meal);
            const cal = Math.round(macros.calories);
            const p = Math.round(macros.protein * 10) / 10;
            const c = Math.round(macros.carbs * 10) / 10;
            const f = Math.round(macros.fat * 10) / 10;
            return `  • ${name}: ${cal} cal | P: ${p}g | C: ${c}g | F: ${f}g`;
          }),
        ];
      })
      .join("\n");

    return `📊 Daily Summary - ${formatDateLong(selectedDate)}
👤 ${userName}

🔥 Calories: ${Math.round(todayTotals.calories)}
🥩 Protein: ${Math.round(todayTotals.protein * 10) / 10}g (${
      todayTotals.calories > 0
        ? Math.round(((todayTotals.protein * 4) / todayTotals.calories) * 100)
        : 0
    }%)
🍞 Carbs: ${Math.round(todayTotals.carbs * 10) / 10}g (${
      todayTotals.calories > 0
        ? Math.round(((todayTotals.carbs * 4) / todayTotals.calories) * 100)
        : 0
    }%)
🥑 Fat: ${Math.round(todayTotals.fat * 10) / 10}g (${
      todayTotals.calories > 0
        ? Math.round(((todayTotals.fat * 9) / todayTotals.calories) * 100)
        : 0
    }%)
${mealsList}

Tracked with Food Macro Tracker`;
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-base font-semibold text-white sm:text-lg">
              Today&apos;s Summary
            </div>
          </div>

          <Button
            onClick={handleCopySummary}
            className="whitespace-nowrap text-sm h-9 flex items-center gap-2"
          >
            <ClipboardDocumentIcon className="w-4 h-4" />
            {copied ? "✓ Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <MacroStatsGrid
        calories={todayTotals.calories}
        protein={todayTotals.protein}
        carbs={todayTotals.carbs}
        fat={todayTotals.fat}
        entryCount={meals.length}
      />

      {/* Meal Breakdown or Empty State */}
      {meals.length > 0 ? (
        <div className="space-y-3">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Meals
          </Text>
          <MealBreakdown meals={meals} readOnly />
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-900 p-8 text-center sm:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-2 text-3xl sm:text-4xl">🍽️</div>
            <Text className="text-sm font-semibold text-white sm:text-base">
              No meals logged today
            </Text>
            <Text className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
              Go to Daily Log to start tracking
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
