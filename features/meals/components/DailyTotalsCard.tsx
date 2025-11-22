"use client";

import { Subheading } from "@/app/components/heading";
import { MacroSummary } from "@/features/shared/components/MacroSummary";
import type { MacroTotals } from "@/features/shared/utils/macors";

interface DailyTotalsCardProps {
  readonly macros: MacroTotals;
}

export function DailyTotalsCard({ macros }: DailyTotalsCardProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-950/5 dark:bg-zinc-800 dark:ring-white/10">
      <Subheading>Daily Totals</Subheading>
      <div className="mt-4">
        <MacroSummary macros={macros} />
      </div>
    </div>
  );
}
