"use client";

import { useState } from "react";
import type { FoodItem } from "@/utils/supabase/queries";
import { createRecipe } from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { Button } from "@/app/components/button";
import { Field, Label } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Select } from "@/app/components/select";
import { IngredientList } from "./IngredientList";
import { RecipePreview } from "./RecipePreview";

interface RecipeFormProps {
  readonly userId: string;
  readonly userName: string;
  readonly foods: readonly FoodItem[];
  readonly onRecipeCreated: () => Promise<void>;
}

interface RecipeIngredient {
  food_id: string;
  quantity: number;
  tempId: string;
}

export function RecipeForm({
  userId,
  userName,
  foods,
  onRecipeCreated,
}: RecipeFormProps) {
  const [recipeName, setRecipeName] = useState("");
  const [totalServings, setTotalServings] = useState("4");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddIngredient = () => {
    if (!selectedFoodId || !ingredientQuantity) {
      setError("Please select a food and enter quantity");
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
    setError(null);
  };

  const handleRemoveIngredient = (tempId: string) => {
    setIngredients(ingredients.filter((ing) => ing.tempId !== tempId));
  };

  const handleCreateRecipe = async () => {
    setError(null);

    if (!recipeName || !totalServings || ingredients.length === 0) {
      setError(
        "Please fill in recipe name, servings, and add at least one ingredient"
      );
      return;
    }

    setIsCreating(true);
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

      await onRecipeCreated();
    } catch (err) {
      console.error("Error creating recipe:", err);
      setError("Failed to create recipe. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
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
          <div className="mt-2 grid gap-4 sm:grid-cols-3">
            <Field>
              <Label>Add Ingredients</Label>
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
          <IngredientList
            ingredients={ingredients}
            foods={foods}
            onRemove={handleRemoveIngredient}
          />
        )}

        {/* Preview Nutrition */}
        {ingredients.length > 0 && (
          <RecipePreview
            ingredients={ingredients}
            foods={foods}
            servings={parseFloat(totalServings) || 1}
          />
        )}

        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-200">
            {error}
          </div>
        )}

        <Button onClick={handleCreateRecipe} disabled={isCreating}>
          {isCreating ? "Creating..." : "Create Recipe"}
        </Button>
      </div>
    </div>
  );
}
