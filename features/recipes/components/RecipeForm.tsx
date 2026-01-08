"use client";

import { useState, useEffect, useMemo } from "react";
import {
  createBaseRecipe,
  createRecipeBatch,
  updateRecipe,
  getRecipeWithIngredients,
  searchFoods,
} from "@/utils/supabase/queries";
import type { Recipe, FoodItem } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { XMarkIcon } from "@heroicons/react/20/solid";

interface RecipeFormProps {
  readonly onRecipeSaved: () => Promise<void>;
  readonly editingRecipe?: Recipe | null;
  readonly userId: string;
  readonly userName: string;
  readonly baseRecipeForBatch?: Recipe | null;
}

interface IngredientRow {
  food: FoodItem;
  quantity: string;
}

export function RecipeForm({
  onRecipeSaved,
  editingRecipe,
  userId,
  userName,
  baseRecipeForBatch,
}: RecipeFormProps) {
  const isEditMode = !!editingRecipe;
  const isBatchMode = !!baseRecipeForBatch;

  const [name, setName] = useState("");
  const [totalServings, setTotalServings] = useState("1");
  const [batchDate, setBatchDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [servingsInputs, setServingsInputs] = useState<Record<string, string>>(
    {}
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMacros, setShowMacros] = useState(false);

  useEffect(() => {
    if (editingRecipe) {
      (async () => {
        const full = await getRecipeWithIngredients(editingRecipe.id);
        setName(full.name);
        setTotalServings(full.total_servings.toString());
        if (full.batch_date) {
          setBatchDate(full.batch_date);
        }
        setIngredients(
          full.recipe_ingredients.map((ri) => ({
            food: ri.food_items,
            quantity: ri.quantity.toString(),
          }))
        );
      })();
    }
  }, [editingRecipe]);

  useEffect(() => {
    if (baseRecipeForBatch) {
      (async () => {
        const full = await getRecipeWithIngredients(baseRecipeForBatch.id);
        setName(full.base_recipe_name || full.name);
        setTotalServings(full.total_servings.toString());
        setIngredients(
          full.recipe_ingredients.map((ri) => ({
            food: ri.food_items,
            quantity: ri.quantity.toString(),
          }))
        );
      })();
    }
  }, [baseRecipeForBatch]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchFoods(searchTerm);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const addIngredient = (food: FoodItem) => {
    if (ingredients.some((i) => i.food.id === food.id)) {
      setError(`${food.name} is already added`);
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIngredients((prev) => [...prev, { food, quantity: "" }]);
    setSearchTerm("");
    setSearchResults([]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.food.id !== id));
    setServingsInputs((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const updateQuantity = (id: string, value: string) => {
    setIngredients((prev) =>
      prev.map((i) => (i.food.id === id ? { ...i, quantity: value } : i))
    );
  };

  const totals = useMemo(() => {
    let calories = 0;
    let protein = 0;
    let carbs = 0;
    let fat = 0;

    for (const ing of ingredients) {
      const qty = parseFloat(ing.quantity) || 0;
      const multiplier = qty / 100;
      calories += ing.food.calories * multiplier;
      protein += (ing.food.protein || 0) * multiplier;
      carbs += (ing.food.carbs || 0) * multiplier;
      fat += (ing.food.fat || 0) * multiplier;
    }

    const servings = Math.max(parseFloat(totalServings) || 1, 1);

    return {
      total: { calories, protein, carbs, fat },
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

    const hasEmptyQuantity = ingredients.some(
      (i) => !i.quantity || parseFloat(i.quantity) <= 0
    );
    if (hasEmptyQuantity) {
      setError("All ingredients must have a quantity greater than 0");
      return;
    }

    const servings = parseFloat(totalServings);
    if (!servings || servings <= 0) {
      setError("Total servings must be greater than 0");
      return;
    }

    const parsedIngredients = ingredients.map((i) => ({
      food_id: i.food.id,
      quantity: parseFloat(i.quantity),
    }));

    setIsSaving(true);
    try {
      if (isEditMode) {
        await updateRecipe(
          editingRecipe!.id,
          {
            name,
            user_id: userId,
            created_by_name: userName,
            total_servings: servings,
          },
          parsedIngredients
        );
      } else if (isBatchMode) {
        await createRecipeBatch(
          baseRecipeForBatch!.id,
          userId,
          userName,
          batchDate,
          servings,
          parsedIngredients
        );
      } else {
        await createBaseRecipe(
          {
            name,
            user_id: userId,
            created_by_name: userName,
            total_servings: servings,
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

  const getFormTitle = () => {
    if (isEditMode) return "Edit Recipe";
    if (isBatchMode) return `New Batch of ${baseRecipeForBatch?.name}`;
    return "Create New Recipe";
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field>
          <Label>Recipe Name *</Label>
          <Input
            type="text"
            placeholder="e.g., High Protein Pasta"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isBatchMode}
          />
          {isBatchMode && (
            <Text className="text-xs text-zinc-400 mt-1">
              Batch will be named: {name} (
              {new Date(batchDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              )
            </Text>
          )}
        </Field>

        <Field>
          <Label>Total Servings *</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={totalServings}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                setTotalServings(value);
              }
            }}
          />
        </Field>
      </div>

      {/* Batch Date */}
      {isBatchMode && (
        <Field>
          <Label>Batch Date *</Label>
          <Input
            type="date"
            value={batchDate}
            onChange={(e) => setBatchDate(e.target.value)}
          />
        </Field>
      )}

      {/* Search Ingredients */}
      <Field>
        <Label>Add Ingredients</Label>
        <Input
          type="text"
          placeholder="Search foods..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {isSearching && (
          <Text className="mt-1 text-xs text-zinc-500">Searching...</Text>
        )}
      </Field>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800 overflow-hidden">
          {searchResults.map((food) => (
            <button
              key={food.id}
              className="block w-full px-4 py-3 text-left hover:bg-zinc-700 transition-colors border-b border-zinc-700 last:border-b-0"
              onClick={() => addIngredient(food)}
            >
              <Text className="text-sm font-medium text-white">
                {food.name}
              </Text>
              <Text className="text-xs text-zinc-400 mt-0.5">
                {food.calories} cal per 100{food.base_unit}
                {food.serving_label &&
                  ` • ${food.serving_label}: ${food.serving_size}${food.base_unit}`}
              </Text>
            </button>
          ))}
        </div>
      )}

      {/* Ingredients List */}
      {ingredients.length > 0 && (
        <div className="space-y-3">
          <Text className="text-sm font-medium text-white">
            Ingredients ({ingredients.length})
          </Text>
          {ingredients.map((ing) => {
            const qty = parseFloat(ing.quantity) || 0;
            const multiplier = qty / 100;
            const ingCals = Math.round(ing.food.calories * multiplier);
            const ingProtein =
              Math.round((ing.food.protein || 0) * multiplier * 10) / 10;
            const hasServingInfo =
              ing.food.serving_label && ing.food.serving_size;

            const servingsValue = servingsInputs[ing.food.id] || "";

            return (
              <div
                key={ing.food.id}
                className="rounded-lg bg-zinc-800 border border-zinc-700 p-3 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <Text className="font-medium text-white">
                      {ing.food.name}
                    </Text>
                    {qty > 0 && (
                      <Text className="text-xs text-zinc-400 mt-1">
                        {ingCals} cal • {ingProtein}g protein
                      </Text>
                    )}
                  </div>

                  <button
                    onClick={() => removeIngredient(ing.food.id)}
                    className="p-1 rounded hover:bg-zinc-700 text-zinc-400 hover:text-red-400 transition-colors shrink-0"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Dual Input */}
                {hasServingInfo ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {/* Servings Input */}
                      <div>
                        <Text className="text-xs text-zinc-500 mb-1">
                          {ing.food.serving_label}s
                        </Text>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="text-sm"
                          placeholder="0"
                          value={servingsValue}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              setServingsInputs((prev) => ({
                                ...prev,
                                [ing.food.id]: value,
                              }));

                              if (value === "") {
                                updateQuantity(ing.food.id, "");
                              } else {
                                const servingsNum = parseFloat(value);
                                if (!isNaN(servingsNum)) {
                                  const grams =
                                    servingsNum * ing.food.serving_size!;
                                  updateQuantity(ing.food.id, grams.toString());
                                }
                              }
                            }
                          }}
                        />
                      </div>

                      {/* Grams Input */}
                      <div>
                        <Text className="text-xs text-zinc-500 mb-1">
                          or {ing.food.base_unit}
                        </Text>
                        <Input
                          type="text"
                          inputMode="decimal"
                          className="text-sm"
                          placeholder="0"
                          value={ing.quantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              updateQuantity(ing.food.id, value);

                              if (value === "") {
                                setServingsInputs((prev) => ({
                                  ...prev,
                                  [ing.food.id]: "",
                                }));
                              } else {
                                const grams = parseFloat(value);
                                if (!isNaN(grams)) {
                                  const servings =
                                    grams / ing.food.serving_size!;
                                  setServingsInputs((prev) => ({
                                    ...prev,
                                    [ing.food.id]: servings.toFixed(2),
                                  }));
                                }
                              }
                            }
                          }}
                        />
                      </div>
                    </div>

                    {/* Conversion Display */}
                    {qty > 0 && (
                      <Text className="text-xs text-zinc-500">
                        ={" "}
                        {servingsValue
                          ? parseFloat(servingsValue).toFixed(1)
                          : "0"}{" "}
                        × {ing.food.serving_label} ({qty}
                        {ing.food.base_unit})
                      </Text>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      inputMode="decimal"
                      className="flex-1 text-sm"
                      placeholder="Enter amount"
                      value={ing.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "" || /^\d*\.?\d*$/.test(value)) {
                          updateQuantity(ing.food.id, value);
                        }
                      }}
                    />
                    <Text className="text-sm text-zinc-400 w-8">
                      {ing.food.base_unit}
                    </Text>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Calculate Macros Button */}
      {ingredients.length > 0 && !showMacros && (
        <Button
          plain
          onClick={() => setShowMacros(true)}
          className="w-full flex items-center justify-center gap-2"
        >
          <span>📊</span>
          Calculate Nutrition
        </Button>
      )}

      {/* Nutrition Summary */}
      {ingredients.length > 0 && showMacros && (
        <div className="rounded-xl bg-zinc-800 border border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <Text className="font-semibold text-white">Nutrition Summary</Text>
            <button
              onClick={() => setShowMacros(false)}
              className="text-xs text-zinc-400 hover:text-white transition-colors"
            >
              Hide
            </button>
          </div>

          <div className="space-y-4">
            {/* Total */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🍽️</span>
                <Text className="font-semibold text-white">Total Recipe</Text>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Calories</Text>
                  <Text className="text-lg font-bold text-white mt-1">
                    {Math.round(totals.total.calories)}
                  </Text>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Protein</Text>
                  <Text className="text-lg font-bold text-blue-400 mt-1">
                    {Math.round(totals.total.protein * 10) / 10}g
                  </Text>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Carbs</Text>
                  <Text className="text-lg font-bold text-orange-400 mt-1">
                    {Math.round(totals.total.carbs * 10) / 10}g
                  </Text>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Fat</Text>
                  <Text className="text-lg font-bold text-yellow-400 mt-1">
                    {Math.round(totals.total.fat * 10) / 10}g
                  </Text>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-700" />

            {/* Per Serving */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🥄</span>
                <Text className="font-semibold text-white">
                  Per Serving ({totalServings || 1}{" "}
                  {parseFloat(totalServings) === 1 ? "serving" : "servings"})
                </Text>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Calories</Text>
                  <Text className="text-lg font-bold text-white mt-1">
                    {Math.round(totals.perServing.calories)}
                  </Text>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Protein</Text>
                  <Text className="text-lg font-bold text-blue-400 mt-1">
                    {Math.round(totals.perServing.protein * 10) / 10}g
                  </Text>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Carbs</Text>
                  <Text className="text-lg font-bold text-orange-400 mt-1">
                    {Math.round(totals.perServing.carbs * 10) / 10}g
                  </Text>
                </div>
                <div className="rounded-lg bg-zinc-900 p-3">
                  <Text className="text-xs text-zinc-400">Fat</Text>
                  <Text className="text-lg font-bold text-yellow-400 mt-1">
                    {Math.round(totals.perServing.fat * 10) / 10}g
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-950/50 border border-red-800 p-3">
          <Text className="text-sm text-red-200">{error}</Text>
        </div>
      )}

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSaving} className="w-full">
        {isSaving
          ? isEditMode
            ? "Updating..."
            : "Saving..."
          : getFormTitle().includes("Batch")
          ? "+ Create Batch"
          : isEditMode
          ? "Update Recipe"
          : "+ Create Recipe"}
      </Button>
    </div>
  );
}
