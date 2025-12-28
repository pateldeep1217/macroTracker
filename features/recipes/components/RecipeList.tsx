"use client";

import { useState } from "react";
import type { Recipe } from "@/utils/supabase/queries";
import { Subheading } from "@/app/components/heading";
import { Field } from "@/app/components/fieldset";
import { Input } from "@/app/components/input";
import { Divider } from "@/app/components/divider";
import { RecipeListItem } from "./RecipeListItem";
import { EmptyState } from "@/features/shared/components/EmptyState";

interface RecipeListProps {
  readonly recipes: readonly Recipe[];
  readonly onRecipeDeleted: () => Promise<void>;
  readonly onRecipeEdit?: (recipe: Recipe) => void;
}

export function RecipeList({
  recipes,
  onRecipeDeleted,
  onRecipeEdit,
}: RecipeListProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = recipes.filter((r) =>
    r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <div className="flex items-center justify-between">
        <Subheading>Recipes ({recipes.length})</Subheading>

        <Field className="w-64">
          <Input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Field>
      </div>

      <Divider className="my-4" />

      {filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((recipe) => (
            <RecipeListItem
              key={recipe.id}
              recipe={recipe}
              onDelete={onRecipeDeleted}
              onEdit={onRecipeEdit}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title={searchTerm ? "No recipes found" : "No recipes yet"}
          description={
            searchTerm
              ? "Try a different search term"
              : "Add your first recipe above"
          }
        />
      )}
    </div>
  );
}
