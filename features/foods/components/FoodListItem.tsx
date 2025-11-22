"use client";

import { useState } from "react";
import type { FoodItem } from "@/utils/supabase/queries";
import { deleteFood } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";

interface FoodListItemProps {
  readonly food: FoodItem;
  readonly onDelete: () => Promise<void>;
}

export function FoodListItem({ food, onDelete }: FoodListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${food.name}"? This action cannot be undone.`)) {
      return;
    }

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

  const macros = {
    calories: Math.round(food.calories),
    protein: Math.round((food.protein ?? 0) * 10) / 10,
    carbs: Math.round((food.carbs ?? 0) * 10) / 10,
    fat: Math.round((food.fat ?? 0) * 10) / 10,
    fiber: food.fiber ? Math.round(food.fiber * 10) / 10 : null,
  };

  return (
    <div className="flex items-center justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="flex-1">
        <Text className="font-medium">{food.name}</Text>
        <Text className="mt-1 text-sm text-zinc-500">
          Per 100{food.base_unit}: {macros.calories} cal • P: {macros.protein}g
          • C: {macros.carbs}g • F: {macros.fat}g
          {macros.fiber && ` • Fiber: ${macros.fiber}g`}
        </Text>
      </div>
      <Button
        plain
        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </Button>
    </div>
  );
}
