"use client";

import { Subheading } from "@/app/components/heading";
import { Text } from "@/app/components/text";
import { MacroSummary } from "@/features/shared/components/MacroSummary";
import { MacroDistributionBar } from "./MacroDistributionBar";
import type { MacroTotals } from "@/features/shared/utils/macors";

interface TodaySummaryProps {
  readonly userName: string;
  readonly selectedDate: string;
  readonly macros: MacroTotals;
}

export function TodaySummary({
  userName,
  selectedDate,
  macros,
}: TodaySummaryProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <Subheading>Today's Summary - {selectedDate}</Subheading>
      <Text className="mt-1 text-sm text-zinc-500">for {userName}</Text>

      <div className="mt-6">
        <MacroSummary macros={macros} />
      </div>

      <div className="mt-6">
        <MacroDistributionBar macros={macros} />
      </div>
    </div>
  );
}
