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

  // Determine initial values based on edit mode
  const initialEntryType = editingMeal?.food_id ? "food" : "recipe";
  const initialItemId = editingMeal?.food_id || editingMeal?.recipe_id || "";
  const initialQuantity = editingMeal?.quantity?.toString() || "";
  const initialMealType = editingMeal?.meal_type || "Breakfast";

  const [entryType, setEntryType] = useState<"food" | "recipe">(
    initialEntryType
  );
  const [selectedItemId, setSelectedItemId] = useState(initialItemId);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [quantity, setQuantity] = useState(initialQuantity);
  const [mealType, setMealType] = useState<MealType>(initialMealType);
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial values when editingMeal changes
  useEffect(() => {
    if (editingMeal) {
      const itemName =
        editingMeal.food_items?.name || editingMeal.recipes?.name || "";
      const entryType = editingMeal.food_id ? "food" : "recipe";
      const itemId = editingMeal.food_id || editingMeal.recipe_id || "";
      const qty = editingMeal.quantity?.toString() || "";
      const mType = editingMeal.meal_type as MealType;

      // Batch updates to avoid cascading renders
      setSearchQuery(itemName);
      setEntryType(entryType);
      setSelectedItemId(itemId);
      setQuantity(qty);
      setMealType(mType);
    } else {
      // Reset form when not editing
      setSearchQuery("");
      setSelectedItemId("");
      setQuantity("");
      setMealType("Breakfast");
    }
  }, [editingMeal]);

  const availableItems = entryType === "food" ? foods : recipes;
  const selectedFood =
    entryType === "food" ? foods.find((f) => f.id === selectedItemId) : null;

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return availableItems;

    const query = searchQuery.toLowerCase();
    return availableItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [searchQuery, availableItems]);

  // Close dropdown when clicking outside
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
        // Edit mode
        await onEdit({
          mealId: editingMeal.id,
          quantity: parseFloat(quantity),
          mealType,
        });
      } else {
        // Add mode
        await onAdd({
          entryType,
          itemId: selectedItemId,
          quantity: parseFloat(quantity),
          mealType,
        });
      }

      // Reset form (only in add mode)
      if (!isEditMode) {
        setSelectedItemId("");
        setSearchQuery("");
        setQuantity("");
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
      {/* Entry Type - Disabled in edit mode */}
      <Field>
        <Label>Entry Type</Label>
        <Select
          value={entryType}
          onChange={(e) => {
            setEntryType(e.target.value as "food" | "recipe");
            setSelectedItemId("");
            setSearchQuery("");
          }}
          disabled={isEditMode}
        >
          <option value="food">Food Item</option>
          <option value="recipe">Recipe</option>
        </Select>
      </Field>

      {/* Item Selector with Search - Disabled in edit mode */}
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
            <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-950/10 bg-white shadow-lg dark:border-white/10 dark:bg-zinc-900">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemSelect(item)}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
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

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-200">
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
