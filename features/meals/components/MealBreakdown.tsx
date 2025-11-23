"use client";

import { useState } from "react";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import {
  sumMacros,
  calculateMealMacros,
  formatMacros,
} from "@/features/shared/utils/macors";
import { formatNumber } from "@/features/shared/utils/formatting";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
} from "@/features/shared/utils/constatns";
import type { MealType } from "@/features/shared/utils/constatns";

interface MealBreakdownProps {
  readonly meals: readonly MealEntryWithDetails[];
  readonly onDelete?: (mealId: string) => Promise<void>;
  readonly readOnly?: boolean;
}

export function MealBreakdown({
  meals,
  onDelete,
  readOnly = false,
}: MealBreakdownProps) {
  const groupedMeals = MEAL_TYPES.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    meals: meals.filter((m) => m.meal_type === type),
  }));

  return (
    <div className="space-y-3">
      {groupedMeals.map(({ type, label, meals: mealEntries }) => {
        if (mealEntries.length === 0) return null;

        const mealTotals = sumMacros(mealEntries);

        return (
          <div
            key={type}
            className="rounded-xl bg-white dark:bg-zinc-900 overflow-hidden"
          >
            {/* Meal Type Header */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Text className="font-semibold text-sm capitalize">
                  {label}
                </Text>

                <div className="flex gap-4 text-xs text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">
                    {Math.round(mealTotals.calories)} cal
                  </span>
                  <span>P: {Math.round(mealTotals.protein)}g</span>
                  <span>C: {Math.round(mealTotals.carbs)}g</span>
                  <span>F: {Math.round(mealTotals.fat)}g</span>
                </div>
              </div>
            </div>

            {/* Meal Items */}
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {mealEntries.map((meal) => (
                <MealEntryRow
                  key={meal.id}
                  meal={meal}
                  onDelete={
                    readOnly || !onDelete ? undefined : () => onDelete(meal.id)
                  }
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Internal component
function MealEntryRow({
  meal,
  onDelete,
}: {
  meal: MealEntryWithDetails;
  onDelete?: () => Promise<void>;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm("Delete this entry?")) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Error deleting meal:", error);
      alert("Failed to delete entry");
    } finally {
      setIsDeleting(false);
    }
  };

  const macros = calculateMealMacros(meal);
  const formatted = formatMacros(macros);

  const displayName = meal.food_items
    ? `${meal.food_items.name} (${formatNumber(meal.quantity, 1)}${
        meal.quantity_type
      })`
    : meal.recipes
    ? `${meal.recipes.name} (${formatNumber(meal.quantity, 1)} serving${
        meal.quantity > 1 ? "s" : ""
      })`
    : "Unknown";

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Text className="font-medium text-sm truncate">{displayName}</Text>
          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {formatted.calories} cal • P: {formatted.protein}g • C:{" "}
            {formatted.carbs}g • F: {formatted.fat}g
          </Text>
        </div>
        {onDelete && (
          <Button
            plain
            className="text-xs flex-shrink-0"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "..." : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
