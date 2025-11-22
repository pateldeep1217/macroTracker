"use client";

import { Subheading } from "@/app/components/heading";
import { MealSection } from "./MealSection";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
} from "@/features/shared/utils/constatns";
import type { MealType } from "@/features/shared/utils/constatns";

interface MealBreakdownProps {
  readonly groupedMeals: Record<MealType, MealEntryWithDetails[]>;
  readonly onDelete: (mealId: string) => Promise<void>;
}

export function MealBreakdown({ groupedMeals, onDelete }: MealBreakdownProps) {
  return (
    <div className="space-y-4">
      <Subheading>Meal Breakdown</Subheading>

      {MEAL_TYPES.map((type) => {
        const mealEntries = groupedMeals[type];
        if (!mealEntries || mealEntries.length === 0) return null;

        return (
          <MealSection
            key={type}
            mealType={type}
            label={MEAL_TYPE_LABELS[type]}
            meals={mealEntries}
            onDelete={onDelete}
          />
        );
      })}
    </div>
  );
}
