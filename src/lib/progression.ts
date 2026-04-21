import { db } from "./db";
import type { PRLog } from "./db";

// ─── Epley 1RM formula ────────────────────────────────────────────────────────

export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

// ─── In-memory PR check (called on set toggle — no DB write) ──────────────────

export interface PRCheckResult {
  isMaxWeight: boolean;
  is1RM: boolean;
  isRepsAtWeight: boolean;
}

export function checkPRsInMemory(
  exerciseId: string,
  weight: number,
  reps: number,
  existingPRLogs: PRLog[]
): PRCheckResult {
  if (weight <= 0 || reps <= 0) {
    return { isMaxWeight: false, is1RM: false, isRepsAtWeight: false };
  }

  const exLogs = existingPRLogs.filter((p) => p.exerciseId === exerciseId);

  const maxWeight = exLogs
    .filter((p) => p.type === "max_weight")
    .reduce((m, p) => Math.max(m, p.value), 0);

  const max1RM = exLogs
    .filter((p) => p.type === "1rm")
    .reduce((m, p) => Math.max(m, p.value), 0);

  const maxRepsAtWeight = exLogs
    .filter((p) => p.type === "reps_at_weight" && p.referenceWeight === weight)
    .reduce((m, p) => Math.max(m, p.value), 0);

  return {
    isMaxWeight: weight > maxWeight,
    is1RM: epley1RM(weight, reps) > max1RM,
    isRepsAtWeight: reps > maxRepsAtWeight,
  };
}

// ─── PR recording (DB write) ──────────────────────────────────────────────────

export async function recordPRs(
  exerciseId: string,
  weight: number,
  reps: number,
  prCheck: PRCheckResult
): Promise<void> {
  if (!db) return;
  if (!prCheck.isMaxWeight && !prCheck.is1RM && !prCheck.isRepsAtWeight) return;

  const now = Date.now();
  const toAdd: PRLog[] = [];

  if (prCheck.isMaxWeight) {
    toAdd.push({
      id: crypto.randomUUID(),
      exerciseId,
      type: "max_weight",
      value: weight,
      referenceWeight: weight,
      referenceReps: reps,
      achievedAt: now,
    });
  }

  if (prCheck.is1RM) {
    toAdd.push({
      id: crypto.randomUUID(),
      exerciseId,
      type: "1rm",
      value: epley1RM(weight, reps),
      referenceWeight: weight,
      referenceReps: reps,
      achievedAt: now,
    });
  }

  if (prCheck.isRepsAtWeight) {
    toAdd.push({
      id: crypto.randomUUID(),
      exerciseId,
      type: "reps_at_weight",
      value: reps,
      referenceWeight: weight,
      referenceReps: reps,
      achievedAt: now,
    });
  }

  await db.prLogs.bulkAdd(toAdd);
}

// ─── Post-session progression analysis ───────────────────────────────────────
//
// For each exercise where all target reps were hit:
//   compound → +2.5 kg
//   isolation → +1 rep (until targetRepMax), then +1 kg
// For each exercise that failed target reps 2 sessions in a row at same weight:
//   → deload 10%

export async function analyzeProgressionAfterSession(
  sessionId: string
): Promise<void> {
  if (!db) return;

  const session = await db.workoutSessions.get(sessionId);
  if (!session?.endTime) return;

  const profile = await db.userProfile.get(1);
  if (!profile?.activePlanId) return;

  const plan = await db.workoutPlans.get(profile.activePlanId);
  if (!plan) return;

  const loggedExercises = await db.loggedExercises
    .where("sessionId")
    .equals(sessionId)
    .toArray();

  if (!loggedExercises.length) return;

  const exercises = await db.exercises.toArray();
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const dow = new Date(session.date + "T12:00:00").getDay();
  const plannedDay = plan.days[dow];
  if (!plannedDay || plannedDay.type !== "workout") return;

  // ── Build a map of most-recent prior logged exercise per exerciseId ──────
  const prevLoggedMap = new Map<string, typeof loggedExercises[0]>();

  const prevSessions = await db.workoutSessions
    .where("date")
    .below(session.date)
    .toArray();
  prevSessions.sort((a, b) => b.date.localeCompare(a.date));

  // Walk back through recent sessions to get last-known log for each exercise
  for (const ps of prevSessions.slice(0, 10)) {
    const prevLogs = await db.loggedExercises
      .where("sessionId")
      .equals(ps.id)
      .toArray();
    for (const pl of prevLogs) {
      if (!prevLoggedMap.has(pl.exerciseId) && pl.loggedSets.length > 0) {
        prevLoggedMap.set(pl.exerciseId, pl);
      }
    }
    // Stop early if we have all exercises
    if (prevLoggedMap.size >= loggedExercises.length) break;
  }

  // ── Compute suggestions for each planned exercise ─────────────────────────
  const updatedDays = plan.days.map((day, idx) => {
    if (idx !== dow) return day;

    const updatedExercises = day.plannedExercises.map((pe) => {
      const logged = loggedExercises.find(
        (le) => le.exerciseId === pe.exerciseId
      );
      if (!logged || logged.loggedSets.length === 0) return pe;

      const exercise = exerciseMap.get(pe.exerciseId);
      const isCompound = exercise?.isCompound ?? false;
      const doneSets = logged.loggedSets;

      // Did every done set hit at least the minimum target reps?
      const allHitTarget =
        doneSets.length >= pe.targetSets &&
        doneSets.every((s) => s.reps >= pe.targetRepMin);

      if (allHitTarget) {
        // ── Progression ──────────────────────────────────────────────────
        if (isCompound) {
          return {
            ...pe,
            suggestedNextWeight: (pe.targetWeight ?? 0) + 2.5,
            suggestedNextReps: null as number | null,
            suggestionType: "progression" as const,
          };
        } else {
          // Did all sets also hit the top of the rep range?
          const avgReps =
            doneSets.reduce((s, set) => s + set.reps, 0) / doneSets.length;
          if (avgReps >= pe.targetRepMax) {
            // Hit top of range → bump weight
            return {
              ...pe,
              suggestedNextWeight: (pe.targetWeight ?? 0) + 1,
              suggestedNextReps: null as number | null,
              suggestionType: "progression" as const,
            };
          } else {
            // Not yet at top of range → bump reps
            return {
              ...pe,
              suggestedNextWeight: pe.targetWeight,
              suggestedNextReps: pe.targetRepMin + 1,
              suggestionType: "progression" as const,
            };
          }
        }
      } else {
        // ── Deload check ─────────────────────────────────────────────────
        const prevLogged = prevLoggedMap.get(pe.exerciseId);
        if (prevLogged && prevLogged.loggedSets.length > 0) {
          const prevDoneSets = prevLogged.loggedSets;
          const prevHitTarget =
            prevDoneSets.length >= pe.targetSets &&
            prevDoneSets.every((s) => s.reps >= pe.targetRepMin);

          const currentWeight =
            doneSets[0]?.weight ?? (pe.targetWeight ?? 0);
          const prevWeight =
            prevDoneSets[0]?.weight ?? (pe.targetWeight ?? 0);

          if (!prevHitTarget && Math.abs(currentWeight - prevWeight) < 0.01) {
            // Two consecutive failures at same weight → deload 10%
            const deloadWeight = Math.round(currentWeight * 0.9 * 4) / 4;
            return {
              ...pe,
              suggestedNextWeight: deloadWeight,
              suggestedNextReps: null as number | null,
              suggestionType: "deload" as const,
            };
          }
        }

        // Clear any stale suggestion (this attempt neither progressed nor deloaded)
        return {
          ...pe,
          suggestedNextWeight: null as number | null,
          suggestedNextReps: null as number | null,
          suggestionType: null as "progression" | "deload" | null,
        };
      }
    });

    return { ...day, plannedExercises: updatedExercises };
  });

  await db.workoutPlans.update(plan.id, { days: updatedDays });
}

// ─── Accept / dismiss suggestion ──────────────────────────────────────────────

export async function acceptSuggestion(
  exerciseId: string,
  planId: string,
  dow: number
): Promise<{ newWeight: number | null; newReps: number | null }> {
  if (!db) return { newWeight: null, newReps: null };

  const plan = await db.workoutPlans.get(planId);
  if (!plan) return { newWeight: null, newReps: null };

  let newWeight: number | null = null;
  let newReps: number | null = null;

  const updatedDays = plan.days.map((day, idx) => {
    if (idx !== dow) return day;
    return {
      ...day,
      plannedExercises: day.plannedExercises.map((pe) => {
        if (pe.exerciseId !== exerciseId) return pe;
        newWeight = pe.suggestedNextWeight ?? null;
        newReps = pe.suggestedNextReps ?? null;
        return {
          ...pe,
          targetWeight: pe.suggestedNextWeight ?? pe.targetWeight,
          targetRepMin: pe.suggestedNextReps ?? pe.targetRepMin,
          suggestedNextWeight: null as number | null,
          suggestedNextReps: null as number | null,
          suggestionType: null as "progression" | "deload" | null,
        };
      }),
    };
  });

  await db.workoutPlans.update(planId, { days: updatedDays });
  return { newWeight, newReps };
}

export async function dismissSuggestion(
  exerciseId: string,
  planId: string,
  dow: number
): Promise<void> {
  if (!db) return;

  const plan = await db.workoutPlans.get(planId);
  if (!plan) return;

  const updatedDays = plan.days.map((day, idx) => {
    if (idx !== dow) return day;
    return {
      ...day,
      plannedExercises: day.plannedExercises.map((pe) => {
        if (pe.exerciseId !== exerciseId) return pe;
        return {
          ...pe,
          suggestedNextWeight: null as number | null,
          suggestedNextReps: null as number | null,
          suggestionType: null as "progression" | "deload" | null,
        };
      }),
    };
  });

  await db.workoutPlans.update(planId, { days: updatedDays });
}
