"use client";

import { Text } from "@/app/components/text";
import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly title: string;
  readonly description?: string;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-zinc-200 p-12 text-center dark:border-zinc-700">
      {icon && <div className="mb-4 flex justify-center">{icon}</div>}
      <Text className="font-medium text-zinc-900 dark:text-zinc-100">
        {title}
      </Text>
      {description && <Text className="mt-2 text-zinc-500">{description}</Text>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
