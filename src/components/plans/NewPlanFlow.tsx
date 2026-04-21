'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { db, duplicatePlan, createDeloadPlan } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DOW_LABEL: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};
// Default workout days: Mon Tue Wed Fri Sat
const DEFAULT_WORKOUT_DAYS = new Set([1, 2, 3, 5, 6]);

type StartFrom = 'blank' | 'duplicate' | 'deload';

interface DayConfig {
  dow: number;
  isWorkout: boolean;
  name: string;
}

// ─── Toast helper (simple, no dep) ───────────────────────────────────────────

function showToast(msg: string) {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
    'background:hsl(var(--foreground))', 'color:hsl(var(--background))',
    'padding:10px 18px', 'border-radius:999px', 'font-size:14px',
    'font-weight:500', 'z-index:9999', 'pointer-events:none',
    'white-space:nowrap', 'max-width:90vw', 'text-align:center',
    'box-shadow:0 4px 20px rgba(0,0,0,0.3)',
  ].join(';');
  document.body.appendChild(el);
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.3s';
    el.style.opacity = '1';
  });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 350);
  }, 2800);
}

// ─── Step 1 — Basics ─────────────────────────────────────────────────────────

function StepBasics({
  name,
  setName,
  description,
  setDescription,
  startFrom,
  setStartFrom,
  hasActivePlan,
  onContinue,
}: {
  name: string;
  setName: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  startFrom: StartFrom;
  setStartFrom: (v: StartFrom) => void;
  hasActivePlan: boolean;
  onContinue: () => void;
}) {
  const options: { value: StartFrom; label: string; sub: string; disabled?: boolean }[] = [
    {
      value: 'blank',
      label: 'Blank',
      sub: 'Set up each day from scratch',
    },
    {
      value: 'duplicate',
      label: 'Duplicate current plan',
      sub: 'Copies structure, exercises, and weights',
      disabled: !hasActivePlan,
    },
    {
      value: 'deload',
      label: 'Deload template',
      sub: 'Same exercises · sets −40% · weights −10%',
      disabled: !hasActivePlan,
    },
  ];

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-8">
      {/* Plan name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="plan-name">
          Plan name <span className="text-destructive">*</span>
        </label>
        <input
          id="plan-name"
          type="text"
          maxLength={40}
          placeholder="e.g. Push Pull Legs"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <p className="text-xs text-muted-foreground text-right">{name.length}/40</p>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground" htmlFor="plan-desc">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          id="plan-desc"
          type="text"
          maxLength={100}
          placeholder="e.g. 5-day aesthetic lean bulk"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Start from */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-foreground">Start from</p>
        <div className="flex flex-col gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              disabled={opt.disabled}
              onClick={() => !opt.disabled && setStartFrom(opt.value)}
              className={cn(
                'w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors',
                opt.disabled && 'opacity-40 cursor-not-allowed',
                startFrom === opt.value && !opt.disabled
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:bg-muted/40',
              )}
            >
              {/* Radio circle */}
              <span
                className={cn(
                  'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center',
                  startFrom === opt.value && !opt.disabled
                    ? 'border-primary'
                    : 'border-muted-foreground/40',
                )}
              >
                {startFrom === opt.value && !opt.disabled && (
                  <span className="h-2 w-2 rounded-full bg-primary" />
                )}
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.sub}</span>
              </span>
            </button>
          ))}
        </div>
        {!hasActivePlan && (
          <p className="text-xs text-muted-foreground mt-1">
            Duplicate and Deload require an active plan.
          </p>
        )}
      </div>

      {/* Continue */}
      <Button
        className="w-full gap-2 mt-2"
        disabled={name.trim().length === 0}
        onClick={onContinue}
      >
        {startFrom === 'blank' ? 'Set up schedule' : 'Create plan'}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ─── Step 2 — Schedule (Blank only) ──────────────────────────────────────────

function StepSchedule({
  days,
  setDays,
  onBack,
  onCreate,
  creating,
}: {
  days: DayConfig[];
  setDays: (days: DayConfig[]) => void;
  onBack: () => void;
  onCreate: () => void;
  creating: boolean;
}) {
  function toggleDay(dow: number) {
    setDays(days.map((d) =>
      d.dow === dow ? { ...d, isWorkout: !d.isWorkout, name: !d.isWorkout ? d.name || 'Workout' : d.name } : d,
    ));
  }

  function setDayName(dow: number, name: string) {
    setDays(days.map((d) => (d.dow === dow ? { ...d, name } : d)));
  }

  const workoutDays = days.filter((d) => d.isWorkout);

  return (
    <div className="flex flex-col gap-5 px-4 pt-2 pb-8">
      <p className="text-sm text-muted-foreground">
        Toggle which days are workout days, then name each one.
      </p>

      {/* Day toggles */}
      <div className="flex gap-1.5 flex-wrap">
        {DOW_ORDER.map((dow) => {
          const day = days.find((d) => d.dow === dow)!;
          return (
            <button
              key={dow}
              onClick={() => toggleDay(dow)}
              className={cn(
                'flex-1 min-w-[40px] flex flex-col items-center gap-1 py-2.5 rounded-xl border transition-colors',
                day.isWorkout
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted-foreground',
              )}
            >
              <span className="text-[11px] font-semibold leading-none">{DOW_LABEL[dow]}</span>
              <span className="text-[10px] leading-none">
                {day.isWorkout ? '●' : '–'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Per-day name inputs */}
      {workoutDays.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Select at least one workout day.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Name each day
          </p>
          {DOW_ORDER.filter((dow) => days.find((d) => d.dow === dow)?.isWorkout).map((dow) => {
            const day = days.find((d) => d.dow === dow)!;
            return (
              <div key={dow} className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">
                  {DOW_LABEL[dow]}
                </span>
                <input
                  type="text"
                  maxLength={20}
                  placeholder="Workout"
                  value={day.name === 'Workout' ? '' : day.name}
                  onChange={(e) => setDayName(dow, e.target.value || 'Workout')}
                  className="flex-1 rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 mt-2">
        <Button variant="outline" className="flex-1 gap-1.5" onClick={onBack} disabled={creating}>
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        <Button
          className="flex-1 gap-2"
          disabled={workoutDays.length === 0 || creating}
          onClick={onCreate}
        >
          {creating ? (
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          {creating ? 'Creating…' : 'Create Plan'}
        </Button>
      </div>
    </div>
  );
}

// ─── NewPlanFlow ──────────────────────────────────────────────────────────────

export function NewPlanFlow() {
  const router = useRouter();

  // Step state
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1 fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startFrom, setStartFrom] = useState<StartFrom>('blank');

  // Step 2 fields
  const [days, setDays] = useState<DayConfig[]>(
    DOW_ORDER.map((dow) => ({
      dow,
      isWorkout: DEFAULT_WORKOUT_DAYS.has(dow),
      name: 'Workout',
    })),
  );

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activePlan = useLiveQuery(() =>
    db?.workoutPlans.filter((p) => p.isActive).first(),
  );

  async function handleCreate() {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const planName = name.trim();

      if (startFrom === 'duplicate') {
        if (!activePlan) throw new Error('No active plan to duplicate.');
        const newId = await duplicatePlan(activePlan.id, planName);
        showToast(`${planName} created`);
        router.push(`/plans/${newId}`);

      } else if (startFrom === 'deload') {
        if (!activePlan) throw new Error('No active plan for deload.');
        const newId = await createDeloadPlan(activePlan.id, planName);
        showToast(`${planName} created`);
        router.push(`/plans/${newId}`);

      } else {
        // Blank — save plan + days
        const newPlanId = crypto.randomUUID();
        await db.workoutPlans.add({
          id:          newPlanId,
          name:        planName,
          description: description.trim() || undefined,
          isActive:    false,
          createdAt:   Date.now(),
          days:        [],
        });

        let firstWorkoutDayId: number | null = null;

        for (let i = 0; i < DOW_ORDER.length; i++) {
          const dow = DOW_ORDER[i];
          const cfg = days.find((d) => d.dow === dow)!;
          const dayId = await db.plannedDays.add({
            planId:    newPlanId,
            dayOfWeek: cfg.dow,
            type:      cfg.isWorkout ? 'workout' : 'rest',
            name:      cfg.isWorkout ? (cfg.name || 'Workout') : 'Rest',
            order:     i,
          });
          if (cfg.isWorkout && firstWorkoutDayId === null) {
            firstWorkoutDayId = dayId as number;
          }
        }

        showToast(`${planName} created — add exercises to each day`);

        if (firstWorkoutDayId !== null) {
          router.push(`/plans/${newPlanId}/day/${firstWorkoutDayId}/edit`);
        } else {
          router.push(`/plans/${newPlanId}`);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
      setCreating(false);
    }
  }

  function handleContinue() {
    if (startFrom === 'blank') {
      setStep(2);
    } else {
      handleCreate();
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border">
        <button
          onClick={() => (step === 2 ? setStep(1) : router.back())}
          className="flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold text-foreground leading-tight">
            New Plan
          </h1>
          <p className="text-xs text-muted-foreground">
            Step {step} of {startFrom === 'blank' ? 2 : 1}
          </p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {[1, 2].map((s) => (
            <span
              key={s}
              className={cn(
                'h-1.5 rounded-full transition-all duration-200',
                s === step ? 'w-4 bg-primary' : 'w-1.5 bg-border',
                startFrom !== 'blank' && s === 2 && 'opacity-30',
              )}
            />
          ))}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-4 rounded-xl bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Steps */}
      {step === 1 ? (
        <StepBasics
          name={name}
          setName={setName}
          description={description}
          setDescription={setDescription}
          startFrom={startFrom}
          setStartFrom={setStartFrom}
          hasActivePlan={!!activePlan}
          onContinue={handleContinue}
        />
      ) : (
        <StepSchedule
          days={days}
          setDays={setDays}
          onBack={() => setStep(1)}
          onCreate={handleCreate}
          creating={creating}
        />
      )}
    </div>
  );
}
