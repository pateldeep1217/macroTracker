"use client";

import { useState } from "react";
import type { Recipe, FoodItem } from "@/utils/supabase/queries";
import { Button } from "@/app/components/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/app/components/sheet";
import { RecipeList } from "@/features/recipes/components/RecipeList";
import { RecipeForm } from "@/features/recipes/components/RecipeForm";

interface RecipesTabProps {
  readonly recipes: readonly Recipe[];
  readonly onRefreshRecipes: () => Promise<void>;
  readonly userId: string;
  readonly userName: string;
  readonly foods: FoodItem[];
}

export function RecipesTab({
  recipes,
  onRefreshRecipes,
  userId,
}: RecipesTabProps) {
  const [showSheet, setShowSheet] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const handleSaved = async () => {
    await onRefreshRecipes();
    setShowSheet(false);
    setEditingRecipe(null);
  };

  const handleEdit = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setShowSheet(true);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-base font-semibold text-white sm:text-lg">
              Recipes
            </div>
            <div className="text-xs text-zinc-400">{recipes.length} items</div>
          </div>

          <Button
            onClick={() => setShowSheet(true)}
            className="h-9 whitespace-nowrap"
          >
            + Add Recipe
          </Button>
        </div>
      </div>

      {/* Recipe List */}
      <RecipeList
        recipes={recipes}
        onRecipeDeleted={onRefreshRecipes}
        onRecipeEdit={handleEdit}
      />

      {/* Add/Edit Sheet */}
      <Sheet
        open={showSheet}
        onOpenChange={(open) => {
          setShowSheet(open);
          if (!open) setEditingRecipe(null);
        }}
      >
        <SheetContent side="bottom" className="h-[95vh] sm:rounded-l-xl">
          <div className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>
                {editingRecipe ? "Edit Recipe" : "Add New Recipe"}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-6">
              <RecipeForm
                onRecipeSaved={handleSaved}
                editingRecipe={editingRecipe}
                userId={userId}
              />
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button plain>Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
