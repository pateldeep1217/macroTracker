import { Text } from "@/app/components/text";

interface MacroStatsGridProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entryCount?: number;
}

export function MacroStatsGrid({
  calories,
  protein,
  carbs,
  fat,
  entryCount,
}: MacroStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="rounded-xl bg-zinc-900 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Calories
        </Text>
        <div className="mt-2 font-mono text-2xl font-bold text-white">
          {Math.round(calories).toLocaleString()}
        </div>
        {entryCount && entryCount > 0 && (
          <Text className="mt-1.5 text-xs text-zinc-500">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </Text>
        )}
      </div>

      <div className="rounded-xl bg-zinc-900 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Protein
        </Text>
        <div className="mt-2 font-mono text-2xl font-bold text-white">
          {Math.round(protein * 10) / 10}
          <span className="text-base font-normal text-zinc-500">g</span>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-900 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Carbs
        </Text>
        <div className="mt-2 font-mono text-2xl font-bold text-white">
          {Math.round(carbs * 10) / 10}
          <span className="text-base font-normal text-zinc-500">g</span>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-900 p-4">
        <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Fat
        </Text>
        <div className="mt-2 font-mono text-2xl font-bold text-white">
          {Math.round(fat * 10) / 10}
          <span className="text-base font-normal text-zinc-500">g</span>
        </div>
      </div>
    </div>
  );
}
