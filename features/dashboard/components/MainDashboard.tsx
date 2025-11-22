"use client";

import { useState, useEffect } from "react";
import type {
  AppUser,
  FoodItem,
  Recipe,
  MealEntryWithDetails,
} from "@/utils/supabase/queries";
import {
  getAllFoods,
  getUserRecipes,
  getMealsByDate,
} from "@/utils/supabase/queries";
import { Heading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { DailyLogTab } from "./DailyLogTab";
import { FoodItemsTab } from "./FoodItemsTab";
import { RecipesTab } from "./RecipesTab";
import { SummaryTab } from "./SummaryTab";
import { TabNavigation } from "./TabNavigation";
import { LoadingState } from "@/features/shared/components/LoadingState";

const TABS = [
  { id: "log", label: "Daily Log" },
  { id: "foods", label: "Food Items" },
  { id: "recipes", label: "Recipes" },
  { id: "summary", label: "Summary" },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface MainDashboardProps {
  readonly currentUser: AppUser;
  readonly allUsers: readonly AppUser[];
  readonly onSwitchUser: () => void;
}

export function MainDashboard({
  currentUser,
  allUsers,
  onSwitchUser,
}: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("log");
  const [selectedUserId, setSelectedUserId] = useState(currentUser.id);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<MealEntryWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [isLoading, setIsLoading] = useState(true);

  const selectedUser =
    allUsers.find((u) => u.id === selectedUserId) ?? currentUser;

  // Load initial data
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [foodsData, recipesData] = await Promise.all([
          getAllFoods(),
          getUserRecipes(selectedUserId),
        ]);
        setFoods(foodsData);
        setRecipes(recipesData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedUserId]);

  // Load meals when date or user changes
  useEffect(() => {
    async function loadMeals() {
      try {
        const data = await getMealsByDate(selectedUserId, selectedDate);
        setMeals(data);
      } catch (error) {
        console.error("Error loading meals:", error);
      }
    }
    loadMeals();
  }, [selectedUserId, selectedDate]);

  const refreshMeals = async () => {
    const data = await getMealsByDate(selectedUserId, selectedDate);
    setMeals(data);
  };

  const refreshFoods = async () => {
    const data = await getAllFoods();
    setFoods(data);
  };

  const refreshRecipes = async () => {
    const data = await getUserRecipes(selectedUserId);
    setRecipes(data);
  };

  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Compact Header - Sticky */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <Heading level={1} className="text-lg font-bold sm:text-xl">
                Food Macro Tracker
              </Heading>
              <Text className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:block">
                Track your daily nutrition
              </Text>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <Text className="text-sm font-medium">{currentUser.name}</Text>
                <button
                  onClick={onSwitchUser}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 sm:text-sm"
                >
                  Switch User
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation - Scrollable on Mobile */}
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <TabNavigation
              tabs={TABS}
              activeTab={activeTab}
              onTabChange={(tabId) => setActiveTab(tabId as TabId)}
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        {activeTab === "log" && (
          <DailyLogTab
            userId={selectedUserId}
            userName={selectedUser.name}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            foods={foods}
            recipes={recipes}
            meals={meals}
            onRefreshMeals={refreshMeals}
          />
        )}

        {activeTab === "foods" && (
          <FoodItemsTab foods={foods} onRefreshFoods={refreshFoods} />
        )}

        {activeTab === "recipes" && (
          <RecipesTab
            userId={selectedUserId}
            userName={selectedUser.name}
            recipes={recipes}
            foods={foods}
            onRefreshRecipes={refreshRecipes}
          />
        )}

        {activeTab === "summary" && (
          <SummaryTab
            userId={selectedUserId}
            userName={selectedUser.name}
            selectedDate={selectedDate}
            meals={meals}
          />
        )}
      </div>
    </div>
  );
}
