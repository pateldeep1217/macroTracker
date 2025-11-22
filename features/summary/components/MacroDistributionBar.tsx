"use client";

import { Text } from "@/app/components/text";
import type { MacroTotals } from "@/features/shared/utils/macors";
import { calculateMacroPercentage } from "@/features/shared/utils/macors";

interface MacroDistributionBarProps {
  readonly macros: MacroTotals;
}

export function MacroDistributionBar({ macros }: MacroDistributionBarProps) {
  const proteinPercent = calculateMacroPercentage(macros.protein, 4, macros);
  const carbsPercent = calculateMacroPercentage(macros.carbs, 4, macros);
  const fatPercent = calculateMacroPercentage(macros.fat, 9, macros);

  const totalPercent = proteinPercent + carbsPercent + fatPercent;

  // Handle case where there's no data
  if (totalPercent === 0) {
    return null;
  }

  return (
    <div>
      <Text className="text-sm font-medium">Macro Distribution</Text>
      <div className="mt-2 flex h-4 overflow-hidden rounded-full">
        <div className="bg-green-500" style={{ width: `${proteinPercent}%` }} />
        <div className="bg-orange-500" style={{ width: `${carbsPercent}%` }} />
        <div className="bg-purple-500" style={{ width: `${fatPercent}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-zinc-500">
        <span>Protein: {proteinPercent}%</span>
        <span>Carbs: {carbsPercent}%</span>
        <span>Fat: {fatPercent}%</span>
      </div>
    </div>
  );
}
