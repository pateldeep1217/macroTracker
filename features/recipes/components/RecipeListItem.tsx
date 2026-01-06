"use client";

import { useState } from "react";
import type { Recipe } from "@/utils/supabase/queries";
import { deleteRecipe } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Pencil, Trash2, Copy } from "lucide-react";

interface RecipeListItemProps {
  readonly recipe: Recipe;
  readonly onDelete: () => Promise<void>;
  readonly onEdit?: (recipe: Recipe) => void;
  readonly onCreateBatch?: (recipe: Recipe) => void;
}

export function RecipeListItem({
  recipe,
  onDelete,
  onEdit,
  onCreateBatch,
}: RecipeListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${recipe.name}"? This action cannot be undone.`))
      return;

    setIsDeleting(true);
    try {
      await deleteRecipe(recipe.id);
      await onDelete();
    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert("Failed to delete recipe");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Calculate per-serving macros
  const perServing = {
    calories: recipe.total_calories
      ? Math.round(recipe.total_calories / recipe.total_servings)
      : 0,
    protein: recipe.total_protein
      ? Math.round((recipe.total_protein / recipe.total_servings) * 10) / 10
      : 0,
    carbs: recipe.total_carbs
      ? Math.round((recipe.total_carbs / recipe.total_servings) * 10) / 10
      : 0,
    fat: recipe.total_fat
      ? Math.round((recipe.total_fat / recipe.total_servings) * 10) / 10
      : 0,
  };

  return (
    <div
      className={`rounded-lg border p-3 ${
        recipe.is_base_recipe
          ? "bg-zinc-900 border-zinc-700"
          : "bg-zinc-800/50 border-zinc-700/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {recipe.is_base_recipe && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                BASE
              </span>
            )}
            {!recipe.is_base_recipe && recipe.batch_date && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                BATCH
              </span>
            )}
            <h3 className="text-sm font-semibold text-white truncate">
              {recipe.is_base_recipe
                ? recipe.name
                : formatDate(recipe.batch_date)}
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
            <span>{recipe.total_servings} servings</span>
            {recipe.created_by_name && (
              <>
                <span>•</span>
                <span>by {recipe.created_by_name}</span>
              </>
            )}
            {!recipe.is_base_recipe && formatDate(recipe.created_at) && (
              <>
                <span>•</span>
                <span>Created {formatDate(recipe.created_at)}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Create Batch button (only for base recipes) */}
          {recipe.is_base_recipe && onCreateBatch && (
            <button
              onClick={() => onCreateBatch(recipe)}
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-green-400 transition-colors"
              aria-label="Create new batch"
              title="Create new batch"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(recipe)}
              className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              aria-label="Edit recipe"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Delete recipe"
          >
            {isDeleting ? (
              <div className="h-4 w-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Per-Serving Macros */}
      {perServing.calories > 0 && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-white">
              {perServing.calories}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Cal
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-blue-400">
              {perServing.protein}g
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Protein
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-orange-400">
              {perServing.carbs}g
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Carbs
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-yellow-400">
              {perServing.fat}g
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Fat
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
