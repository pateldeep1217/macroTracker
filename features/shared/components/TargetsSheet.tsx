"use client";

import { useEffect, useState } from "react";
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

const JOB_TYPES = [
  { label: "Desk / Seated",  neat: 0,    desc: "Office, driving, WFH" },
  { label: "Light Standing", neat: 0.1,  desc: "Retail, cashier, teacher" },
  { label: "On Your Feet",   neat: 0.2,  desc: "Server, store clerk, nurse" },
  { label: "Physical Labor", neat: 0.3,  desc: "Construction, warehouse, farming" },
] as const;

const EXERCISE_LEVELS = [
  { label: "None",       bonus: 0,     desc: "No structured workouts" },
  { label: "1–2×/week", bonus: 0.075, desc: "Occasional gym sessions" },
  { label: "3–4×/week", bonus: 0.15,  desc: "Regular training" },
  { label: "5–6×/week", bonus: 0.225, desc: "High frequency" },
  { label: "2× Daily",  bonus: 0.3,   desc: "Athlete / twice a day" },
] as const;

const GOALS = [
  { label: "Cut",       adj: -0.20, desc: "−20% · ~1 lb/week fat loss" },
  { label: "Mild Cut",  adj: -0.10, desc: "−10% · slow, muscle-sparing" },
  { label: "Maintain",  adj:  0,    desc: "Eat at TDEE" },
  { label: "Lean Bulk", adj: +0.10, desc: "+10% · minimize fat gain" },
] as const;

const PROTEIN_TARGETS = [
  { label: "Minimum",    value: 0.8,  desc: "0.8g/kg · RDA, sedentary" },
  { label: "Moderate",   value: 1.6,  desc: "1.6g/kg · Active / fitness" },
  { label: "High",       value: 2.0,  desc: "2.0g/kg · Athletes / muscle" },
  { label: "Aggressive", value: 2.2,  desc: "2.2g/kg · Bodybuilding / cut" },
] as const;

// ── localStorage helpers ──────────────────────────────────────────────────
const STORAGE_KEY = (userId: string) => `calc_inputs_${userId}`;

interface StoredCalcInputs {
  useImperial: boolean;
  sex: "male" | "female";
  age: string;
  weightKg: string;
  weightLbs: string;
  heightCm: string;
  heightFt: string;
  heightIn: string;
  jobTypeLabel: string;
  exerciseLabel: string;
  goalLabel: string;
  proteinTargetValue: number;
}

function loadCalcInputs(userId: string): Partial<StoredCalcInputs> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveCalcInputs(userId: string, data: StoredCalcInputs) {
  try {
    localStorage.setItem(STORAGE_KEY(userId), JSON.stringify(data));
  } catch {}
}

export function TargetsSheet({ open, onClose, currentUser, onSaved }: TargetsSheetProps) {

  // ── Manual targets — pre-filled from saved user data ───────────────
  const [calories, setCalories] = useState(String(currentUser.target_calories ?? ""));
  const [protein, setProtein]   = useState(String(currentUser.target_protein  ?? ""));
  const [carbs, setCarbs]       = useState(String(currentUser.target_carbs    ?? ""));
  const [fat, setFat]           = useState(String(currentUser.target_fat      ?? ""));
  const [fiber, setFiber]       = useState(String(currentUser.target_fiber    ?? ""));

  // Re-sync manual fields when sheet opens or user changes
  useEffect(() => {
    if (open) {
      setCalories(String(currentUser.target_calories ?? ""));
      setProtein(String(currentUser.target_protein  ?? ""));
      setCarbs(String(currentUser.target_carbs      ?? ""));
      setFat(String(currentUser.target_fat          ?? ""));
      setFiber(String(currentUser.target_fiber      ?? ""));
    }
  }, [open, currentUser]);

  // ── Calculator inputs — restored from localStorage ─────────────────
  const saved = loadCalcInputs(currentUser.id);

  const [useImperial, setUseImperial] = useState(saved.useImperial ?? false);
  const [sex, setSex]                 = useState<"male" | "female">(saved.sex ?? "female");
  const [age, setAge]                 = useState(saved.age ?? "");
  const [weightKg, setWeightKg]       = useState(saved.weightKg ?? "");
  const [weightLbs, setWeightLbs]     = useState(saved.weightLbs ?? "");
  const [heightCm, setHeightCm]       = useState(saved.heightCm ?? "");
  const [heightFt, setHeightFt]       = useState(saved.heightFt ?? "");
  const [heightIn, setHeightIn]       = useState(saved.heightIn ?? "");

  const [jobType, setJobType] = useState<typeof JOB_TYPES[number]>(
    JOB_TYPES.find(j => j.label === saved.jobTypeLabel) ?? JOB_TYPES[0]
  );
  const [exerciseLevel, setExerciseLevel] = useState<typeof EXERCISE_LEVELS[number]>(
    EXERCISE_LEVELS.find(e => e.label === saved.exerciseLabel) ?? EXERCISE_LEVELS[2]
  );
  const [goal, setGoal] = useState<typeof GOALS[number]>(
    GOALS.find(g => g.label === saved.goalLabel) ?? GOALS[2]
  );
  const [proteinTarget, setProteinTarget] = useState<typeof PROTEIN_TARGETS[number]>(
    PROTEIN_TARGETS.find(p => p.value === saved.proteinTargetValue) ?? PROTEIN_TARGETS[2]
  );

  // Persist to localStorage whenever any calc input changes
  useEffect(() => {
    saveCalcInputs(currentUser.id, {
      useImperial, sex, age, weightKg, weightLbs,
      heightCm, heightFt, heightIn,
      jobTypeLabel: jobType.label,
      exerciseLabel: exerciseLevel.label,
      goalLabel: goal.label,
      proteinTargetValue: proteinTarget.value,
    });
  }, [
    useImperial, sex, age, weightKg, weightLbs,
    heightCm, heightFt, heightIn,
    jobType, exerciseLevel, goal, proteinTarget,
    currentUser.id,
  ]);

  // ── UI state ─────────────────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // ── Derived weight in kg ──────────────────────────────────────────────
  const getWeightKg = (): number | null => {
    if (useImperial) {
      const lbs = parseFloat(weightLbs);
      return isNaN(lbs) || lbs <= 0 ? null : lbs / 2.2046;
    }
    const kg = parseFloat(weightKg);
    return isNaN(kg) || kg <= 0 ? null : kg;
  };

  // ── Mifflin-St Jeor BMR → TDEE ───────────────────────────────────────
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
    return Math.round(bmr * (1.2 + jobType.neat + exerciseLevel.bonus));
  };

  const tdee              = computeTDEE();
  const suggestedCalories = tdee ? Math.round(tdee * (1 + goal.adj)) : null;
  const suggestedProtein  = (() => { const w = getWeightKg(); return w ? Math.round(w * proteinTarget.value) : null; })();
  const suggestedFat      = (() => { const w = getWeightKg(); return w ? Math.round(w * 0.9) : null; })();
  const suggestedCarbs    = (() => {
    if (!suggestedCalories || !suggestedProtein || !suggestedFat) return null;
    const g = Math.round((suggestedCalories - suggestedProtein * 4 - suggestedFat * 9) / 4);
    return g > 0 ? g : null;
  })();

  const isCalcReady        = !!(suggestedCalories && suggestedProtein && suggestedFat && suggestedCarbs);
  const activityMultiplier = (1.2 + jobType.neat + exerciseLevel.bonus).toFixed(2);

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

  const hasExistingTargets = !!(currentUser.target_calories);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="sm:rounded-l-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{hasExistingTargets ? "Edit Daily Goals" : "Set Daily Goals"}</SheetTitle>
          <SheetDescription>
            {hasExistingTargets
              ? `Update macro goals for ${currentUser.name}.`
              : `Set daily macro goals for ${currentUser.name}.`}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">

          {/* ── SECTION 1: Calculator ─────────────────────────────── */}
          <section className="space-y-5">
            <SectionDivider label="Calculate my goals" />

            {/* Unit toggle */}
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
                    <Input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} placeholder="e.g. 68" />
                  </Field>
                  <Field label="Height (cm)" className="col-span-2">
                    <Input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} placeholder="e.g. 170" />
                  </Field>
                </>
              )}
            </div>

            {/* Job type */}
            <div>
              <FieldLabel>Job / Daily Movement</FieldLabel>
              <p className="text-[10px] text-zinc-600 mt-0.5 mb-2">How active is your job outside the gym?</p>
              <div className="grid grid-cols-2 gap-2">
                {JOB_TYPES.map((j) => (
                  <button
                    key={j.label}
                    onClick={() => setJobType(j)}
                    className={`rounded-lg px-3 py-2.5 text-left transition-colors ${
                      jobType.label === j.label
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-sm font-medium">{j.label}</div>
                    <div className={`text-[10px] mt-0.5 ${jobType.label === j.label ? "text-zinc-300" : "text-zinc-600"}`}>
                      {j.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise frequency */}
            <div>
              <FieldLabel>Gym / Exercise</FieldLabel>
              <p className="text-[10px] text-zinc-600 mt-0.5 mb-2">Structured workouts only — not your job.</p>
              <div className="space-y-1.5">
                {EXERCISE_LEVELS.map((e) => (
                  <button
                    key={e.label}
                    onClick={() => setExerciseLevel(e)}
                    className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      exerciseLevel.label === e.label
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <span className="font-medium">{e.label}</span>
                    <span className={`text-xs ${exerciseLevel.label === e.label ? "text-zinc-300" : "text-zinc-600"}`}>
                      {e.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Goal */}
            <div>
              <FieldLabel>Goal</FieldLabel>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {GOALS.map((g) => (
                  <button
                    key={g.label}
                    onClick={() => setGoal(g)}
                    className={`rounded-lg px-3 py-2.5 text-left transition-colors ${
                      goal.label === g.label
                        ? "bg-zinc-700 text-white"
                        : "bg-zinc-900 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-sm font-medium">{g.label}</div>
                    <div className={`text-[10px] mt-0.5 leading-snug ${goal.label === g.label ? "text-zinc-300" : "text-zinc-600"}`}>
                      {g.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Protein per kg */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <FieldLabel>Protein per kg</FieldLabel>
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
                    <div className={`text-[10px] mt-0.5 leading-snug ${proteinTarget.value === pt.value ? "text-zinc-300" : "text-zinc-600"}`}>
                      {pt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Result card */}
            {isCalcReady ? (
              <div className="rounded-xl bg-zinc-800/50 border border-zinc-700 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <FieldLabel>Suggested Goals</FieldLabel>
                  {tdee && (
                    <span className="text-[10px] text-zinc-600">
                      TDEE {tdee.toLocaleString()} kcal · ×{activityMultiplier}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  {[
                    { label: "Calories", value: suggestedCalories, unit: "kcal", color: "text-white" },
                    { label: "Protein",  value: suggestedProtein,  unit: "g",    color: "text-blue-400" },
                    { label: "Carbs",    value: suggestedCarbs,    unit: "g",    color: "text-emerald-400" },
                    { label: "Fat",      value: suggestedFat,      unit: "g",    color: "text-amber-400" },
                  ].map(({ label, value, unit, color }) => (
                    <div key={label}>
                      <div className={`text-lg font-bold tabular-nums ${color}`}>{value?.toLocaleString()}</div>
                      <div className="text-[10px] text-zinc-500">{unit}</div>
                      <div className="text-[10px] text-zinc-600">{label}</div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  Mifflin-St Jeor · job ({jobType.label}) + gym ({exerciseLevel.label}) · goal: {goal.label} · protein {proteinTarget.value}g/kg · fat 0.9g/kg
                </p>
                <button
                  onClick={applyAll}
                  className="w-full rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-semibold py-2.5 transition-colors"
                >
                  Apply these goals ↓
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3 text-center">
                <Text className="text-xs text-zinc-600">Fill in your details above to get a suggestion</Text>
              </div>
            )}
          </section>

          {/* ── SECTION 2: Manual goals ─────────────────────────────── */}
          <section className="space-y-4">
            <SectionDivider label={hasExistingTargets ? "Your current goals" : "Set manually"} />

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

            {/* Live macro breakdown bar */}
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
          {hasExistingTargets && (
            <Button plain onClick={handleClear} disabled={isSaving}>Clear goals</Button>
          )}
          <SheetClose asChild>
            <Button plain disabled={isSaving}>Cancel</Button>
          </SheetClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : hasExistingTargets ? "Update Goals" : "Save Goals"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

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
  return <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">{children}</p>;
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <FieldLabel>{label}</FieldLabel>
      <div className="mt-1">{children}</div>
    </div>
  );
}