"use client";

import { useState } from "react";
import type { FoodItem } from "@/utils/supabase/queries";
import { deleteFood } from "@/utils/supabase/queries";
import { Pencil, Trash2 } from "lucide-react";
import { getServingMacros } from "@/features/shared/utils/macors";

interface FoodListItemProps {
  readonly food: FoodItem;
  readonly onDelete: () => Promise<void>;
  readonly onEdit?: (food: FoodItem) => void;
}

export function FoodListItem({ food, onDelete, onEdit }: FoodListItemProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${food.name}"? This action cannot be undone.`))
      return;

    setIsDeleting(true);
    try {
      await deleteFood(food.id);
      await onDelete();
    } catch (error) {
      console.error("Error deleting food:", error);
      alert("Failed to delete food item");
    } finally {
      setIsDeleting(false);
    }
  };

  // Get macros for one serving
  const serving = getServingMacros(food);

  // Format serving display
  const getServingDisplay = () => {
    if (!food.serving_size) {
      return `Per 100${food.base_unit}`;
    }

    if (food.serving_label) {
      // e.g., "1 scoop (30g)" or "1 cup (240ml)"
      return `${food.serving_label} (${food.serving_size}${food.base_unit})`;
    }

    // Fallback: just show the size
    return `${food.serving_size}${food.base_unit}`;
  };

  return (
    <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-white truncate">
            {food.name}
          </h3>
          <p className="text-sm text-zinc-400 mt-0.5">
            Per serving: {getServingDisplay()}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(food)}
              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
              aria-label="Edit food"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Delete food"
          >
            {isDeleting ? (
              <div className="h-4 w-4 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {serving && (
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-white">
              {serving.calories.toFixed(0)}
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Cal
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-blue-400">
              {serving.protein.toFixed(1)}g
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Protein
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-orange-400">
              {serving.carbs.toFixed(1)}g
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Carbs
            </div>
          </div>
          <div className="bg-zinc-800/50 rounded p-2">
            <div className="text-lg font-bold text-yellow-400">
              {serving.fat.toFixed(1)}g
            </div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
              Fat
            </div>
          </div>
        </div>
      )}

      {/* Show per-100g info as secondary info */}
      <div className="mt-2 pt-2 border-t border-zinc-800/50">
        <p className="text-xs text-zinc-500">
          Per 100{food.base_unit}: {food.calories.toFixed(0)} cal,{" "}
          {(food.protein ?? 0).toFixed(1)}g protein,{" "}
          {(food.carbs ?? 0).toFixed(1)}g carbs, {(food.fat ?? 0).toFixed(1)}g
          fat
        </p>
      </div>
    </div>
  );
}
