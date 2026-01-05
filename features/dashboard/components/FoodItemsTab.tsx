"use client";

import { useState } from "react";
import type { FoodItem } from "@/utils/supabase/queries";
import { Button } from "@/app/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/sheet";
import { FoodForm } from "@/features/foods/components/FoodForm";
import { FoodList } from "@/features/foods/components/Foodlist";

interface FoodItemsTabProps {
  readonly foods: readonly FoodItem[];
  readonly onRefreshFoods: () => Promise<void>;
}

export function FoodItemsTab({ foods, onRefreshFoods }: FoodItemsTabProps) {
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null);

  const handleFoodAdded = async () => {
    await onRefreshFoods();
    setShowAddSheet(false);
    setEditingFood(null);
  };

  const handleEdit = (food: FoodItem) => {
    setEditingFood(food);
    setShowAddSheet(true);
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <div className="rounded-xl bg-zinc-900 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-base font-semibold text-white sm:text-lg">
              Food Database
            </div>
            <div className="text-xs text-zinc-400">{foods.length} items</div>
          </div>

          <Button
            onClick={() => setShowAddSheet(true)}
            className="whitespace-nowrap h-9"
          >
            + Add Food
          </Button>
        </div>
      </div>

      {/* Food List */}
      <FoodList
        foods={foods}
        onFoodDeleted={onRefreshFoods}
        onFoodEdit={handleEdit}
      />

      {/* Add/Edit Food Sheet */}
      <Sheet
        open={showAddSheet}
        onOpenChange={(open) => {
          setShowAddSheet(open);
          if (!open) setEditingFood(null);
        }}
      >
        <SheetContent side="bottom" className="h-[95vh] sm:rounded-l-xl">
          <div className="flex h-full flex-col">
            <SheetHeader>
              <SheetTitle>
                {editingFood ? "Edit Food Item" : "Add New Food Item"}
              </SheetTitle>
              <SheetDescription>
                Enter nutrition facts from the food label. All macros will be
                converted to per-100g/ml for accurate calculations.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto py-6">
              <FoodForm
                onFoodAdded={handleFoodAdded}
                editingFood={editingFood}
              />
            </div>

            <SheetFooter>
              <SheetClose asChild>
                <Button plain>Cancel</Button>
              </SheetClose>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
