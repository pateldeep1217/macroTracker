"use client";

import { useState } from "react";
import type { FoodItem, Recipe } from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Divider } from "@/app/components/divider";
import { RecipeListItem } from "./RecipeListItem";
import { EmptyState } from "@/features/shared/components/EmptyState";

interface RecipeListProps {
  readonly recipes: readonly Recipe[];
  readonly foods: readonly FoodItem[];
}

export function RecipeList({ recipes, foods }: RecipeListProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <Subheading>Your Recipes ({recipes.length})</Subheading>

      <Divider className="my-4" />

      {recipes.length > 0 ? (
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <RecipeListItem key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No recipes yet"
          description="Create your first recipe above!"
        />
      )}
    </div>
  );
}
