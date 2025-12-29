"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createRecipe,
  updateRecipe,
  getRecipeWithIngredients,
  searchFoods,
} from "@/utils/supabase/queries";

import type { Recipe, FoodItem } from "@/utils/supabase/queries";

import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Divider } from "@/app/components/divider";
import { getQuantityMacros } from "@/features/shared/utils/macors";

interface RecipeFormProps {
  readonly onRecipeSaved: () => Promise<void>;
  readonly editingRecipe?: Recipe | null;
  readonly userId: string;
}

interface IngredientRow {
  food: FoodItem;
  quantity: string;
}

export function RecipeForm({
  onRecipeSaved,
  editingRecipe,
  userId,
}: RecipeFormProps) {
  const isEditMode = !!editingRecipe;

  const [name, setName] = useState("");
  const [totalServings, setTotalServings] = useState("1");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load recipe when editing
  useEffect(() => {
    if (!editingRecipe) return;

    (async () => {
      const full = await getRecipeWithIngredients(editingRecipe.id);

      setName(full.name);
      setTotalServings(full.total_servings.toString());

      setIngredients(
        full.recipe_ingredients.map((ri) => ({
          food: ri.food_items,
          quantity: ri.quantity.toString(),
        }))
      );
    })();
  }, [editingRecipe]);

  // Search foods
  useEffect(() => {
    let active = true;

    if (searchTerm.length < 2) {
      setSearchResults([]);
      return;
    }

    (async () => {
      const results = await searchFoods(searchTerm);
      if (active) setSearchResults(results);
    })();

    return () => {
      active = false;
    };
  }, [searchTerm]);

  const addIngredient = (food: FoodItem) => {
    if (ingredients.some((i) => i.food.id === food.id)) return;

    setIngredients((prev) => [...prev, { food, quantity: "" }]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.food.id !== id));
  };

  const updateQuantity = (id: string, value: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.food.id === id ? { ...i, quantity: value } : i))
    );
  };

  // REAL-TIME MACROS
  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const ing of ingredients) {
      const qty = parseFloat(ing.quantity) || 0;
      calories += (ing.food.calories * qty) / 100;
      protein += ((ing.food.protein || 0) * qty) / 100;
      carbs += ((ing.food.carbs || 0) * qty) / 100;
      fat += ((ing.food.fat || 0) * qty) / 100;
    }

    const servings = parseFloat(totalServings) || 1;

    return {
      calories,
      protein,
      carbs,
      fat,
      perServing: {
        calories: calories / servings,
        protein: protein / servings,
        carbs: carbs / servings,
        fat: fat / servings,
      },
    };
  }, [ingredients, totalServings]);

  const handleSubmit = async () => {
    setError(null);

    if (!name.trim()) {
      setError("Recipe name is required");
      return;
    }

    if (ingredients.length === 0) {
      setError("Add at least one ingredient");
      return;
    }

    if (!totalServings || parseFloat(totalServings) <= 0) {
      setError("Total servings must be greater than 0");
      return;
    }

    const parsedIngredients = ingredients.map((i) => ({
      food_id: i.food.id,
      quantity: parseFloat(i.quantity) || 0,
    }));

    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateRecipe(
          editingRecipe!.id,
          {
            name,
            user_id: userId,
            total_servings: parseFloat(totalServings),
          },
          parsedIngredients
        );
      } else {
        await createRecipe(
          {
            name,
            user_id: userId,
            total_servings: parseFloat(totalServings),
          },
          parsedIngredients
        );
      }

      await onRecipeSaved();
    } catch (err) {
      console.error(err);
      setError("Failed to save recipe");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* HEADER */}
      <div>
        <Subheading>{isEditMode ? "Edit Recipe" : "Create Recipe"}</Subheading>
        <Text className="mt-1 text-sm text-zinc-500">
          Use descriptive names like “Chicken Stir Fry - High Protein” or
          “Oatmeal - Breakfast Batch” to easily identify recipes later.
        </Text>
      </div>
      <Divider />
      {/* NAME + SERVINGS */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field>
          <Label>Recipe Name *</Label>
          <Input
            type="text"
            placeholder="e.g., Chickpea Rice Bowl"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>

        <Field>
          <Label>Total Servings *</Label>
          <Input
            type="number"
            min="1"
            step="0.1"
            value={totalServings}
            onChange={(e) => setTotalServings(e.target.value)}
          />
        </Field>
      </div>
      {/* INGREDIENT SEARCH */}
      <Field>
        <Label>Add Ingredients</Label>
        <Input
          type="text"
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Field>
      {searchResults.length > 0 && (
        <div className="rounded-lg border bg-white dark:bg-zinc-900">
          {searchResults.map((food) => (
            <button
              key={food.id}
              className="block w-full px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => addIngredient(food)}
            >
              {food.name}
            </button>
          ))}
        </div>
      )}
      {/* INGREDIENT LIST */}
      {/* INGREDIENT LIST */}
      <div className="space-y-3">
        {ingredients.map((ing) => {
          const qty = parseFloat(ing.quantity) || 0;
          const macros = getQuantityMacros(ing.food, qty);

          return (
            <div
              key={ing.food.id}
              className="flex items-center justify-between rounded-lg bg-zinc-50 p-3 dark:bg-zinc-900"
            >
              <div>
                {/* NAME */}
                <Text className="font-medium">{ing.food.name}</Text>

                {/* QUANTITY MACROS */}
                {qty > 0 && (
                  <Text className="text-xs text-zinc-700 dark:text-zinc-300">
                    {qty}
                    {ing.food.base_unit} → {macros.calories.toFixed(0)} cal • P:{" "}
                    {macros.protein.toFixed(1)}g • C: {macros.carbs.toFixed(1)}g
                    • F: {macros.fat.toFixed(1)}g
                    {macros.fiber !== null &&
                      ` • Fiber: ${macros.fiber.toFixed(1)}g`}
                  </Text>
                )}

                {/* PER 100g/ml */}
                <Text className="text-xs text-zinc-500">
                  Per 100{ing.food.base_unit}: {ing.food.calories} cal
                </Text>
              </div>

              {/* INPUT + REMOVE */}
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-24"
                  placeholder="Qty"
                  value={ing.quantity}
                  onChange={(e) => updateQuantity(ing.food.id, e.target.value)}
                />
                <Text className="text-sm">{ing.food.base_unit}</Text>

                <Button
                  plain
                  className="text-red-600"
                  onClick={() => removeIngredient(ing.food.id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      {/* ERROR */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      )}
      {/* ACTION BUTTON */}
      <div className="pt-4">
        <Button onClick={handleSubmit} disabled={isSaving} className="w-full">
          {isSaving
            ? isEditMode
              ? "Updating..."
              : "Saving..."
            : isEditMode
            ? "Update Recipe"
            : "+ Create Recipe"}
        </Button>
      </div>
      {/* MACRO PREVIEW */}
      {/* NUTRITION SUMMARY */}{" "}
      <div className="rounded-xl bg-zinc-50 p-6 dark:bg-zinc-900">
        {" "}
        {/* TOTAL SECTION */}{" "}
        <div>
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <span className="text-lg">🍽️</span>{" "}
            <Subheading className="text-base">
              Nutrition Summary (Total)
            </Subheading>{" "}
          </div>{" "}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {" "}
            <Text>Calories: {totals.calories.toFixed(0)} cal</Text>{" "}
            <Text>Protein: {totals.protein.toFixed(1)} g</Text>{" "}
            <Text>Carbs: {totals.carbs.toFixed(1)} g</Text>{" "}
            <Text>Fat: {totals.fat.toFixed(1)} g</Text>{" "}
          </div>{" "}
        </div>{" "}
        <Divider className="my-6" /> {/* PER SERVING SECTION */}{" "}
        <div>
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <span className="text-lg">🥄</span>{" "}
            <Subheading className="text-base">
              {" "}
              Nutrition per Serving ({totalServings} servings){" "}
            </Subheading>{" "}
          </div>{" "}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            {" "}
            <Text>
              Calories: {totals.perServing.calories.toFixed(0)} cal
            </Text>{" "}
            <Text>Protein: {totals.perServing.protein.toFixed(1)} g</Text>{" "}
            <Text>Carbs: {totals.perServing.carbs.toFixed(1)} g</Text>{" "}
            <Text>Fat: {totals.perServing.fat.toFixed(1)} g</Text>{" "}
          </div>{" "}
        </div>{" "}
        {/* OPTIONAL HINT */}{" "}
        <Text className="mt-4 text-xs text-zinc-500">
          {" "}
          Calculated as: Total ÷ Servings{" "}
        </Text>{" "}
      </div>
    </div>
  );
}
