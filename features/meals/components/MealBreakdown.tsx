"use client";

import { useState } from "react";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import {
  PencilIcon,
  TrashIcon,
  ClipboardIcon,
} from "@heroicons/react/24/outline";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import {
  sumMacros,
  calculateMealMacros,
  formatMacros,
} from "@/features/shared/utils/macors";
import { formatNumber } from "@/features/shared/utils/formatting";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
} from "@/features/shared/utils/constatns";
import type { MealType } from "@/features/shared/utils/constatns";

interface MealBreakdownProps {
  readonly meals: readonly MealEntryWithDetails[];
  readonly onDelete?: (mealId: string) => Promise<void>;
  readonly onEdit?: (meal: MealEntryWithDetails) => void;
  readonly readOnly?: boolean;
}

// Meal type icons and colors
const MEAL_CONFIG: Record<
  MealType,
  { icon: string; color: string; headerBg: string }
> = {
  Breakfast: {
    icon: "🍳",
    color: "text-orange-400",
    headerBg: "bg-gradient-to-r from-orange-500/20 to-orange-500/10",
  },
  Lunch: {
    icon: "🥗",
    color: "text-green-400",
    headerBg: "bg-gradient-to-r from-green-500/20 to-green-500/10",
  },
  Dinner: {
    icon: "🍽️",
    color: "text-blue-400",
    headerBg: "bg-gradient-to-r from-blue-500/20 to-blue-500/10",
  },
  Snacks: {
    icon: "🍪",
    color: "text-purple-400",
    headerBg: "bg-gradient-to-r from-purple-500/20 to-purple-500/10",
  },
  "Pre Workout": {
    icon: "💪",
    color: "text-red-400",
    headerBg: "bg-gradient-to-r from-red-500/20 to-red-500/10",
  },
  "Post Workout": {
    icon: "🥤",
    color: "text-cyan-400",
    headerBg: "bg-gradient-to-r from-cyan-500/20 to-cyan-500/10",
  },
};

export function MealBreakdown({
  meals,
  onDelete,
  onEdit,
  readOnly = false,
}: MealBreakdownProps) {
  const groupedMeals = MEAL_TYPES.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    meals: meals.filter((m) => m.meal_type === type),
    config: MEAL_CONFIG[type],
  }));

  return (
    <div className="space-y-4">
      {groupedMeals.map(({ type, label, meals: mealEntries, config }) => {
        if (mealEntries.length === 0) return null;

        return (
          <MealTypeSection
            key={type}
            type={type}
            label={label}
            mealEntries={mealEntries}
            config={config}
            onDelete={onDelete}
            onEdit={onEdit}
            readOnly={readOnly}
          />
        );
      })}
    </div>
  );
}

// Meal Type Section Component
function MealTypeSection({
  label,
  mealEntries,
  config,
  onDelete,
  onEdit,
  readOnly,
}: {
  type: MealType;
  label: string;
  mealEntries: readonly MealEntryWithDetails[];
  config: { icon: string; color: string; headerBg: string };
  onDelete?: (mealId: string) => Promise<void>;
  onEdit?: (meal: MealEntryWithDetails) => void;
  readOnly: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const mealTotals = sumMacros(mealEntries as MealEntryWithDetails[]);

  const handleCopyMeal = async () => {
    const fiberText =
      mealTotals.fiber > 0
        ? ` | Fiber: ${Math.round(mealTotals.fiber * 10) / 10}g`
        : "";
    const headerText = `${label}: ${Math.round(
      mealTotals.calories
    )} cal | P: ${Math.round(mealTotals.protein)}g | C: ${Math.round(
      mealTotals.carbs
    )}g | F: ${Math.round(mealTotals.fat)}g${fiberText}`;

    const itemsList = mealEntries
      .map((meal) => {
        const macros = calculateMealMacros(meal);
        const name = meal.food_items?.name || meal.recipes?.name || "Unknown";
        const fiberItem =
          macros.fiber > 0
            ? ` | Fiber: ${Math.round(macros.fiber * 10) / 10}g`
            : "";
        return `  • ${name}: ${Math.round(macros.calories)} cal | P: ${
          Math.round(macros.protein * 10) / 10
        }g | C: ${Math.round(macros.carbs * 10) / 10}g | F: ${
          Math.round(macros.fat * 10) / 10
        }g${fiberItem}`;
      })
      .join("\n");

    const text = `${headerText}\n${itemsList}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
      {/* Meal Type Header */}
      <div className={`${config.headerBg} px-5 py-4`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.icon}</span>
            <Text className={`font-bold text-lg ${config.color}`}>{label}</Text>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-4 text-sm font-medium">
              <span className={`${config.color}`}>
                {Math.round(mealTotals.calories)} cal
              </span>
              <span className="text-zinc-400">
                P: {Math.round(mealTotals.protein)}g
              </span>
              <span className="text-zinc-400">
                C: {Math.round(mealTotals.carbs)}g
              </span>
              <span className="text-zinc-400">
                F: {Math.round(mealTotals.fat)}g
              </span>
              {mealTotals.fiber > 0 && (
                <span className="text-zinc-500">
                  Fiber: {Math.round(mealTotals.fiber * 10) / 10}g
                </span>
              )}
            </div>

            <Button
              plain
              className="text-zinc-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-zinc-700/50"
              onClick={handleCopyMeal}
              title="Copy meal"
            >
              {copied ? (
                <span className="text-green-400 text-xs font-bold">✓</span>
              ) : (
                <ClipboardIcon className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Meal Items */}
      <div className="p-3 space-y-2">
        {mealEntries.map((meal) => (
          <MealEntryRow
            key={meal.id}
            meal={meal}
            onDelete={
              readOnly || !onDelete ? undefined : () => onDelete(meal.id)
            }
            onEdit={readOnly || !onEdit ? undefined : () => onEdit(meal)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

// Internal component
function MealEntryRow({
  meal,
  onDelete,
  onEdit,
  readOnly,
}: {
  meal: MealEntryWithDetails;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDelete = async () => {
    if (!onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete();
    } catch (error) {
      console.error("Error deleting meal:", error);
      alert("Failed to delete entry");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleCopyMacros = async () => {
    const fiberText =
      macros.fiber && macros.fiber > 0
        ? ` | Fiber: ${Math.round(macros.fiber * 10) / 10}g`
        : "";
    const text = `${formatted.calories} cal | P: ${formatted.protein}g | C: ${formatted.carbs}g | F: ${formatted.fat}g${fiberText}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const macros = calculateMealMacros(meal);
  const formatted = formatMacros(macros);

  // Build display name with smart serving info
  let displayName = "Unknown";

  if (meal.food_items) {
    const food = meal.food_items;
    const qty = meal.quantity;

    if (food.serving_label && food.serving_size && qty === food.serving_size) {
      displayName = `${food.name} (${food.serving_label})`;
    } else if (food.serving_label && food.serving_size) {
      const servingCount = qty / food.serving_size;
      if (Number.isInteger(servingCount)) {
        const pluralLabel =
          servingCount > 1
            ? food.serving_label.replace(/^1 /, `${servingCount} `)
            : food.serving_label;
        displayName = `${food.name} (${pluralLabel})`;
      } else {
        displayName = `${food.name} (${formatNumber(qty, 1)}${
          meal.quantity_type
        } ≈ ${formatNumber(servingCount, 1)}×)`;
      }
    } else {
      displayName = `${food.name} (${formatNumber(qty, 1)}${
        meal.quantity_type
      })`;
    }
  } else if (meal.recipes) {
    displayName = `${meal.recipes.name} (${formatNumber(
      meal.quantity,
      1
    )} serving${meal.quantity > 1 ? "s" : ""})`;
  }

  return (
    <>
      <div className="rounded-xl bg-zinc-800/50 border border-zinc-700/50 p-4 hover:bg-zinc-800 hover:border-zinc-600 transition-all">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Food Name */}
            <div className="flex items-start gap-2">
              <span className="text-zinc-500 mt-0.5">•</span>
              <Text className="font-semibold text-base text-white leading-snug">
                {displayName}
              </Text>
            </div>

            {/* Macros - Larger and more readable */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm pl-4">
              <span className="font-bold text-orange-400">
                {formatted.calories} cal
              </span>
              <span className="text-zinc-300">
                <span className="font-medium">P:</span> {formatted.protein}g
              </span>
              <span className="text-zinc-300">
                <span className="font-medium">C:</span> {formatted.carbs}g
              </span>
              <span className="text-zinc-300">
                <span className="font-medium">F:</span> {formatted.fat}g
              </span>
              {macros.fiber && macros.fiber > 0 && (
                <span className="text-zinc-400">
                  <span className="font-medium">Fiber:</span>{" "}
                  {Math.round(macros.fiber * 10) / 10}g
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons - Icons */}
          {(onEdit || onDelete) && (
            <div className="flex gap-1 shrink-0">
              {onEdit && (
                <Button
                  plain
                  className="text-zinc-400 hover:text-blue-400 transition-colors p-2 rounded-lg hover:bg-zinc-700/50"
                  onClick={onEdit}
                  title="Edit entry"
                >
                  <PencilIcon className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  plain
                  className="text-zinc-400 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-zinc-700/50"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  title="Delete entry"
                >
                  {isDeleting ? (
                    <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                  ) : (
                    <TrashIcon className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-4xl">🗑️</div>
              <div>
                <Text className="text-lg font-semibold text-white">
                  Delete this entry?
                </Text>
                <Text className="text-sm text-zinc-400 mt-2">
                  This action cannot be undone.
                </Text>
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  plain
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600"
                >
                  {isDeleting ? "Deleting..." : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
