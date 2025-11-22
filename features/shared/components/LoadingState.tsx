"use client";

import { Text } from "@/app/components/text";

interface LoadingStateProps {
  readonly message?: string;
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
        <Text className="text-zinc-500">{message}</Text>
      </div>
    </div>
  );
}
