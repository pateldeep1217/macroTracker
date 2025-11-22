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
import { Avatar } from "@/app/components/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/app/components/dropdown";
import {
  Navbar,
  NavbarDivider,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/app/components/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
} from "@/app/components/sidebar";
import { StackedLayout } from "@/app/components/stacked-layout";
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
} from "@heroicons/react/20/solid";
import { UserIcon } from "@heroicons/react/16/solid";

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

  function UserDropdownMenu() {
    return (
      <DropdownMenu className="min-w-64" anchor="bottom end">
        <DropdownItem href="#">
          <UserIcon />
          <DropdownLabel>{currentUser.name}</DropdownLabel>
        </DropdownItem>
        <DropdownDivider />
        <DropdownItem onClick={onSwitchUser}>
          <DropdownLabel>Switch User</DropdownLabel>
        </DropdownItem>
      </DropdownMenu>
    );
  }

  return (
    <StackedLayout
      navbar={
        <Navbar>
          <NavbarSection className="max-lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <span className="text-lg font-bold">🍎</span>
              </div>
              <div>
                <div className="text-base font-semibold">
                  Food Macro Tracker
                </div>
                <div className="text-xs text-zinc-500">
                  Track your nutrition
                </div>
              </div>
            </div>
          </NavbarSection>
          <NavbarDivider className="max-lg:hidden" />
          <NavbarSection className="max-lg:hidden">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavbarItem
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  current={activeTab === tab.id}
                >
                  <Icon />
                  {tab.label}
                </NavbarItem>
              );
            })}
          </NavbarSection>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar initials={currentUser.name.substring(0, 2)} square />
              </DropdownButton>
              <UserDropdownMenu />
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
                <span className="text-lg font-bold">🍎</span>
              </div>
              <div className="flex-1 min-w-0">
                <SidebarLabel className="text-sm font-semibold">
                  Food Tracker
                </SidebarLabel>
                <div className="text-xs text-zinc-500 truncate">
                  {currentUser.name}
                </div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarBody>
            <SidebarSection>
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <SidebarItem
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    current={activeTab === tab.id}
                  >
                    <Icon />
                    <SidebarLabel>{tab.label}</SidebarLabel>
                  </SidebarItem>
                );
              })}
            </SidebarSection>
          </SidebarBody>
        </Sidebar>
      }
    >
      <div className="mx-auto max-w-6xl">
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
    </StackedLayout>
  );
}
