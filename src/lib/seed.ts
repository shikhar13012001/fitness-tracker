import type { Exercise, WorkoutPlan, ActionItem, UserProfile } from "./db";

export const PLAN_ID = "plan-aesthetic-lean-bulk";

// ─── Exercise Library ─────────────────────────────────────────────────────────
// Covers every exercise in the default plan + common alternatives per §6.4.
// tutorial URLs are left empty — fill in real video links before shipping.

export const SEED_EXERCISES: Exercise[] = [
  // ── PUSH ──────────────────────────────────────────────────────────────────

  {
    id: "barbell-bench-press",
    name: "Barbell Bench Press",
    muscleGroups: ["Chest"],
    secondaryMuscleGroups: ["Shoulders", "Triceps"],
    equipment: "Barbell",
    instructions:
      "Lie on a flat bench with feet flat on the floor and grip the bar just outside shoulder width. Lower the bar under control to mid-chest, then press to full extension without bouncing off the chest.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "incline-db-press",
    name: "Incline Dumbbell Press",
    muscleGroups: ["Upper Chest"],
    secondaryMuscleGroups: ["Shoulders", "Triceps"],
    equipment: "Dumbbell",
    instructions:
      "Set the bench to 30–45°, hold dumbbells at chest level with palms forward. Press to full extension, then lower slowly until you feel a stretch in the upper chest.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "cable-chest-fly",
    name: "Cable Chest Fly",
    muscleGroups: ["Chest"],
    secondaryMuscleGroups: ["Shoulders"],
    equipment: "Cable",
    instructions:
      "Stand between cable stations with handles set at chest height, step forward into a staggered stance. Bring both arms together in a wide arc, squeezing the chest hard at the midpoint, then return under control.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "seated-db-shoulder-press",
    name: "Seated Dumbbell Shoulder Press",
    muscleGroups: ["Shoulders"],
    secondaryMuscleGroups: ["Triceps", "Upper Chest"],
    equipment: "Dumbbell",
    instructions:
      "Sit upright with back supported, hold dumbbells at shoulder height with palms facing forward. Press overhead to full extension, then lower with control back to shoulder level.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "lateral-raises",
    name: "Lateral Raises",
    muscleGroups: ["Side Delts"],
    secondaryMuscleGroups: ["Traps"],
    equipment: "Dumbbell",
    instructions:
      "Stand holding light dumbbells at your sides with a slight elbow bend. Raise both arms out to shoulder height, pause briefly, then lower slowly — do not shrug or use momentum.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "tricep-rope-pushdown",
    name: "Tricep Rope Pushdown",
    muscleGroups: ["Triceps"],
    secondaryMuscleGroups: [],
    equipment: "Cable",
    instructions:
      "Stand at a high cable pulley with a rope attachment, grip both ends and push down until arms are fully extended, flaring the rope ends apart at the bottom. Keep elbows pinned at your sides throughout.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "overhead-tricep-extension",
    name: "Overhead Tricep Extension",
    muscleGroups: ["Triceps"],
    secondaryMuscleGroups: [],
    equipment: "Dumbbell",
    instructions:
      "Hold one dumbbell with both hands overhead, lower it behind your head by bending the elbows to 90°, then press back to full extension. Keep upper arms vertical and close to your ears.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },

  // ── PULL ──────────────────────────────────────────────────────────────────

  {
    id: "lat-pulldown",
    name: "Lat Pulldown",
    muscleGroups: ["Lats"],
    secondaryMuscleGroups: ["Biceps", "Rear Delts"],
    equipment: "Cable",
    instructions:
      "Sit with thighs secured under the pad and grip the bar slightly wider than shoulder width with an overhand grip. Pull the bar to your upper chest by driving your elbows down, then return under control to full arm extension.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "pull-ups",
    name: "Pull-Ups",
    muscleGroups: ["Lats"],
    secondaryMuscleGroups: ["Biceps", "Rear Delts"],
    equipment: "Bodyweight",
    instructions:
      "Hang from a bar with an overhand grip slightly wider than shoulder width. Pull your chest to the bar by driving your elbows down, then lower under control to full hang — do not kip.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    muscleGroups: ["Lats", "Rhomboids"],
    secondaryMuscleGroups: ["Biceps", "Rear Delts", "Lower Back"],
    equipment: "Barbell",
    instructions:
      "Hinge at the hips with knees slightly bent and a flat back, grip the bar about shoulder width. Pull the bar to your lower abdomen by driving the elbows back, squeeze the shoulder blades, then lower to full extension.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "seated-cable-row",
    name: "Seated Cable Row",
    muscleGroups: ["Lats", "Rhomboids"],
    secondaryMuscleGroups: ["Biceps", "Rear Delts"],
    equipment: "Cable",
    instructions:
      "Sit with feet on the platform and knees slightly bent, hold the handle with a neutral grip. Row to your lower abdomen keeping your torso upright, squeeze the shoulder blades at the end of each rep, then return to full arm extension.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "face-pulls",
    name: "Face Pulls",
    muscleGroups: ["Rear Delts"],
    secondaryMuscleGroups: ["Rotator Cuff", "Traps"],
    equipment: "Cable",
    instructions:
      "Set a cable at face height with a rope attachment, grip both ends with an overhand grip. Pull toward your forehead by driving elbows out and back at shoulder height — hold briefly at peak contraction, then return slowly.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "ez-bar-curl",
    name: "EZ Bar Curl",
    muscleGroups: ["Biceps"],
    secondaryMuscleGroups: ["Brachialis"],
    equipment: "EZ Bar",
    instructions:
      "Stand holding an EZ bar on the angled inner grips, curl toward your chin while keeping elbows pinned at your sides. Lower under control to full extension — do not swing.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "hammer-curl",
    name: "Hammer Curl",
    muscleGroups: ["Brachialis"],
    secondaryMuscleGroups: ["Biceps", "Forearms"],
    equipment: "Dumbbell",
    instructions:
      "Hold dumbbells at your sides with palms facing inward. Curl both (or alternating) dumbbells while maintaining the neutral hammer grip throughout, then lower slowly to the start.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },

  // ── LEGS ──────────────────────────────────────────────────────────────────

  {
    id: "back-squat",
    name: "Back Squat",
    muscleGroups: ["Quads", "Glutes"],
    secondaryMuscleGroups: ["Hamstrings", "Core", "Lower Back"],
    equipment: "Barbell",
    instructions:
      "Position the barbell across your upper traps, feet shoulder-width apart with toes slightly out. Squat to at least parallel by pushing your knees out over your toes, then drive through your heels to stand — keep chest up throughout.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "romanian-deadlift",
    name: "Romanian Deadlift",
    muscleGroups: ["Hamstrings", "Glutes"],
    secondaryMuscleGroups: ["Lower Back", "Glutes"],
    equipment: "Barbell",
    instructions:
      "Hold a barbell at hip height with a flat back, hinge at the hips pushing them back until you feel a strong hamstring stretch — usually just below the knee. Drive the hips forward to return, keeping the bar close to your legs.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "leg-press",
    name: "Leg Press",
    muscleGroups: ["Quads", "Glutes"],
    secondaryMuscleGroups: ["Hamstrings"],
    equipment: "Machine",
    instructions:
      "Sit in the machine with feet hip-width apart on the platform, lower the sled until your knees reach 90° without letting your lower back round. Press back to near-full extension without locking out.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "leg-curl",
    name: "Leg Curl",
    muscleGroups: ["Hamstrings"],
    secondaryMuscleGroups: ["Calves"],
    equipment: "Machine",
    instructions:
      "Lie face down with the pad resting just above your heels, curl your legs toward your glutes under control. Hold briefly at the top, then lower slowly — do not let the weight drop.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "walking-lunges",
    name: "Walking Lunges",
    muscleGroups: ["Quads", "Glutes"],
    secondaryMuscleGroups: ["Hamstrings", "Core"],
    equipment: "Bodyweight",
    instructions:
      "Step forward into a lunge, lowering the rear knee toward the floor while keeping the torso upright. Push off the front heel to bring the rear foot forward, stepping into the next lunge — 10 reps per leg.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "standing-calf-raise",
    name: "Standing Calf Raise",
    muscleGroups: ["Calves"],
    secondaryMuscleGroups: [],
    equipment: "Machine",
    instructions:
      "Stand with the balls of your feet on the edge of the platform, rise onto your toes as high as possible and hold for a beat. Lower your heels below the platform level for a full stretch at the bottom.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },

  // ── UPPER AESTHETIC ───────────────────────────────────────────────────────

  {
    id: "arnold-press",
    name: "Arnold Press",
    muscleGroups: ["Shoulders"],
    secondaryMuscleGroups: ["Triceps"],
    equipment: "Dumbbell",
    instructions:
      "Start with dumbbells at shoulder height and palms facing you, rotate your palms outward as you press overhead to full extension. Reverse the rotation on the way down back to the start position.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "rear-delt-fly",
    name: "Rear Delt Fly",
    muscleGroups: ["Rear Delts"],
    secondaryMuscleGroups: ["Rhomboids", "Traps"],
    equipment: "Dumbbell",
    instructions:
      "Hinge forward at the hips holding light dumbbells, raise both arms out to your sides until they're roughly parallel to the floor. Squeeze the rear delts at the top, then lower with control — use light weight and avoid shrugging.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "incline-db-curl",
    name: "Incline Dumbbell Curl",
    muscleGroups: ["Biceps"],
    secondaryMuscleGroups: [],
    equipment: "Dumbbell",
    instructions:
      "Sit on a 45–60° incline bench with dumbbells hanging at full arm extension, curl them by contracting the biceps without swinging or raising your shoulders. The incline creates a long-head stretch at the bottom.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "preacher-curl",
    name: "Preacher Curl",
    muscleGroups: ["Biceps"],
    secondaryMuscleGroups: [],
    equipment: "EZ Bar",
    instructions:
      "Drape your upper arms over the preacher pad with an underhand grip on the EZ bar, curl to full contraction squeezing hard at the top. Lower to full extension — do not bounce or use momentum at the bottom.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "skull-crushers",
    name: "Skull Crushers",
    muscleGroups: ["Triceps"],
    secondaryMuscleGroups: [],
    equipment: "Barbell",
    instructions:
      "Lie on a flat bench holding an EZ bar or barbell directly over your chest with arms extended. Lower the bar toward your forehead by bending only at the elbows, then press back to full extension.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },

  // ── LOWER + CORE ──────────────────────────────────────────────────────────

  {
    id: "deadlift",
    name: "Deadlift",
    muscleGroups: ["Hamstrings", "Glutes", "Lower Back"],
    secondaryMuscleGroups: ["Lats", "Traps", "Quads", "Core"],
    equipment: "Barbell",
    instructions:
      "Stand with the bar over mid-foot, hinge down and grip just outside your legs, drive your chest up to create a flat back. Push the floor away, keeping the bar dragging up your shins and thighs, until you're fully upright with hips locked.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    muscleGroups: ["Quads", "Glutes"],
    secondaryMuscleGroups: ["Hamstrings", "Core"],
    equipment: "Dumbbell",
    instructions:
      "Rest one foot behind you on a bench, hold dumbbells at your sides, and lower your rear knee toward the floor in a controlled split-squat. Drive through the front heel to stand — complete all reps on one leg before switching (10 per leg).",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "leg-extension",
    name: "Leg Extension",
    muscleGroups: ["Quads"],
    secondaryMuscleGroups: [],
    equipment: "Machine",
    instructions:
      "Sit in the machine with the pad resting on the front of your ankles, extend your legs to full lockout squeezing the quads hard at the top. Lower with control — do not let the weight crash back.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "seated-calf-raise",
    name: "Seated Calf Raise",
    muscleGroups: ["Calves"],
    secondaryMuscleGroups: [],
    equipment: "Machine",
    instructions:
      "Sit with the pad across your lower thighs and the balls of your feet on the platform. Press your heels up as high as possible and hold, then lower to a full stretch — the seated position targets the soleus muscle.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "hanging-leg-raise",
    name: "Hanging Leg Raise",
    muscleGroups: ["Abs"],
    secondaryMuscleGroups: ["Hip Flexors"],
    equipment: "Bodyweight",
    instructions:
      "Hang from a pull-up bar with straight arms, raise your legs (knees bent for easier, straight for harder) until your thighs reach parallel or beyond. Lower under full control — avoid swinging.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "plank",
    name: "Plank",
    muscleGroups: ["Core"],
    secondaryMuscleGroups: ["Glutes", "Shoulders"],
    equipment: "Bodyweight",
    instructions:
      "Assume a forearm push-up position with a straight line from head to heels, brace your core and glutes. Hold the position — do not let your hips sag or pike, breathe steadily. Target: 45 seconds per hold.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "cable-woodchoppers",
    name: "Cable Woodchoppers",
    muscleGroups: ["Obliques"],
    secondaryMuscleGroups: ["Core", "Shoulders"],
    equipment: "Cable",
    instructions:
      "Set a cable handle at shoulder height on one side, stand perpendicular and pull the handle diagonally across your body in a chopping motion while rotating your torso. Control the return to the start — 12 reps per side.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },

  // ── ALTERNATIVES (per §6.4) ───────────────────────────────────────────────

  {
    id: "db-bench-press",
    name: "Dumbbell Bench Press",
    muscleGroups: ["Chest"],
    secondaryMuscleGroups: ["Shoulders", "Triceps"],
    equipment: "Dumbbell",
    instructions:
      "Lie on a flat bench holding dumbbells at chest level with palms facing forward. Press to full extension, then lower slowly until you feel a chest stretch — use when a barbell is not available.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "goblet-squat",
    name: "Goblet Squat",
    muscleGroups: ["Quads", "Glutes"],
    secondaryMuscleGroups: ["Core", "Hamstrings"],
    equipment: "Dumbbell",
    instructions:
      "Hold a dumbbell vertically at chest height, squat to depth keeping elbows inside your knees to drive them out. Drive through your heels to stand — great as a warm-up or when barbells are busy.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
  {
    id: "dumbbell-row",
    name: "Single-Arm Dumbbell Row",
    muscleGroups: ["Lats"],
    secondaryMuscleGroups: ["Biceps", "Rear Delts"],
    equipment: "Dumbbell",
    instructions:
      "Place one hand and knee on a bench for support, row the dumbbell to your hip by driving your elbow back and up. Lower to full extension — use a full range of motion and avoid rotating your torso excessively.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "machine-shoulder-press",
    name: "Machine Shoulder Press",
    muscleGroups: ["Shoulders"],
    secondaryMuscleGroups: ["Triceps"],
    equipment: "Machine",
    instructions:
      "Adjust the seat so handles are at shoulder height, press overhead to full extension, then lower under control. Use the machine on days when shoulder stability feels off or when supersetting.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: true,
  },
  {
    id: "cable-curl",
    name: "Cable Curl",
    muscleGroups: ["Biceps"],
    secondaryMuscleGroups: [],
    equipment: "Cable",
    instructions:
      "Stand at a low cable pulley with a straight or EZ bar attachment, curl toward your chin while keeping elbows pinned. The cable maintains constant tension throughout the range — lower under control to full extension.",
    tutorialUrl: "",
    isCustom: false,
    isCompound: false,
  },
];

// ─── Default Workout Plan ─────────────────────────────────────────────────────
// Index = JS Date.getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat

export const SEED_PLAN: WorkoutPlan = {
  id: PLAN_ID,
  name: "Aesthetic Lean Bulk",
  isActive: true,
  days: [
    // [0] Sunday — PUSH (testing)
    {
      dayOfWeek: 0,
      type: "workout",
      name: "Push",
      plannedExercises: [
        { exerciseId: "barbell-bench-press",    targetSets: 4, targetRepMin: 6,  targetRepMax: 8,  targetWeight: null, order: 1, restSeconds: 180, isTimed: false, notes: "" },
        { exerciseId: "incline-db-press",       targetSets: 3, targetRepMin: 8,  targetRepMax: 10, targetWeight: null, order: 2, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "cable-chest-fly",        targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 3, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "seated-db-shoulder-press", targetSets: 3, targetRepMin: 8, targetRepMax: 10, targetWeight: null, order: 4, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "lateral-raises",         targetSets: 4, targetRepMin: 12, targetRepMax: 15, targetWeight: null, order: 5, restSeconds: 60,  isTimed: false, notes: "" },
        { exerciseId: "tricep-rope-pushdown",   targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 6, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "overhead-tricep-extension", targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 7, restSeconds: 90, isTimed: false, notes: "" },
      ],
    },

    // [1] Monday — PUSH
    {
      dayOfWeek: 1,
      type: "workout",
      name: "Push",
      plannedExercises: [
        { exerciseId: "barbell-bench-press",    targetSets: 4, targetRepMin: 6,  targetRepMax: 8,  targetWeight: null, order: 1, restSeconds: 180, isTimed: false, notes: "" },
        { exerciseId: "incline-db-press",       targetSets: 3, targetRepMin: 8,  targetRepMax: 10, targetWeight: null, order: 2, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "cable-chest-fly",        targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 3, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "seated-db-shoulder-press", targetSets: 3, targetRepMin: 8, targetRepMax: 10, targetWeight: null, order: 4, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "lateral-raises",         targetSets: 4, targetRepMin: 12, targetRepMax: 15, targetWeight: null, order: 5, restSeconds: 60,  isTimed: false, notes: "" },
        { exerciseId: "tricep-rope-pushdown",   targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 6, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "overhead-tricep-extension", targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 7, restSeconds: 90, isTimed: false, notes: "" },
      ],
    },

    // [2] Tuesday — PULL
    {
      dayOfWeek: 2,
      type: "workout",
      name: "Pull",
      plannedExercises: [
        { exerciseId: "lat-pulldown",   targetSets: 4, targetRepMin: 6,  targetRepMax: 10, targetWeight: null, order: 1, restSeconds: 180, isTimed: false, notes: "" },
        { exerciseId: "barbell-row",    targetSets: 4, targetRepMin: 8,  targetRepMax: 10, targetWeight: null, order: 2, restSeconds: 180, isTimed: false, notes: "" },
        { exerciseId: "seated-cable-row", targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 3, restSeconds: 90, isTimed: false, notes: "" },
        { exerciseId: "face-pulls",     targetSets: 3, targetRepMin: 12, targetRepMax: 15, targetWeight: null, order: 4, restSeconds: 60,  isTimed: false, notes: "" },
        { exerciseId: "ez-bar-curl",    targetSets: 3, targetRepMin: 8,  targetRepMax: 10, targetWeight: null, order: 5, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "hammer-curl",    targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 6, restSeconds: 90,  isTimed: false, notes: "" },
      ],
    },

    // [3] Wednesday — LEGS
    {
      dayOfWeek: 3,
      type: "workout",
      name: "Legs",
      plannedExercises: [
        { exerciseId: "back-squat",         targetSets: 4, targetRepMin: 6,  targetRepMax: 8,  targetWeight: null, order: 1, restSeconds: 180, isTimed: false, notes: "" },
        { exerciseId: "romanian-deadlift",  targetSets: 3, targetRepMin: 8,  targetRepMax: 10, targetWeight: null, order: 2, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "leg-press",          targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 3, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "leg-curl",           targetSets: 3, targetRepMin: 10, targetRepMax: 12, targetWeight: null, order: 4, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "walking-lunges",     targetSets: 3, targetRepMin: 10, targetRepMax: 10, targetWeight: null, order: 5, restSeconds: 90,  isTimed: false, notes: "10 reps per leg" },
        { exerciseId: "standing-calf-raise", targetSets: 4, targetRepMin: 12, targetRepMax: 15, targetWeight: null, order: 6, restSeconds: 60, isTimed: false, notes: "" },
      ],
    },

    // [4] Thursday — UPPER AESTHETIC
    {
      dayOfWeek: 4,
      type: "workout",
      name: "Upper Aesthetic",
      plannedExercises: [
        { exerciseId: "arnold-press",           targetSets: 4, targetRepMin: 8,  targetRepMax: 10, targetWeight: null, order: 1, restSeconds: 120, isTimed: false, notes: "" },
        { exerciseId: "lateral-raises",         targetSets: 4, targetRepMin: 12, targetRepMax: 15, targetWeight: null, order: 2, restSeconds: 60,  isTimed: false, notes: "Drop set on final set" },
        { exerciseId: "rear-delt-fly",          targetSets: 3, targetRepMin: 12, targetRepMax: 15, targetWeight: null, order: 3, restSeconds: 60,  isTimed: false, notes: "" },
        { exerciseId: "incline-db-curl",        targetSets: 3, targetRepMin: 10, targetRepMax: 10, targetWeight: null, order: 4, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "preacher-curl",          targetSets: 3, targetRepMin: 10, targetRepMax: 10, targetWeight: null, order: 5, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "skull-crushers",         targetSets: 3, targetRepMin: 10, targetRepMax: 10, targetWeight: null, order: 6, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "tricep-rope-pushdown",   targetSets: 3, targetRepMin: 12, targetRepMax: 12, targetWeight: null, order: 7, restSeconds: 90,  isTimed: false, notes: "" },
      ],
    },

    // [5] Friday — REST (testing)
    {
      dayOfWeek: 5,
      type: "rest",
      name: "Rest",
      plannedExercises: [],
    },

    // [6] Saturday — LOWER + CORE
    {
      dayOfWeek: 6,
      type: "workout",
      name: "Lower + Core",
      plannedExercises: [
        { exerciseId: "deadlift",              targetSets: 4, targetRepMin: 5,  targetRepMax: 5,  targetWeight: null, order: 1, restSeconds: 240, isTimed: false, notes: "" },
        { exerciseId: "bulgarian-split-squat", targetSets: 3, targetRepMin: 10, targetRepMax: 10, targetWeight: null, order: 2, restSeconds: 120, isTimed: false, notes: "10 reps per leg" },
        { exerciseId: "leg-extension",         targetSets: 3, targetRepMin: 12, targetRepMax: 12, targetWeight: null, order: 3, restSeconds: 90,  isTimed: false, notes: "" },
        { exerciseId: "seated-calf-raise",     targetSets: 4, targetRepMin: 15, targetRepMax: 15, targetWeight: null, order: 4, restSeconds: 60,  isTimed: false, notes: "" },
        { exerciseId: "hanging-leg-raise",     targetSets: 3, targetRepMin: 12, targetRepMax: 12, targetWeight: null, order: 5, restSeconds: 60,  isTimed: false, notes: "" },
        { exerciseId: "plank",                 targetSets: 3, targetRepMin: 45, targetRepMax: 45, targetWeight: null, order: 6, restSeconds: 60,  isTimed: true,  notes: "45 second hold" },
        { exerciseId: "cable-woodchoppers",    targetSets: 3, targetRepMin: 12, targetRepMax: 12, targetWeight: null, order: 7, restSeconds: 60,  isTimed: false, notes: "12 reps per side" },
      ],
    },
  ],
};

// ─── Action Items ─────────────────────────────────────────────────────────────

export const SEED_ACTION_ITEMS: ActionItem[] = [
  {
    id: "creatine",
    name: "Creatine",
    type: "supplement",
    schedule: "daily",
    suggestedTime: "Anytime",
    dose: "5 g",
  },
  {
    id: "whey-post-workout",
    name: "Whey Protein Shake",
    type: "supplement",
    schedule: "training_days",
    suggestedTime: "Post-workout",
    dose: "1 scoop (~25 g protein)",
  },
  {
    id: "whey-morning",
    name: "Whey Protein Shake",
    type: "supplement",
    schedule: "rest_days",
    suggestedTime: "Morning",
    dose: "1 scoop (~25 g protein)",
  },
  {
    id: "water-intake",
    name: "Water Intake",
    type: "habit",
    schedule: "daily",
    suggestedTime: "Throughout day",
    dose: "3 L",
  },
  {
    id: "protein-check",
    name: "Protein Target Check",
    type: "habit",
    schedule: "daily",
    suggestedTime: "Evening",
    dose: "130 g total",
  },
];

// ─── User Profile ─────────────────────────────────────────────────────────────

export const SEED_USER_PROFILE: UserProfile = {
  id: 1,
  heightCm: 178,
  startingWeightKg: 65,
  currentWeightKg: 65,
  units: "kg",
  proteinTargetG: 130,
  activePlanId: PLAN_ID,
};
