"use client";

import { useState, useEffect } from "react";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import { getMealsByDate } from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { TodaySummary } from "@/features/summary/components/TodaySummary";
import { WeeklySummary } from "@/features/summary/components/WeeklySummary";
import { LoadingState } from "@/features/shared/components/LoadingState";
import { sumMacros } from "@/features/shared/utils/macors";
import { getDateDaysAgo } from "@/features/shared/utils/formatting";

interface SummaryTabProps {
  readonly userId: string;
  readonly userName: string;
  readonly selectedDate: string;
  readonly meals: readonly MealEntryWithDetails[];
}

interface DayStats {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function SummaryTab({
  userId,
  userName,
  selectedDate,
  meals,
}: SummaryTabProps) {
  const [dateRange, setDateRange] = useState({
    start: getDateDaysAgo(7),
    end: selectedDate,
  });
  const [weekData, setWeekData] = useState<DayStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadWeekData();
  }, [userId, dateRange]);

  const loadWeekData = async () => {
    setIsLoading(true);
    try {
      const days = getDaysBetween(dateRange.start, dateRange.end);
      const dataPromises = days.map(async (date) => {
        const dayMeals = await getMealsByDate(userId, date);
        const totals = sumMacros(dayMeals);
        return {
          date,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
        };
      });

      const data = await Promise.all(dataPromises);
      setWeekData(data);
    } catch (error) {
      console.error("Error loading week data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const todayTotals = sumMacros(meals as MealEntryWithDetails[]);

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <TodaySummary
        userName={userName}
        selectedDate={selectedDate}
        macros={todayTotals}
      />

      {/* Weekly Summary */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Subheading>Weekly Summary</Subheading>
          <div className="flex gap-2">
            <Field>
              <Label>From</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
              />
            </Field>
            <Field>
              <Label>To</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
              />
            </Field>
          </div>
        </div>

        {isLoading ? (
          <LoadingState message="Loading weekly data..." />
        ) : (
          <WeeklySummary weekData={weekData} />
        )}
      </div>
    </div>
  );
}

// Helper function
function getDaysBetween(startDate: string, endDate: string): string[] {
  const days: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push(d.toISOString().split("T")[0]);
  }

  return days;
}
