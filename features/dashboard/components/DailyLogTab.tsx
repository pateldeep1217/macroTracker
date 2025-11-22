"use client";

import { useState } from "react";
import type {
  FoodItem,
  Recipe,
  MealEntryWithDetails,
} from "@/utils/supabase/queries";
import { logFood, logRecipe, deleteMealEntry } from "@/utils/supabase/queries";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Input } from "@/app/components/input";
import { Button } from "@/app/components/button";
import { Dialog, DialogTitle, DialogBody } from "@/app/components/dialog";
import { AddMealForm } from "@/features/meals/components/AddMealForm";
import { MealBreakdown } from "@/features/meals/components/MealBreakdown";
import type { MealType } from "@/features/shared/utils/constatns";
import { MEAL_TYPES } from "@/features/shared/utils/constatns";
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
  const [showAddDialog, setShowAddDialog] = useState(false);

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
      setShowAddDialog(false);
    } catch (error) {
      console.error("Error adding entry:", error);
      throw error;
    } finally {
      setIsAdding(false);
    }
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

  const groupedMeals = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = meals.filter((m) => m.meal_type === type);
    return acc;
  }, {} as Record<MealType, MealEntryWithDetails[]>);

  const dailyTotals = sumMacros(meals as MealEntryWithDetails[]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header Section */}
      <div className="rounded-2xl bg-zinc-900 p-4 dark:bg-zinc-800 sm:p-6">
        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split("T")[0]);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
            >
              ←
            </button>

            <div className="min-w-0 flex-1">
              <Heading
                level={2}
                className="text-lg font-semibold text-white sm:text-xl"
              >
                Daily Nutrition Log
              </Heading>
              <Text className="mt-1 text-xs text-zinc-400 sm:text-sm truncate">
                {formatDate(selectedDate)} • {userName}
              </Text>
            </div>

            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split("T")[0]);
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white active:bg-zinc-700"
            >
              →
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="flex-1 bg-zinc-800 text-sm text-white border-zinc-700 sm:flex-initial"
            />
            <Button
              onClick={() => setShowAddDialog(true)}
              className="whitespace-nowrap text-sm sm:text-base"
            >
              + Add
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900 sm:p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Total Calories
          </Text>
          <div className="mt-2 font-mono text-xl font-bold text-zinc-900 dark:text-white sm:mt-2.5 sm:text-2xl lg:text-3xl">
            {meals.length > 0
              ? Math.round(dailyTotals.calories).toLocaleString()
              : "0"}
          </div>
          {meals.length > 0 && (
            <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-1.5">
              {meals.length} {meals.length === 1 ? "entry" : "entries"}
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900 sm:p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Protein
          </Text>
          <div className="mt-2 font-mono text-xl font-bold text-zinc-900 dark:text-white sm:mt-2.5 sm:text-2xl lg:text-3xl">
            {meals.length > 0 ? Math.round(dailyTotals.protein * 10) / 10 : "0"}
            <span className="text-sm font-normal text-zinc-500 sm:text-base">
              g
            </span>
          </div>
          {meals.length > 0 && dailyTotals.calories > 0 && (
            <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-1.5">
              {Math.round(
                ((dailyTotals.protein * 4) / dailyTotals.calories) * 100
              )}
              % of calories
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900 sm:p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Carbs
          </Text>
          <div className="mt-2 font-mono text-xl font-bold text-zinc-900 dark:text-white sm:mt-2.5 sm:text-2xl lg:text-3xl">
            {meals.length > 0 ? Math.round(dailyTotals.carbs * 10) / 10 : "0"}
            <span className="text-sm font-normal text-zinc-500 sm:text-base">
              g
            </span>
          </div>
          {meals.length > 0 && dailyTotals.calories > 0 && (
            <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-1.5">
              {Math.round(
                ((dailyTotals.carbs * 4) / dailyTotals.calories) * 100
              )}
              % of calories
            </Text>
          )}
        </div>

        <div className="rounded-xl bg-white p-4 dark:bg-zinc-900 sm:p-5">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Fat
          </Text>
          <div className="mt-2 font-mono text-xl font-bold text-zinc-900 dark:text-white sm:mt-2.5 sm:text-2xl lg:text-3xl">
            {meals.length > 0 ? Math.round(dailyTotals.fat * 10) / 10 : "0"}
            <span className="text-sm font-normal text-zinc-500 sm:text-base">
              g
            </span>
          </div>
          {meals.length > 0 && dailyTotals.calories > 0 && (
            <Text className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 sm:mt-1.5">
              {Math.round(((dailyTotals.fat * 9) / dailyTotals.calories) * 100)}
              % of calories
            </Text>
          )}
        </div>
      </div>

      {/* Meal Breakdown */}
      {meals.length > 0 ? (
        <div className="space-y-3">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Meal Breakdown
          </Text>
          <MealBreakdown groupedMeals={groupedMeals} onDelete={handleDelete} />
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-8 text-center dark:bg-zinc-900 sm:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-3 text-3xl sm:text-4xl">🍽️</div>
            <Text className="text-sm font-semibold text-zinc-900 dark:text-white sm:text-base">
              No meals logged yet
            </Text>
            <Text className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
              Click "+ Add" to start tracking your nutrition
            </Text>
          </div>
        </div>
      )}

      {/* Add Entry Dialog */}
      {showAddDialog && (
        <Dialog
          open={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          size="lg"
        >
          <DialogTitle>Add Meal Entry</DialogTitle>
          <DialogBody>
            <AddMealForm
              foods={foods}
              recipes={recipes}
              onAdd={handleAddEntry}
              isAdding={isAdding}
            />
          </DialogBody>
        </Dialog>
      )}
    </div>
  );
}
