"use client";

import { useState } from "react";
import type { MealEntryWithDetails } from "@/utils/supabase/queries";
import type { AppUser } from "@/utils/supabase/queries";
import { Text } from "@/app/components/text";
import { sumMacros, calculateMealMacros } from "@/features/shared/utils/macors";
import { MacroStatsGrid } from "@/features/shared/components/MacroStatsGrid";
import { TargetsSheet } from "@/features/shared/components/TargetsSheet";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/features/shared/utils/constatns";
import type { MealType } from "@/features/shared/utils/constatns";
import { formatNumber } from "@/features/shared/utils/formatting";

interface SummaryTabProps {
  readonly userId: string;
  readonly userName: string;
  readonly selectedDate: string;
  readonly meals: readonly MealEntryWithDetails[];
  readonly currentUser: AppUser;
  readonly onUserUpdated: (user: AppUser) => void;
}

// Meal colors — matches MealBreakdown
const MEAL_CONFIG: Record<MealType, { icon: string; calColor: string; barColor: string; pillBg: string }> = {
  Breakfast:      { icon: "🍳", calColor: "text-orange-400", barColor: "bg-orange-500",  pillBg: "bg-orange-500/10"  },
  Lunch:          { icon: "🥗", calColor: "text-green-400",  barColor: "bg-green-500",   pillBg: "bg-green-500/10"   },
  Dinner:         { icon: "🍽️", calColor: "text-blue-400",   barColor: "bg-blue-500",    pillBg: "bg-blue-500/10"    },
  Snacks:         { icon: "🍪", calColor: "text-purple-400", barColor: "bg-purple-500",  pillBg: "bg-purple-500/10"  },
  "Pre Workout":  { icon: "💪", calColor: "text-red-400",    barColor: "bg-red-500",     pillBg: "bg-red-500/10"     },
  "Post Workout": { icon: "🥤", calColor: "text-cyan-400",   barColor: "bg-cyan-500",    pillBg: "bg-cyan-500/10"    },
};

export function SummaryTab({
  userName,
  selectedDate,
  meals,
  currentUser,
  onUserUpdated,
}: SummaryTabProps) {
  const [copied, setCopied] = useState(false);
  const [showTargetsSheet, setShowTargetsSheet] = useState(false);

  const totals = sumMacros(meals as MealEntryWithDetails[]);
  const totalKcal  = totals.calories;
  const proteinPct = totalKcal > 0 ? Math.round(((totals.protein * 4) / totalKcal) * 100) : 0;
  const carbsPct   = totalKcal > 0 ? Math.round(((totals.carbs * 4)   / totalKcal) * 100) : 0;
  const fatPct     = totalKcal > 0 ? Math.round(((totals.fat * 9)     / totalKcal) * 100) : 0;

  // ── Goal progress stats ───────────────────────────────────────────────
  const targets = {
    calories: currentUser.target_calories ?? undefined,
    protein:  currentUser.target_protein  ?? undefined,
    carbs:    currentUser.target_carbs    ?? undefined,
    fat:      currentUser.target_fat      ?? undefined,
    fiber:    currentUser.target_fiber    ?? undefined,
  };
  const hasTargets = !!(targets.calories);

  // ── Copy summary ──────────────────────────────────────────────────────
  const handleCopySummary = async () => {
    const groupedMeals = MEAL_TYPES.map(
      (type) => [type, meals.filter((m) => m.meal_type === type)] as const
    );
    const mealsList = groupedMeals
      .flatMap(([mealType, mealEntries]) => {
        if (mealEntries.length === 0) return [];
        return [
          `\n${mealType.toUpperCase()}:`,
          ...mealEntries.map((meal) => {
            const name = meal.food_items?.name || meal.recipes?.name || "Unknown";
            const macros = calculateMealMacros(meal);
            return `  • ${name}: ${Math.round(macros.calories)} cal | P: ${Math.round(macros.protein * 10) / 10}g | C: ${Math.round(macros.carbs * 10) / 10}g | F: ${Math.round(macros.fat * 10) / 10}g`;
          }),
        ];
      })
      .join("\n");

    const text = `📊 Daily Summary — ${formatDateLong(selectedDate)}
👤 ${userName}

🔥 Calories: ${Math.round(totalKcal)}${targets.calories ? ` / ${targets.calories}` : ""}
🥩 Protein:  ${Math.round(totals.protein * 10) / 10}g (${proteinPct}%)
🍞 Carbs:    ${Math.round(totals.carbs * 10) / 10}g (${carbsPct}%)
🥑 Fat:      ${Math.round(totals.fat * 10) / 10}g (${fatPct}%)
${mealsList}

Tracked with Food Macro Tracker`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Failed to copy:", e);
    }
  };

  return (
    <div className="space-y-4 pb-6">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="rounded-xl bg-zinc-900 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-white">Summary</p>
          <p className="text-xs text-zinc-500 mt-0.5">{formatDateLong(selectedDate)}</p>
        </div>
        <button
          onClick={handleCopySummary}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            copied
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700"
          }`}
        >
          {copied ? <><span>✓</span><span>Copied!</span></> : <><span className="text-base leading-none">📋</span><span>Share</span></>}
        </button>
      </div>

      {/* ── MacroStatsGrid (goals + progress) ────────────────────── */}
      <MacroStatsGrid
        calories={totals.calories}
        protein={totals.protein}
        carbs={totals.carbs}
        fat={totals.fat}
        fiber={totals.fiber}
        entryCount={meals.length}
        targets={targets}
        onEditTargets={() => setShowTargetsSheet(true)}
      />

      {/* ── Macro split bar — summary-exclusive insight ───────────── */}
      {totalKcal > 0 && (
        <div className="rounded-xl bg-zinc-900 px-4 py-3 space-y-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Macro split</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-px">
            <div className="bg-blue-500    transition-all duration-500" style={{ width: `${proteinPct}%` }} />
            <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${carbsPct}%` }} />
            <div className="bg-amber-400   transition-all duration-500" style={{ width: `${fatPct}%` }} />
          </div>
          <div className="flex items-center gap-4 text-xs">
            {[
              { label: "Protein", pct: proteinPct, color: "bg-blue-500" },
              { label: "Carbs",   pct: carbsPct,   color: "bg-emerald-500" },
              { label: "Fat",     pct: fatPct,      color: "bg-amber-400" },
            ].map(({ label, pct, color }) => (
              <span key={label} className="flex items-center gap-1.5 text-zinc-400">
                <span className={`w-2 h-2 rounded-sm ${color} inline-block`} />
                {label} <span className="text-white font-semibold">{pct}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Goal progress cards — only shown if targets are set ──── */}
      {hasTargets && totalKcal > 0 && (
        <div className="rounded-xl bg-zinc-900 px-4 py-3 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Goal progress</p>
          <div className="space-y-2.5">
            {[
              { label: "Calories", value: Math.round(totals.calories), target: targets.calories, unit: "kcal", color: "bg-emerald-500" },
              { label: "Protein",  value: Math.round(totals.protein * 10) / 10,  target: targets.protein,  unit: "g", color: "bg-blue-500" },
              { label: "Carbs",    value: Math.round(totals.carbs * 10) / 10,    target: targets.carbs,    unit: "g", color: "bg-emerald-500" },
              { label: "Fat",      value: Math.round(totals.fat * 10) / 10,      target: targets.fat,      unit: "g", color: "bg-amber-400" },
            ].filter(row => row.target != null).map(({ label, value, target, unit, color }) => {
              const pct = target ? Math.min((value / target) * 100, 100) : 0;
              const over = target != null && value > target;
              const remaining = target != null ? Math.round(target - value) : null;
              return (
                <div key={label} className="group">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs text-zinc-400">{label}</span>
                    <span className={`text-xs font-medium tabular-nums ${over ? "text-red-400" : "text-zinc-400"}`}>
                      <span className="text-white font-semibold">{value.toLocaleString()}</span>
                      {unit === "kcal" ? " kcal" : `g`}
                      {target != null && <span className="text-zinc-600"> / {target.toLocaleString()}{unit === "kcal" ? " kcal" : "g"}</span>}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-zinc-800">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${over ? "bg-red-500" : color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {remaining != null && (
                    <p className={`text-[10px] mt-1 ${over ? "text-red-400" : "text-zinc-600"}`}>
                      {over ? `${Math.abs(remaining)}${unit === "kcal" ? " kcal" : "g"} over` : `${remaining}${unit === "kcal" ? " kcal" : "g"} remaining`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Meals — read-only with hover-reveal name (no actions) ── */}
      {meals.length > 0 ? (
        <div className="space-y-3">
          <Text className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">Meals</Text>
          <div className="space-y-3">
            {MEAL_TYPES.map((type) => {
              const mealEntries = meals.filter((m) => m.meal_type === type);
              if (mealEntries.length === 0) return null;
              const config = MEAL_CONFIG[type];
              const label  = MEAL_TYPE_LABELS[type];
              const mealTotals = sumMacros(mealEntries as MealEntryWithDetails[]);

              return (
                <div key={type} className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800/60">
                  {/* Meal header */}
                  <div className="flex items-center justify-between px-4 py-3 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`shrink-0 w-1 h-6 rounded-full ${config.barColor}`} />
                      <span className="text-xl leading-none">{config.icon}</span>
                      <span className={`font-semibold text-sm ${config.calColor}`}>{label}</span>
                    </div>
                    <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 ${config.pillBg} text-xs font-medium`}>
                      <span className={`font-bold ${config.calColor}`}>{Math.round(mealTotals.calories)} cal</span>
                      <span className="text-zinc-500 hidden sm:inline">·</span>
                      <span className="text-zinc-400 hidden sm:inline">P: {Math.round(mealTotals.protein)}g</span>
                      <span className="text-zinc-400 hidden sm:inline">C: {Math.round(mealTotals.carbs)}g</span>
                      <span className="text-zinc-400 hidden sm:inline">F: {Math.round(mealTotals.fat)}g</span>
                    </div>
                  </div>

                  {/* Meal items — read-only, hover-reveal macros */}
                  <div className="px-3 pb-3 space-y-1.5">
                    {mealEntries.map((meal) => {
                      const macros = calculateMealMacros(meal);
                      let displayName = "Unknown";
                      if (meal.food_items) {
                        const food = meal.food_items;
                        const qty = meal.quantity;
                        if (food.serving_label && food.serving_size && qty === food.serving_size) {
                          displayName = `${food.name} (${food.serving_label})`;
                        } else if (food.serving_label && food.serving_size) {
                          const servingCount = qty / food.serving_size;
                          displayName = Number.isInteger(servingCount)
                            ? `${food.name} (${servingCount > 1 ? food.serving_label.replace(/^1 /, `${servingCount} `) : food.serving_label})`
                            : `${food.name} (${formatNumber(qty, 1)}${meal.quantity_type})`;
                        } else {
                          displayName = `${food.name} (${formatNumber(qty, 1)}${meal.quantity_type})`;
                        }
                      } else if (meal.recipes) {
                        displayName = `${meal.recipes.name} (${formatNumber(meal.quantity, 1)} serving${meal.quantity > 1 ? "s" : ""})`;
                      }

                      return (
                        <div
                          key={meal.id}
                          className="group rounded-xl bg-zinc-800/40 hover:bg-zinc-800 border border-transparent hover:border-zinc-700/50 px-3.5 py-3 transition-all duration-150"
                        >
                          <div className="flex items-center gap-3">
                            <span className="shrink-0 w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-zinc-400 transition-colors mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white leading-snug truncate">{displayName}</p>
                              {/* Macros — visible on hover (same animation as MealBreakdown) */}
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <span className={`font-semibold ${config.calColor}`}>{Math.round(macros.calories)} cal</span>
                                <span className="text-zinc-500">P: <span className="text-zinc-300">{Math.round(macros.protein * 10) / 10}g</span></span>
                                <span className="text-zinc-500">C: <span className="text-zinc-300">{Math.round(macros.carbs * 10) / 10}g</span></span>
                                <span className="text-zinc-500">F: <span className="text-zinc-300">{Math.round(macros.fat * 10) / 10}g</span></span>
                                {macros.fiber != null && macros.fiber > 0 && (
                                  <span className="text-zinc-600">Fiber: {Math.round(macros.fiber * 10) / 10}g</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-zinc-900 p-8 text-center sm:p-12">
          <div className="mx-auto max-w-sm">
            <div className="mb-3 text-4xl">🍽️</div>
            <Text className="text-sm font-semibold text-white">No meals logged today</Text>
            <Text className="mt-1.5 text-xs text-zinc-500">
              Head to <span className="text-white font-medium">Daily Log</span> to start tracking
            </Text>
          </div>
        </div>
      )}

      <TargetsSheet
        open={showTargetsSheet}
        onClose={() => setShowTargetsSheet(false)}
        currentUser={currentUser}
        onSaved={(updated) => {
          onUserUpdated(updated);
          setShowTargetsSheet(false);
        }}
      />
    </div>
  );
}

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}