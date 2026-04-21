"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Plus,
  X,
  Award,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { db } from "@/lib/db";
import type { LoggedSet, PlannedExercise } from "@/lib/db";
import { kgToDisplay, displayToKg, type Unit } from "@/lib/units";
import { cn } from "@/lib/utils";
import { useRestTimer } from "@/context/RestTimerContext";
import {
  checkPRsInMemory,
  recordPRs,
  analyzeProgressionAfterSession,
  acceptSuggestion,
  dismissSuggestion,
} from "@/lib/progression";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface SetDraft {
  weight: string;
  reps: string;
  done: boolean;
}

type SetsMap = Record<string, SetDraft[]>; // loggedExerciseId → drafts

// ─── Utilities ─────────────────────────────────────────────────────────────────

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Session Timer Hook ─────────────────────────────────────────────────────────

function useSessionTimer(startTime: number | undefined) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) return;
    setElapsed(Math.floor((Date.now() - startTime) / 1000));
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);
  return elapsed;
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function SetRow({
  index,
  set,
  canRemove,
  onWeightChange,
  onRepsChange,
  onToggle,
  onRemove,
  isPR,
  isNewPR,
}: {
  index: number;
  set: SetDraft;
  canRemove: boolean;
  onWeightChange: (v: string) => void;
  onRepsChange: (v: string) => void;
  onToggle: () => void;
  onRemove: () => void;
  isPR?: boolean;
  isNewPR?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-2 items-center px-2 py-2 rounded-xl transition-colors duration-700",
        "grid-cols-[1.5rem_1fr_1fr_2.5rem_1.75rem]",
        isNewPR
          ? "bg-amber-500/25 border border-amber-500/50"
          : isPR
          ? "bg-amber-500/10 border border-amber-500/30"
          : set.done
          ? "bg-green-500/10"
          : "bg-card border border-border"
      )}
    >
      {/* Set number / PR icon */}
      <span
        className={cn(
          "text-xs font-mono text-center font-semibold",
          isPR ? "text-amber-400" : set.done ? "text-green-400" : "text-muted-foreground"
        )}
      >
        {isPR ? "🏆" : index + 1}
      </span>

      {/* Weight */}
      <input
        type="number"
        inputMode="decimal"
        value={set.weight}
        onChange={(e) => onWeightChange(e.target.value)}
        disabled={set.done}
        placeholder="0"
        className="w-full text-center text-sm font-semibold rounded-lg border border-input bg-background py-2.5 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 tabular-nums"
      />

      {/* Reps */}
      <input
        type="number"
        inputMode="numeric"
        value={set.reps}
        onChange={(e) => onRepsChange(e.target.value)}
        disabled={set.done}
        placeholder="0"
        className="w-full text-center text-sm font-semibold rounded-lg border border-input bg-background py-2.5 focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 tabular-nums"
      />

      {/* Check */}
      <button
        onClick={onToggle}
        className={cn(
          "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
          set.done && isPR
            ? "bg-amber-500 text-white"
            : set.done
            ? "bg-green-500 text-white"
            : "bg-muted text-muted-foreground hover:bg-green-500/20 hover:text-green-400 active:bg-green-500/30"
        )}
      >
        {set.done && isPR ? (
          <Award className="h-4 w-4" />
        ) : (
          <Check className="h-4 w-4" />
        )}
      </button>

      {/* Remove */}
      {canRemove && !set.done ? (
        <button
          onClick={onRemove}
          className="h-7 w-7 rounded-lg flex items-center justify-center text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}

// ─── Progression Suggestion Bar ────────────────────────────────────────────────

function ProgressionSuggestionBar({
  planned,
  unit,
  onAccept,
  onDismiss,
}: {
  planned: PlannedExercise;
  unit: Unit;
  onAccept: () => void;
  onDismiss: () => void;
}) {
  if (!planned.suggestionType) return null;

  const isDeload = planned.suggestionType === "deload";
  const hasWeightSuggestion =
    planned.suggestedNextWeight !== null &&
    planned.suggestedNextWeight !== undefined;
  const hasRepSuggestion =
    planned.suggestedNextReps !== null &&
    planned.suggestedNextReps !== undefined;

  const dw = (kg: number | null | undefined) =>
    kg != null ? kgToDisplay(kg, unit).toFixed(1) : "?";

  const label = isDeload
    ? `Deload → ${dw(planned.suggestedNextWeight)} ${unit} (was ${dw(planned.targetWeight)} ${unit})`
    : hasRepSuggestion
    ? `Suggested: ${planned.suggestedNextReps} reps (was ${planned.targetRepMin})`
    : hasWeightSuggestion
    ? `Suggested: ${dw(planned.suggestedNextWeight)} ${unit} (was ${dw(planned.targetWeight)} ${unit})`
    : null;

  if (!label) return null;

  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 rounded-xl px-3 py-2",
        isDeload
          ? "bg-yellow-500/10 border border-yellow-500/20"
          : "bg-green-500/10 border border-green-500/20"
      )}
    >
      {isDeload ? (
        <AlertTriangle className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
      ) : (
        <TrendingUp className="h-3.5 w-3.5 text-green-400 shrink-0" />
      )}
      <span
        className={cn(
          "flex-1 text-xs font-medium",
          isDeload ? "text-yellow-300" : "text-green-300"
        )}
      >
        {label}
      </span>
      <button
        onClick={onAccept}
        className={cn(
          "text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
          isDeload
            ? "bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 active:bg-yellow-500/40"
            : "bg-green-500/20 text-green-300 hover:bg-green-500/30 active:bg-green-500/40"
        )}
      >
        Accept
      </button>
      <button
        onClick={onDismiss}
        className="text-xs text-muted-foreground hover:text-foreground px-1.5 py-1 rounded-lg hover:bg-muted transition-colors"
      >
        Dismiss
      </button>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-card border border-border p-4">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xl font-bold text-foreground tabular-nums leading-tight text-center">
        {value}
      </span>
    </div>
  );
}

function SummaryScreen({
  summary,
  unit,
  onDone,
}: {
  summary: { duration: number; totalVolume: number; exercisesDone: number; prCount: number };
  unit: Unit;
  onDone: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center px-6 gap-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center">
          <Trophy className="h-12 w-12 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Workout Done!</h1>
        {summary.prCount > 0 ? (
          <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-full px-3 py-1">
            <Award className="h-4 w-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">
              {summary.prCount} new PR{summary.prCount > 1 ? "s" : ""} this session!
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground max-w-[26ch]">
            Excellent work. Your session has been saved.
          </p>
        )}
      </div>

      <div className="w-full grid grid-cols-3 gap-3">
        <StatCard label="Time" value={formatTime(summary.duration)} />
        <StatCard
          label="Volume"
          value={`${Math.round(kgToDisplay(summary.totalVolume, unit)).toLocaleString()} ${unit}`}
        />
        <StatCard label="Exercises" value={String(summary.exercisesDone)} />
      </div>

      <button
        onClick={onDone}
        className="w-full py-4 rounded-xl bg-primary text-primary-foreground text-base font-semibold hover:bg-primary/90 active:bg-primary/80 transition-colors"
      >
        Back to Today
      </button>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function WorkoutSessionView({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  // ── Dexie data ────────────────────────────────────────────────────────────────
  const session = useLiveQuery(
    () => db.workoutSessions.get(sessionId),
    [sessionId]
  );
  const loggedExercises = useLiveQuery(
    () =>
      db.loggedExercises.where("sessionId").equals(sessionId).toArray(),
    [sessionId]
  );
  const profile = useLiveQuery(() => db.userProfile.get(1));
  const unit: Unit = (profile?.units ?? "kg") as Unit;
  const activePlan = useLiveQuery(
    () =>
      profile?.activePlanId
        ? db.workoutPlans.get(profile.activePlanId)
        : undefined,
    [profile?.activePlanId]
  );
  const allExercises = useLiveQuery(() => db.exercises.toArray());

  // ── Local state ───────────────────────────────────────────────────────────────
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setsMap, setSetsMap] = useState<SetsMap>({});
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<{
    duration: number;
    totalVolume: number;
    exercisesDone: number;
    prCount: number;
  } | null>(null);

  // PR tracking
  const [prSetKeys, setPrSetKeys] = useState<Set<string>>(new Set());
  const [newPRFlashKeys, setNewPRFlashKeys] = useState<Set<string>>(new Set());
  const [prExerciseIds, setPrExerciseIds] = useState<Set<string>>(new Set());
  const [prToastExercise, setPrToastExercise] = useState<string | null>(null);

  // Swipe
  const touchStartX = useRef<number | null>(null);

  // ── Timers ────────────────────────────────────────────────────────────────────
  const elapsed = useSessionTimer(session?.startTime);
  const restTimer = useRestTimer();

  // ── Derived: ordered pairs of (loggedExercise, plannedExercise, exercise) ────
  const exerciseMap = useMemo(
    () => new Map((allExercises ?? []).map((e) => [e.id, e])),
    [allExercises]
  );

  // Day-of-week for the session date (used for accept/dismiss suggestion)
  const sessionDow = useMemo(() => {
    if (!session) return 0;
    return new Date(session.date + "T12:00:00").getDay();
  }, [session]);

  const plannedDay = useMemo(() => {
    if (!activePlan || !session) return null;
    // Parse date as local noon to avoid DST edge cases
    const dow = new Date(session.date + "T12:00:00").getDay();
    return activePlan.days[dow];
  }, [activePlan, session]);

  const orderedPairs = useMemo(() => {
    if (!loggedExercises || !plannedDay) return [];
    const planMap = new Map<string, PlannedExercise>(
      plannedDay.plannedExercises.map((pe) => [pe.exerciseId, pe])
    );
    return loggedExercises
      .map((le) => ({
        logged: le,
        planned: planMap.get(le.exerciseId) ?? null,
        exercise: exerciseMap.get(le.exerciseId),
      }))
      .sort((a, b) => (a.planned?.order ?? 0) - (b.planned?.order ?? 0));
  }, [loggedExercises, plannedDay, exerciseMap]);

  // Exercise IDs in this session — declared after orderedPairs
  const exerciseIdsInSession = useMemo(
    () => orderedPairs.map((p) => p.logged.exerciseId),
    [orderedPairs]
  );

  // Existing PR logs for exercises in this session
  const prLogs = useLiveQuery<import("@/lib/db").PRLog[]>(
    () =>
      exerciseIdsInSession.length > 0
        ? db.prLogs.where("exerciseId").anyOf(exerciseIdsInSession).toArray()
        : Promise.resolve([] as import("@/lib/db").PRLog[]),
    [exerciseIdsInSession]
  );

  // ── Initialise set drafts when exercise data first loads ────────────────────
  useEffect(() => {
    if (!orderedPairs.length) return;
    setSetsMap((prev) => {
      const next = { ...prev };
      for (const { logged, planned } of orderedPairs) {
        if (!next[logged.id]) {
          const count = planned?.targetSets ?? 3;
          const rawKg = planned?.targetWeight ?? 0;
          const defaultWeight = String(rawKg > 0 ? kgToDisplay(rawKg, unit).toFixed(1) : 0);
          const defaultReps = String(planned?.targetRepMin ?? 8);
          next[logged.id] = Array.from({ length: count }, () => ({
            weight: defaultWeight,
            reps: defaultReps,
            done: false,
          }));
        }
      }
      return next;
    });
  }, [orderedPairs, unit]);

  // ── All-done check ──────────────────────────────────────────────────────────
  const allDone = useMemo(() => {
    if (!orderedPairs.length) return false;
    return orderedPairs.every(({ logged }) => {
      const sets = setsMap[logged.id] ?? [];
      return sets.length > 0 && sets.every((s) => s.done);
    });
  }, [orderedPairs, setsMap]);

  // ── Swipe handlers ──────────────────────────────────────────────────────────
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0 && exerciseIndex < orderedPairs.length - 1)
      setExerciseIndex((i) => i + 1);
    if (dx > 0 && exerciseIndex > 0)
      setExerciseIndex((i) => i - 1);
  }

  // ── Set CRUD ────────────────────────────────────────────────────────────────
  function updateSet(
    leId: string,
    setIdx: number,
    field: "weight" | "reps",
    value: string
  ) {
    setSetsMap((prev) => {
      const sets = [...(prev[leId] ?? [])];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      return { ...prev, [leId]: sets };
    });
  }

  async function toggleSet(
    leId: string,
    setIdx: number,
    restSeconds: number,
    exerciseId: string
  ) {
    const sets = setsMap[leId] ?? [];
    const wasAlreadyDone = sets[setIdx]?.done ?? false;

    setSetsMap((prev) => {
      const s = [...(prev[leId] ?? [])];
      s[setIdx] = { ...s[setIdx], done: !s[setIdx].done };
      return { ...prev, [leId]: s };
    });

    if (!wasAlreadyDone) {
      // Set is being marked done
      restTimer.start(restSeconds);

      const set = sets[setIdx];
      const weight = displayToKg(parseFloat(set.weight) || 0, unit);
      const reps = parseInt(set.reps) || 0;

      if (prLogs !== undefined && weight > 0 && reps > 0) {
        const prCheck = checkPRsInMemory(exerciseId, weight, reps, prLogs);
        const isAnyPR =
          prCheck.isMaxWeight || prCheck.is1RM || prCheck.isRepsAtWeight;

        if (isAnyPR) {
          const key = `${leId}-${setIdx}`;
          setPrSetKeys((prev) => new Set(Array.from(prev).concat(key)));
          setNewPRFlashKeys((prev) => new Set(Array.from(prev).concat(key)));
          setPrExerciseIds((prev) => new Set(Array.from(prev).concat(exerciseId)));

          // Get exercise name for toast
          const exName =
            exerciseMap.get(exerciseId)?.name ?? "exercise";
          setPrToastExercise(exName);

          // Auto-clear flash and toast
          setTimeout(() => {
            setNewPRFlashKeys((prev) => {
              const next = new Set(prev);
              next.delete(key);
              return next;
            });
          }, 2500);
          setTimeout(() => setPrToastExercise(null), 3000);

          // Persist to DB
          await recordPRs(exerciseId, weight, reps, prCheck);
        }
      }
    }
  }

  function addSet(leId: string, planned: PlannedExercise | null) {
    setSetsMap((prev) => {
      const sets = prev[leId] ?? [];
      const last = sets[sets.length - 1];
      const rawKg = planned?.targetWeight ?? 0;
      const fallback = String(rawKg > 0 ? kgToDisplay(rawKg, unit).toFixed(1) : 0);
      return {
        ...prev,
        [leId]: [
          ...sets,
          {
            weight: last?.weight ?? fallback,
            reps: last?.reps ?? String(planned?.targetRepMin ?? 8),
            done: false,
          },
        ],
      };
    });
  }

  function removeSet(leId: string, setIdx: number) {
    setSetsMap((prev) => {
      const sets = [...(prev[leId] ?? [])];
      sets.splice(setIdx, 1);
      return { ...prev, [leId]: sets };
    });
  }

  // ── Accept / dismiss progression suggestion ─────────────────────────────────
  async function handleAcceptSuggestion(exerciseId: string) {
    if (!activePlan) return;
    const result = await acceptSuggestion(exerciseId, activePlan.id, sessionDow);
    // Pre-fill draft weights with new value for not-yet-done sets
    if (result.newWeight !== null) {
      const leId = orderedPairs.find(
        (p) => p.logged.exerciseId === exerciseId
      )?.logged.id;
      if (leId) {
        setSetsMap((prev) => ({
          ...prev,
          [leId]: (prev[leId] ?? []).map((s) =>
            s.done ? s : { ...s, weight: String(result.newWeight) }
          ),
        }));
      }
    }
  }

  async function handleDismissSuggestion(exerciseId: string) {
    if (!activePlan) return;
    await dismissSuggestion(exerciseId, activePlan.id, sessionDow);
  }

  // ── Finish workout ──────────────────────────────────────────────────────────
  async function handleFinish() {
    if (!session) return;

    restTimer.stop();

    const endTime = Date.now();
    const duration = Math.round((endTime - session.startTime) / 1000);
    let totalVolume = 0;

    type UpdateEntry = { id: string; loggedSets: LoggedSet[]; completed: boolean };
    const updates: UpdateEntry[] = [];

    for (const { logged } of orderedPairs) {
      const drafts = setsMap[logged.id] ?? [];
      const loggedSets: LoggedSet[] = drafts
        .filter((s) => s.done)
        .map((s) => ({
          weight: displayToKg(parseFloat(s.weight) || 0, unit),
          reps: parseInt(s.reps) || 0,
          rpe: null,
          timestamp: Date.now(),
        }));

      loggedSets.forEach((s) => {
        totalVolume += s.weight * s.reps;
      });

      updates.push({
        id: logged.id,
        loggedSets,
        completed: loggedSets.length > 0,
      });
    }

    await db.transaction(
      "rw",
      [db.workoutSessions, db.loggedExercises],
      async () => {
        await db.workoutSessions.update(session.id, {
          endTime,
          duration,
          totalVolume,
        });
        await Promise.all(
          updates.map(({ id, loggedSets, completed }) =>
            db.loggedExercises.update(id, { loggedSets, completed })
          )
        );
      }
    );

    // Analyze progression and deload suggestions
    try {
      await analyzeProgressionAfterSession(session.id);
    } catch (e) {
      console.error("Progression analysis failed", e);
    }

    const exercisesDone = updates.filter((u) => u.completed).length;
    setSummary({ duration, totalVolume, exercisesDone, prCount: prExerciseIds.size });
    setFinished(true);
  }

  // ── Loading state ────────────────────────────────────────────────────────────
  const loading =
    session === undefined ||
    loggedExercises === undefined ||
    profile === undefined ||
    activePlan === undefined ||
    allExercises === undefined ||
    orderedPairs.length === 0;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Summary screen ────────────────────────────────────────────────────────────
  if (finished && summary) {
    return (
      <SummaryScreen
        summary={summary}
        unit={unit}
        onDone={() => router.replace("/today")}
      />
    );
  }

  const current = orderedPairs[Math.min(exerciseIndex, orderedPairs.length - 1)];
  const currentSets = setsMap[current.logged.id] ?? [];
  const exerciseName = current.exercise?.name ?? current.logged.exerciseId;
  const muscleGroup = current.exercise?.muscleGroups[0];
  const restSeconds = current.planned?.restSeconds ?? 90;
  const doneSetsCount = currentSets.filter((s) => s.done).length;

  return (
    <>
      {/* Full-screen overlay — sits above the BottomNav */}
      <div className="fixed inset-0 z-[60] bg-background flex flex-col">
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground p-1 -ml-1 transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex flex-col items-center">
            <span className="text-2xl font-mono font-bold tabular-nums text-foreground leading-none">
              {formatTime(elapsed)}
            </span>
            <span className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
              {session?.dayName}
            </span>
          </div>

          {/* Spacer to keep timer centred */}
          <div className="w-8" />
        </div>

        {/* ── Exercise area ── */}
        <div
          className="flex-1 flex flex-col overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* PR toast */}
          {prToastExercise && (
            <div className="mx-4 mt-2 px-3 py-2 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="text-xs font-semibold text-amber-300">
                🏆 New PR — {prToastExercise}!
              </span>
            </div>
          )}

          {/* Exercise header */}
          <div className="px-4 pt-4 pb-3 shrink-0">
            {/* Dot indicators */}
            <div className="flex items-center gap-1.5 mb-3">
              {orderedPairs.map((pair, i) => {
                const pairSets = setsMap[pair.logged.id] ?? [];
                const pairDone =
                  pairSets.length > 0 && pairSets.every((s) => s.done);
                return (
                  <button
                    key={i}
                    onClick={() => setExerciseIndex(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === exerciseIndex
                        ? "bg-primary w-6"
                        : pairDone
                        ? "bg-green-500 w-3"
                        : "bg-muted w-3"
                    )}
                  />
                );
              })}
            </div>

            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-foreground leading-tight">
                  {exerciseName}
                </h2>
                {muscleGroup && (
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {muscleGroup}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-sm font-semibold text-muted-foreground tabular-nums mt-0.5">
                {exerciseIndex + 1} / {orderedPairs.length}
              </span>
            </div>

            {/* Target badges + suggestion */}
            {current.planned && (
              <>
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <span className="text-xs bg-primary/10 text-primary rounded-full px-2.5 py-0.5 font-medium">
                    {current.planned.targetSets} sets
                  </span>
                  <span className="text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
                    {current.planned.isTimed
                      ? `${current.planned.targetRepMin}s`
                      : `${current.planned.targetRepMin}–${current.planned.targetRepMax} reps`}
                  </span>
                  {current.planned.targetWeight !== null && (
                    <span className="text-xs bg-muted text-muted-foreground rounded-full px-2.5 py-0.5">
                      {kgToDisplay(current.planned.targetWeight, unit).toFixed(1)} {unit}
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-xs rounded-full px-2.5 py-0.5 font-medium ml-auto",
                      doneSetsCount >= (current.planned?.targetSets ?? 0)
                        ? "bg-green-500/10 text-green-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {doneSetsCount}/{current.planned.targetSets} done
                  </span>
                </div>

                {/* Progression / deload suggestion */}
                {current.planned.suggestionType && (
                  <ProgressionSuggestionBar
                    planned={current.planned}
                    unit={unit}
                    onAccept={() =>
                      handleAcceptSuggestion(current.logged.exerciseId)
                    }
                    onDismiss={() =>
                      handleDismissSuggestion(current.logged.exerciseId)
                    }
                  />
                )}
              </>
            )}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[1.5rem_1fr_1fr_2.5rem_1.75rem] gap-2 px-5 pb-1.5 shrink-0">
            <span className="text-[11px] text-muted-foreground text-center">#</span>
            <span className="text-[11px] text-muted-foreground text-center">{unit}</span>
            <span className="text-[11px] text-muted-foreground text-center">reps</span>
            <span />
            <span />
          </div>

          {/* Scrollable sets list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className="space-y-2">
              {currentSets.map((set, i) => (
                <SetRow
                  key={i}
                  index={i}
                  set={set}
                  canRemove={currentSets.length > 1}
                  onWeightChange={(v) =>
                    updateSet(current.logged.id, i, "weight", v)
                  }
                  onRepsChange={(v) =>
                    updateSet(current.logged.id, i, "reps", v)
                  }
                  onToggle={() => {
                    void toggleSet(
                      current.logged.id,
                      i,
                      restSeconds,
                      current.logged.exerciseId
                    );
                  }}
                  onRemove={() => removeSet(current.logged.id, i)}
                  isPR={prSetKeys.has(`${current.logged.id}-${i}`)}
                  isNewPR={newPRFlashKeys.has(`${current.logged.id}-${i}`)}
                />
              ))}

              <button
                onClick={() => addSet(current.logged.id, current.planned)}
                className="w-full py-2.5 mt-1 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 active:bg-muted/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Set
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer nav ── */}
          <div className="px-4 pb-[calc(4rem+env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 border-t border-border shrink-0 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => setExerciseIndex((i) => Math.max(0, i - 1))}
              disabled={exerciseIndex === 0}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-muted text-foreground text-sm font-medium disabled:opacity-30 transition-opacity active:bg-muted/70"
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </button>
            <button
              onClick={() =>
                setExerciseIndex((i) =>
                  Math.min(orderedPairs.length - 1, i + 1)
                )
              }
              disabled={exerciseIndex === orderedPairs.length - 1}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-muted text-foreground text-sm font-medium disabled:opacity-30 transition-opacity active:bg-muted/70"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {allDone ? (
            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-green-500 hover:bg-green-400 active:bg-green-600 text-white text-base font-semibold transition-colors"
            >
              <Trophy className="h-5 w-5" />
              Finish Workout
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-500/60 text-red-400 text-sm font-medium hover:bg-red-500/10 active:bg-red-500/15 transition-colors"
            >
              End Workout
            </button>
          )}
        </div>
      </div>

    </>
  );
}
