"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import type {
  FoodItem,
  Recipe,
  MealEntryWithDetails,
} from "@/utils/supabase/queries";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Select } from "@/app/components/select";
import { Text } from "@/app/components/text";
import {
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
} from "@/features/shared/utils/constatns";
import type { MealType } from "@/features/shared/utils/constatns";

interface AddMealFormProps {
  readonly foods: readonly FoodItem[];
  readonly recipes: readonly Recipe[];
  readonly onAdd: (data: {
    entryType: "food" | "recipe";
    itemId: string;
    quantity: number;
    mealType: MealType;
  }) => Promise<void>;
  readonly onEdit?: (data: {
    mealId: string;
    quantity: number;
    mealType: MealType;
  }) => Promise<void>;
  readonly isAdding: boolean;
  readonly editingMeal?: MealEntryWithDetails | null;
}

export function AddMealForm({
  foods,
  recipes,
  onAdd,
  onEdit,
  isAdding,
  editingMeal,
}: AddMealFormProps) {
  const isEditMode = !!editingMeal;

  const [entryType, setEntryType] = useState<"food" | "recipe">(() =>
    editingMeal?.recipe_id ? "recipe" : "food"
  );
  const [selectedItemId, setSelectedItemId] = useState(
    () => editingMeal?.food_id || editingMeal?.recipe_id || ""
  );
  const [searchQuery, setSearchQuery] = useState(
    () => editingMeal?.food_items?.name || editingMeal?.recipes?.name || ""
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(
    () => editingMeal?.quantity?.toString() || ""
  );
  const [servingsInput, setServingsInput] = useState("");
  const [mealType, setMealType] = useState<MealType>(
    () => (editingMeal?.meal_type as MealType) || "Breakfast"
  );
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const availableItems = entryType === "food" ? foods : recipes;
  const selectedFood =
    entryType === "food" ? foods.find((f) => f.id === selectedItemId) : null;
  const selectedRecipe =
    entryType === "recipe"
      ? recipes.find((r) => r.id === selectedItemId)
      : null;

  const hasServingInfo =
    selectedFood?.serving_label && selectedFood?.serving_size;

  const previewMacros = useMemo(() => {
    if (!quantity || !selectedItemId) return null;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) return null;

    if (entryType === "food" && selectedFood) {
      if (
        typeof selectedFood.calories !== "number" ||
        typeof selectedFood.protein !== "number" ||
        typeof selectedFood.carbs !== "number" ||
        typeof selectedFood.fat !== "number"
      ) {
        console.warn("Food item missing nutrition data:", selectedFood.name);
        return null;
      }

      const multiplier = qty / 100;
      return {
        calories: Math.round(selectedFood.calories * multiplier),
        protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
        carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
        fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
      };
    } else if (entryType === "recipe" && selectedRecipe) {
      const calories = selectedRecipe.total_calories;
      const protein = selectedRecipe.total_protein;
      const carbs = selectedRecipe.total_carbs;
      const fat = selectedRecipe.total_fat;
      const servingsCount = selectedRecipe.total_servings;

      if (
        typeof calories !== "number" ||
        typeof protein !== "number" ||
        typeof carbs !== "number" ||
        typeof fat !== "number" ||
        typeof servingsCount !== "number" ||
        servingsCount <= 0
      ) {
        console.warn("Recipe missing nutrition data:", selectedRecipe.name);
        return null;
      }

      const perServing = {
        calories: calories / servingsCount,
        protein: protein / servingsCount,
        carbs: carbs / servingsCount,
        fat: fat / servingsCount,
      };
      return {
        calories: Math.round(perServing.calories * qty),
        protein: Math.round(perServing.protein * qty * 10) / 10,
        carbs: Math.round(perServing.carbs * qty * 10) / 10,
        fat: Math.round(perServing.fat * qty * 10) / 10,
      };
    }

    return null;
  }, [quantity, selectedItemId, entryType, selectedFood, selectedRecipe]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;

    const query = searchQuery.toLowerCase();
    return availableItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [searchQuery, availableItems]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    setError(null);

    if (!selectedItemId || !quantity) {
      setError("Please select an item and enter quantity");
      return;
    }

    try {
      if (isEditMode && onEdit && editingMeal) {
        await onEdit({
          mealId: editingMeal.id,
          quantity: parseFloat(quantity),
          mealType,
        });
      } else {
        await onAdd({
          entryType,
          itemId: selectedItemId,
          quantity: parseFloat(quantity),
          mealType,
        });
      }

      if (!isEditMode) {
        setSelectedItemId("");
        setSearchQuery("");
        setQuantity("");
        setServingsInput("");
      }
    } catch (err) {
      console.error("Add/Edit meal error:", err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${
              isEditMode ? "update" : "add"
            } entry. Please try again.`
      );
    }
  };

  const handleItemSelect = (item: FoodItem | Recipe) => {
    setSelectedItemId(item.id);
    setSearchQuery(item.name);
    setShowDropdown(false);
  };

  return (
    <div className="space-y-4">
      {/* Entry Type */}
      <Field>
        <Label>Entry Type</Label>
        <Select
          value={entryType}
          onChange={(e) => {
            setEntryType(e.target.value as "food" | "recipe");
            setSelectedItemId("");
            setSearchQuery("");
            setQuantity("");
            setServingsInput("");
          }}
          disabled={isEditMode}
        >
          <option value="food">Food Item</option>
          <option value="recipe">Recipe</option>
        </Select>
      </Field>

      {/* Item Selector */}
      <Field>
        <Label>{entryType === "food" ? "Food Item" : "Recipe"}</Label>
        <div className="relative" ref={dropdownRef}>
          <Input
            ref={inputRef}
            type="text"
            placeholder={`Search ${entryType}...`}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowDropdown(true);
              if (!e.target.value) {
                setSelectedItemId("");
              }
            }}
            onFocus={() => !isEditMode && setShowDropdown(true)}
            disabled={isEditMode}
          />

          {showDropdown && !isEditMode && (
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 shadow-lg">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemSelect(item)}
                    className="w-full px-4 py-2 text-left text-sm text-zinc-100 hover:bg-zinc-800"
                  >
                    {item.name}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-zinc-500">
                  No {entryType}s found
                </div>
              )}
            </div>
          )}
        </div>
      </Field>

      {/* Quantity */}
      <Field>
        <Label>{entryType === "recipe" ? "Servings" : "Amount"}</Label>

        {hasServingInfo && entryType === "food" ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {/* Servings Input */}
              <div>
                <Text className="text-xs text-zinc-400 mb-1">
                  {selectedFood.serving_label}s
                </Text>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={servingsInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setServingsInput(value);

                      if (value === "") {
                        setQuantity("");
                      } else {
                        const servingsNum = parseFloat(value);
                        if (!isNaN(servingsNum)) {
                          const grams =
                            servingsNum * selectedFood.serving_size!;
                          setQuantity(grams.toString());
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Grams Input */}
              <div>
                <Text className="text-xs text-zinc-400 mb-1">
                  or {selectedFood.base_unit}
                </Text>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  value={quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "" || /^\d*\.?\d*$/.test(value)) {
                      setQuantity(value);

                      if (value === "") {
                        setServingsInput("");
                      } else {
                        const grams = parseFloat(value);
                        if (!isNaN(grams)) {
                          const servings = grams / selectedFood.serving_size!;
                          setServingsInput(servings.toFixed(2));
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Conversion Display */}
            {quantity && parseFloat(quantity) > 0 && (
              <Text className="text-xs text-zinc-400">
                = {servingsInput ? parseFloat(servingsInput).toFixed(1) : "0"} ×{" "}
                {selectedFood.serving_label} ({quantity}
                {selectedFood.base_unit})
              </Text>
            )}
          </div>
        ) : (
          <>
            <Input
              type="text"
              inputMode="decimal"
              placeholder={
                entryType === "recipe"
                  ? "Enter servings"
                  : selectedFood?.base_unit === "g"
                  ? "Enter grams"
                  : selectedFood?.base_unit === "ml"
                  ? "Enter milliliters"
                  : "Enter amount"
              }
              value={quantity}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setQuantity(value);
                }
              }}
            />
          </>
        )}
      </Field>

      {/* Macro Preview */}
      {previewMacros && (
        <div className="rounded-lg bg-zinc-800/50 p-3">
          <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
            Nutrition Preview
          </Text>
          <div className="flex gap-4 text-sm text-zinc-100">
            <div>
              <span className="font-semibold">{previewMacros.calories}</span>
              <span className="text-zinc-400 ml-1">cal</span>
            </div>
            <div>
              <span className="font-semibold">P:</span>
              <span className="ml-1">{previewMacros.protein}g</span>
            </div>
            <div>
              <span className="font-semibold">C:</span>
              <span className="ml-1">{previewMacros.carbs}g</span>
            </div>
            <div>
              <span className="font-semibold">F:</span>
              <span className="ml-1">{previewMacros.fat}g</span>
            </div>
          </div>
        </div>
      )}

      {/* Meal Type */}
      <Field>
        <Label>Meal Type</Label>
        <Select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
        >
          {MEAL_TYPES.map((type) => (
            <option key={type} value={type}>
              {MEAL_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </Field>

      {error && (
        <div className="rounded-lg bg-red-950/20 border border-red-800 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!selectedItemId || !quantity || isAdding}
          className="w-full"
        >
          {isAdding
            ? isEditMode
              ? "Updating..."
              : "Adding..."
            : isEditMode
            ? "Update Entry"
            : "+ Add to Log"}
        </Button>
      </div>
    </div>
  );
}
