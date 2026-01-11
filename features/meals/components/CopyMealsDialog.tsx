"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/app/components/button";
import { Text } from "@/app/components/text";
import {
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions,
} from "@/app/components/dialog";
import {
  getRecentDaysWithMeals,
  copyMealsToDate,
} from "@/utils/supabase/queries";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
} from "@/features/shared/utils/constatns";
import type { MealType } from "@/features/shared/utils/constatns";
import { sumMacros } from "@/features/shared/utils/macors";

interface CopyMealsDialogProps {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly userId: string;
  readonly targetDate: string;
  readonly onCopyComplete: () => Promise<void>;
}

interface DayWithMeals {
  date: string;
  meals: MealEntryWithDetails[];
}

export function CopyMealsDialog({
  open,
  onClose,
  userId,
  targetDate,
  onCopyComplete,
}: CopyMealsDialogProps) {
  const [recentDays, setRecentDays] = useState<DayWithMeals[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<MealType>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);

  const loadRecentDays = useCallback(async () => {
    setIsLoading(true);
    try {
      const days = await getRecentDaysWithMeals(userId, 10);
      // Filter out the target date
      const filtered = days.filter((d) => d.date !== targetDate);
      setRecentDays(filtered);
    } catch (error) {
      console.error("Error loading recent days:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, targetDate]);

  useEffect(() => {
    if (open) {
      loadRecentDays();
    }
  }, [open, loadRecentDays]);

  const handleDateSelect = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
      setSelectedMealTypes(new Set());
    } else {
      setSelectedDate(date);
      // Auto-select all meal types for this date
      const day = recentDays.find((d) => d.date === date);
      if (day) {
        const mealTypesInDay = new Set(
          day.meals.map((m) => m.meal_type as MealType)
        );
        setSelectedMealTypes(mealTypesInDay);
      }
    }
  };

  const handleMealTypeToggle = (mealType: MealType) => {
    const newSelected = new Set(selectedMealTypes);
    if (newSelected.has(mealType)) {
      newSelected.delete(mealType);
    } else {
      newSelected.add(mealType);
    }
    setSelectedMealTypes(newSelected);
  };

  const handleCopy = async () => {
    if (!selectedDate || selectedMealTypes.size === 0) return;

    setIsCopying(true);
    try {
      await copyMealsToDate(
        userId,
        selectedDate,
        targetDate,
        Array.from(selectedMealTypes)
      );
      await onCopyComplete();
      onClose();
      // Reset state
      setSelectedDate(null);
      setSelectedMealTypes(new Set());
    } catch (error) {
      console.error("Error copying meals:", error);
      alert("Failed to copy meals. Please try again.");
    } finally {
      setIsCopying(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dateOnly = date.toISOString().split("T")[0];
    const todayOnly = today.toISOString().split("T")[0];
    const yesterdayOnly = yesterday.toISOString().split("T")[0];

    if (dateOnly === todayOnly) return "Today";
    if (dateOnly === yesterdayOnly) return "Yesterday";

    const daysAgo = Math.floor(
      (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    return `${daysAgo} days ago - ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  };

  const selectedDay = selectedDate
    ? recentDays.find((d) => d.date === selectedDate)
    : null;
  const mealTypeGroups = selectedDay
    ? MEAL_TYPES.map((type) => ({
        type,
        meals: selectedDay.meals.filter((m) => m.meal_type === type),
      })).filter((g) => g.meals.length > 0)
    : [];

  return (
    <Dialog open={open} onClose={onClose} size="2xl">
      <DialogTitle>📋 Copy from Previous Day</DialogTitle>
      <DialogDescription>
        Select a day and which meals to copy to {formatDate(targetDate)}
      </DialogDescription>

      <DialogBody>
        {isLoading ? (
          <div className="py-8 text-center text-zinc-400">
            Loading recent days...
          </div>
        ) : recentDays.length === 0 ? (
          <div className="py-8 text-center text-zinc-400">
            No recent meals found. Start logging to see previous days here.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Select Date */}
            <div className="space-y-2">
              <Text className="text-sm font-semibold text-zinc-400">
                Select a day:
              </Text>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {recentDays.map(({ date, meals }) => {
                  const totals = sumMacros(meals);
                  const isSelected = selectedDate === date;

                  return (
                    <button
                      key={date}
                      onClick={() => handleDateSelect(date)}
                      className={`w-full rounded-lg border p-3 text-left transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10 dark:border-blue-400 dark:bg-blue-500/20"
                          : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <Text className="font-medium">
                            {formatDate(date)}
                          </Text>
                          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            {meals.length}{" "}
                            {meals.length === 1 ? "entry" : "entries"}
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text className="text-sm font-bold text-orange-500 dark:text-orange-400">
                            {Math.round(totals.calories)} cal
                          </Text>
                          <Text className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            P: {Math.round(totals.protein)}g • C:{" "}
                            {Math.round(totals.carbs)}g • F:{" "}
                            {Math.round(totals.fat)}g
                          </Text>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Select Meal Types */}
            {selectedDate && (
              <div className="space-y-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <Text className="text-sm font-semibold text-zinc-400">
                  Select meals to copy:
                </Text>
                <div className="space-y-2">
                  {mealTypeGroups.map(({ type, meals }) => {
                    const isSelected = selectedMealTypes.has(type);
                    const mealTotals = sumMacros(meals);

                    return (
                      <button
                        key={type}
                        onClick={() => handleMealTypeToggle(type)}
                        className={`w-full rounded-lg border p-3 text-left transition-all ${
                          isSelected
                            ? "border-green-500 bg-green-500/10 dark:border-green-400 dark:bg-green-500/20"
                            : "border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800/50"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400"
                                  : "border-zinc-400 dark:border-zinc-600"
                              }`}
                            >
                              {isSelected && (
                                <span className="text-white text-xs font-bold">
                                  ✓
                                </span>
                              )}
                            </div>
                            <Text className="font-medium">
                              {MEAL_TYPE_LABELS[type]}
                            </Text>
                            <Text className="text-xs text-zinc-500 dark:text-zinc-400">
                              ({meals.length}{" "}
                              {meals.length === 1 ? "item" : "items"})
                            </Text>
                          </div>
                          <Text className="text-sm text-zinc-500 dark:text-zinc-400">
                            {Math.round(mealTotals.calories)} cal
                          </Text>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogBody>

      <DialogActions>
        <Button plain onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleCopy}
          disabled={!selectedDate || selectedMealTypes.size === 0 || isCopying}
        >
          {isCopying
            ? "Copying..."
            : `Copy ${selectedMealTypes.size} Meal${
                selectedMealTypes.size === 1 ? "" : "s"
              }`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
