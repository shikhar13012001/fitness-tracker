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

  const loggedExercises = await db.loggedExercises
    .where("sessionId")
    .equals(sessionId)
    .toArray();
  if (!loggedExercises.length) return;

  const exercises = await db.exercises.toArray();
  const exerciseMap = new Map(exercises.map((e) => [e.id, e]));

  const dow = new Date(session.date + "T12:00:00").getDay();

  // ── Look up planned day + exercises from normalised tables ────────────────
  const plannedDay = await db.plannedDays
    .where("planId")
    .equals(session.planId)
    .filter((d) => d.dayOfWeek === dow)
    .first();
  if (!plannedDay || plannedDay.type !== "workout" || !plannedDay.id) return;

  const plannedExercises = await db.plannedExercises
    .where("plannedDayId")
    .equals(plannedDay.id)
    .toArray();

  // ── Build a map of most-recent prior logged exercise per exerciseId ──────
  const prevLoggedMap = new Map<string, typeof loggedExercises[0]>();

  const prevSessions = await db.workoutSessions
    .where("date")
    .below(session.date)
    .toArray();
  prevSessions.sort((a, b) => b.date.localeCompare(a.date));

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
    if (prevLoggedMap.size >= loggedExercises.length) break;
  }

  // ── Compute + write suggestions for each planned exercise ─────────────────
  for (const pe of plannedExercises) {
    if (pe.id == null) continue;
    const logged = loggedExercises.find((le) => le.exerciseId === pe.exerciseId);
    if (!logged || logged.loggedSets.length === 0) continue;

    const exercise = exerciseMap.get(pe.exerciseId);
    const isCompound = exercise?.isCompound ?? false;
    const doneSets = logged.loggedSets;

    const allHitTarget =
      doneSets.length >= pe.targetSets &&
      doneSets.every((s) => s.reps >= pe.targetRepMin);

    type SuggestionUpdate = {
      suggestedNextWeight: number | null;
      suggestedNextReps: number | null;
      suggestionType: "progression" | "deload" | null;
    };
    let update: SuggestionUpdate;

    if (allHitTarget) {
      if (isCompound) {
        update = {
          suggestedNextWeight: (pe.targetWeight ?? 0) + 2.5,
          suggestedNextReps: null,
          suggestionType: "progression",
        };
      } else {
        const avgReps =
          doneSets.reduce((s, set) => s + set.reps, 0) / doneSets.length;
        if (avgReps >= pe.targetRepMax) {
          update = {
            suggestedNextWeight: (pe.targetWeight ?? 0) + 1,
            suggestedNextReps: null,
            suggestionType: "progression",
          };
        } else {
          update = {
            suggestedNextWeight: pe.targetWeight,
            suggestedNextReps: pe.targetRepMin + 1,
            suggestionType: "progression",
          };
        }
      }
    } else {
      const prevLogged = prevLoggedMap.get(pe.exerciseId);
      if (prevLogged && prevLogged.loggedSets.length > 0) {
        const prevDoneSets = prevLogged.loggedSets;
        const prevHitTarget =
          prevDoneSets.length >= pe.targetSets &&
          prevDoneSets.every((s) => s.reps >= pe.targetRepMin);
        const currentWeight = doneSets[0]?.weight ?? (pe.targetWeight ?? 0);
        const prevWeight = prevDoneSets[0]?.weight ?? (pe.targetWeight ?? 0);

        if (!prevHitTarget && Math.abs(currentWeight - prevWeight) < 0.01) {
          const deloadWeight = Math.round(currentWeight * 0.9 * 4) / 4;
          update = {
            suggestedNextWeight: deloadWeight,
            suggestedNextReps: null,
            suggestionType: "deload",
          };
        } else {
          update = { suggestedNextWeight: null, suggestedNextReps: null, suggestionType: null };
        }
      } else {
        update = { suggestedNextWeight: null, suggestedNextReps: null, suggestionType: null };
      }
    }

    await db.plannedExercises.update(pe.id, update);
  }
}

// ─── Accept / dismiss suggestion ──────────────────────────────────────────────

export async function acceptSuggestion(
  exerciseId: string,
  planId: string,
  dow: number
): Promise<{ newWeight: number | null; newReps: number | null }> {
  if (!db) return { newWeight: null, newReps: null };

  const plannedDay = await db.plannedDays
    .where("planId")
    .equals(planId)
    .filter((d) => d.dayOfWeek === dow)
    .first();
  if (!plannedDay?.id) return { newWeight: null, newReps: null };

  const pe = await db.plannedExercises
    .where("plannedDayId")
    .equals(plannedDay.id)
    .filter((e) => e.exerciseId === exerciseId)
    .first();
  if (!pe?.id) return { newWeight: null, newReps: null };

  const newWeight = pe.suggestedNextWeight ?? null;
  const newReps = pe.suggestedNextReps ?? null;

  await db.plannedExercises.update(pe.id, {
    targetWeight: pe.suggestedNextWeight ?? pe.targetWeight,
    targetRepMin: pe.suggestedNextReps ?? pe.targetRepMin,
    suggestedNextWeight: null,
    suggestedNextReps: null,
    suggestionType: null,
  });

  return { newWeight, newReps };
}

export async function dismissSuggestion(
  exerciseId: string,
  planId: string,
  dow: number
): Promise<void> {
  if (!db) return;

  const plannedDay = await db.plannedDays
    .where("planId")
    .equals(planId)
    .filter((d) => d.dayOfWeek === dow)
    .first();
  if (!plannedDay?.id) return;

  const pe = await db.plannedExercises
    .where("plannedDayId")
    .equals(plannedDay.id)
    .filter((e) => e.exerciseId === exerciseId)
    .first();
  if (!pe?.id) return;

  await db.plannedExercises.update(pe.id, {
    suggestedNextWeight: null,
    suggestedNextReps: null,
    suggestionType: null,
  });
}
