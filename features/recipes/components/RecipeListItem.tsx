"use client";

import { useState } from "react";
import type { Recipe } from "@/utils/supabase/queries";
import { deleteRecipe } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";

interface RecipeListItemProps {
  readonly recipe: Recipe;
  readonly onDelete: () => Promise<void>;
  readonly onEdit?: (recipe: Recipe) => void;
}

export function RecipeListItem({
  recipe,
  onDelete,
  onEdit,
}: RecipeListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete recipe "${recipe.name}"?`)) return;

    setIsDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      await onDelete(); // refresh parent list
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-start justify-between rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900">
      <div className="flex-1 min-w-0">
        <Text className="font-medium">{recipe.name}</Text>
        <Text className="mt-1 text-sm text-zinc-500">
          {recipe.total_servings} servings
        </Text>
      </div>

      <div className="flex gap-2 shrink-0">
        {onEdit && (
          <Button plain className="text-sm" onClick={() => onEdit(recipe)}>
            Edit
          </Button>
        )}

        <Button
          plain
          className="text-sm text-red-600"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
