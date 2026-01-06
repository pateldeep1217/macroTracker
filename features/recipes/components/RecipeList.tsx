"use client";

import { useState, useMemo } from "react";
import type { Recipe } from "@/utils/supabase/queries";
import { Input } from "@/app/components/input";
import { Field } from "@/app/components/fieldset";
import { Text } from "@/app/components/text";
import { RecipeListItem } from "./RecipeListItem";

interface RecipeListProps {
  readonly recipes: readonly Recipe[];
  readonly onRecipeDeleted: () => Promise<void>;
  readonly onRecipeEdit?: (recipe: Recipe) => void;
  readonly onCreateBatch?: (recipe: Recipe) => void;
}

export function RecipeList({
  recipes,
  onRecipeDeleted,
  onRecipeEdit,
  onCreateBatch,
}: RecipeListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // Group recipes by base_recipe_name
  const groupedRecipes = useMemo(() => {
    const filtered = recipes.filter((r) =>
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Group by base_recipe_name
    const groups = new Map<string, Recipe[]>();

    filtered.forEach((recipe) => {
      const baseRecipeName = recipe.base_recipe_name || recipe.name;
      if (!groups.has(baseRecipeName)) {
        groups.set(baseRecipeName, []);
      }
      groups.get(baseRecipeName)!.push(recipe);
    });

    // Sort each group: base first, then batches by date
    groups.forEach((recipeList) => {
      recipeList.sort((a, b) => {
        if (a.is_base_recipe && !b.is_base_recipe) return -1;
        if (!a.is_base_recipe && b.is_base_recipe) return 1;
        if (a.batch_date && b.batch_date) {
          return (
            new Date(b.batch_date).getTime() - new Date(a.batch_date).getTime()
          );
        }
        return 0;
      });
    });

    return Array.from(groups.entries());
  }, [recipes, searchTerm]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="rounded-xl bg-zinc-900 p-3 sm:p-4">
        <Field>
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </Field>
      </div>

      {/* Grouped List */}
      {groupedRecipes.length > 0 ? (
        <div className="space-y-6">
          {groupedRecipes.map(([baseRecipeName, recipeList]) => (
            <div key={baseRecipeName} className="space-y-2">
              {/* Group Header */}
              <div className="flex items-center justify-between px-1">
                <Text className="text-sm font-semibold text-white">
                  {baseRecipeName}
                </Text>
                <Text className="text-xs text-zinc-500">
                  {recipeList.length}{" "}
                  {recipeList.length === 1 ? "version" : "versions"}
                </Text>
              </div>

              {/* Recipes in Group */}
              <div className="space-y-2">
                {recipeList.map((recipe) => (
                  <RecipeListItem
                    key={recipe.id}
                    recipe={recipe}
                    onDelete={onRecipeDeleted}
                    onEdit={onRecipeEdit}
                    onCreateBatch={onCreateBatch}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-900 p-8 text-center sm:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-2 text-3xl sm:text-4xl">🧑‍🍳</div>
            <Text className="text-sm font-semibold text-white sm:text-base">
              {searchTerm ? "No recipes found" : "No recipes yet"}
            </Text>
            <Text className="mt-1.5 text-xs text-zinc-400 sm:text-sm">
              {searchTerm
                ? "Try a different search term"
                : "Create your first recipe to get started"}
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}
