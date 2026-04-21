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
  days: PlannedDay[]; // always 7 elements, index = JS dayOfWeek (0=Sun … 6=Sat)
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
}

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
  thigh: number | null;
}

export interface UserProfile {
  id: number; // always 1 — single-user app
  heightCm: number;
  startingWeightKg: number;
  currentWeightKg: number;
  units: "kg" | "lbs";
  proteinTargetG: number;
  activePlanId: string;
}

// ─── Database ─────────────────────────────────────────────────────────────────

class FitTrackDB extends Dexie {
  exercises!: EntityTable<Exercise, "id">;
  workoutPlans!: EntityTable<WorkoutPlan, "id">;
  workoutSessions!: EntityTable<WorkoutSession, "id">;
  loggedExercises!: EntityTable<LoggedExercise, "id">;
  actionItems!: EntityTable<ActionItem, "id">;
  actionItemLogs!: EntityTable<ActionItemLog, "id">;
  proteinEntries!: EntityTable<ProteinEntry, "id">;
  bodyweightEntries!: EntityTable<BodyweightEntry, "id">;
  bodyMeasurements!: EntityTable<BodyMeasurement, "id">;
  userProfile!: EntityTable<UserProfile, "id">;

  constructor() {
    super("FitTrackDB");

    this.version(1).stores({
      exercises:       "id, name, equipment, isCompound",
      workoutPlans:    "id, isActive",
      workoutSessions: "id, date, planId",
      loggedExercises: "id, sessionId, exerciseId",
      actionItems:     "id, schedule",
      actionItemLogs:  "id, actionItemId, date",
      proteinEntries:  "id, date",
      bodyweightEntries: "id, date",
      bodyMeasurements:  "id, date",
      userProfile:     "id",
    });

    this.on("populate", async () => {
      await this.exercises.bulkAdd(SEED_EXERCISES);
      await this.workoutPlans.add(SEED_PLAN);
      await this.actionItems.bulkAdd(SEED_ACTION_ITEMS);
      await this.userProfile.add(SEED_USER_PROFILE);
    });
  }
}

// Only instantiate in browser — IndexedDB doesn't exist on the server.
// Client components guard their own rendering with useLiveQuery returning undefined on SSR.
export const db =
  typeof window !== "undefined"
    ? new FitTrackDB()
    : (null as unknown as FitTrackDB);
