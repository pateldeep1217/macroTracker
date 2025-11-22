"use client";

import type { FoodItem } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { MacroCard } from "@/features/shared/components/MacroCard";

interface RecipeIngredient {
  food_id: string;
  quantity: number;
  tempId: string;
}

interface RecipePreviewProps {
  readonly ingredients: readonly RecipeIngredient[];
  readonly foods: readonly FoodItem[];
  readonly servings: number;
}

export function RecipePreview({
  ingredients,
  foods,
  servings,
}: RecipePreviewProps) {
  const totals = ingredients.reduce(
    (acc, ing) => {
      const food = foods.find((f) => f.id === ing.food_id);
      if (!food) return acc;

      const multiplier = ing.quantity / 100;
      return {
        calories: acc.calories + food.calories * multiplier,
        protein: acc.protein + (food.protein ?? 0) * multiplier,
        carbs: acc.carbs + (food.carbs ?? 0) * multiplier,
        fat: acc.fat + (food.fat ?? 0) * multiplier,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const perServing = {
    calories: Math.round(totals.calories / servings),
    protein: Math.round((totals.protein / servings) * 10) / 10,
    carbs: Math.round((totals.carbs / servings) * 10) / 10,
    fat: Math.round((totals.fat / servings) * 10) / 10,
  };

  return (
    <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
      <Text className="text-sm font-medium text-blue-900 dark:text-blue-100">
        Nutrition per Serving
      </Text>
      <div className="mt-3 grid grid-cols-4 gap-3">
        <div>
          <Text className="text-xs text-blue-700 dark:text-blue-300">
            Calories
          </Text>
          <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {perServing.calories}
          </Text>
        </div>
        <div>
          <Text className="text-xs text-blue-700 dark:text-blue-300">
            Protein
          </Text>
          <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {perServing.protein}g
          </Text>
        </div>
        <div>
          <Text className="text-xs text-blue-700 dark:text-blue-300">
            Carbs
          </Text>
          <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {perServing.carbs}g
          </Text>
        </div>
        <div>
          <Text className="text-xs text-blue-700 dark:text-blue-300">Fat</Text>
          <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {perServing.fat}g
          </Text>
        </div>
      </div>
    </div>
  );
}
