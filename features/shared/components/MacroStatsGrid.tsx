import { Text } from "@/app/components/text";

interface Targets {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

interface MacroStatsGridProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  entryCount?: number;
  targets?: Targets;
  onEditTargets?: () => void;
}

function MacroCard({
  label,
  value,
  target,
  unit = "g",
}: {
  label: string;
  value: number;
  target?: number;
  unit?: string;
}) {
  const pct = target ? Math.min((value / target) * 100, 100) : null;
  const remaining = target != null ? target - value : null;
  const over = remaining !== null && remaining < 0;

  const displayValue =
    unit === "kcal"
      ? Math.round(value).toLocaleString()
      : `${Math.round(value * 10) / 10}`;

  return (
    <div className="rounded-xl bg-zinc-900 p-4">
      <Text className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {label}
      </Text>
      <div className="mt-2 font-mono text-2xl font-bold text-white">
        {displayValue}
        {unit !== "kcal" && (
          <span className="text-base font-normal text-zinc-500">{unit}</span>
        )}
      </div>

      {target != null ? (
        <>
          <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-700">
            <div
              className={`h-1.5 rounded-full transition-all ${over ? "bg-red-500" : "bg-emerald-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <Text className={`mt-1 text-xs ${over ? "text-red-400" : "text-zinc-500"}`}>
            {over
              ? `${Math.abs(Math.round(remaining!))}${unit === "kcal" ? " kcal" : "g"} over`
              : `${Math.round(remaining!)}${unit === "kcal" ? " kcal" : "g"} left`}
          </Text>
        </>
      ) : null}
    </div>
  );
}

export function MacroStatsGrid({
  calories,
  protein,
  carbs,
  fat,
  fiber,
  entryCount,
  targets,
  onEditTargets,
}: MacroStatsGridProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <MacroCard label="Calories" value={calories} target={targets?.calories} unit="kcal" />
        <MacroCard label="Protein"  value={protein}  target={targets?.protein} />
        <MacroCard label="Carbs"    value={carbs}    target={targets?.carbs} />
        <MacroCard label="Fat"      value={fat}      target={targets?.fat} />
        <MacroCard label="Fiber"    value={fiber ?? 0} target={targets?.fiber} />
      </div>

      <div className="flex items-center justify-between px-1">
        {entryCount != null && entryCount > 0 ? (
          <Text className="text-xs text-zinc-500">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </Text>
        ) : <span />}
        <button
          onClick={onEditTargets}
          className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2"
        >
          {targets?.calories ? "Edit targets" : "Set targets"}
        </button>
      </div>
    </div>
  );
}