import type { MealEntryWithDetails } from "@/utils/supabase/queries";

export interface MacroTotals {
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
}

export function calculateMealMacros(meal: MealEntryWithDetails): MacroTotals {
  if (meal.food_items) {
    const multiplier = meal.quantity / 100;
    const food = meal.food_items;
    return {
      calories: food.calories * multiplier,
      protein: (food.protein ?? 0) * multiplier,
      carbs: (food.carbs ?? 0) * multiplier,
      fat: (food.fat ?? 0) * multiplier,
    };
  }

  if (meal.recipes) {
    const servings = meal.quantity;
    const recipe = meal.recipes;
    const totalServings = recipe.total_servings;

    return {
      calories: ((recipe.total_calories ?? 0) * servings) / totalServings,
      protein: ((recipe.total_protein ?? 0) * servings) / totalServings,
      carbs: ((recipe.total_carbs ?? 0) * servings) / totalServings,
      fat: ((recipe.total_fat ?? 0) * servings) / totalServings,
    };
  }

  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function sumMacros(meals: MealEntryWithDetails[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (totals, meal) => {
      const mealMacros = calculateMealMacros(meal);
      return {
        calories: totals.calories + mealMacros.calories,
        protein: totals.protein + mealMacros.protein,
        carbs: totals.carbs + mealMacros.carbs,
        fat: totals.fat + mealMacros.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export interface FormattedMacros {
  readonly calories: number;
  readonly protein: number;
  readonly carbs: number;
  readonly fat: number;
}

export function formatMacros(macros: MacroTotals): FormattedMacros {
  return {
    calories: Math.round(macros.calories),
    protein: Number(macros.protein.toFixed(1)),
    carbs: Number(macros.carbs.toFixed(1)),
    fat: Number(macros.fat.toFixed(1)),
  };
}

export function calculateMacroPercentage(
  grams: number,
  caloriesPerGram: number,
  totals: MacroTotals
): number {
  const totalCalories = totals.protein * 4 + totals.carbs * 4 + totals.fat * 9;

  if (totalCalories === 0) return 0;

  return Math.round((grams * caloriesPerGram * 100) / totalCalories);
}
