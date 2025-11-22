"use client";

import type { FoodItem } from "@/utils/supabase/queries";
import { FoodForm } from "@/features/foods/components/FoodForm";
import { FoodList } from "@/features/foods/components/Foodlist";

interface FoodItemsTabProps {
  readonly foods: readonly FoodItem[];
  readonly onRefreshFoods: () => Promise<void>;
}

export function FoodItemsTab({ foods, onRefreshFoods }: FoodItemsTabProps) {
  return (
    <div className="space-y-6">
      <FoodForm onFoodAdded={onRefreshFoods} />
      <FoodList foods={foods} onFoodDeleted={onRefreshFoods} />
    </div>
  );
}
