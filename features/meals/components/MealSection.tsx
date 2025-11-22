"use client";

import { Subheading } from "@/app/components/heading";
import { Divider } from "@/app/components/divider";
import { MealEntryRow } from "./MealEntryRow";
import { MacroSummary } from "@/features/shared/components/MacroSummary";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import { sumMacros } from "@/features/shared/utils/macors";
import type { MealType } from "@/features/shared/utils/constatns";

interface MealSectionProps {
  readonly mealType: MealType;
  readonly label: string;
  readonly meals: readonly MealEntryWithDetails[];
  readonly onDelete: (mealId: string) => Promise<void>;
}

export function MealSection({
  mealType,
  label,
  meals,
  onDelete,
}: MealSectionProps) {
  const mealTotals = sumMacros(meals as MealEntryWithDetails[]);

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <div className="flex items-center justify-between px-6 py-4">
        <Subheading>{label}</Subheading>
        <MacroSummary macros={mealTotals} variant="inline" />
      </div>

      <Divider />

      <div className="space-y-2 p-4">
        {meals.map((meal) => (
          <MealEntryRow
            key={meal.id}
            meal={meal}
            onDelete={() => onDelete(meal.id)}
          />
        ))}
      </div>
    </div>
  );
}
