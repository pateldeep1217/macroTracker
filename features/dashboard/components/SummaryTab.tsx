"use client";

import { useState } from "react";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { sumMacros, calculateMealMacros } from "@/features/shared/utils/macors";
import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";

import { MEAL_TYPES } from "@/features/shared/utils/constatns";

interface SummaryTabProps {
  readonly userId: string;
  readonly userName: string;
  readonly selectedDate: string;
  readonly meals: readonly MealEntryWithDetails[];
}

export function SummaryTab({
  userId,
  userName,
  selectedDate,
  meals,
}: SummaryTabProps) {
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

  const groupedMeals = MEAL_TYPES.map(
    (type) => [type, meals.filter((m) => m.meal_type === type)] as const
  );

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 p-4 dark:bg-zinc-800">
        <div className="flex items-center justify-between gap-2">
          <Heading
            level={2}
            className="text-base font-semibold text-white sm:text-lg"
          >
            Today's Summary
          </Heading>
          <Button
            onClick={handleCopySummary}
            className="whitespace-nowrap text-sm"
          >
            {copied ? (
              "✓ Copied"
            ) : (
              <>
                <ClipboardDocumentIcon className="w-4 h-4" /> Copy
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Calories
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {Math.round(todayTotals.calories).toLocaleString()}
          </div>
          {meals.length > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {meals.length} {meals.length === 1 ? "entry" : "entries"}
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Protein
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {Math.round(todayTotals.protein * 10) / 10}
            <span className="text-base font-normal text-zinc-500">g</span>
          </div>
          {todayTotals.calories > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(
                ((todayTotals.protein * 4) / todayTotals.calories) * 100
              )}
              %
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Carbs
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {Math.round(todayTotals.carbs * 10) / 10}
            <span className="text-base font-normal text-zinc-500">g</span>
          </div>
          {todayTotals.calories > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(
                ((todayTotals.carbs * 4) / todayTotals.calories) * 100
              )}
              %
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Fat
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {Math.round(todayTotals.fat * 10) / 10}
            <span className="text-base font-normal text-zinc-500">g</span>
          </div>
          {todayTotals.calories > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(((todayTotals.fat * 9) / todayTotals.calories) * 100)}
              %
            </Text>
          )}
        </div>
      </div>

      {/* Meal Breakdown - Read Only */}
      {meals.length > 0 ? (
        <div className="space-y-3">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Meals
          </Text>

          {groupedMeals.map(([mealType, mealEntries]) => {
            if (mealEntries.length === 0) return null;

            const mealTotals = sumMacros(mealEntries);

            return (
              <div
                key={mealType}
                className="rounded-xl bg-white dark:bg-zinc-900 overflow-hidden"
              >
                {/* Meal Type Header */}
                <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center justify-between">
                    <Text className="font-semibold text-sm capitalize">
                      {mealType}
                    </Text>
                    <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                      <span>{Math.round(mealTotals.calories)} cal</span>
                      <span>P: {Math.round(mealTotals.protein)}g</span>
                      <span>C: {Math.round(mealTotals.carbs)}g</span>
                      <span>F: {Math.round(mealTotals.fat)}g</span>
                    </div>
                  </div>
                </div>

                {/* Meal Items */}
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {mealEntries.map((meal) => {
                    const macros = calculateMealMacros(meal);
                    return (
                      <div key={meal.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <Text className="font-medium text-sm truncate">
                              {meal.food_items?.name || meal.recipes?.name}
                            </Text>
                            <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {Math.round(macros.calories)} cal • P:{" "}
                              {Math.round(macros.protein * 10) / 10}g • C:{" "}
                              {Math.round(macros.carbs * 10) / 10}g • F:{" "}
                              {Math.round(macros.fat * 10) / 10}g
                            </Text>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-white p-8 text-center dark:bg-zinc-900 sm:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-2 text-3xl sm:text-4xl">🍽️</div>
            <Text className="text-sm font-semibold text-zinc-900 dark:text-white sm:text-base">
              No meals logged today
            </Text>
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
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
