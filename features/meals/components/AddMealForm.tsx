"use client";

import { useState } from "react";
import type { FoodItem, Recipe } from "@/utils/supabase/queries";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Select } from "@/app/components/select";
import { Subheading } from "@/app/components/heading";
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
  readonly isAdding: boolean;
}

export function AddMealForm({
  foods,
  recipes,
  onAdd,
  isAdding,
}: AddMealFormProps) {
  const [entryType, setEntryType] = useState<"food" | "recipe">("food");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [mealType, setMealType] = useState<MealType>("Breakfast");
  const [error, setError] = useState<string | null>(null);

  const availableItems = entryType === "food" ? foods : recipes;
  const selectedFood =
    entryType === "food" ? foods.find((f) => f.id === selectedItemId) : null;

  const handleSubmit = async () => {
    setError(null);

    if (!selectedItemId || !quantity) {
      setError("Please select an item and enter quantity");
      return;
    }

    try {
      await onAdd({
        entryType,
        itemId: selectedItemId,
        quantity: parseFloat(quantity),
        mealType,
      });

      // Reset form
      setSelectedItemId("");
      setQuantity("");
    } catch (err) {
      // Show the actual error message for debugging
      console.error("Add meal error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to add entry. Please try again."
      );
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <Subheading>Add New Entry</Subheading>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Entry Type */}
        <Field>
          <Label>Entry Type</Label>
          <Select
            value={entryType}
            onChange={(e) => {
              setEntryType(e.target.value as "food" | "recipe");
              setSelectedItemId("");
            }}
          >
            <option value="food">Food Item</option>
            <option value="recipe">Recipe</option>
          </Select>
        </Field>

        {/* Item Selector */}
        <Field>
          <Label>{entryType === "food" ? "Food Item" : "Recipe"}</Label>
          <Select
            value={selectedItemId}
            onChange={(e) => setSelectedItemId(e.target.value)}
          >
            <option value="">Select {entryType}...</option>
            {availableItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </Field>

        {/* Quantity */}
        <Field>
          <Label>
            Quantity{" "}
            {selectedFood
              ? `(${selectedFood.base_unit})`
              : entryType === "recipe"
              ? "(servings)"
              : ""}
          </Label>
          <Input
            type="number"
            placeholder="Amount"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>

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
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6">
        <Button
          onClick={handleSubmit}
          disabled={!selectedItemId || !quantity || isAdding}
        >
          {isAdding ? "Adding..." : "+ Add to Log"}
        </Button>
      </div>
    </div>
  );
}
