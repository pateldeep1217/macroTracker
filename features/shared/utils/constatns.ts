export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Pre-workout",
  "Post-workout",
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  Breakfast: "Breakfast",
  Lunch: "Lunch",
  Dinner: "Dinner",
  Snack: "Snack",
  "Pre-workout": "Pre Workout",
  "Post-workout": "Post Workout",
} as const;

// Type-safe helper
export function getMealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type];
}

// Runtime type guard
export function isMealType(value: unknown): value is MealType {
  return typeof value === "string" && MEAL_TYPES.includes(value as MealType);
}
