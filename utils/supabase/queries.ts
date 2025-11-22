// utils/supabase/queries.ts
// Simple queries using your existing setup

import { MealType } from "@/features/shared/utils/constatns";
import { createClient } from "./client";
import type { Database } from "./database.types";

// Helper types
type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type FoodItem = Tables<"food_items">;
export type Recipe = Tables<"recipes">;
export type RecipeIngredient = Tables<"recipe_ingredients">;
export type MealEntry = Tables<"meal_entries">;
export type AppUser = Tables<"app_users">;

export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (RecipeIngredient & { food_items: FoodItem })[];
};

export type MealEntryWithDetails = MealEntry & {
  food_items?: FoodItem | null;
  recipes?: Recipe | null;
};

// ==========================================
// FOOD ITEMS
// ==========================================

export async function getAllFoods() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as FoodItem[];
}

export async function searchFoods(searchTerm: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .ilike("name", `%${searchTerm}%`)
    .order("name")
    .limit(20);

  if (error) throw error;
  return data as FoodItem[];
}

export type CreateFoodFromLabelInput = {
  name: string;
  brand?: string;
  labelServingSize: number;
  labelServingUnit: "g" | "ml";
  labelCalories: number;
  labelProtein: number;
  labelCarbs: number;
  labelFat: number;
  labelFiber?: number;
};

export async function createFoodFromLabel(input: CreateFoodFromLabelInput) {
  const supabase = createClient();

  // Convert to per-100
  const per100 = (value: number) =>
    Math.round((value / input.labelServingSize) * 100 * 100) / 100;

  const { data, error } = await supabase
    .from("food_items")
    .insert({
      name: input.name,
      base_unit: input.labelServingUnit,
      calories: per100(input.labelCalories),
      protein: per100(input.labelProtein),
      carbs: per100(input.labelCarbs),
      fat: per100(input.labelFat),
      fiber: input.labelFiber ? per100(input.labelFiber) : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FoodItem;
}

export async function deleteFood(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("food_items").delete().eq("id", id);

  if (error) throw error;
}

// ==========================================
// RECIPES
// ==========================================

export async function getUserRecipes(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Recipe[];
}

export async function getRecipeWithIngredients(recipeId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients (
        *,
        food_items (*)
      )
    `
    )
    .eq("id", recipeId)
    .single();

  if (error) throw error;
  return data as RecipeWithIngredients;
}

export async function createRecipe(
  recipe: Inserts<"recipes">,
  ingredients: { food_id: string; quantity: number }[]
) {
  const supabase = createClient();

  // Create recipe
  const { data: newRecipe, error: recipeError } = await supabase
    .from("recipes")
    .insert(recipe)
    .select()
    .single();

  if (recipeError) throw recipeError;

  // Add ingredients
  if (ingredients.length > 0) {
    const ingredientsToInsert = ingredients.map((ing) => ({
      recipe_id: newRecipe.id,
      ...ing,
    }));

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert);

    if (ingredientsError) throw ingredientsError;

    // Calculate macros
    await supabase.rpc("calculate_recipe_macros", {
      recipe_uuid: newRecipe.id,
    });
  }

  return getRecipeWithIngredients(newRecipe.id);
}

// ==========================================
// MEAL ENTRIES
// ==========================================

export async function getMealsByDate(userId: string, date: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meal_entries")
    .select(
      `
      *,
      food_items (*),
      recipes (*)
    `
    )
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at");

  if (error) throw error;
  return data as MealEntryWithDetails[];
}

export async function logFood(input: {
  userId: string;
  date: string;
  mealType?: MealType;
  foodId: string;
  quantity: number;
  quantityType: "g" | "ml";
  notes?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meal_entries")
    .insert({
      user_id: input.userId,
      date: input.date,
      meal_type: input.mealType,
      food_id: input.foodId,
      quantity: input.quantity,
      quantity_type: input.quantityType,
      notes: input.notes || null,
      recipe_id: null,
      prepared_meal_id: null,
    })
    .select(
      `
      *,
      food_items (*)
    `
    )
    .single();

  if (error) throw error;
  return data as MealEntryWithDetails;
}

export async function logRecipe(input: {
  userId: string;
  date: string;
  mealType?: MealType;
  recipeId: string;
  servings: number;
  notes?: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("meal_entries")
    .insert({
      user_id: input.userId,
      date: input.date,
      meal_type: input.mealType,
      recipe_id: input.recipeId,
      quantity: input.servings,
      quantity_type: "servings",
      notes: input.notes || null,
      food_id: null,
      prepared_meal_id: null,
    })
    .select(
      `
      *,
      recipes (*)
    `
    )
    .single();

  if (error) throw error;
  return data as MealEntryWithDetails;
}

export async function updateMealEntry(input: {
  id: string;
  quantity: number;
  mealType?: MealType;
  notes?: string;
}) {
  const supabase = createClient();

  const updateData: any = {
    quantity: input.quantity,
  };

  if (input.mealType) updateData.meal_type = input.mealType;
  if (input.notes !== undefined) updateData.notes = input.notes;

  const { data, error } = await supabase
    .from("meal_entries")
    .update(updateData)
    .eq("id", input.id)
    .select(
      `
      *,
      food_items (*),
      recipes (*)
    `
    )
    .single();

  if (error) throw error;
  return data as MealEntryWithDetails;
}
export async function deleteMealEntry(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("meal_entries").delete().eq("id", id);

  if (error) throw error;
}

// ==========================================
// USERS
// ==========================================

export async function getAllUsers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as AppUser[];
}
