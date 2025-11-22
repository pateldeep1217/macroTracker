"use client";

import { MacroCard } from "./MacroCard";
import type { MacroTotals } from "@/features/shared/utils/macors";
import { formatMacros } from "@/features/shared/utils/macors";

type MacroSummaryVariant = "cards" | "inline";
type MacroSummarySize = "sm" | "lg";

interface MacroSummaryProps {
  readonly macros: MacroTotals;
  readonly variant?: MacroSummaryVariant;
  readonly size?: MacroSummarySize;
}

export function MacroSummary({
  macros,
  variant = "cards",
  size = "lg",
}: MacroSummaryProps) {
  const formatted = formatMacros(macros);

  if (variant === "inline") {
    return (
      <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span className="font-medium">{formatted.calories} cal</span>
        <span>P: {formatted.protein}g</span>
        <span>C: {formatted.carbs}g</span>
        <span>F: {formatted.fat}g</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MacroCard
        label="Calories"
        value={formatted.calories}
        color="blue"
        size={size}
      />
      <MacroCard
        label="Protein"
        value={`${formatted.protein}g`}
        color="green"
        size={size}
      />
      <MacroCard
        label="Carbs"
        value={`${formatted.carbs}g`}
        color="orange"
        size={size}
      />
      <MacroCard
        label="Fat"
        value={`${formatted.fat}g`}
        color="purple"
        size={size}
      />
    </div>
  );
}
