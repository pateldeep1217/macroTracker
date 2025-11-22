"use client";

import type { FoodItem, Recipe } from "@/utils/supabase/queries";
import { RecipeForm } from "@/features/recipes/components/RecipeForm";
import { RecipeList } from "@/features/recipes/components/RecipeList";

interface RecipesTabProps {
  readonly userId: string;
  readonly userName: string;
  readonly recipes: readonly Recipe[];
  readonly foods: readonly FoodItem[];
  readonly onRefreshRecipes: () => Promise<void>;
}

export function RecipesTab({
  userId,
  userName,
  recipes,
  foods,
  onRefreshRecipes,
}: RecipesTabProps) {
  return (
    <div className="space-y-6">
      <RecipeForm
        userId={userId}
        userName={userName}
        foods={foods}
        onRecipeCreated={onRefreshRecipes}
      />
      <RecipeList recipes={recipes} foods={foods} />
    </div>
  );
}
