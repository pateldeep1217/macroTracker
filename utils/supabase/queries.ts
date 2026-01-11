// utils/supabase/queries.ts
// Organized CRUD operations for easy navigation

import { MealType } from "@/features/shared/utils/constatns";
import { createClient } from "./client";
import type { Database } from "./database.types";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

// Base types
export type FoodItem = Tables<"food_items">;
export type Recipe = Tables<"recipes">;
export type RecipeIngredient = Tables<"recipe_ingredients">;
export type MealEntry = Tables<"meal_entries">;
export type AppUser = Tables<"app_users">;

// Extended types
export type RecipeWithIngredients = Recipe & {
  recipe_ingredients: (RecipeIngredient & { food_items: FoodItem })[];
};

export type MealEntryWithDetails = MealEntry & {
  food_items?: FoodItem | null;
  recipes?: Recipe | null;
};

// Input types
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
  servingLabel?: string;
};

// ==========================================
// FOOD ITEMS
// ==========================================

// READ
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

// CREATE
export async function createFoodFromLabel(input: CreateFoodFromLabelInput) {
  const supabase = createClient();

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
      serving_label: input.servingLabel || null,
      serving_size: input.labelServingSize,
    })
    .select()
    .single();

  if (error) throw error;
  return data as FoodItem;
}

// UPDATE
export async function updateFood(id: string, input: CreateFoodFromLabelInput) {
  const supabase = createClient();

  const per100 = (value: number) =>
    Math.round((value / input.labelServingSize) * 100 * 100) / 100;

  const { data, error } = await supabase
    .from("food_items")
    .update({
      name: input.name,
      base_unit: input.labelServingUnit,
      calories: per100(input.labelCalories),
      protein: per100(input.labelProtein),
      carbs: per100(input.labelCarbs),
      fat: per100(input.labelFat),
      fiber: input.labelFiber ? per100(input.labelFiber) : null,
      serving_label: input.servingLabel || null,
      serving_size: input.labelServingSize,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as FoodItem;
}

// DELETE
export async function deleteFood(id: string) {
  const supabase = createClient();

  // Check if used in recipes
  const { data: recipeUses } = await supabase
    .from("recipe_ingredients")
    .select("recipes(name)")
    .eq("food_id", id)
    .limit(3);

  if (recipeUses && recipeUses.length > 0) {
    const names = recipeUses
      .map((r: any) => r.recipes?.name)
      .filter(Boolean)
      .join(", ");
    throw new Error(
      `Cannot delete - used in recipes: ${names}. Edit the food item to fix data instead.`
    );
  }

  // Check if used in meal entries
  const { data: mealUses } = await supabase
    .from("meal_entries")
    .select("date")
    .eq("food_id", id)
    .limit(1);

  if (mealUses && mealUses.length > 0) {
    throw new Error(
      "Cannot delete - this food has been logged in your meals. Edit the food item to fix data instead."
    );
  }

  // Safe to delete
  const { error } = await supabase.from("food_items").delete().eq("id", id);
  if (error) throw error;
}

// ==========================================
// RECIPES
// ==========================================

// READ
export async function getAllRecipes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("base_recipe_name")
    .order("is_base_recipe", { ascending: false })
    .order("batch_date", { ascending: false, nullsFirst: false })
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

// CREATE
export async function createBaseRecipe(
  recipe: {
    name: string;
    user_id: string;
    created_by_name: string;
    total_servings: number;
  },
  ingredients: { food_id: string; quantity: number }[]
) {
  const supabase = createClient();

  const { data: newRecipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      ...recipe,
      base_recipe_name: recipe.name,
      is_base_recipe: true,
      batch_date: null,
      parent_recipe_id: null,
    })
    .select()
    .single();

  if (recipeError) throw recipeError;

  if (ingredients.length > 0) {
    const ingredientsToInsert = ingredients.map((ing) => ({
      recipe_id: newRecipe.id,
      ...ing,
    }));

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert);

    if (ingredientsError) throw ingredientsError;

    await supabase.rpc("calculate_recipe_macros", {
      recipe_uuid: newRecipe.id,
    });
  }

  return getRecipeWithIngredients(newRecipe.id);
}

export async function createRecipeBatch(
  baseRecipeId: string,
  userId: string,
  userName: string,
  batchDate: string,
  newServings: number,
  newIngredients: { food_id: string; quantity: number }[]
) {
  const supabase = createClient();

  const { data: baseRecipe, error: fetchError } = await supabase
    .from("recipes")
    .select("base_recipe_name")
    .eq("id", baseRecipeId)
    .single();

  if (fetchError) throw fetchError;

  const batchName = `${baseRecipe.base_recipe_name} (${new Date(
    batchDate
  ).toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;

  const { data: newBatch, error: batchError } = await supabase
    .from("recipes")
    .insert({
      name: batchName,
      base_recipe_name: baseRecipe.base_recipe_name,
      user_id: userId,
      created_by_name: userName,
      total_servings: newServings,
      is_base_recipe: false,
      batch_date: batchDate,
      parent_recipe_id: baseRecipeId,
    })
    .select()
    .single();

  if (batchError) throw batchError;

  if (newIngredients.length > 0) {
    const ingredientsToInsert = newIngredients.map((ing) => ({
      recipe_id: newBatch.id,
      ...ing,
    }));

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsToInsert);

    if (ingredientsError) throw ingredientsError;

    await supabase.rpc("calculate_recipe_macros", {
      recipe_uuid: newBatch.id,
    });
  }

  return getRecipeWithIngredients(newBatch.id);
}

// UPDATE
export async function updateRecipe(
  recipeId: string,
  recipeData: {
    name?: string;
    user_id?: string;
    created_by_name?: string;
    total_servings?: number;
  },
  ingredients: { food_id: string; quantity: number }[]
) {
  const supabase = createClient();

  // Update recipe base fields (only safe fields)
  const { error: recipeError } = await supabase
    .from("recipes")
    .update(recipeData)
    .eq("id", recipeId);

  if (recipeError) throw recipeError;

  // Delete old ingredients
  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);

  // Insert new ingredients
  if (ingredients.length > 0) {
    const rows = ingredients.map((i) => ({
      recipe_id: recipeId,
      ...i,
    }));

    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(rows);

    if (ingError) throw ingError;
  }

  // Recalculate macros
  await supabase.rpc("calculate_recipe_macros", {
    recipe_uuid: recipeId,
  });

  return getRecipeWithIngredients(recipeId);
}

// DELETE
export async function deleteRecipe(id: string) {
  const supabase = createClient();

  // Check if this is a base recipe with batches
  const { data: batches, error: batchCheckError } = await supabase
    .from("recipes")
    .select("id, name")
    .eq("parent_recipe_id", id);

  if (batchCheckError) throw batchCheckError;

  if (batches && batches.length > 0) {
    throw new Error(
      `Cannot delete base recipe. It has ${
        batches.length
      } batch(es). Delete batches first:\n${batches
        .map((b) => `• ${b.name}`)
        .join("\n")}`
    );
  }

  // Delete recipe (recipe_ingredients cascade automatically)
  // meal_entries will have recipe_id set to NULL (from ON DELETE SET NULL)
  const { error } = await supabase.from("recipes").delete().eq("id", id);

  if (error) throw error;
}

// ==========================================
// MEAL ENTRIES
// ==========================================

// READ
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

export async function getRecentDaysWithMeals(
  userId: string,
  limit: number = 10
) {
  const supabase = createClient();

  // Get distinct dates from the last 30 days that have meals
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("meal_entries")
    .select(
      `
      date,
      meal_type,
      *,
      food_items (*),
      recipes (*)
    `
    )
    .eq("user_id", userId)
    .gte("date", thirtyDaysAgoStr)
    .order("date", { ascending: false })
    .order("created_at");

  if (error) throw error;

  // Group by date
  const mealsByDate = new Map<string, MealEntryWithDetails[]>();

  (data as MealEntryWithDetails[]).forEach((meal) => {
    if (!mealsByDate.has(meal.date)) {
      mealsByDate.set(meal.date, []);
    }
    mealsByDate.get(meal.date)!.push(meal);
  });

  // Convert to array and limit
  const recentDays = Array.from(mealsByDate.entries())
    .slice(0, limit)
    .map(([date, meals]) => ({ date, meals }));

  return recentDays;
}

export async function copyMealsToDate(
  userId: string,
  fromDate: string,
  toDate: string,
  mealTypes: MealType[]
) {
  const supabase = createClient();

  // Get meals from source date
  const { data: sourceMeals, error: fetchError } = await supabase
    .from("meal_entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", fromDate)
    .in("meal_type", mealTypes);

  if (fetchError) throw fetchError;
  if (!sourceMeals || sourceMeals.length === 0) return [];

  // Create new entries for target date
  const newEntries = sourceMeals.map((meal) => ({
    user_id: userId,
    date: toDate,
    meal_type: meal.meal_type,
    food_id: meal.food_id,
    recipe_id: meal.recipe_id,
    quantity: meal.quantity,
    quantity_type: meal.quantity_type,
    notes: meal.notes,
    prepared_meal_id: meal.prepared_meal_id,
  }));

  const { data, error } = await supabase.from("meal_entries").insert(newEntries)
    .select(`
      *,
      food_items (*),
      recipes (*)
    `);

  if (error) throw error;
  return data as MealEntryWithDetails[];
}

// CREATE
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

// UPDATE
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

// DELETE
export async function deleteMealEntry(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("meal_entries").delete().eq("id", id);

  if (error) throw error;
}

// ==========================================
// USERS
// ==========================================

// READ
export async function getAllUsers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .order("name");

  if (error) throw error;
  return data as AppUser[];
}
