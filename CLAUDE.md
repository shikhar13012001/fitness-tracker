# Fitness Tracker App — Requirements v2

*Updated to include user profile, seeded training plan, and supplement/nutrition protocol.*


---

## 1. User Profile & Context

* **Height:** 5'10" (178 cm)
* **Weight:** 65 kg (\~143 lbs) — BMI 20.6
* **Body type:** Ectomorph (skinny, hard-gainer)
* **Primary goal:** Aesthetics — definition, visible muscle, "looks"
* **Strategy:** Lean bulk — slow weight gain (0.25–0.5 kg/week) with high protein
* **Supplements on hand:** Whey protein, creatine
* **Training environment:** Gym with barbells, dumbbells, cables, machines
* **Trainer:** None (app is replacing this function)

This profile drives several product decisions downstream: protein tracking becomes critical, weekly bodyweight tracking matters more than typical, and the default seeded plan is aesthetics-focused with enough hypertrophy volume for an ectomorph.


---

## 2. Product Vision

A single-user web app that replaces a personal trainer for a lean-bulking ectomorph chasing aesthetics. It tells you what to do each day, times your rest and sessions, tracks your lifts to enforce progressive overload, reminds you to take creatine and hit your protein target, and shows you whether you're actually progressing. Mobile-first, installable to home screen, works offline in gyms with bad signal.

## 3. Goals

* Never wonder what workout it is — home screen always shows today's plan
* Logging a set takes ≤ 2 taps + numeric input (the #1 UX priority)
* Enforce progressive overload automatically via weight-increase suggestions
* Keep protein intake front-and-center (the bottleneck for this body type)
* Track bodyweight weekly to confirm the lean bulk is working
* Replace trainer check-ins with streaks, stats, and gentle nudges

## 4. Out of Scope (v1)

Full macro/calorie tracking (protein only), meal planning, AI form coaching, wearable sync, social features, multi-user support, and marketplace plans. Keep it lean.


---

## 5. Feature List

### Tier 1 — MVP


 1. **Exercise Library** — searchable catalog with muscle group, equipment, instructions, tutorial URL. Pre-seeded with \~40 exercises needed for the default plan. Custom exercises allowed.
 2. **Workout Plan Builder** — weekly schedules (7-day cycle). Each day is either workout or rest. Workout days hold exercises with target sets × reps × weight. Pre-seeded with the default aesthetic lean-bulk plan (see §6).
 3. **Today's Workout** — home screen auto-detects today from the active plan. Shows exercise list with targets, "Start Workout" button, quick links to tutorials.
 4. **Session Logging** — per exercise: log each set (weight × reps), tick completion, add notes. Auto-saves.
 5. **Session Timer + Rest Timer + Exercise Timer** — session timer runs while workout active; rest timer auto-triggers on set completion with sound + vibration (presets: 60s / 90s / 2min / 3min); exercise timer for timed holds (plank).
 6. **Action Items / Supplements Checklist** — daily list pre-seeded with creatine, whey (post-workout on training days, morning on rest days), and water target. Resets at midnight.
 7. **Protein Intake Tracker** — simple daily gram counter with quick-add buttons (Whey scoop = 25g, Chicken 100g = 31g, Eggs 2 = 12g, custom). Daily target 130g (2g/kg). Shown on home screen.
 8. **Bodyweight Log** — weekly (or daily if preferred) weigh-in with running chart. Starting weight: 65 kg. Target trajectory: +0.25–0.5 kg/week.
 9. **Basic Stats** — workouts this week, total weekly volume, current streak.
10. **Progression Automation** — when all target reps hit on a compound lift, app suggests +2.5 kg next session; on isolation lifts, suggests +1 rep or +1 kg.

### Tier 2 — Phase 2


11. **Progress Charts** — weight progression per exercise (line chart), weekly volume trend, muscle-group distribution.
12. **Personal Records** — auto-detect PRs per exercise (max weight for each rep range), celebratory moment when hit.
13. **Calendar / History** — month view with workout/rest day indicators, tap to see past session details, filter by exercise to see progression timeline.
14. **Body Measurements** — optional weekly log of chest, waist, arms, thighs with trend charts.
15. **Bodyweight Trend Analysis** — detect if weekly gain is in target range; if under-gaining, suggest "+200 kcal/day"; if over-gaining, suggest "-200 kcal/day".

### Tier 3 — Nice-to-have


16. Push notifications (workout reminders, supplement reminders, protein check-in at 8pm)
17. CSV / JSON export and import
18. Dark mode (default), unit toggle (kg/lbs), plate calculator for barbell loading
19. Deload week suggestion when strength regresses 2+ sessions


---

## 6. Seed Data (Pre-Loaded Content)

The app should ship pre-populated with this content so there's nothing to set up — just open and start training.

### 6.1 Default Workout Plan — "Aesthetic Lean Bulk"

Set as the active plan on first launch.

**Day 1 (Mon) — PUSH**
Barbell bench press — 4 × 6–8 | Incline dumbbell press — 3 × 8–10 | Cable/machine chest fly — 3 × 10–12 | Seated DB shoulder press — 3 × 8–10 | Lateral raises — 4 × 12–15 | Tricep rope pushdown — 3 × 10–12 | Overhead tricep extension — 3 × 10–12

**Day 2 (Tue) — PULL**
Pull-ups or lat pulldown — 4 × 6–10 | Barbell row — 4 × 8–10 | Seated cable row — 3 × 10–12 | Face pulls — 3 × 12–15 | Barbell/EZ curl — 3 × 8–10 | Hammer curl — 3 × 10–12

**Day 3 (Wed) — LEGS**
Back squat — 4 × 6–8 | Romanian deadlift — 3 × 8–10 | Leg press — 3 × 10–12 | Leg curl — 3 × 10–12 | Walking lunges — 3 × 10/leg | Standing calf raise — 4 × 12–15

**Day 4 (Thu) — REST**

**Day 5 (Fri) — UPPER AESTHETIC**
Arnold press — 4 × 8–10 | Lateral raises (drop set final) — 4 × 12–15 | Rear delt fly — 3 × 12–15 | Incline DB curl — 3 × 10 | Preacher curl — 3 × 10 | Skull crushers — 3 × 10 | Cable rope pushdown — 3 × 12

**Day 6 (Sat) — LOWER + CORE**
Deadlift — 4 × 5 | Bulgarian split squat — 3 × 10/leg | Leg extension — 3 × 12 | Seated calf raise — 4 × 15 | Hanging leg raise — 3 × 12 | Plank — 3 × 45s | Cable woodchoppers — 3 × 12/side

**Day 7 (Sun) — REST**

Starting weights are left blank — the user enters what they can do on week 1, and the app takes progression from there.

### 6.2 Default Action Items / Supplements

| Item | Type | When | Dose |
|----|----|----|----|
| Creatine | Supplement | Anytime daily | 5 g |
| Whey protein shake | Supplement | Post-workout (training days) | 1 scoop (\~25g protein) |
| Whey protein shake | Supplement | Morning (rest days, if needed) | 1 scoop |
| Water intake | Habit | Throughout day | 3 L target |
| Protein target check | Habit | Evening | 130 g total |

### 6.3 Nutrition Targets (displayed in Settings / Profile)

* Calories: \~2800–3000 / day (maintenance \~2500 + surplus \~300–500)
* Protein: 130 g/day (2 g per kg bodyweight)
* Carbs: 350–400 g
* Fat: 70–80 g
* Water: 3 L+

The app tracks protein explicitly; the rest are reference targets the user manages externally.

### 6.4 Exercise Library Seed

All exercises referenced in §6.1, plus common alternatives (e.g., dumbbell bench as alt to barbell bench, goblet squat as alt to back squat). Each entry: name, primary muscle group, secondary muscles, equipment, 2-sentence instructions, YouTube tutorial link.


---

## 7. Key User Flows

### Flow A — Daily workout

Open app → home shows "Today: Push Day — 7 exercises, est. 60 min" and current protein count (e.g. "45 / 130 g today") → tap **Start Workout** → session timer kicks off → first exercise card shows Bench Press 4×6–8 @ 60 kg with tutorial link → log set 1 (weight + reps) → rest timer auto-starts at 90s with audio/vibration alert at end → repeat sets → tick exercise complete, move to next → after last exercise, **Post-Workout Checklist** appears (log whey shake, stretching) → tap **Finish** → summary screen shows total time, total volume, any PRs hit, whether all rep targets were hit (triggering progression suggestions for next session).

### Flow B — Logging protein during the day

From anywhere: tap the floating protein counter → quick-add chips (Whey scoop +25g, Chicken 100g +31g, Greek yogurt +15g, Eggs ×2 +12g) or Custom → number updates → progress ring fills toward 130g. App can nudge in the evening if below target.

### Flow C — Weekly bodyweight check

Sunday morning, app prompts: "Time for weekly weigh-in." Enter weight → chart updates → app computes weekly delta → feedback: "Up 0.4 kg — on track" or "Up 0.1 kg — try adding 200 kcal/day" or "Up 0.7 kg — consider pulling back 200 kcal."

### Flow D — Checking progress

Stats tab → weekly overview → tap an exercise (e.g. Bench Press) → line chart of working weight over last 12 weeks → confirms whether progressive overload is actually happening.

### Flow E — Managing plans

Plans tab → active plan shown with all 7 days → edit any day's exercises, add/remove, reorder → save. Multiple plans can exist; set one as active.


---

## 8. Screen Structure / Information Architecture

Bottom tab bar (mobile-first), five tabs:

* **Today** — today's workout + protein counter + supplement checklist + bodyweight prompt if due
* **Plans** — active plan view, plan editor, plan switcher
* **Stats** — weekly summary, per-exercise progression, PRs
* **History** — calendar view, past sessions, bodyweight chart
* **More** — Exercise Library, Action Items settings, Profile & Goals, App Settings

The active workout session is a full-screen modal layered over Today, preventing accidental navigation mid-set.


---

## 9. Data Model

Core entities:

* **UserProfile** — height, starting_weight, current_weight, units, protein_target, active_plan_id
* **Exercise** — id, name, muscle_groups\[\], equipment, instructions, tutorial_url, is_custom
* **WorkoutPlan** — id, name, is_active, days\[\] (7)
* **PlannedDay** — day_of_week, type (workout/rest), name, planned_exercises\[\]
* **PlannedExercise** — exercise_id, target_sets, target_rep_min, target_rep_max, target_weight, order, rest_seconds
* **WorkoutSession** — id, date, plan_id, day_name, start_time, end_time, duration, total_volume, notes
* **LoggedExercise** — session_id, exercise_id, logged_sets\[\], notes, completed
* **LoggedSet** — weight, reps, rpe (optional), timestamp
* **ActionItem** — id, name, type (supplement/habit), schedule (daily/training_days/rest_days), suggested_time, dose
* **ActionItemLog** — action_item_id, date, completed_at
* **ProteinEntry** — date, grams, source_label, timestamp
* **BodyweightEntry** — date, weight
* **BodyMeasurement** — date, chest, waist, left_arm, right_arm, thigh (optional per-field)

PRs are computed on the fly from LoggedSet history — no separate table.


---

## 10. App Behavior Rules

### Today's workout logic

Home always shows *today*, never yesterday or a carried-over session. Missed workouts stay missed — the plan doesn't shift forward. Users can retroactively log a workout from the calendar if they trained off-schedule.

### Timer behavior

Session timer runs continuously from "Start Workout" to "Finish" — idle time between sets counts. Rest timer persists across tab/app changes (service worker + notifications). Audio alert is non-negotiable (gym earbuds need to fire reliably).

### Progression automation

After each session, for each exercise where all target reps were hit across all sets:

* Compound lifts (bench, squat, deadlift, OHP, row) → suggest +2.5 kg next session
* Isolation lifts (curls, raises, extensions, etc.) → suggest either +1 rep (until top of range) or +1 kg (once at top of range for all sets)

If user fails to hit target reps on the same weight two sessions in a row → suggest deload 10% next session.

### Supplements & action items

Checklists reset at local midnight. "Training days" items only show on days marked as workouts in the active plan. Streak = consecutive days where all required daily items (creatine, protein target) were completed, rest days included.

### Workout streaks

Counts consecutive days matching the plan — a rest day on a planned rest day still counts as "on streak."

### Protein nudge

If 8 PM local time and protein is < 80% of target (< 104 g), send a gentle notification ("70 g of protein today — one shake would close the gap.").

### Bodyweight feedback

Weekly delta computed from last 7 days of entries. < 0.25 kg/week → suggest +200 kcal/day. > 0.5 kg/week → suggest -200 kcal/day. In range → "on track" confirmation.


---

## 11. Technical Stack (recommended)

* **Framework:** React (Next.js) or SvelteKit
* **Styling:** Tailwind CSS
* **Storage:** IndexedDB via Dexie.js (local-first)
* **Charts:** Recharts (React) or Chart.js
* **PWA:** Service worker for offline + installable
* **Alerts:** Web Notifications API, Vibration API, Audio API for timer beeps
* **Hosting:** Vercel or Netlify (free tier)

Optional later: layer Supabase on top for cross-device sync without changing the local-first model.


---

## 12. Non-Functional Requirements

Mobile-first responsive design. Initial load < 2 seconds on 4G. Works fully offline after first visit. Installable as PWA. Dark mode by default (gym lighting). Logging a set ≤ 2 taps + number input. Timer audio must fire even with screen off and other apps foregrounded.


---

## 13. Build Roadmap

* **Week 1** — Project setup (Next.js/SvelteKit + Tailwind + Dexie), data model, seed exercise library & default plan
* **Week 2** — Today's view, session logging, set input UX
* **Week 3** — Session + rest timers with audio/vibration, post-workout summary, progression suggestion logic
* **Week 4** — Supplements checklist, protein tracker, bodyweight log
* **Week 5** — Stats dashboard (weekly volume, streak, per-exercise charts)
* **Week 6** — Calendar/history, PR detection, bodyweight trend feedback
* **Week 7** — PWA setup (service worker, install prompt, offline), notifications
* **Week 8** — Polish, real-world testing, iterate


---

## 14. Open Decisions

Before writing code, decide: (1) local-only or cross-device sync from day one; (2) kg primary (you're metric) — confirmed; (3) whether to wire in the [wger.de](http://wger.de) free exercise API or hand-seed \~40 exercises — hand-seeding is faster for v1; (4) whether "missed" workouts shift the schedule (no, recommended — stays on calendar week) or advance (the app "waits" for you); (5) time of day for weekly bodyweight prompt — suggest Sunday 9 AM.