"use client";

import { useState } from "react";
import type { Recipe, RecipeWithIngredients } from "@/utils/supabase/queries";
import { getRecipeWithIngredients } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { LoadingState } from "@/features/shared/components/LoadingState";

interface RecipeListItemProps {
  readonly recipe: Recipe;
}

export function RecipeListItem({ recipe }: RecipeListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [details, setDetails] = useState<RecipeWithIngredients | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    if (!isExpanded && !details) {
      setIsLoading(true);
      try {
        const data = await getRecipeWithIngredients(recipe.id);
        setDetails(data);
      } catch (error) {
        console.error("Error loading recipe details:", error);
      } finally {
        setIsLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const perServing = {
    calories: Math.round((recipe.total_calories ?? 0) / recipe.total_servings),
    protein:
      Math.round(((recipe.total_protein ?? 0) / recipe.total_servings) * 10) /
      10,
    carbs:
      Math.round(((recipe.total_carbs ?? 0) / recipe.total_servings) * 10) / 10,
    fat:
      Math.round(((recipe.total_fat ?? 0) / recipe.total_servings) * 10) / 10,
  };

  return (
    <div className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Text className="font-medium">{recipe.name}</Text>
          <Text className="mt-1 text-sm text-zinc-500">
            {recipe.total_servings} servings • Per serving:{" "}
            {perServing.calories} cal • P: {perServing.protein}g • C:{" "}
            {perServing.carbs}g • F: {perServing.fat}g
          </Text>
        </div>
        <Button plain className="text-sm" onClick={handleToggle}>
          {isExpanded ? "Hide" : "View"} Details
        </Button>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          {isLoading ? (
            <LoadingState message="Loading ingredients..." />
          ) : details ? (
            <>
              <Text className="text-sm font-medium">Ingredients:</Text>
              <div className="mt-2 space-y-1">
                {details.recipe_ingredients.map((ing) => (
                  <Text
                    key={ing.id}
                    className="text-sm text-zinc-600 dark:text-zinc-400"
                  >
                    • {ing.food_items.name} - {ing.quantity}
                    {ing.food_items.base_unit}
                  </Text>
                ))}
              </div>
            </>
          ) : (
            <Text className="text-sm text-zinc-500">
              Failed to load ingredients
            </Text>
          )}
        </div>
      )}
    </div>
  );
}
