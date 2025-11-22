"use client";

import { useState } from "react";
import type {
  FoodItem,
  Recipe,
  RecipeWithIngredients,
} from "@/utils/supabase/queries";
import {
  createRecipe,
  getRecipeWithIngredients,
} from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Select } from "@/app/components/select";
import { Divider } from "@/app/components/divider";

interface RecipesTabProps {
  userId: string;
  userName: string;
  recipes: Recipe[];
  foods: FoodItem[];
  onRefreshRecipes: () => Promise<void>;
}

interface RecipeIngredient {
  food_id: string;
  quantity: number;
  tempId: string;
}

export function RecipesTab({
  userId,
  userName,
  recipes,
  foods,
  onRefreshRecipes,
}: RecipesTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [recipeName, setRecipeName] = useState("");
  const [totalServings, setTotalServings] = useState("4");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<
    Record<string, RecipeWithIngredients>
  >({});

  const handleAddIngredient = () => {
    if (!selectedFoodId || !ingredientQuantity) {
      alert("Please select a food and enter quantity");
      return;
    }

    const newIngredient: RecipeIngredient = {
      food_id: selectedFoodId,
      quantity: parseFloat(ingredientQuantity),
      tempId: Date.now().toString(),
    };

    setIngredients([...ingredients, newIngredient]);
    setSelectedFoodId("");
    setIngredientQuantity("");
  };

  const handleRemoveIngredient = (tempId: string) => {
    setIngredients(ingredients.filter((ing) => ing.tempId !== tempId));
  };

  const handleCreateRecipe = async () => {
    if (!recipeName || !totalServings || ingredients.length === 0) {
      alert(
        "Please fill in recipe name, servings, and add at least one ingredient"
      );
      return;
    }

    setIsAdding(true);
    try {
      await createRecipe(
        {
          user_id: userId,
          name: recipeName,
          total_servings: parseFloat(totalServings),
        },
        ingredients.map((ing) => ({
          food_id: ing.food_id,
          quantity: ing.quantity,
        }))
      );

      // Reset form
      setRecipeName("");
      setTotalServings("4");
      setIngredients([]);

      await onRefreshRecipes();
    } catch (error) {
      console.error("Error creating recipe:", error);
      alert("Failed to create recipe");
    } finally {
      setIsAdding(false);
    }
  };

  const toggleRecipeDetails = async (recipeId: string) => {
    if (expandedRecipe === recipeId) {
      setExpandedRecipe(null);
    } else {
      setExpandedRecipe(recipeId);
      if (!recipeDetails[recipeId]) {
        try {
          const details = await getRecipeWithIngredients(recipeId);
          setRecipeDetails((prev) => ({ ...prev, [recipeId]: details }));
        } catch (error) {
          console.error("Error loading recipe details:", error);
        }
      }
    }
  };

  const getFoodName = (foodId: string) => {
    return foods.find((f) => f.id === foodId)?.name || "Unknown";
  };

  const calculateIngredientMacros = () => {
    return ingredients.reduce(
      (totals, ing) => {
        const food = foods.find((f) => f.id === ing.food_id);
        if (!food) return totals;

        const multiplier = ing.quantity / 100;
        return {
          calories: totals.calories + food.calories * multiplier,
          protein: totals.protein + (food.protein || 0) * multiplier,
          carbs: totals.carbs + (food.carbs || 0) * multiplier,
          fat: totals.fat + (food.fat || 0) * multiplier,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const currentTotals = calculateIngredientMacros();
  const servings = parseFloat(totalServings) || 1;
  const perServing = {
    calories: Math.round(currentTotals.calories / servings),
    protein: Math.round((currentTotals.protein / servings) * 10) / 10,
    carbs: Math.round((currentTotals.carbs / servings) * 10) / 10,
    fat: Math.round((currentTotals.fat / servings) * 10) / 10,
  };

  return (
    <div className="space-y-6">
      {/* Create Recipe Form */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
        <Subheading>Create New Recipe for {userName}</Subheading>

        <div className="mt-6 space-y-6">
          {/* Recipe Details */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <Label>Recipe Name *</Label>
              <Input
                type="text"
                placeholder="e.g., Chicken Stir Fry"
                value={recipeName}
                onChange={(e) => setRecipeName(e.target.value)}
              />
            </Field>

            <Field>
              <Label>Total Servings *</Label>
              <Input
                type="number"
                placeholder="4"
                value={totalServings}
                onChange={(e) => setTotalServings(e.target.value)}
                min="1"
                step="0.5"
              />
            </Field>
          </div>

          {/* Add Ingredients */}
          <div>
            <Label>Add Ingredients</Label>
            <div className="mt-2 grid gap-4 sm:grid-cols-3">
              <Field>
                <Select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                >
                  <option value="">Select food...</option>
                  {foods.map((food) => (
                    <option key={food.id} value={food.id}>
                      {food.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field>
                <Input
                  type="number"
                  placeholder={`Quantity (${
                    selectedFoodId
                      ? foods.find((f) => f.id === selectedFoodId)?.base_unit
                      : "g/ml"
                  })`}
                  value={ingredientQuantity}
                  onChange={(e) => setIngredientQuantity(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </Field>

              <Button onClick={handleAddIngredient} outline>
                + Add
              </Button>
            </div>
          </div>

          {/* Ingredients List */}
          {ingredients.length > 0 && (
            <div>
              <Label>Ingredients ({ingredients.length})</Label>
              <div className="mt-2 space-y-2">
                {ingredients.map((ing) => {
                  const food = foods.find((f) => f.id === ing.food_id);
                  return (
                    <div
                      key={ing.tempId}
                      className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
                    >
                      <Text className="text-sm">
                        {getFoodName(ing.food_id)} - {ing.quantity}
                        {food?.base_unit}
                      </Text>
                      <Button
                        plain
                        className="text-xs"
                        onClick={() => handleRemoveIngredient(ing.tempId)}
                      >
                        Remove
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview Nutrition */}
          {ingredients.length > 0 && (
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-950/20">
              <Text className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Nutrition per Serving
              </Text>
              <div className="mt-2 grid grid-cols-4 gap-4">
                <div>
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    Calories
                  </Text>
                  <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {perServing.calories}
                  </Text>
                </div>
                <div>
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    Protein
                  </Text>
                  <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {perServing.protein}g
                  </Text>
                </div>
                <div>
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    Carbs
                  </Text>
                  <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {perServing.carbs}g
                  </Text>
                </div>
                <div>
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    Fat
                  </Text>
                  <Text className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                    {perServing.fat}g
                  </Text>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleCreateRecipe} disabled={isAdding}>
            {isAdding ? "Creating..." : "Create Recipe"}
          </Button>
        </div>
      </div>

      {/* Recipes List */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
        <Subheading>Your Recipes ({recipes.length})</Subheading>

        <Divider className="my-4" />

        {recipes.length > 0 ? (
          <div className="space-y-2">
            {recipes.map((recipe) => {
              const perServingRecipe = {
                calories: Math.round(
                  (recipe.total_calories || 0) / recipe.total_servings
                ),
                protein:
                  Math.round(
                    ((recipe.total_protein || 0) / recipe.total_servings) * 10
                  ) / 10,
                carbs:
                  Math.round(
                    ((recipe.total_carbs || 0) / recipe.total_servings) * 10
                  ) / 10,
                fat:
                  Math.round(
                    ((recipe.total_fat || 0) / recipe.total_servings) * 10
                  ) / 10,
              };

              const isExpanded = expandedRecipe === recipe.id;
              const details = recipeDetails[recipe.id];

              return (
                <div
                  key={recipe.id}
                  className="rounded-lg bg-zinc-50 p-4 dark:bg-zinc-900"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Text className="font-medium">{recipe.name}</Text>
                      <Text className="mt-1 text-sm text-zinc-500">
                        {recipe.total_servings} servings • Per serving:{" "}
                        {perServingRecipe.calories} cal • P:{" "}
                        {perServingRecipe.protein}g • C:{" "}
                        {perServingRecipe.carbs}g • F: {perServingRecipe.fat}g
                      </Text>
                    </div>
                    <Button
                      plain
                      className="text-sm"
                      onClick={() => toggleRecipeDetails(recipe.id)}
                    >
                      {isExpanded ? "Hide" : "View"} Details
                    </Button>
                  </div>

                  {isExpanded && details && (
                    <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700">
                      <Text className="text-sm font-medium">Ingredients:</Text>
                      <div className="mt-2 space-y-1">
                        {details.recipe_ingredients.map((ing) => (
                          <Text
                            key={ing.id}
                            className="text-sm text-zinc-600 dark:text-zinc-400"
                          >
                            • {ing.food_items.name} - {ing.quantity}
                            {ing.food_items.base_unit}
                          </Text>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Text className="text-zinc-500">
              No recipes yet. Create your first recipe above!
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
