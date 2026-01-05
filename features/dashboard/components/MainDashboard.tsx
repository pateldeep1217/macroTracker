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
  getRecipeWithIngredients,
} from "@/utils/supabase/queries";

import { DailyLogTab } from "./DailyLogTab";
import { FoodItemsTab } from "./FoodItemsTab";
import { RecipesTab } from "./RecipesTab";
import { SummaryTab } from "./SummaryTab";
import { LoadingState } from "@/features/shared/components/LoadingState";

import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  Squares2X2Icon,
  BeakerIcon,
  ArrowPathIcon,
} from "@heroicons/react/20/solid";

const TABS = [
  { id: "log", label: "Daily Log", icon: ClipboardDocumentListIcon },
  { id: "foods", label: "Food Items", icon: Squares2X2Icon },
  { id: "recipes", label: "Recipes", icon: BeakerIcon },
  { id: "summary", label: "Summary", icon: ChartBarIcon },
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
  // Tab persistence with localStorage
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    const savedTab = localStorage.getItem("activeTab") as TabId | null;
    if (savedTab && TABS.some((t) => t.id === savedTab)) {
      return savedTab;
    }
    return "log";
  });

  // Save tab to localStorage when it changes
  const handleTabChange = (tabId: TabId) => {
    setActiveTab(tabId);
    localStorage.setItem("activeTab", tabId);
  };

  const [selectedUserId] = useState(currentUser.id);

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [meals, setMeals] = useState<MealEntryWithDetails[]>([]);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const [isLoading, setIsLoading] = useState(true);

  const selectedUser =
    allUsers.find((u) => u.id === selectedUserId) ?? currentUser;

  // Load foods + recipes
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const foodsData = await getAllFoods();
        const baseRecipes = await getUserRecipes(selectedUserId);

        const recipesWithIngredients = await Promise.all(
          baseRecipes.map((r) => getRecipeWithIngredients(r.id))
        );

        setFoods(foodsData);
        setRecipes(recipesWithIngredients);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [selectedUserId]);

  // Load meals
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
    const base = await getUserRecipes(selectedUserId);
    const full = await Promise.all(
      base.map((r) => getRecipeWithIngredients(r.id))
    );
    setRecipes(full);
  };

  if (isLoading) {
    return <LoadingState message="Loading your dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Simple Top Navigation */}
      <div className="sticky top-0 z-50 bg-zinc-900 border-b border-zinc-800">
        <div className="mx-auto max-w-6xl">
          {/* Header Row */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="text-xl">🍎</div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-white">
                  Food Macro Tracker
                </div>
              </div>
            </div>

            <button
              onClick={onSwitchUser}
              className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ArrowPathIcon className="h-4 w-4" />
              <span>{currentUser.name}</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex overflow-x-auto px-4 sm:px-6">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all
                    ${
                      isActive
                        ? "border-blue-500 text-white"
                        : "border-transparent text-zinc-400 hover:border-zinc-700 hover:text-zinc-300"
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
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
            foods={foods}
            recipes={recipes}
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
