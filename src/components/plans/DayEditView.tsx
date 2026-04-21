'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronLeft, ChevronUp, ChevronDown, X, Plus } from 'lucide-react';
import { db } from '@/lib/db';
import type { PlannedExerciseRow } from '@/lib/db';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DOW_ABBR: Record<number, string> = {
  0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
};

// ─── Draft types ──────────────────────────────────────────────────────────────

interface ExerciseDraft {
  rowId?: number;       // PlannedExerciseRow.id — undefined for newly added
  exerciseId: string;
  name: string;
  sets: string;
  repMin: string;
  repMax: string;
  weight: string;       // "" = null (not set)
  rest: string;
  isTimed: boolean;
  notes: string;
  removePending: boolean;
}

function rowToDraft(row: PlannedExerciseRow, name: string): ExerciseDraft {
  return {
    rowId: row.id,
    exerciseId: row.exerciseId,
    name,
    sets: String(row.targetSets),
    repMin: String(row.targetRepMin),
    repMax: String(row.targetRepMax),
    weight: row.targetWeight !== null ? String(row.targetWeight) : '',
    rest: String(row.restSeconds),
    isTimed: row.isTimed,
    notes: row.notes,
    removePending: false,
  };
}

function draftToRow(d: ExerciseDraft, plannedDayId: number, order: number): PlannedExerciseRow {
  const parsedWeight = d.weight.trim() === '' ? null : parseFloat(d.weight);
  return {
    id: d.rowId,
    plannedDayId,
    exerciseId: d.exerciseId,
    targetSets: Math.max(1, parseInt(d.sets) || 3),
    targetRepMin: Math.max(1, parseInt(d.repMin) || 8),
    targetRepMax: Math.max(1, parseInt(d.repMax) || 10),
    targetWeight: parsedWeight !== null && isNaN(parsedWeight) ? null : parsedWeight,
    restSeconds: Math.max(0, parseInt(d.rest) || 90),
    order,
    isTimed: d.isTimed,
    notes: d.notes,
    suggestedNextWeight: null,
    suggestedNextReps: null,
    suggestionType: null,
  };
}

// snapshot used for dirty-checking — strip UI-only fields
function snapshot(drafts: ExerciseDraft[]): string {
  return JSON.stringify(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    drafts.map(({ removePending, ...d }) => d),
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="px-4 pt-4 pb-6 space-y-3 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
        <div className="h-6 w-44 rounded-lg bg-muted animate-pulse" />
        <div className="ml-auto h-8 w-14 rounded-lg bg-muted animate-pulse" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
      ))}
    </div>
  );
}

// ─── ConfirmDialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  destructive,
}: {
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 pb-8">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-xl">
        <p className="text-sm text-foreground mb-5 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl border border-border bg-background text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            Keep editing
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              'flex-1 h-10 rounded-xl text-sm font-semibold transition-colors',
              destructive
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-primary text-primary-foreground hover:bg-primary/90',
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

function ExerciseCard({
  draft,
  index,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemoveRequest,
  onRemoveConfirm,
  onRemoveCancel,
}: {
  draft: ExerciseDraft;
  index: number;
  total: number;
  onChange: (patch: Partial<ExerciseDraft>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemoveRequest: () => void;
  onRemoveConfirm: () => void;
  onRemoveCancel: () => void;
}) {
  const weightEmpty = draft.weight.trim() === '';

  // Shared input classes
  const inputBase =
    'w-full rounded-lg border border-border bg-background text-foreground text-sm text-center py-1.5 px-1 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent tabular-nums';
  const inputSm = cn(inputBase, 'min-w-0');

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Remove confirm overlay */}
      {draft.removePending && (
        <ConfirmDialog
          message={`Remove "${draft.name}" from this day?`}
          confirmLabel="Remove"
          onConfirm={onRemoveConfirm}
          onCancel={onRemoveCancel}
          destructive
        />
      )}

      {/* Card header: name row + reorder + remove */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        {/* Reorder arrows */}
        <div className="flex flex-col shrink-0">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
            aria-label="Move up"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="h-5 w-5 flex items-center justify-center rounded text-muted-foreground disabled:opacity-20 hover:text-foreground transition-colors"
            aria-label="Move down"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>

        {/* Exercise name */}
        <span className="flex-1 text-sm font-semibold text-foreground min-w-0 truncate">
          {draft.name}
        </span>

        {/* Remove */}
        <button
          onClick={onRemoveRequest}
          className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
          aria-label={`Remove ${draft.name}`}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Input grid */}
      <div className="px-3 pb-3">
        <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-1.5 items-end">
          {/* Sets */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-muted-foreground text-center leading-none">
              Sets
            </label>
            <input
              value={draft.sets}
              onChange={(e) => onChange({ sets: e.target.value })}
              inputMode="numeric"
              type="text"
              pattern="[0-9]*"
              className={inputSm}
              placeholder="3"
            />
          </div>

          {/* Reps min */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-muted-foreground text-center leading-none">
              Rep min
            </label>
            <input
              value={draft.repMin}
              onChange={(e) => onChange({ repMin: e.target.value })}
              inputMode="numeric"
              type="text"
              pattern="[0-9]*"
              className={inputSm}
              placeholder="8"
            />
          </div>

          {/* Reps max */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-muted-foreground text-center leading-none">
              Rep max
            </label>
            <input
              value={draft.repMax}
              onChange={(e) => onChange({ repMax: e.target.value })}
              inputMode="numeric"
              type="text"
              pattern="[0-9]*"
              className={inputSm}
              placeholder="10"
            />
          </div>

          {/* Weight */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-muted-foreground text-center leading-none">
              kg
            </label>
            <input
              value={draft.weight}
              onChange={(e) => onChange({ weight: e.target.value })}
              inputMode="decimal"
              type="text"
              pattern="[0-9]*[.]?[0-9]*"
              className={cn(
                inputSm,
                weightEmpty
                  ? 'border-amber-500/50 text-amber-400 placeholder:text-amber-400/60'
                  : '',
              )}
              placeholder="—"
            />
          </div>

          {/* Rest */}
          <div className="flex flex-col gap-0.5">
            <label className="text-[10px] text-muted-foreground text-center leading-none">
              Rest s
            </label>
            <input
              value={draft.rest}
              onChange={(e) => onChange({ rest: e.target.value })}
              inputMode="numeric"
              type="text"
              pattern="[0-9]*"
              className={inputSm}
              placeholder="90"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DayEditView ──────────────────────────────────────────────────────────────

export function DayEditView({
  planId,
  dayId,
}: {
  planId: string;
  dayId: number;
}) {
  const router = useRouter();

  // ── Data ──────────────────────────────────────────────────────────────────

  const plan = useLiveQuery(() => db.workoutPlans.get(planId), [planId]);
  const day = useLiveQuery(() => db.plannedDays.get(dayId), [dayId]);
  const exerciseRows = useLiveQuery(
    () => db.plannedExercises.where('plannedDayId').equals(dayId).sortBy('order'),
    [dayId],
  );
  const exerciseMap = useLiveQuery(async () => {
    const exs = await db.exercises.toArray();
    return new Map(exs.map((e) => [e.id, e.name]));
  });

  // ── Draft state ───────────────────────────────────────────────────────────

  const [drafts, setDrafts] = useState<ExerciseDraft[]>([]);
  const [initialized, setInitialized] = useState(false);
  const originalSnap = useRef<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [discardDialog, setDiscardDialog] = useState(false);

  // Initialise drafts once data arrives (only once — don't re-init on Dexie live updates)
  useEffect(() => {
    if (initialized || !exerciseRows || !exerciseMap) return;
    const initial = exerciseRows
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((r) => rowToDraft(r, exerciseMap.get(r.exerciseId) ?? r.exerciseId));
    setDrafts(initial);
    originalSnap.current = snapshot(initial);
    setInitialized(true);
  }, [exerciseRows, exerciseMap, initialized]);

  const isDirty = initialized && snapshot(drafts) !== originalSnap.current;

  // ── Handlers ──────────────────────────────────────────────────────────────

  function update(index: number, patch: Partial<ExerciseDraft>) {
    setDrafts((prev) =>
      prev.map((d, i) => (i === index ? { ...d, ...patch } : d)),
    );
  }

  function moveUp(index: number) {
    if (index === 0) return;
    setDrafts((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    setDrafts((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function requestRemove(index: number) {
    update(index, { removePending: true });
  }

  function confirmRemove(index: number) {
    setDrafts((prev) => prev.filter((_, i) => i !== index));
  }

  function cancelRemove(index: number) {
    update(index, { removePending: false });
  }

  const handleBack = useCallback(() => {
    if (isDirty) {
      setDiscardDialog(true);
    } else {
      router.back();
    }
  }, [isDirty, router]);

  async function handleSave() {
    if (!isDirty || isSaving) return;
    setIsSaving(true);
    try {
      // IDs of exercises that existed on load (for deletion of removed ones)
      const originalIds = (exerciseRows ?? [])
        .map((r) => r.id)
        .filter((id): id is number => id != null);
      const keptIds = new Set(
        drafts.filter((d) => d.rowId != null).map((d) => d.rowId!),
      );
      const deletedIds = originalIds.filter((id) => !keptIds.has(id));

      await db.transaction('rw', db.plannedExercises, async () => {
        if (deletedIds.length) {
          await db.plannedExercises.bulkDelete(deletedIds);
        }
        await db.plannedExercises.bulkPut(
          drafts.map((d, i) => draftToRow(d, dayId, i)),
        );
      });

      router.push(`/plans/${planId}`);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Loading / not-found ───────────────────────────────────────────────────

  const loading =
    plan === undefined ||
    day === undefined ||
    exerciseRows === undefined ||
    exerciseMap === undefined ||
    !initialized;

  if (loading) return <Skeleton />;

  if (!plan || !day) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 px-6">
        <p className="text-sm text-muted-foreground">Day not found.</p>
        <button
          className="text-sm text-primary underline"
          onClick={() => router.back()}
        >
          Go back
        </button>
      </div>
    );
  }

  const headerLabel = `${DOW_ABBR[day.dayOfWeek]} — ${day.name}`;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Discard changes dialog */}
      {discardDialog && (
        <ConfirmDialog
          message="Discard changes to this day?"
          confirmLabel="Discard"
          onConfirm={() => router.back()}
          onCancel={() => setDiscardDialog(false)}
          destructive
        />
      )}

      <div className="px-4 pt-4 pb-24 max-w-lg mx-auto">
        {/* ── Header ── */}
        <div className="flex items-center gap-2 mb-5">
          <button
            onClick={handleBack}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors active:scale-95 shrink-0"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <h1 className="flex-1 text-base font-bold text-foreground truncate">
            {headerLabel}
          </h1>

          <button
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            className={cn(
              'h-8 px-4 rounded-lg text-sm font-semibold transition-colors shrink-0',
              isDirty && !isSaving
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95'
                : 'bg-muted text-muted-foreground cursor-not-allowed',
            )}
          >
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </div>

        {/* ── Exercise cards ── */}
        <div className="space-y-2">
          {drafts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No exercises yet — tap + Add Exercise to start.
            </p>
          )}

          {drafts.map((draft, i) => (
            <ExerciseCard
              key={draft.exerciseId + (draft.rowId ?? `new-${i}`)}
              draft={draft}
              index={i}
              total={drafts.length}
              onChange={(patch) => update(i, patch)}
              onMoveUp={() => moveUp(i)}
              onMoveDown={() => moveDown(i)}
              onRemoveRequest={() => requestRemove(i)}
              onRemoveConfirm={() => confirmRemove(i)}
              onRemoveCancel={() => cancelRemove(i)}
            />
          ))}
        </div>

        {/* ── Add Exercise ── */}
        <button
          className="mt-4 w-full flex items-center justify-center gap-2 h-12 rounded-xl border border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-[0.98]"
          onClick={() => {
            // Bottom sheet picker — wired up in the next prompt
          }}
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>

        {/* Unsaved indicator */}
        {isDirty && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Unsaved changes · tap Save to apply
          </p>
        )}
      </div>
    </>
  );
}
