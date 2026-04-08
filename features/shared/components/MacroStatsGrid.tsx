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

function CalorieRing({ value, target }: { value: number; target?: number }) {
  const SIZE = 72;
  const STROKE = 5;
  const R = (SIZE - STROKE) / 2;
  const CIRC = 2 * Math.PI * R;
  const pct = target ? Math.min(value / target, 1) : 0;
  const over = target != null && value > target;
  const remaining = target != null ? target - Math.round(value) : null;
  const pctDisplay = target ? Math.round((value / target) * 100) : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} className="rotate-[-90deg]">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="#27272a" strokeWidth={STROKE} />
          {target && (
            <circle
              cx={SIZE / 2} cy={SIZE / 2} r={R}
              fill="none"
              stroke={over ? "#ef4444" : "#22c55e"}
              strokeWidth={STROKE}
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {target != null ? (
            <>
              <span className="text-sm font-bold tabular-nums text-white leading-none">
                {remaining! > 0 ? remaining!.toLocaleString() : "0"}
              </span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-wide mt-0.5">left</span>
            </>
          ) : (
            <span className="text-lg">🎯</span>
          )}
        </div>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-1">Calories</p>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-bold tabular-nums text-white leading-none">
            {Math.round(value).toLocaleString()}
          </span>
          {target != null && (
            <span className="text-sm text-zinc-500">/ {target.toLocaleString()} kcal</span>
          )}
        </div>
        <p className={`text-xs mt-1 ${over ? "text-red-400" : "text-zinc-500"}`}>
          {target != null
            ? over
              ? `${Math.abs(remaining!)} kcal over goal`
              : `${pctDisplay}% of daily goal`
            : "No calorie goal set"}
        </p>
      </div>
    </div>
  );
}

function MacroCard({
  label,
  value,
  target,
  color,
  dimmed = false,
}: {
  label: string;
  value: number;
  target?: number;
  color: string;
  dimmed?: boolean;
}) {
  const pct = target ? Math.min((value / target) * 100, 100) : null;
  const over = target != null && value > target;
  const remaining = target != null ? Math.round(target - value) : null;

  return (
    <div className={`rounded-xl bg-zinc-900 p-3.5 transition-opacity ${dimmed ? "opacity-50" : ""}`}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">{label}</p>
      <div className="flex items-baseline gap-0.5 mb-2.5">
        <span className="text-2xl font-bold tabular-nums text-white leading-none">
          {Math.round(value * 10) / 10}
        </span>
        <span className="text-sm text-zinc-500 ml-0.5">g</span>
      </div>
      <div className="h-1 w-full rounded-full bg-zinc-800">
        {pct !== null && (
          <div
            className={`h-1 rounded-full transition-all duration-500 ${over ? "bg-red-500" : color}`}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <p className={`mt-2 text-xs ${over ? "text-red-400" : "text-zinc-600"}`}>
        {target != null
          ? over ? `+${Math.abs(remaining!)}g over` : `${remaining}g left`
          : <span className="text-zinc-800">—</span>}
      </p>
    </div>
  );
}

// ── Animated no-targets banner ────────────────────────────────────────────────
function NoTargetsBanner({ onEditTargets }: { onEditTargets?: () => void }) {
  return (
    <>
      <style>{`
        @keyframes msg-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes msg-bounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-3px); }
        }
        @keyframes msg-fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .msg-shimmer {
          background: linear-gradient(90deg, #3f3f46 0%, #6366f1 30%, #10b981 50%, #f59e0b 70%, #3f3f46 100%);
          background-size: 200% 100%;
          animation: msg-shimmer 3s linear infinite;
        }
        .msg-icon { animation: msg-bounce 2.2s ease-in-out infinite; }
        .msg-root { animation: msg-fadein 0.4s ease both; }
      `}</style>
      <button
        onClick={onEditTargets}
        className="cursor-pointer msg-root group relative w-full overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/80 p-4 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      >
        <div className="msg-shimmer absolute top-0 left-0 h-[2px] w-full" />
        <div className="flex items-center gap-3.5">
          <div className="msg-icon shrink-0 w-10 h-10 rounded-full bg-zinc-800 group-hover:bg-zinc-700 flex items-center justify-center text-xl transition-colors duration-200">
            🎯
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Set your daily goals</p>
            <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
              Add calorie & macro targets to track your progress each day.
            </p>
          </div>
          <span className="shrink-0 text-zinc-600 group-hover:text-white group-hover:translate-x-0.5 transition-all duration-200 text-sm">→</span>
        </div>
      </button>
    </>
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
  const hasTargets = !!(targets?.calories || targets?.protein || targets?.carbs || targets?.fat);

  return (
    <div className="space-y-2.5">
      {/* Animated prompt — prominent, not a tiny footer link */}
      {!hasTargets && <NoTargetsBanner onEditTargets={onEditTargets} />}

      {/* Calorie hero */}
      <div className="rounded-xl bg-zinc-900 p-4">
        <CalorieRing value={calories} target={targets?.calories} />
      </div>

      {/* Macro cards */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <MacroCard label="Protein" value={protein}    target={targets?.protein} color="bg-blue-500"    />
        <MacroCard label="Carbs"   value={carbs}      target={targets?.carbs}   color="bg-emerald-500" />
        <MacroCard label="Fat"     value={fat}        target={targets?.fat}     color="bg-amber-400"   />
        <MacroCard label="Fiber"   value={fiber ?? 0} target={targets?.fiber}   color="bg-violet-500"  />
      </div>

      {/* Footer — edit link when targets exist, nothing when they don't (banner handles it) */}
      <div className="flex items-center justify-between px-1">
        {entryCount != null && entryCount > 0 ? (
          <Text className="text-xs text-zinc-600">
            {entryCount} {entryCount === 1 ? "entry" : "entries"}
          </Text>
        ) : <span />}
        {hasTargets && (
          <button
            onClick={onEditTargets}
            className="text-xs text-zinc-500 hover:text-white transition-colors"
          >
            Edit goals →
          </button>
        )}
      </div>
    </div>
  );
}