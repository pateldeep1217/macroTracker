"use client";

import { useState } from "react";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import {
  calculateMealMacros,
  formatMacros,
} from "@/features/shared/utils/macors";
import { formatNumber } from "@/features/shared/utils/formatting";

interface MealEntryRowProps {
  readonly meal: MealEntryWithDetails;
  readonly onDelete: () => Promise<void>;
}

export function MealEntryRow({ meal, onDelete }: MealEntryRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
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
    <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900">
      <div className="flex-1">
        <Text className="text-sm font-medium">{displayName}</Text>
        <Text className="text-xs text-zinc-500">
          {formatted.calories} cal • P: {formatted.protein}g • C:{" "}
          {formatted.carbs}g • F: {formatted.fat}g
        </Text>
      </div>
      <Button
        plain
        className="text-xs"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
