"use client";

import type { FoodItem } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { Label } from "@/app/components/fieldset";

interface RecipeIngredient {
  food_id: string;
  quantity: number;
  tempId: string;
}

interface IngredientListProps {
  readonly ingredients: readonly RecipeIngredient[];
  readonly foods: readonly FoodItem[];
  readonly onRemove: (tempId: string) => void;
}

export function IngredientList({
  ingredients,
  foods,
  onRemove,
}: IngredientListProps) {
  const getFoodName = (foodId: string) => {
    return foods.find((f) => f.id === foodId)?.name ?? "Unknown";
  };

  const getFoodUnit = (foodId: string) => {
    return foods.find((f) => f.id === foodId)?.base_unit ?? "";
  };

  return (
    <div>
      <Label>Ingredients ({ingredients.length})</Label>
      <div className="mt-2 space-y-2">
        {ingredients.map((ing) => (
          <div
            key={ing.tempId}
            className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
          >
            <Text className="text-sm">
              {getFoodName(ing.food_id)} - {ing.quantity}
              {getFoodUnit(ing.food_id)}
            </Text>
            <Button
              plain
              className="text-xs"
              onClick={() => onRemove(ing.tempId)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
