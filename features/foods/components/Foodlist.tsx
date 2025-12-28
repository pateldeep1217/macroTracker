"use client";

import { useState } from "react";
import type { FoodItem } from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Field } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Divider } from "@/app/components/divider";
import { FoodListItem } from "./FoodListItem";
import { EmptyState } from "@/features/shared/components/EmptyState";

interface FoodListProps {
  readonly foods: readonly FoodItem[];
  readonly onFoodDeleted: () => Promise<void>;
  readonly onFoodEdit?: (food: FoodItem) => void; // ADD THIS LINE
}

export function FoodList({ foods, onFoodDeleted, onFoodEdit }: FoodListProps) {
  // ADD onFoodEdit HERE
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFoods = foods.filter((food) =>
    food.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <Subheading>Food Database ({foods.length} items)</Subheading>
        <Field className="w-64">
          <Input
            type="text"
            placeholder="Search foods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Field>
      </div>

      <Divider className="my-4" />

      {filteredFoods.length > 0 ? (
        <div className="space-y-2">
          {filteredFoods.map((food) => (
            <FoodListItem
              key={food.id}
              food={food}
              onDelete={onFoodDeleted}
              onEdit={onFoodEdit} // ADD THIS LINE
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchTerm ? "No foods found" : "No food items yet"}
          description={
            searchTerm
              ? "Try a different search term"
              : "Add your first food item above"
          }
        />
      )}
    </div>
  );
}
