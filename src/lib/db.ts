import Dexie, { type EntityTable } from "dexie";
import { SEED_EXERCISES, SEED_PLAN, SEED_ACTION_ITEMS, SEED_USER_PROFILE } from "./seed";

// ─── Core Types ───────────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  secondaryMuscleGroups: string[];
  equipment: string;
  instructions: string;
  tutorialUrl: string;
  isCustom: boolean;
  isCompound: boolean; // drives +2.5 kg vs +1 rep/kg progression logic
}

export interface WorkoutPlan {
  id: string;
  name: string;
  isActive: boolean;
  createdAt?: number;   // ms timestamp; optional so SEED_PLAN (no createdAt) stays valid
  description?: string;
  /** @deprecated Nested representation kept for backward-compat with existing views.
   *  New code should use the plannedDays / plannedExercises tables.
   *  Always present on seed/migrated plans; new plans created via Plans UI provide []. */
  days: PlannedDay[];
}

export interface PlannedDay {
  dayOfWeek: number; // 0=Sun, 1=Mon, … 6=Sat
  type: "workout" | "rest";
  name: string;
  plannedExercises: PlannedExercise[];
}

export interface PlannedExercise {
  exerciseId: string;
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  targetWeight: number | null; // null until user sets week-1 weight
  order: number;
  restSeconds: number;
  isTimed: boolean; // true for holds like plank (reps = seconds)
  notes: string; // e.g. "per leg", "drop set on final set"
  // Progression / deload suggestions (written by analyzeProgressionAfterSession)
  suggestedNextWeight?: number | null;
  suggestedNextReps?: number | null;
  suggestionType?: "progression" | "deload" | null;
}

// ─── Normalised plan tables ────────────────────────────────────────────────────

export interface PlannedDayRow {
  id?: number;         // Dexie ++id auto-increment
  planId: string;      // FK → WorkoutPlan.id
  dayOfWeek: number;   // 0=Sun … 6=Sat
  type: "workout" | "rest";
  name: string;
  order: number;
}

export interface PlannedExerciseRow {
  id?: number;          // Dexie ++id auto-increment
  plannedDayId: number; // FK → PlannedDayRow.id
  exerciseId: string;   // FK → Exercise.id
  targetSets: number;
  targetRepMin: number;
  targetRepMax: number;
  targetWeight: number | null;
  restSeconds: number;
  order: number;
  isTimed: boolean;
  notes: string;
  suggestedNextWeight?: number | null;
  suggestedNextReps?: number | null;
  suggestionType?: "progression" | "deload" | null;
  previousWeight?: number | null;
}

// ─── Populated / joined plan shape (returned by helpers) ──────────────────────

export interface PopulatedPlannedDay extends PlannedDayRow {
  exercises: PlannedExerciseRow[];
}

export interface PopulatedPlan extends WorkoutPlan {
  plannedDays: PopulatedPlannedDay[];
}

// ─── Session types ────────────────────────────────────────────────────────────

export interface WorkoutSession {
  id: string;
  date: string; // "YYYY-MM-DD"
  planId: string;
  dayName: string;
  startTime: number; // ms timestamp
  endTime: number | null;
  duration: number | null; // seconds
  totalVolume: number | null; // kg × reps summed
  notes: string;
}

export interface LoggedExercise {
  id: string;
  sessionId: string;
  exerciseId: string;
  loggedSets: LoggedSet[];
  notes: string;
  completed: boolean;
}

export interface LoggedSet {
  weight: number;
  reps: number;
  rpe: number | null;
  timestamp: number;
}

export interface ActionItem {
  id: string;
  name: string;
  type: "supplement" | "habit";
  schedule: "daily" | "training_days" | "rest_days";
  suggestedTime: string;
  dose: string;
}

export interface ActionItemLog {
  id: string;
  actionItemId: string;
  date: string; // "YYYY-MM-DD"
  completedAt: number; // ms timestamp
}

export interface ProteinEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  grams: number;
  sourceLabel: string;
  timestamp: number;
}

export interface BodyweightEntry {
  id: string;
  date: string; // "YYYY-MM-DD"
  weight: number; // kg
}

export interface BodyMeasurement {
  id: string;
  date: string;
  chest: number | null;
  waist: number | null;
  leftArm: number | null;
  rightArm: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
}

export interface NotificationPrefs {
  enabled: boolean;           // master switch
  workoutReminders: boolean;  // per-DOW time reminders
  // Per JS getDay() key ("0"=Sun … "6"=Sat) → "HH:MM" 24h local
  workoutTimes: Partial<Record<string, string>>;
  proteinNudge: boolean;      // 8 PM nudge when protein < 80% target
  supplementReminder: boolean;// 9 PM creatine nudge
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  workoutReminders: true,
  workoutTimes: {},
  proteinNudge: true,
  supplementReminder: true,
};

export interface UserProfile {
  id: number; // always 1 — single-user app
  heightCm: number;
  startingWeightKg: number;
  currentWeightKg: number;
  units: "kg" | "lbs";
  theme?: "dark" | "light" | "system"; // UI theme; default "dark"
  proteinTargetG: number;
  activePlanId: string;
  notificationPrefs?: NotificationPrefs;
}

export interface PRLog {
  id: string;
  exerciseId: string;
  type: "max_weight" | "1rm" | "reps_at_weight";
  value: number; // kg for max_weight/1rm, reps for reps_at_weight
  referenceWeight: number; // weight at which PR was set
  referenceReps: number; // reps at which PR was set
  achievedAt: number; // ms timestamp
}

// ─── Database ─────────────────────────────────────────────────────────────────

class FitTrackDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  workoutPlans!: EntityTable<WorkoutPlan, "id">;
  plannedDays!: EntityTable<PlannedDayRow, "id">;
  plannedExercises!: EntityTable<PlannedExerciseRow, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  loggedExercises!: EntityTable<LoggedExercise, "id">;
  actionItems!: EntityTable<ActionItem, "id">;
  actionItemLogs!: EntityTable<ActionItemLog, "id">;
  proteinEntries!: EntityTable<ProteinEntry, "id">;
  bodyweightEntries!: EntityTable<BodyweightEntry, "id">;
  bodyMeasurements!: EntityTable<BodyMeasurement, "id">;
  userProfile!: EntityTable<UserProfile, "id">;
  prLogs!: EntityTable<PRLog, "id">;

  constructor() {
    super("FitTrackDB");

    this.version(1).stores({
      exercises:         "id, name, equipment, isCompound",
      workoutPlans:      "id, isActive",
      workoutSessions:   "id, date, planId",
      loggedExercises:   "id, sessionId, exerciseId",
      actionItems:       "id, schedule",
      actionItemLogs:    "id, actionItemId, date",
      proteinEntries:    "id, date",
      bodyweightEntries: "id, date",
      bodyMeasurements:  "id, date",
      userProfile:       "id",
    });

    // Version 2: add PRLog table
    this.version(2).stores({
      prLogs: "id, exerciseId, type, achievedAt",
    });

    // Version 3: normalised plan tables; migrate embedded days into rows
    this.version(3).stores({
      plannedDays:      "++id, planId, dayOfWeek",
      plannedExercises: "++id, plannedDayId, exerciseId",
    }).upgrade(async (tx) => {
      const plans = await tx.table<WorkoutPlan>("workoutPlans").toArray();
      for (const plan of plans) {
        if (!plan.days?.length) continue;
        for (const day of plan.days) {
          const dayId = await tx.table("plannedDays").add({
            planId:     plan.id,
            dayOfWeek:  day.dayOfWeek,
            type:       day.type,
            name:       day.name,
            order:      day.dayOfWeek,
          });
          for (const ex of day.plannedExercises) {
            await tx.table("plannedExercises").add({
              plannedDayId:       dayId,
              exerciseId:         ex.exerciseId,
              targetSets:         ex.targetSets,
              targetRepMin:       ex.targetRepMin,
              targetRepMax:       ex.targetRepMax,
              targetWeight:       ex.targetWeight,
              restSeconds:        ex.restSeconds,
              order:              ex.order,
              isTimed:            ex.isTimed,
              notes:              ex.notes,
              suggestedNextWeight: ex.suggestedNextWeight ?? null,
              suggestedNextReps:   ex.suggestedNextReps ?? null,
              suggestionType:      ex.suggestionType ?? null,
            });
          }
        }
        // Backfill createdAt; keep days[] intact for backward-compat reads
        await tx.table("workoutPlans").update(plan.id, { createdAt: Date.now() });
      }
    });

    // ── Cascade delete hooks ───────────────────────────────────────────────────

    this.workoutPlans.hook("deleting", (primKey, _obj, trans) => {
      trans
        .table("plannedDays")
        .where("planId")
        .equals(primKey as string)
        .primaryKeys()
        .then((dayIds: number[]) => {
          if (dayIds.length) {
            trans.table("plannedExercises").where("plannedDayId").anyOf(dayIds).delete();
          }
          trans.table("plannedDays").where("planId").equals(primKey as string).delete();
        });
    });

    this.plannedDays.hook("deleting", (primKey, _obj, trans) => {
      trans
        .table("plannedExercises")
        .where("plannedDayId")
        .equals(primKey as number)
        .delete();
    });

    // ── Seed on first open ─────────────────────────────────────────────────────

    this.on("populate", async () => {
      await this.exercises.bulkAdd(SEED_EXERCISES);
      await this.workoutPlans.add(SEED_PLAN);
      await this.actionItems.bulkAdd(SEED_ACTION_ITEMS);
      await this.userProfile.add(SEED_USER_PROFILE);

      // Also populate normalised plan tables from SEED_PLAN.days
      if (SEED_PLAN.days) {
        for (const day of SEED_PLAN.days) {
          const dayId = await this.plannedDays.add({
            planId:    SEED_PLAN.id,
            dayOfWeek: day.dayOfWeek,
            type:      day.type,
            name:      day.name,
            order:     day.dayOfWeek,
          });
          for (const ex of day.plannedExercises) {
            await this.plannedExercises.add({
              plannedDayId:        dayId as number,
              exerciseId:          ex.exerciseId,
              targetSets:          ex.targetSets,
              targetRepMin:        ex.targetRepMin,
              targetRepMax:        ex.targetRepMax,
              targetWeight:        ex.targetWeight,
              restSeconds:         ex.restSeconds,
              order:               ex.order,
              isTimed:             ex.isTimed,
              notes:               ex.notes,
              suggestedNextWeight: null,
              suggestedNextReps:   null,
              suggestionType:      null,
            });
          }
        }
      }
    });
  }
}

// Only instantiate in browser — IndexedDB doesn't exist on the server.
export const db =
  typeof window !== "undefined"
    ? new FitTrackDB()
    : (null as unknown as FitTrackDB);

// ─── Helper functions ─────────────────────────────────────────────────────────

/** Returns the active plan with all its days and exercises fully joined. */
export async function getActivePlan(): Promise<PopulatedPlan | null> {
  const plan = await db.workoutPlans.filter((p) => p.isActive).first();
  if (!plan) return null;

  const days = await db.plannedDays
    .where("planId")
    .equals(plan.id)
    .sortBy("order");

  const populatedDays: PopulatedPlannedDay[] = await Promise.all(
    days.map(async (day) => {
      const exercises = await db.plannedExercises
        .where("plannedDayId")
        .equals(day.id!)
        .sortBy("order");
      return { ...day, exercises };
    })
  );

  return { ...plan, plannedDays: populatedDays };
}

/** Sets the given plan as active, and all others as inactive. Atomic transaction. */
export async function setActivePlan(planId: string): Promise<void> {
  await db.transaction("rw", db.workoutPlans, db.userProfile, async () => {
    const all = await db.workoutPlans.toArray();
    await Promise.all(
      all.map((p) => db.workoutPlans.update(p.id, { isActive: p.id === planId }))
    );
    await db.userProfile.update(1, { activePlanId: planId });
  });
}

/** Deep-copies a plan and all its days/exercises into a new inactive plan. Returns new plan id. */
export async function duplicatePlan(planId: string, newName: string): Promise<string> {
  const source = await getActivePlan().then(() =>
    db.workoutPlans.get(planId)
  );
  if (!source) throw new Error(`Plan ${planId} not found`);

  const sourceDays = await db.plannedDays
    .where("planId")
    .equals(planId)
    .sortBy("order");

  const newPlanId = crypto.randomUUID();

  await db.transaction(
    "rw",
    db.workoutPlans,
    db.plannedDays,
    db.plannedExercises,
    async () => {
      await db.workoutPlans.add({
        id:          newPlanId,
        name:        newName,
        isActive:    false,
        createdAt:   Date.now(),
        description: source.description,
        days:        [], // normalised tables are the source of truth for the copy
      });

      for (const day of sourceDays) {
        const sourceExercises = await db.plannedExercises
          .where("plannedDayId")
          .equals(day.id!)
          .sortBy("order");

        const newDayId = await db.plannedDays.add({
          planId:    newPlanId,
          dayOfWeek: day.dayOfWeek,
          type:      day.type,
          name:      day.name,
          order:     day.order,
        });

        for (const ex of sourceExercises) {
          await db.plannedExercises.add({
            plannedDayId:        newDayId as number,
            exerciseId:          ex.exerciseId,
            targetSets:          ex.targetSets,
            targetRepMin:        ex.targetRepMin,
            targetRepMax:        ex.targetRepMax,
            targetWeight:        ex.targetWeight,
            restSeconds:         ex.restSeconds,
            order:               ex.order,
            isTimed:             ex.isTimed,
            notes:               ex.notes,
            // clear progression suggestions on the copy
            suggestedNextWeight: null,
            suggestedNextReps:   null,
            suggestionType:      null,
            previousWeight:      null,
          });
        }
      }
    }
  );

  return newPlanId;
}

/** Creates a deload copy of a plan: same structure, sets −40% (min 1), weights −10%. */
export async function createDeloadPlan(planId: string, newName: string): Promise<string> {
  const source = await db.workoutPlans.get(planId);
  if (!source) throw new Error(`Plan ${planId} not found`);

  const sourceDays = await db.plannedDays
    .where("planId")
    .equals(planId)
    .sortBy("order");

  const newPlanId = crypto.randomUUID();

  await db.transaction(
    "rw",
    db.workoutPlans,
    db.plannedDays,
    db.plannedExercises,
    async () => {
      await db.workoutPlans.add({
        id:          newPlanId,
        name:        newName,
        isActive:    false,
        createdAt:   Date.now(),
        description: source.description ? `Deload: ${source.description}` : "Deload week",
        days:        [],
      });

      for (const day of sourceDays) {
        const sourceExercises = await db.plannedExercises
          .where("plannedDayId")
          .equals(day.id!)
          .sortBy("order");

        const newDayId = await db.plannedDays.add({
          planId:    newPlanId,
          dayOfWeek: day.dayOfWeek,
          type:      day.type,
          name:      day.name,
          order:     day.order,
        });

        for (const ex of sourceExercises) {
          const deloadSets = Math.max(1, Math.round(ex.targetSets * 0.6));
          const deloadWeight = ex.targetWeight !== null
            ? Math.round(ex.targetWeight * 0.9 * 4) / 4  // round to nearest 0.25 kg
            : null;
          await db.plannedExercises.add({
            plannedDayId:        newDayId as number,
            exerciseId:          ex.exerciseId,
            targetSets:          deloadSets,
            targetRepMin:        ex.targetRepMin,
            targetRepMax:        ex.targetRepMax,
            targetWeight:        deloadWeight,
            restSeconds:         ex.restSeconds,
            order:               ex.order,
            isTimed:             ex.isTimed,
            notes:               ex.notes,
            suggestedNextWeight: null,
            suggestedNextReps:   null,
            suggestionType:      null,
            previousWeight:      null,
          });
        }
      }
    }
  );

  return newPlanId;
}

/** Returns today's PlannedDayRow (with exercises) from the active plan, or null on rest/no plan. */
export async function getTodaysPlannedDay(): Promise<PopulatedPlannedDay | null> {
  const plan = await getActivePlan();
  if (!plan) return null;

  const todayDow = new Date().getDay(); // 0=Sun … 6=Sat
  return plan.plannedDays.find((d) => d.dayOfWeek === todayDow) ?? null;
}
