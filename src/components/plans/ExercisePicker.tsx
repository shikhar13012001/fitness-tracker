'use client';

import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Search, X, Plus, Check } from 'lucide-react';
import { db } from '@/lib/db';
import type { Exercise } from '@/lib/db';
import { cn } from '@/lib/utils';

// ─── Muscle group filter chips ────────────────────────────────────────────────

const MUSCLE_CHIPS: { label: string; groups: string[]; isCustom?: boolean }[] = [
  { label: 'Push',   groups: ['Chest', 'Upper Chest', 'Shoulders', 'Side Delts', 'Triceps'] },
  { label: 'Pull',   groups: ['Lats', 'Rhomboids', 'Mid Back', 'Lower Back', 'Rear Delts', 'Biceps'] },
  { label: 'Legs',   groups: ['Quads', 'Hamstrings', 'Glutes', 'Calves', 'Legs', 'Hips'] },
  { label: 'Core',   groups: ['Core', 'Abs'] },
  { label: 'Custom', groups: [], isCustom: true },
];

// ─── Custom exercise creation form ───────────────────────────────────────────

function CustomExerciseForm({
  onCreated,
  onCancel,
}: {
  onCreated: (ex: Exercise) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [isCompound, setIsCompound] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    try {
      const newEx: Exercise = {
        id: crypto.randomUUID(),
        name: trimmed,
        muscleGroups: muscle.trim() ? [muscle.trim()] : ['Other'],
        secondaryMuscleGroups: [],
        equipment: 'Other',
        instructions: '',
        tutorialUrl: '',
        isCustom: true,
        isCompound,
      };
      await db.exercises.add(newEx);
      onCreated(newEx);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-border p-4 bg-card space-y-3 shrink-0">
      <p className="text-sm font-semibold text-foreground">Create custom exercise</p>
      <input
        ref={nameRef}
        type="text"
        placeholder="Exercise name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
        maxLength={60}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <input
        type="text"
        placeholder="Muscle group (e.g. Chest)"
        value={muscle}
        onChange={(e) => setMuscle(e.target.value)}
        maxLength={30}
        className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isCompound}
          onChange={(e) => setIsCompound(e.target.checked)}
          className="h-4 w-4 rounded accent-primary"
        />
        <span className="text-sm text-foreground">Compound lift</span>
        <span className="text-xs text-muted-foreground">(progression +2.5 kg)</span>
      </label>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 h-9 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleCreate}
          disabled={!name.trim() || saving}
          className="flex-1 h-9 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
        >
          {saving ? 'Creating…' : 'Create & Add'}
        </button>
      </div>
    </div>
  );
}

// ─── ExercisePicker ───────────────────────────────────────────────────────────

export function ExercisePicker({
  open,
  onClose,
  onSelect,
  addedIds,
}: {
  open: boolean;
  onClose: () => void;
  /** Called with (exerciseId, name) — sheet closes automatically after this. */
  onSelect: (exerciseId: string, name: string) => void;
  /** Set of exerciseIds already on this day — shown greyed-out as "Added". */
  addedIds: Set<string>;
}) {
  const [search, setSearch] = useState('');
  const [filterChip, setFilterChip] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLInputElement>(null);

  const allExercises = useLiveQuery(() =>
    db?.exercises.orderBy('name').toArray() ?? Promise.resolve([])
  );

  // Focus search when sheet opens; reset state when closed
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => searchRef.current?.focus(), 160);
      return () => clearTimeout(t);
    } else {
      setSearch('');
      setFilterChip(null);
      setShowCreate(false);
      setRecentlyAdded(new Set());
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const filtered = (allExercises ?? []).filter((ex) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ex.name.toLowerCase().includes(q) ||
      ex.muscleGroups.some((m) => m.toLowerCase().includes(q));

    let matchChip = true;
    if (filterChip) {
      const chip = MUSCLE_CHIPS.find((c) => c.label === filterChip);
      if (chip?.isCustom) {
        matchChip = !!ex.isCustom;
      } else if (chip) {
        matchChip = chip.groups.some((g) => ex.muscleGroups.includes(g));
      }
    }

    return matchSearch && matchChip;
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-background rounded-t-2xl border-t border-border flex flex-col max-h-[88vh] animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="px-4 pt-3 pb-0 shrink-0">
          <div className="w-8 h-1 rounded-full bg-border mx-auto mb-3" />

          <div className="flex items-center gap-2 mb-3">
            <h2 className="flex-1 text-base font-semibold text-foreground">
              Add Exercise
            </h2>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder="Search exercises…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1"
               style={{ scrollbarWidth: 'none' }}>
            {/* All chip */}
            <button
              onClick={() => setFilterChip(null)}
              className={cn(
                'shrink-0 h-7 px-3.5 rounded-full text-xs font-medium transition-colors',
                filterChip === null
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground',
              )}
            >
              All
            </button>
            {MUSCLE_CHIPS.map((chip) => (
              <button
                key={chip.label}
                onClick={() =>
                  setFilterChip((prev) =>
                    prev === chip.label ? null : chip.label
                  )
                }
                className={cn(
                  'shrink-0 h-7 px-3.5 rounded-full text-xs font-medium transition-colors',
                  filterChip === chip.label
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/30 min-h-0">
          {/* + Create custom exercise — always at top */}
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/40 transition-colors"
            >
              <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                <Plus className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-sm font-medium text-primary">Create custom exercise</span>
            </button>
          )}

          {filtered.length === 0 && !showCreate ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              No exercises match.
            </p>
          ) : (
            filtered.map((ex) => {
              const already = addedIds.has(ex.id);
              const justAdded = recentlyAdded.has(ex.id);
              return (
                <button
                  key={ex.id}
                  onClick={() => {
                    if (already) return;
                    onSelect(ex.id, ex.name);
                    setRecentlyAdded((prev) => {
                      const next = new Set(prev);
                      next.add(ex.id);
                      // Clear flash after 1.5s
                      setTimeout(() => {
                        setRecentlyAdded((p) => {
                          const n = new Set(p);
                          n.delete(ex.id);
                          return n;
                        });
                      }, 1500);
                      return next;
                    });
                  }}
                  disabled={already}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    already
                      ? 'opacity-35 cursor-default'
                      : justAdded
                      ? 'bg-emerald-500/15'
                      : 'hover:bg-muted/40 active:bg-muted/60',
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'text-sm font-medium leading-snug',
                        already ? 'text-muted-foreground' : 'text-foreground',
                      )}
                    >
                      {ex.name}
                      {ex.isCustom && (
                        <span className="ml-2 text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full font-medium align-middle">
                          Custom
                        </span>
                      )}
                    </p>
                    {ex.muscleGroups.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {ex.muscleGroups.join(' · ')}
                        {ex.isCompound && (
                          <span className="ml-1.5 text-emerald-500/80">· compound</span>
                        )}
                      </p>
                    )}
                  </div>
                  {already ? (
                    <span className="text-xs text-muted-foreground shrink-0">Added</span>
                  ) : justAdded ? (
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Custom exercise form OR Done button */}
        {showCreate ? (
          <CustomExerciseForm
            onCreated={(ex) => {
              onSelect(ex.id, ex.name);
              setShowCreate(false);
              setRecentlyAdded((prev) => {
                const next = new Set(prev);
                next.add(ex.id);
                setTimeout(() => {
                  setRecentlyAdded((p) => { const n = new Set(p); n.delete(ex.id); return n; });
                }, 1500);
                return next;
              });
            }}
            onCancel={() => setShowCreate(false)}
          />
        ) : (
          <div className="border-t border-border p-4 shrink-0">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
