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

const MEAL_CONFIG: Record<MealType, {
  icon: string;
  calColor: string;        // calorie accent
  barColor: string;        // left-border accent (4px strip)
  pillBg: string;          // subtle header pill bg
}> = {
  Breakfast:     { icon: "🍳", calColor: "text-orange-400",  barColor: "bg-orange-500",  pillBg: "bg-orange-500/10"  },
  Lunch:         { icon: "🥗", calColor: "text-green-400",   barColor: "bg-green-500",   pillBg: "bg-green-500/10"   },
  Dinner:        { icon: "🍽️", calColor: "text-blue-400",    barColor: "bg-blue-500",    pillBg: "bg-blue-500/10"    },
  Snacks:        { icon: "🍪", calColor: "text-purple-400",  barColor: "bg-purple-500",  pillBg: "bg-purple-500/10"  },
  "Pre Workout": { icon: "💪", calColor: "text-red-400",     barColor: "bg-red-500",     pillBg: "bg-red-500/10"     },
  "Post Workout":{ icon: "🥤", calColor: "text-cyan-400",    barColor: "bg-cyan-500",    pillBg: "bg-cyan-500/10"    },
};

export function MealBreakdown({ meals, onDelete, onEdit, readOnly = false }: MealBreakdownProps) {
  const groupedMeals = MEAL_TYPES.map((type) => ({
    type,
    label: MEAL_TYPE_LABELS[type],
    meals: meals.filter((m) => m.meal_type === type),
    config: MEAL_CONFIG[type],
  }));

  return (
    <div className="space-y-3">
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
  config: { icon: string; calColor: string; barColor: string; pillBg: string };
  onDelete?: (mealId: string) => Promise<void>;
  onEdit?: (meal: MealEntryWithDetails) => void;
  readOnly: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const mealTotals = sumMacros(mealEntries as MealEntryWithDetails[]);

  const handleCopyMeal = async () => {
    const fiberText = mealTotals.fiber > 0 ? ` | Fiber: ${Math.round(mealTotals.fiber * 10) / 10}g` : "";
    const headerText = `${label}: ${Math.round(mealTotals.calories)} cal | P: ${Math.round(mealTotals.protein)}g | C: ${Math.round(mealTotals.carbs)}g | F: ${Math.round(mealTotals.fat)}g${fiberText}`;
    const itemsList = mealEntries.map((meal) => {
      const macros = calculateMealMacros(meal);
      const name = meal.food_items?.name || meal.recipes?.name || "Unknown";
      const fiberItem = macros.fiber > 0 ? ` | Fiber: ${Math.round(macros.fiber * 10) / 10}g` : "";
      return `  • ${name}: ${Math.round(macros.calories)} cal | P: ${Math.round(macros.protein * 10) / 10}g | C: ${Math.round(macros.carbs * 10) / 10}g | F: ${Math.round(macros.fat * 10) / 10}g${fiberItem}`;
    }).join("\n");
    try {
      await navigator.clipboard.writeText(`${headerText}\n${itemsList}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { console.error(e); }
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/60">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        {/* Left: icon + label */}
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Colored left-side accent dot */}
          <span className={`shrink-0 w-1 h-6 rounded-full ${config.barColor}`} />
          <span className="text-xl leading-none">{config.icon}</span>
          <span className={`font-semibold text-sm ${config.calColor}`}>{label}</span>
        </div>

        {/* Right: macro summary pill + copy */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${config.pillBg} text-xs font-medium`}>
            <span className={`font-bold ${config.calColor}`}>{Math.round(mealTotals.calories)} cal</span>
            <span className="text-zinc-500 hidden sm:inline">·</span>
            <span className="text-zinc-400 hidden sm:inline">P: {Math.round(mealTotals.protein)}g</span>
            <span className="text-zinc-400 hidden sm:inline">C: {Math.round(mealTotals.carbs)}g</span>
            <span className="text-zinc-400 hidden sm:inline">F: {Math.round(mealTotals.fat)}g</span>
            {mealTotals.fiber > 0 && (
              <span className="text-zinc-500 hidden lg:inline">Fiber: {Math.round(mealTotals.fiber * 10) / 10}g</span>
            )}
          </div>
          <button
            onClick={handleCopyMeal}
            title="Copy meal"
            className="text-zinc-600 hover:text-zinc-300 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
          >
            {copied
              ? <span className="text-green-400 text-xs font-bold">✓</span>
              : <ClipboardIcon className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Items ── */}
      <div className="px-3 pb-3 space-y-1.5">
        {mealEntries.map((meal) => (
          <MealEntryRow
            key={meal.id}
            meal={meal}
            calColor={config.calColor}
            onDelete={readOnly || !onDelete ? undefined : () => onDelete(meal.id)}
            onEdit={readOnly || !onEdit ? undefined : () => onEdit(meal)}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function MealEntryRow({
  meal,
  calColor,
  onDelete,
  onEdit,
  readOnly,
}: {
  meal: MealEntryWithDetails;
  calColor: string;
  onDelete?: () => Promise<void>;
  onEdit?: () => void;
  readOnly?: boolean;
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const macros = calculateMealMacros(meal);
  const formatted = formatMacros(macros);

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } catch {
      alert("Failed to delete entry");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Display name
  let displayName = "Unknown";
  if (meal.food_items) {
    const food = meal.food_items;
    const qty = meal.quantity;
    if (food.serving_label && food.serving_size && qty === food.serving_size) {
      displayName = `${food.name} (${food.serving_label})`;
    } else if (food.serving_label && food.serving_size) {
      const servingCount = qty / food.serving_size;
      if (Number.isInteger(servingCount)) {
        const pluralLabel = servingCount > 1
          ? food.serving_label.replace(/^1 /, `${servingCount} `)
          : food.serving_label;
        displayName = `${food.name} (${pluralLabel})`;
      } else {
        displayName = `${food.name} (${formatNumber(qty, 1)}${meal.quantity_type} ≈ ${formatNumber(servingCount, 1)}×)`;
      }
    } else {
      displayName = `${food.name} (${formatNumber(qty, 1)}${meal.quantity_type})`;
    }
  } else if (meal.recipes) {
    displayName = `${meal.recipes.name} (${formatNumber(meal.quantity, 1)} serving${meal.quantity > 1 ? "s" : ""})`;
  }

  return (
    <>
      <div className="group rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/50 px-3.5 py-3 transition-all duration-150">
        <div className="flex items-center gap-3">
          {/* Bullet */}
          <span className="shrink-0 w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition-colors mt-0.5" />

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white leading-snug truncate">{displayName}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs">
              <span className={`font-semibold ${calColor}`}>{formatted.calories} cal</span>
              <span className="text-zinc-500">P: <span className="text-zinc-300">{formatted.protein}g</span></span>
              <span className="text-zinc-500">C: <span className="text-zinc-300">{formatted.carbs}g</span></span>
              <span className="text-zinc-500">F: <span className="text-zinc-300">{formatted.fat}g</span></span>
              {macros.fiber && macros.fiber > 0 && (
                <span className="text-zinc-600">Fiber: {Math.round(macros.fiber * 10) / 10}g</span>
              )}
            </div>
          </div>

          {/* Actions — visible on hover */}
          {(onEdit || onDelete) && (
              <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {onEdit && (
                <button
                  onClick={onEdit}
                  title="Edit entry"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-blue-400 hover:bg-zinc-700/60 transition-colors"
                >
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  title="Delete entry"
                  className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700/60 transition-colors"
                >
                  {isDeleting
                    ? <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-400 rounded-full animate-spin" />
                    : <TrashIcon className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center space-y-4">
              <div className="text-4xl">🗑️</div>
              <div>
                <Text className="text-lg font-semibold text-white">Delete this entry?</Text>
                <Text className="text-sm text-zinc-400 mt-1">This action cannot be undone.</Text>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white hover:bg-red-600 text-sm font-semibold transition-colors disabled:opacity-60"
                >
                  {isDeleting ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
