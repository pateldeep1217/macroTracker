"use client";

import type { Recipe } from "@/utils/supabase/queries";
import { deleteRecipe } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { PencilIcon, TrashIcon } from "@heroicons/react/20/solid";

interface RecipeListItemProps {
  readonly recipe: Recipe;
  readonly onDelete: () => Promise<void>;
  readonly onEdit?: (recipe: Recipe) => void;
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function RecipeListItem({
  recipe,
  onDelete,
  onEdit,
}: RecipeListItemProps) {
  const handleDelete = async () => {
    if (!confirm(`Delete recipe "${recipe.name}"?`)) return;

    try {
      await deleteRecipe(recipe.id);
      await onDelete(); // refresh list
    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe");
    }
  };

  return (
    <div className="flex items-center justify-between rounded-xl border bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col">
        <Text className="text-base font-semibold text-zinc-900 dark:text-white">
          {recipe.name}
        </Text>

        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{recipe.total_servings} servings</span>
          <span>•</span>
          <span>Created {formatDate(recipe.created_at)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          plain
          onClick={() => onEdit?.(recipe)}
          className="text-blue-600 dark:text-blue-300"
        >
          <PencilIcon className="h-4 w-4" />
        </Button>

        <Button
          plain
          onClick={handleDelete}
          className="text-red-600 dark:text-red-300"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
