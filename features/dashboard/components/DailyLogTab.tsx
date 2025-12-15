// ============================================
// FILE: DailyLogTab.tsx - USING CUSTOM SHEET
// ============================================
"use client";

import { useState } from "react";
import type {
  FoodItem,
  Recipe,
  MealEntryWithDetails,
} from "@/utils/supabase/queries";
import {
  logFood,
  logRecipe,
  deleteMealEntry,
  updateMealEntry,
} from "@/utils/supabase/queries";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Input } from "@/app/components/input";
import { Button } from "@/app/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/app/components/sheet"; // Adjust path to where you save the sheet component
import { AddMealForm } from "@/features/meals/components/AddMealForm";
import { MealBreakdown } from "@/features/meals/components/MealBreakdown";
import type { MealType } from "@/features/shared/utils/constatns";
import { sumMacros } from "@/features/shared/utils/macors";

interface DailyLogTabProps {
  readonly userId: string;
  readonly userName: string;
  readonly selectedDate: string;
  readonly setSelectedDate: (date: string) => void;
  readonly foods: readonly FoodItem[];
  readonly recipes: readonly Recipe[];
  readonly meals: readonly MealEntryWithDetails[];
  readonly onRefreshMeals: () => Promise<void>;
}

export function DailyLogTab({
  userId,
  userName,
  selectedDate,
  setSelectedDate,
  foods,
  recipes,
  meals,
  onRefreshMeals,
}: DailyLogTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealEntryWithDetails | null>(
    null
  );

  const handleAddEntry = async (data: {
    entryType: "food" | "recipe";
    itemId: string;
    quantity: number;
    mealType: MealType;
  }) => {
    setIsAdding(true);
    try {
      if (data.entryType === "food") {
        const food = foods.find((f) => f.id === data.itemId);
        if (!food) {
          throw new Error("Food not found");
        }

        await logFood({
          userId,
          date: selectedDate,
          mealType: data.mealType,
          foodId: data.itemId,
          quantity: data.quantity,
          quantityType: food.base_unit as "g" | "ml",
        });
      } else {
        await logRecipe({
          userId,
          date: selectedDate,
          mealType: data.mealType,
          recipeId: data.itemId,
          servings: data.quantity,
        });
      }

      await onRefreshMeals();
      setShowAddSheet(false);
      setEditingMeal(null);
    } catch (error) {
      console.error("Error adding entry:", error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditEntry = async (data: {
    mealId: string;
    quantity: number;
    mealType: MealType;
  }) => {
    setIsAdding(true);
    try {
      await updateMealEntry({
        id: data.mealId,
        quantity: data.quantity,
        mealType: data.mealType,
      });

      await onRefreshMeals();
      setShowAddSheet(false);
      setEditingMeal(null);
    } catch (error) {
      console.error("Error updating entry:", error);
      throw error;
    } finally {
      setIsAdding(false);
    }
  };

  const handleEdit = (meal: MealEntryWithDetails) => {
    setEditingMeal(meal);
    setShowAddSheet(true);
  };

  const handleDelete = async (mealId: string) => {
    try {
      await deleteMealEntry(mealId);
      await onRefreshMeals();
    } catch (error) {
      console.error("Error deleting meal:", error);
      throw error;
    }
  };

  const dailyTotals = sumMacros(meals as MealEntryWithDetails[]);

  const formatDateShort = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header with Date Navigation */}
      <div className="rounded-xl bg-zinc-900 p-3 dark:bg-zinc-800 sm:p-4">
        <div className="flex items-center justify-between gap-3 ">
          {/* Date Navigation Group */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split("T")[0]);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              aria-label="Previous day"
            >
              ←
            </button>

            <div className="px-3 text-center">
              <Text className="text-base font-semibold text-white sm:text-lg">
                {formatDateShort(selectedDate)}
              </Text>
              <Text className="text-xs text-zinc-400 ">{userName}</Text>
            </div>

            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split("T")[0]);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
              aria-label="Next day"
            >
              →
            </button>

            <div className="relative ml-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-9 w-9 shrink-0 bg-zinc-800 text-white border-zinc-700 cursor-pointer hover:bg-zinc-700 transition-colors opacity-0 absolute inset-0"
                style={{ colorScheme: "dark" }}
                aria-label="Select date"
              />
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors pointer-events-none">
                📅
              </div>
            </div>
          </div>

          {/* Add Button */}
          <Button
            onClick={() => setShowAddSheet(true)}
            className="whitespace-nowrap h-9 flex justify-center items-center"
          >
            + Add
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Calories
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {meals.length > 0
              ? Math.round(dailyTotals.calories).toLocaleString()
              : "0"}
          </div>
          {meals.length > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {meals.length} {meals.length === 1 ? "entry" : "entries"}
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Protein
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {meals.length > 0 ? Math.round(dailyTotals.protein * 10) / 10 : "0"}
            <span className="text-base font-normal text-zinc-500">g</span>
          </div>
          {meals.length > 0 && dailyTotals.calories > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(
                ((dailyTotals.protein * 4) / dailyTotals.calories) * 100
              )}
              %
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Carbs
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {meals.length > 0 ? Math.round(dailyTotals.carbs * 10) / 10 : "0"}
            <span className="text-base font-normal text-zinc-500">g</span>
          </div>
          {meals.length > 0 && dailyTotals.calories > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(
                ((dailyTotals.carbs * 4) / dailyTotals.calories) * 100
              )}
              %
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Fat
          </Text>
          <div className="mt-2 font-mono text-2xl font-bold text-zinc-900 dark:text-white">
            {meals.length > 0 ? Math.round(dailyTotals.fat * 10) / 10 : "0"}
            <span className="text-base font-normal text-zinc-500">g</span>
          </div>
          {meals.length > 0 && dailyTotals.calories > 0 && (
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Math.round(((dailyTotals.fat * 9) / dailyTotals.calories) * 100)}
              %
            </Text>
          )}
        </div>
      </div>

      {/* Meal Breakdown */}
      {meals.length > 0 ? (
        <div className="space-y-3">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Meals
          </Text>
          <MealBreakdown
            meals={meals}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        </div>
      ) : (
        <div className="rounded-xl bg-white p-8 text-center dark:bg-zinc-900 sm:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-2 text-3xl sm:text-4xl">🍽️</div>
            <Text className="text-sm font-semibold text-zinc-900 dark:text-white sm:text-base">
              No meals logged yet
            </Text>
            <Text className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              Tap &quot;+ Add&quot; to start tracking
            </Text>
          </div>
        </div>
      )}

      {/* Add/Edit Entry Sheet */}
      <Sheet
        open={showAddSheet}
        onOpenChange={(open) => {
          setShowAddSheet(open);
          if (!open) setEditingMeal(null);
        }}
      >
        <SheetContent side="bottom" className="sm:rounded-l-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingMeal ? "Edit Meal Entry" : "Add Meal Entry"}
            </SheetTitle>
            <SheetDescription>
              {editingMeal
                ? "Update the quantity or meal type for this entry."
                : `Select a food item or recipe to add to your daily log for ${formatDateShort(
                    selectedDate
                  )}.`}
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <AddMealForm
              foods={foods}
              recipes={recipes}
              onAdd={handleAddEntry}
              onEdit={handleEditEntry}
              isAdding={isAdding}
              editingMeal={editingMeal}
            />
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button plain>Cancel</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
