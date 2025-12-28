"use client";

import { useState } from "react";
import { createFoodFromLabel, updateFood } from "@/utils/supabase/queries";
import type { FoodItem } from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Select } from "@/app/components/select";

interface FoodFormProps {
  readonly onFoodAdded: () => Promise<void>;
  readonly editingFood?: FoodItem | null;
}

interface FormData {
  name: string;
  brand: string;
  servingSize: string;
  servingUnit: "g" | "ml";
  servingLabel: string; // NEW: "1 scoop", "1 cup", etc.
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber: string;
}

const INITIAL_FORM_DATA: FormData = {
  name: "",
  brand: "",
  servingSize: "",
  servingUnit: "g",
  servingLabel: "", // NEW
  calories: "",
  protein: "",
  carbs: "",
  fat: "",
  fiber: "",
};

export function FoodForm({ onFoodAdded, editingFood }: FoodFormProps) {
  const isEditMode = !!editingFood;

  // Initialize form with editing food data if in edit mode
  const [formData, setFormData] = useState<FormData>(() => {
    if (editingFood) {
      // Convert from per-100 back to label values
      // We'll use serving_size if available, otherwise default to 100
      const servingSize = editingFood.serving_size || 100;
      const toLabel = (per100Value: number) =>
        Math.round(((per100Value * servingSize) / 100) * 100) / 100;

      return {
        name: editingFood.name,
        brand: "",
        servingSize: servingSize.toString(),
        servingUnit: editingFood.base_unit as "g" | "ml",
        servingLabel: editingFood.serving_label || "",
        calories: toLabel(editingFood.calories).toString(),
        protein: toLabel(editingFood.protein || 0).toString(),
        carbs: toLabel(editingFood.carbs || 0).toString(),
        fat: toLabel(editingFood.fat || 0).toString(),
        fiber: editingFood.fiber ? toLabel(editingFood.fiber).toString() : "",
      };
    }
    return INITIAL_FORM_DATA;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formData.name || !formData.servingSize || !formData.calories) {
      setError(
        "Please fill in required fields: name, serving size, and calories"
      );
      return;
    }

    setIsAdding(true);
    try {
      if (isEditMode && editingFood) {
        await updateFood(editingFood.id, {
          name: formData.name,
          brand: formData.brand || undefined,
          labelServingSize: parseFloat(formData.servingSize),
          labelServingUnit: formData.servingUnit,
          servingLabel: formData.servingLabel || undefined,
          labelCalories: parseFloat(formData.calories),
          labelProtein: parseFloat(formData.protein) || 0,
          labelCarbs: parseFloat(formData.carbs) || 0,
          labelFat: parseFloat(formData.fat) || 0,
          labelFiber: formData.fiber ? parseFloat(formData.fiber) : undefined,
        });
      } else {
        await createFoodFromLabel({
          name: formData.name,
          brand: formData.brand || undefined,
          labelServingSize: parseFloat(formData.servingSize),
          labelServingUnit: formData.servingUnit,
          servingLabel: formData.servingLabel || undefined,
          labelCalories: parseFloat(formData.calories),
          labelProtein: parseFloat(formData.protein) || 0,
          labelCarbs: parseFloat(formData.carbs) || 0,
          labelFat: parseFloat(formData.fat) || 0,
          labelFiber: formData.fiber ? parseFloat(formData.fiber) : undefined,
        });
      }

      // Reset form
      setFormData(INITIAL_FORM_DATA);
      await onFoodAdded();
    } catch (err) {
      console.error("Error adding food:", err);
      setError("Failed to add food item. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <Subheading>Add New Food Item</Subheading>
      <Text className="mt-1 text-sm text-zinc-500">
        Enter nutrition facts from the food label
      </Text>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field className="sm:col-span-2">
          <Label>Food Name *</Label>
          <Input
            type="text"
            placeholder="e.g., Protein Powder"
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
          />
        </Field>

        <Field className="sm:col-span-2">
          <Label>Brand (optional)</Label>
          <Input
            type="text"
            placeholder="e.g., Optimum Nutrition"
            value={formData.brand}
            onChange={(e) => updateField("brand", e.target.value)}
          />
        </Field>

        <Field>
          <Label>Serving Size *</Label>
          <Input
            type="number"
            placeholder="30"
            value={formData.servingSize}
            onChange={(e) => updateField("servingSize", e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>

        <Field>
          <Label>Unit *</Label>
          <Select
            value={formData.servingUnit}
            onChange={(e) =>
              updateField("servingUnit", e.target.value as "g" | "ml")
            }
          >
            <option value="g">grams (g)</option>
            <option value="ml">milliliters (ml)</option>
          </Select>
        </Field>

        {/* NEW FIELD: Serving Label */}
        <Field className="sm:col-span-2">
          <Label>Serving Label (optional)</Label>
          <Input
            type="text"
            placeholder='e.g., "1 scoop", "1 cup", "1 medium banana"'
            value={formData.servingLabel}
            onChange={(e) => updateField("servingLabel", e.target.value)}
          />
          <Text className="mt-1 text-xs text-zinc-500">
            Include the number in the label (e.g., &quot;1 scoop&quot;, not just
            &quot;scoop&quot;). This helps users log food more easily.
          </Text>
        </Field>

        <Field>
          <Label>Calories *</Label>
          <Input
            type="number"
            placeholder="120"
            value={formData.calories}
            onChange={(e) => updateField("calories", e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>

        <Field>
          <Label>Protein (g)</Label>
          <Input
            type="number"
            placeholder="24"
            value={formData.protein}
            onChange={(e) => updateField("protein", e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>

        <Field>
          <Label>Carbs (g)</Label>
          <Input
            type="number"
            placeholder="1"
            value={formData.carbs}
            onChange={(e) => updateField("carbs", e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>

        <Field>
          <Label>Fat (g)</Label>
          <Input
            type="number"
            placeholder="2"
            value={formData.fat}
            onChange={(e) => updateField("fat", e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>

        <Field>
          <Label>Fiber (g) - optional</Label>
          <Input
            type="number"
            placeholder="0"
            value={formData.fiber}
            onChange={(e) => updateField("fiber", e.target.value)}
            min="0"
            step="0.1"
          />
        </Field>
      </div>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="mt-6">
        <Button onClick={handleSubmit} disabled={isAdding}>
          {isAdding
            ? isEditMode
              ? "Updating..."
              : "Adding..."
            : isEditMode
            ? "Update Food Item"
            : "+ Add Food Item"}
        </Button>
      </div>
    </div>
  );
}
