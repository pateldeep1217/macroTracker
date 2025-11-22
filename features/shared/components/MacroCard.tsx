"use client";

import { Text } from "@/app/components/text";

type MacroColor = "blue" | "green" | "orange" | "purple";
type MacroSize = "sm" | "lg";

interface MacroCardProps {
  readonly label: string;
  readonly value: string | number;
  readonly color: MacroColor;
  readonly size?: MacroSize;
}

const COLOR_STYLES: Record<MacroColor, string> = {
  blue: "bg-blue-50 text-blue-900 dark:bg-blue-950/30 dark:text-blue-100",
  green: "bg-green-50 text-green-900 dark:bg-green-950/30 dark:text-green-100",
  orange:
    "bg-orange-50 text-orange-900 dark:bg-orange-950/30 dark:text-orange-100",
  purple:
    "bg-purple-50 text-purple-900 dark:bg-purple-950/30 dark:text-purple-100",
} as const;

const SIZE_STYLES: Record<MacroSize, string> = {
  sm: "text-2xl",
  lg: "text-3xl",
} as const;

export function MacroCard({
  label,
  value,
  color,
  size = "lg",
}: MacroCardProps) {
  return (
    <div className={`rounded-lg p-4 ${COLOR_STYLES[color]}`}>
      <Text className="text-sm opacity-70">{label}</Text>
      <Text className={`mt-2 font-bold ${SIZE_STYLES[size]}`}>{value}</Text>
    </div>
  );
}
