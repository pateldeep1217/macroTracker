"use client";

import { useState } from "react";
import type { FoodItem } from "@/utils/supabase/queries";
import { deleteFood } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { getServingMacros } from "@/features/shared/utils/macors";

interface FoodListItemProps {
  readonly food: FoodItem;
  readonly onDelete: () => Promise<void>;
  readonly onEdit?: (food: FoodItem) => void;
}

export function FoodListItem({ food, onDelete, onEdit }: FoodListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${food.name}"? This action cannot be undone.`))
      return;

    setIsDeleting(true);
    try {
      await deleteFood(food.id);
      await onDelete();
    } catch (error) {
      console.error("Error deleting food:", error);
      alert("Failed to delete food item");
    } finally {
      setIsDeleting(false);
    }
  };

  // Per‑100g/ml macros (same as before)
  const per100 = {
    calories: Math.round(food.calories),
    protein: Math.round((food.protein ?? 0) * 10) / 10,
    carbs: Math.round((food.carbs ?? 0) * 10) / 10,
    fat: Math.round((food.fat ?? 0) * 10) / 10,
    fiber: food.fiber ? Math.round(food.fiber * 10) / 10 : null,
  };

  // NEW: Serving macros
  const serving = getServingMacros(food);

  return (
    <div className="flex items-start justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="flex-1 min-w-0">
        {/* NAME + SERVING LABEL */}
        <div className="flex items-baseline gap-2">
          <Text className="font-medium">{food.name}</Text>

          {food.serving_label && food.serving_size && (
            <Text className="text-xs text-zinc-500">
              {food.serving_label} ({food.serving_size}
              {food.base_unit})
            </Text>
          )}
        </div>

        {/* SERVING MACROS */}
        {serving && (
          <Text className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            {food.serving_label || "Serving"} — {serving.calories.toFixed(0)}{" "}
            cal • P: {serving.protein.toFixed(1)}g • C:{" "}
            {serving.carbs.toFixed(1)}g • F: {serving.fat.toFixed(1)}g
            {serving.fiber !== null && ` • Fiber: ${serving.fiber.toFixed(1)}g`}
          </Text>
        )}

        {/* PER 100g/ml */}
        <Text className="mt-1 text-xs text-zinc-500">
          Per 100{food.base_unit}: {per100.calories} cal • P: {per100.protein}g
          • C: {per100.carbs}g • F: {per100.fat}g
          {per100.fiber && ` • Fiber: ${per100.fiber}g`}
        </Text>
      </div>

      {/* ACTIONS */}
      <div className="flex gap-2 shrink-0">
        {onEdit && (
          <Button plain className="text-sm" onClick={() => onEdit(food)}>
            Edit
          </Button>
        )}
        <Button
          plain
          className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
