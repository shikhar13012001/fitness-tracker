'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Plus,
  Pencil,
  Copy,
  Trash2,
} from 'lucide-react';
import { db, setActivePlan, duplicatePlan } from '@/lib/db';
import type { WorkoutPlan, PlannedDayRow } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg: string, variant: 'default' | 'error' = 'default') {
  if (typeof document === 'undefined') return;
  const el = document.createElement('div');
  el.textContent = msg;
  const bg = variant === 'error'
    ? 'hsl(var(--destructive))'
    : 'hsl(var(--foreground))';
  const fg = variant === 'error'
    ? 'hsl(var(--destructive-foreground))'
    : 'hsl(var(--background))';
  el.style.cssText = [
    'position:fixed', 'bottom:80px', 'left:50%', 'transform:translateX(-50%)',
    `background:${bg}`, `color:${fg}`,
    'padding:10px 18px', 'border-radius:999px', 'font-size:14px',
    'font-weight:500', 'z-index:9999', 'pointer-events:none',
    'white-space:nowrap', 'max-width:90vw', 'text-align:center',
    'box-shadow:0 4px 20px rgba(0,0,0,0.35)', 'opacity:0',
    'transition:opacity 0.2s',
  ].join(';');
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = '1'; });
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 250);
  }, 2800);
}

// ─── BottomSheet ──────────────────────────────────────────────────────────────

interface SheetAction {
  label: string;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}

function BottomSheet({
  open,
  title,
  body,
  actions,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  actions: SheetAction[];
  onClose: () => void;
}) {
  // Prevent scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative bg-card rounded-t-2xl border-t border-border p-6 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        <div className="w-8 h-1 rounded-full bg-border mx-auto -mt-2 mb-1" />
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-semibold text-foreground leading-snug">{title}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
        </div>
        <div className="flex flex-col gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant === 'destructive' ? 'destructive' : 'default'}
              className="w-full"
              onClick={() => { action.onClick(); onClose(); }}
            >
              {action.label}
            </Button>
          ))}
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────────────────────

// Display order: Mon … Sun (JS getDay(): 0=Sun, 1=Mon … 6=Sat)
const DOW_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DOW_ABBR: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

function weekNumber(plan: WorkoutPlan): number {
  if (!plan.createdAt) return 1;
  return Math.max(1, Math.floor((Date.now() - plan.createdAt) / (7 * 24 * 60 * 60 * 1000)) + 1);
}

function trainingDayCount(planId: string, allDays: PlannedDayRow[]): number {
  return allDays.filter((d) => d.planId === planId && d.type === 'workout').length;
}

// ─── WeekStrip ────────────────────────────────────────────────────────────────

function WeekStrip({
  planId,
  allDays,
}: {
  planId: string;
  allDays: PlannedDayRow[];
}) {
  const todayDow = new Date().getDay();
  const planDays = allDays.filter((d) => d.planId === planId);

  return (
    <div className="flex gap-1 mt-3">
      {DOW_ORDER.map((dow) => {
        const day = planDays.find((d) => d.dayOfWeek === dow);
        const isWorkout = day?.type === 'workout';
        const isToday = dow === todayDow;

        return (
          <div
            key={dow}
            className={cn(
              'flex-1 flex flex-col items-center gap-1 py-1.5 rounded-lg select-none',
              isToday && 'ring-1 ring-primary/60 bg-primary/5',
            )}
          >
            <span className="text-[10px] text-muted-foreground leading-none">
              {DOW_ABBR[dow]}
            </span>
            <span
              className={cn(
                'text-xs font-bold leading-none',
                isWorkout ? 'text-emerald-400' : 'text-muted-foreground/30',
              )}
            >
              {isWorkout ? '●' : '–'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── ActivePlanCard ───────────────────────────────────────────────────────────

function ActivePlanCard({
  plan,
  allDays,
}: {
  plan: WorkoutPlan;
  allDays: PlannedDayRow[];
}) {
  const router = useRouter();
  const count = trainingDayCount(plan.id, allDays);
  const week = weekNumber(plan);

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      {/* Tappable area — navigates to the weekly plan view */}
      <button
        className="w-full text-left p-4 focus:outline-none active:bg-muted/40 transition-colors"
        onClick={() => router.push(`/plans/${plan.id}`)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-foreground leading-tight truncate">
              {plan.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {count} training day{count !== 1 ? 's' : ''} · Week {week}
            </p>
          </div>
        </div>

        <WeekStrip planId={plan.id} allDays={allDays} />
      </button>

      {/* Edit button — stopPropagation so it doesn't navigate */}
      <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={() => router.push(`/plans/${plan.id}`)}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit Plan
        </Button>
      </div>
    </div>
  );
}

// ─── SavedPlanRow ─────────────────────────────────────────────────────────────

function SavedPlanRow({
  plan,
  allDays,
  onActivate,
  onDuplicate,
  onDelete,
}: {
  plan: WorkoutPlan;
  allDays: PlannedDayRow[];
  onActivate: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const startX = useRef<number | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const count = trainingDayCount(plan.id, allDays);

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleTouchStart(e: React.TouchEvent) {
    startX.current = e.touches[0].clientX;
    longPressTimer.current = setTimeout(() => setRevealed(true), 500);
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (startX.current !== null) {
      const moved = Math.abs(e.touches[0].clientX - startX.current);
      if (moved > 8) clearLongPress(); // moved — not a long press
    }
  }

  function handleTouchEnd(e: React.TouchEvent) {
    clearLongPress();
    if (startX.current === null) return;
    const dx = startX.current - e.changedTouches[0].clientX;
    if (dx > 60) setRevealed(true);
    else if (dx < -20) setRevealed(false);
    startX.current = null;
  }

  return (
    <div className="relative overflow-hidden">
      {/* Action drawer (revealed on swipe/long-press) */}
      <div
        className="absolute right-0 top-0 bottom-0 flex"
        aria-hidden={!revealed}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRevealed(false);
            onDuplicate();
          }}
          className="flex flex-col items-center justify-center gap-0.5 w-16 bg-zinc-700 text-zinc-100 text-[11px] font-medium"
        >
          <Copy className="h-4 w-4" />
          Dup
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRevealed(false);
            onDelete();
          }}
          className="flex flex-col items-center justify-center gap-0.5 w-16 bg-red-700 text-white text-[11px] font-medium"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </button>
      </div>

      {/* Main row */}
      <div
        className={cn(
          'relative bg-card flex items-center gap-3 px-4 py-3.5 transition-transform duration-200 ease-out',
          revealed ? '-translate-x-32' : 'translate-x-0',
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => revealed && setRevealed(false)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {plan.name}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {count} training day{count !== 1 ? 's' : ''}
          </p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={onActivate}
          >
            Activate
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── PlansView ────────────────────────────────────────────────────────────────

type SheetMode =
  | { type: 'activate'; plan: WorkoutPlan }
  | { type: 'delete'; plan: WorkoutPlan }
  | null;

export function PlansView() {
  const router = useRouter();
  const plans = useLiveQuery(async () => {
    const all = await db.workoutPlans.toArray();
    return all.sort((a, b) => a.name.localeCompare(b.name));
  });
  const allDays = useLiveQuery(() => db.plannedDays.toArray());

  const [sheet, setSheet] = useState<SheetMode>(null);

  const loading = plans === undefined || allDays === undefined;
  const activePlan = plans?.find((p) => p.isActive) ?? null;
  const savedPlans = (plans ?? []).filter((p) => !p.isActive);

  // ── Activate ────────────────────────────────────────────────────────────────
  function requestActivate(plan: WorkoutPlan) {
    setSheet({ type: 'activate', plan });
  }

  async function confirmActivate(plan: WorkoutPlan) {
    try {
      await setActivePlan(plan.id);
      showToast(`${plan.name} is now active`);
    } catch {
      showToast('Failed to activate plan', 'error');
    }
  }

  // ── Duplicate ───────────────────────────────────────────────────────────────
  async function handleDuplicate(planId: string) {
    const plan = plans?.find((p) => p.id === planId);
    if (!plan) return;
    try {
      await duplicatePlan(planId, `${plan.name} (copy)`);
      showToast('Plan duplicated');
    } catch {
      showToast('Failed to duplicate plan', 'error');
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  function requestDelete(plan: WorkoutPlan) {
    if (plan.isActive) {
      showToast("Can't delete the active plan — activate another plan first", 'error');
      return;
    }
    setSheet({ type: 'delete', plan });
  }

  async function confirmDelete(plan: WorkoutPlan) {
    try {
      // Cascade hooks in db.ts handle days + exercises automatically
      await db.workoutPlans.delete(plan.id);
      showToast('Plan deleted');
    } catch {
      showToast('Failed to delete plan', 'error');
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-20 rounded-lg bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded bg-muted animate-pulse" />
        <div className="h-48 rounded-2xl bg-muted animate-pulse" />
        <div className="h-5 w-24 rounded bg-muted animate-pulse" />
        <div className="h-14 rounded-2xl bg-muted animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="px-4 pt-6 pb-6 space-y-5 max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Plans</h1>
          <button
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors active:scale-95"
            aria-label="Create new plan"
            onClick={() => router.push('/plans/new')}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* ── Active ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2.5">
            Active
          </p>
          {activePlan ? (
            <ActivePlanCard plan={activePlan} allDays={allDays ?? []} />
          ) : (
            <div className="rounded-2xl bg-card border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No active plan.{' '}
                {savedPlans.length > 0
                  ? 'Activate one from Saved Plans below.'
                  : 'Tap + to create one.'}
              </p>
            </div>
          )}
        </section>

        {/* ── Saved Plans ── */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase mb-2.5">
            Saved Plans
          </p>
          {savedPlans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other plans saved.
            </p>
          ) : (
            <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border">
              {savedPlans.map((plan) => (
                <SavedPlanRow
                  key={plan.id}
                  plan={plan}
                  allDays={allDays ?? []}
                  onActivate={() => requestActivate(plan)}
                  onDuplicate={() => handleDuplicate(plan.id)}
                  onDelete={() => requestDelete(plan)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Bottom sheets ── */}
      <BottomSheet
        open={sheet?.type === 'activate'}
        title={`Switch to ${sheet?.type === 'activate' ? sheet.plan.name : ''}?`}
        body="Your current progress and session history won't be affected."
        actions={[
          {
            label: 'Switch plan',
            onClick: () => sheet?.type === 'activate' && confirmActivate(sheet.plan),
          },
        ]}
        onClose={() => setSheet(null)}
      />

      <BottomSheet
        open={sheet?.type === 'delete'}
        title={`Delete ${sheet?.type === 'delete' ? sheet.plan.name : ''}?`}
        body="This cannot be undone. All exercises configured for this plan will be removed."
        actions={[
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: () => sheet?.type === 'delete' && confirmDelete(sheet.plan),
          },
        ]}
        onClose={() => setSheet(null)}
      />
    </>
  );
}
