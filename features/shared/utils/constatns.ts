export const MEAL_TYPES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks", // ← add the 's'
  "Pre Workout", // ← change hyphen to space
  "Post Workout", // ← change hyphen to space
] as const;

export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  Breakfast: "Breakfast",
  Lunch: "Lunch",
  Dinner: "Dinner",
  Snacks: "Snacks", // ← add the 's'
  "Pre Workout": "Pre Workout", // ← change hyphen to space
  "Post Workout": "Post Workout", // ← change hyphen to space
} as const;

// Type-safe helper
export function getMealTypeLabel(type: MealType): string {
  return MEAL_TYPE_LABELS[type];
}

// Runtime type guard
export function isMealType(value: unknown): value is MealType {
  return typeof value === "string" && MEAL_TYPES.includes(value as MealType);
}
