"use client";

import { useState } from "react";
import type { AppUser } from "@/utils/supabase/queries";
import { updateUserTargets } from "@/utils/supabase/queries";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Text } from "@/app/components/text";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/app/components/sheet";

interface TargetsSheetProps {
  open: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onSaved: (user: AppUser) => void;
}

const ACTIVITY_LEVELS = [
  { label: "Sedentary",   value: 1.2,   desc: "Desk job, little movement" },
  { label: "Light",       value: 1.375, desc: "1–3 workouts/week" },
  { label: "Moderate",    value: 1.55,  desc: "3–5 workouts/week" },
  { label: "Very Active", value: 1.725, desc: "6–7 workouts/week" },
  { label: "Athlete",     value: 1.9,   desc: "2× daily training" },
] as const;

// Evidence-based protein targets per kg bodyweight
// Sources: ISSN Position Stand (1.4–2.0g/kg for exercising adults),
//          Morton meta-analysis breakpoint ~1.6g/kg,
//          Newer research (Nunes 2022) suggests 2.0g/kg for trained lifters.
//          2g/kg confirmed safe long-term (PubMed 26797090).
const PROTEIN_TARGETS = [
  { label: "Minimum",    value: 0.8,  desc: "0.8g/kg · RDA, sedentary" },
  { label: "Moderate",   value: 1.6,  desc: "1.6g/kg · Active / fitness" },
  { label: "High",       value: 2.0,  desc: "2.0g/kg · Athletes / muscle gain" },
  { label: "Aggressive", value: 2.2,  desc: "2.2g/kg · Bodybuilding / cut" },
] as const;

export function TargetsSheet({ open, onClose, currentUser, onSaved }: TargetsSheetProps) {
  // ── Manual targets ──────────────────────────────────────────────────
  const [calories, setCalories] = useState(String(currentUser.target_calories ?? ""));
  const [protein, setProtein]   = useState(String(currentUser.target_protein ?? ""));
  const [carbs, setCarbs]       = useState(String(currentUser.target_carbs ?? ""));
  const [fat, setFat]           = useState(String(currentUser.target_fat ?? ""));
  const [fiber, setFiber]       = useState(String(currentUser.target_fiber ?? ""));

  // ── Calculator inputs ───────────────────────────────────────────────
  const [useImperial, setUseImperial] = useState(false);
  const [sex, setSex]                 = useState<"male" | "female">("female");
  const [age, setAge]                 = useState("");
  const [weightKg, setWeightKg]       = useState("");
  const [weightLbs, setWeightLbs]     = useState("");
  const [heightCm, setHeightCm]       = useState("");
  const [heightFt, setHeightFt]       = useState("");
  const [heightIn, setHeightIn]       = useState("");
  const [activityLevel, setActivityLevel]   = useState(ACTIVITY_LEVELS[2]);
  const [proteinTarget, setProteinTarget]   = useState(PROTEIN_TARGETS[2]); // 2.0g/kg

  // ── UI state ─────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Helpers ──────────────────────────────────────────────────────────
  const getWeightKg = (): number | null => {
    if (useImperial) {
      const lbs = parseFloat(weightLbs);
      return isNaN(lbs) || lbs <= 0 ? null : lbs / 2.2046;
    }
    const kg = parseFloat(weightKg);
    return isNaN(kg) || kg <= 0 ? null : kg;
  };

  // Mifflin-St Jeor: men +5, women −161
  const computeTDEE = (): number | null => {
    const w = getWeightKg();
    const a = parseFloat(age);
    if (!w || isNaN(a) || a <= 0) return null;
    let h: number;
    if (useImperial) {
      h = ((parseFloat(heightFt) || 0) * 12 + (parseFloat(heightIn) || 0)) * 2.54;
    } else {
      h = parseFloat(heightCm);
    }
    if (isNaN(h) || h <= 0) return null;
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === "male" ? 5 : -161);
    return Math.round(bmr * activityLevel.value);
  };

  const computeProtein = (): number | null => {
    const w = getWeightKg();
    return w ? Math.round(w * proteinTarget.value) : null;
  };

  const suggestedCalories = computeTDEE();
  const suggestedProtein  = computeProtein();
  // Fat: 0.9g/kg — evidence-based minimum for hormonal health
  const suggestedFat = (() => {
    const w = getWeightKg();
    return w ? Math.round(w * 0.9) : null;
  })();
  // Carbs fill remaining calories after protein + fat
  const suggestedCarbs = (() => {
    if (!suggestedCalories || !suggestedProtein || !suggestedFat) return null;
    const g = Math.round((suggestedCalories - suggestedProtein * 4 - suggestedFat * 9) / 4);
    return g > 0 ? g : null;
  })();

  const isCalcReady = !!(suggestedCalories && suggestedProtein && suggestedFat && suggestedCarbs);

  const applyAll = () => {
    if (suggestedCalories) setCalories(String(suggestedCalories));
    if (suggestedProtein)  setProtein(String(suggestedProtein));
    if (suggestedFat)      setFat(String(suggestedFat));
    if (suggestedCarbs)    setCarbs(String(suggestedCarbs));
  };

  // ── Live macro bar ────────────────────────────────────────────────────
  const kcal           = parseFloat(calories);
  const hasCalories    = !isNaN(kcal) && kcal > 0;
  const proteinKcal    = parseFloat(protein) * 4;
  const carbsKcal      = parseFloat(carbs) * 4;
  const fatKcal        = parseFloat(fat) * 9;
  const totalMacroKcal = proteinKcal + carbsKcal + fatKcal;

  // ── Save / Clear ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserTargets(currentUser.id, {
        target_calories: calories ? parseInt(calories)  : null,
        target_protein:  protein  ? parseFloat(protein) : null,
        target_carbs:    carbs    ? parseFloat(carbs)   : null,
        target_fat:      fat      ? parseFloat(fat)     : null,
        target_fiber:    fiber    ? parseFloat(fiber)   : null,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error("Failed to save targets:", err);
      setError("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserTargets(currentUser.id, {
        target_calories: null, target_protein: null,
        target_carbs:    null, target_fat:     null, target_fiber: null,
      });
      setCalories(""); setProtein(""); setCarbs(""); setFat(""); setFiber("");
      onSaved(updated);
      onClose();
    } catch (err) {
      console.error("Failed to clear targets:", err);
      setError("Failed to clear. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
<SheetContent side="right" className="sm:rounded-l-xl overflow-y-auto ">
        <SheetHeader>
          <SheetTitle>Daily Targets</SheetTitle>
          <SheetDescription>Set daily macro goals for {currentUser.name}.</SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">

          {/* ── SECTION 1: Calculator ───────────────────────────────── */}
          <section className="space-y-4">
            <SectionDivider label="Calculator" />

            {/* Metric / Imperial */}
            <div className="flex rounded-lg overflow-hidden border border-zinc-800 w-fit text-xs">
              {(["Metric", "Imperial"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => setUseImperial(u === "Imperial")}
                  className={`px-3 py-1.5 font-medium transition-colors ${
                    (u === "Imperial") === useImperial
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>

            {/* Sex */}
            <div className="grid grid-cols-2 gap-2">
              {(["female", "male"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSex(s)}
                  className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                    sex === s
                      ? "bg-zinc-700 text-white"
                      : "bg-zinc-900 text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {s === "male" ? "♂ Male" : "♀ Female"}
                </button>
              ))}
            </div>

            {/* Age + Weight + Height */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age (years)">
                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 28" />
              </Field>

              {useImperial ? (
                <>
                  <Field label="Weight (lbs)">
                    <Input type="number" value={weightLbs} onChange={(e) => setWeightLbs(e.target.value)} placeholder="e.g. 130" />
                  </Field>
                  <Field label="Height (ft)">
                    <Input type="number" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} placeholder="e.g. 5" />
                  </Field>
                  <Field label="Height (in)">
                    <Input type="number" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} placeholder="e.g. 6" />
                  </Field>
                </>
              ) : (
                <>
                  <Field label="Weight (kg)">
                    <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 52" />
                  </Field>
                  <Field label="Height (cm)" className="col-span-2">
                    <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 165" />
                  </Field>
                </>
              )}
            </div>

            {/* Activity level */}
            <div>
              <FieldLabel>Activity Level</FieldLabel>
              <div className="mt-2 space-y-1.5">
                {ACTIVITY_LEVELS.map((level) => (
                  <button
                    key={level.label}
                    onClick={() => setActivityLevel(level)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      activityLevel.value === level.value
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="font-medium">{level.label}</span>
                    <span className={`text-xs ${activityLevel.value === level.value ? "text-zinc-300" : "text-zinc-600"}`}>
                      {level.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Protein target per kg */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Protein Target</FieldLabel>
                {suggestedProtein && (
                  <span className="text-[10px] text-zinc-500">
                    → {suggestedProtein}g for {Math.round((getWeightKg() ?? 0) * 10) / 10}kg
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PROTEIN_TARGETS.map((pt) => (
                  <button
                    key={pt.label}
                    onClick={() => setProteinTarget(pt)}
                    className={`rounded-lg px-3 py-2.5 text-left transition-colors ${
                      proteinTarget.value === pt.value
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-sm font-medium">{pt.label}</div>
                    <div className={`text-[10px] mt-0.5 leading-snug ${
                      proteinTarget.value === pt.value ? "text-zinc-300" : "text-zinc-600"
                    }`}>
                      {pt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Result card */}
            {isCalcReady ? (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-3">
                <FieldLabel>Suggested Targets</FieldLabel>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Calories", value: suggestedCalories, unit: "kcal", color: "text-white" },
                    { label: "Protein",  value: suggestedProtein,  unit: "g",    color: "text-blue-400" },
                    { label: "Carbs",    value: suggestedCarbs,    unit: "g",    color: "text-emerald-400" },
                    { label: "Fat",      value: suggestedFat,      unit: "g",    color: "text-amber-400" },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label}>
                      <div className={`text-lg font-bold tabular-nums ${color}`}>{value}</div>
                      <div className="text-[10px] text-zinc-500">{unit} · {label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Calories via Mifflin-St Jeor ({activityLevel.label}) · Protein {proteinTarget.value}g/kg · Fat 0.9g/kg · Carbs fill remainder
                </p>
                <button
                  onClick={applyAll}
                  className="w-full rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold py-2.5 transition-colors"
                >
                  Apply these targets ↓
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
                <Text className="text-xs text-zinc-600">Fill in your details above to get a suggestion</Text>
              </div>
            )}
          </section>

          {/* ── SECTION 2: Manual targets ────────────────────────────── */}
          <section className="space-y-4">
            <SectionDivider label="Your Targets" />

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Calories", unit: "kcal", value: calories, set: setCalories, span: true },
                { label: "Protein",  unit: "g",    value: protein,  set: setProtein,  span: false },
                { label: "Carbs",    unit: "g",    value: carbs,    set: setCarbs,    span: false },
                { label: "Fat",      unit: "g",    value: fat,      set: setFat,      span: false },
                { label: "Fiber",    unit: "g",    value: fiber,    set: setFiber,    span: false },
              ].map(({ label, unit, value, set, span }) => (
                <Field key={label} label={`${label} (${unit})`} className={span ? "col-span-2" : ""}>
                  <Input
                    type="number"
                    value={value}
                    onChange={(e) => set(e.target.value)}
                    placeholder="—"
                  />
                </Field>
              ))}
            </div>

            {/* Macro bar */}
            {hasCalories && totalMacroKcal > 0 && (
              <div className="space-y-1.5">
                <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500"    style={{ width: `${(proteinKcal / totalMacroKcal) * 100}%` }} />
                  <div className="bg-emerald-500" style={{ width: `${(carbsKcal   / totalMacroKcal) * 100}%` }} />
                  <div className="bg-amber-500"   style={{ width: `${(fatKcal     / totalMacroKcal) * 100}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-zinc-500">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                    P {Math.round((proteinKcal / totalMacroKcal) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                    C {Math.round((carbsKcal / totalMacroKcal) * 100)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    F {Math.round((fatKcal / totalMacroKcal) * 100)}%
                  </span>
                  {Math.abs(totalMacroKcal - kcal) > 50 && (
                    <span className="text-amber-500">⚠ {Math.round(totalMacroKcal)} vs {Math.round(kcal)} kcal</span>
                  )}
                </div>
              </div>
            )}
          </section>

          {error && <Text className="text-xs text-red-400">{error}</Text>}
        </div>

        <SheetFooter className="flex-col gap-2 sm:flex-row">
          {currentUser.target_calories && (
            <Button plain onClick={handleClear} disabled={isSaving}>Clear targets</Button>
          )}
          <SheetClose asChild>
            <Button plain disabled={isSaving}>Cancel</Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Targets"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ── Small helper components ───────────────────────────────────────────────────

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-zinc-800" />
      <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">{label}</span>
      <div className="h-px flex-1 bg-zinc-800" />
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{children}</p>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1">{children}</div>
    </div>
  );
}