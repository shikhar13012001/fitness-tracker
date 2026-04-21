# [CLAUDE.md](http://CLAUDE.md)

*This file is automatically loaded by Claude Code as context for every session in this project. It contains the full product spec, user profile, seeded data, and build conventions. Keep it updated as the project evolves.*


---

## Project: Personal Fitness Tracker

A single-user web app that replaces a personal trainer for a lean-bulking ectomorph chasing aesthetics. Mobile-first, installable as a PWA, works offline. Local-first storage via IndexedDB.


---

## User Profile (single user — the owner)

* **Height:** 5'10" (178 cm)
* **Weight:** 65 kg (\~143 lbs) — BMI 20.6
* **Body type:** Ectomorph (skinny, hard-gainer)
* **Primary goal:** Aesthetics — definition, visible muscle, "looks"
* **Strategy:** Lean bulk — target +0.25–0.5 kg/week
* **Supplements on hand:** Whey protein, creatine monohydrate
* **Training environment:** Gym with full equipment (barbells, dumbbells, cables, machines)
* **Protein target:** 130 g/day (2 g per kg bodyweight)
* **Calorie target:** \~2800–3000/day (\~300–500 kcal surplus)

This profile drives several product decisions: protein tracking is first-class, weekly bodyweight trend matters, the default plan is aesthetics-focused with hypertrophy volume suitable for an ectomorph.


---

## Tech Stack (authoritative)

* **Framework:** Next.js 14 with App Router, TypeScript
* **Styling:** Tailwind CSS
* **UI components:** shadcn/ui
* **Storage:** IndexedDB via Dexie.js (local-first, no backend in v1/v2)
* **Charts (Phase 2):** Recharts
* **PWA (Phase 2):** next-pwa or workbox service worker
* **Alerts:** Web Notifications API, Vibration API, Web Audio API
* **Hosting:** Vercel (free tier)
* **Source control:** git, GitHub

Do not introduce new dependencies without a clear justification. No server-side database, no auth, no backend — this is a personal single-user PWA.


---

## Product Goals

* Never wonder what workout it is — home screen always shows today's plan
* Logging a set takes ≤ 2 taps + numeric input (the #1 UX priority)
* Enforce progressive overload automatically via weight-increase suggestions
* Keep protein intake front-and-center (the bottleneck for this body type)
* Track bodyweight weekly to confirm the lean bulk is working
* Replace trainer check-ins with streaks, stats, and gentle nudges

## Out of Scope (v1 & v2)

Full macro/calorie tracking (protein only), meal planning, AI form coaching, wearable sync, social features, multi-user support, marketplace plans, cross-device sync.


---

## Phased Feature List

### Phase 1 — MVP (ship first day)


1. **Exercise Library** — searchable catalog with muscle group, equipment, instructions, tutorial URL. Pre-seeded with \~40 exercises. Custom exercises allowed.
2. **Workout Plan Builder** — weekly schedules (7-day cycle). Pre-seeded with the default aesthetic lean-bulk plan (see Seed Data below).
3. **Today's Workout** — home screen auto-detects today from the active plan. Shows exercise list with targets, "Start Workout" button, tutorial links.
4. **Session Logging** — per exercise: log each set (weight × reps), tick completion, add notes. Auto-saves.
5. **Session Timer + Rest Timer + Exercise Timer** — session timer during workout; rest timer auto-triggers on set completion with sound + vibration (presets: 60s / 90s / 2min / 3min); exercise timer for holds.
6. **Action Items / Supplements Checklist** — daily list pre-seeded with creatine, whey, water. Resets at midnight.
7. **Protein Intake Tracker** — daily gram counter with quick-add chips. Target 130g.
8. **Bodyweight Log** — weekly or daily entry with a simple list history.
9. **Basic Stats** — workouts this week, weekly volume, current streak, last 5 sessions.

### Phase 2 — (ship over following weeks)


10. **PWA + Full Offline** — service worker, manifest, installable, works in gyms with bad signal.
11. **Progression Automation** — auto-suggest next session's weight when all target reps hit.
12. **Personal Records** — auto-detect PRs (max weight, estimated 1RM via Epley, max reps at weight) with celebratory UI.
13. **Deload Detection** — suggest 10% deload after 2 consecutive failed sessions on same exercise.
14. **Progress Charts** — per-exercise weight progression (line), weekly volume (bar), muscle group distribution (pie).
15. **Calendar / History** — month view with workout/rest/missed indicators, tap any past day for session details, retroactive logging for missed workouts.
16. **Body Measurements** — optional weekly log of chest, waist, arms, thighs with trend charts.
17. **Bodyweight Trend Analysis** — weekly delta computed; feedback: "add 200 kcal" / "on track" / "pull 200 kcal".
18. **Notifications** — workout reminders, 8 PM protein nudge if below 80% target, supplement reminders.
19. **Polish** — dark mode toggle (dark default), kg/lbs units switch, plate calculator, export/import JSON, reset data.

### Out of Scope (pushed to theoretical Phase 3)

Multi-device sync, social features, AI form coaching, wearable integration, full macro tracking beyond protein, plan templates marketplace.


---

## Seed Data (pre-loaded on first launch)

### Default Workout Plan — "Aesthetic Lean Bulk"

Set as the active plan on first launch. Starting weights are null — user fills in week 1.

**Day 1 (Mon) — PUSH**

* Barbell bench press — 4 × 6–8
* Incline dumbbell press — 3 × 8–10
* Cable or machine chest fly — 3 × 10–12
* Seated dumbbell shoulder press — 3 × 8–10
* Lateral raises — 4 × 12–15
* Tricep rope pushdown — 3 × 10–12
* Overhead tricep extension — 3 × 10–12

**Day 2 (Tue) — PULL**

* Pull-ups or lat pulldown — 4 × 6–10
* Barbell row — 4 × 8–10
* Seated cable row — 3 × 10–12
* Face pulls — 3 × 12–15
* Barbell or EZ-bar curl — 3 × 8–10
* Hammer curl — 3 × 10–12

**Day 3 (Wed) — LEGS**

* Back squat — 4 × 6–8
* Romanian deadlift — 3 × 8–10
* Leg press — 3 × 10–12
* Leg curl — 3 × 10–12
* Walking lunges — 3 × 10/leg
* Standing calf raise — 4 × 12–15

**Day 4 (Thu) — REST**

**Day 5 (Fri) — UPPER AESTHETIC**

* Arnold press — 4 × 8–10
* Lateral raises (drop set final) — 4 × 12–15
* Rear delt fly — 3 × 12–15
* Incline dumbbell curl — 3 × 10
* Preacher curl — 3 × 10
* Skull crushers — 3 × 10
* Cable rope pushdown — 3 × 12

**Day 6 (Sat) — LOWER + CORE**

* Deadlift — 4 × 5
* Bulgarian split squat — 3 × 10/leg
* Leg extension — 3 × 12
* Seated calf raise — 4 × 15
* Hanging leg raise — 3 × 12
* Plank — 3 × 45 sec
* Cable woodchoppers — 3 × 12/side

**Day 7 (Sun) — REST**

### Default Action Items / Supplements

| Item | Type | Schedule | Dose |
|----|----|----|----|
| Creatine | Supplement | Daily | 5 g, anytime |
| Whey protein shake | Supplement | Training days | 1 scoop (\~25g protein) post-workout |
| Whey protein shake | Supplement | Rest days | 1 scoop morning (if needed to hit protein) |
| Water intake | Habit | Daily | 3 L target |
| Protein target check | Habit | Daily evening | 130 g total |

### Exercise Library Seed

All \~30 exercises referenced in the default plan plus common alternatives (e.g., dumbbell bench as alt to barbell bench, goblet squat as alt to back squat). Each entry includes: name, primary muscle group, secondary muscles, equipment, brief instructions (1–2 sentences), YouTube tutorial URL.

Classification for progression rules — **compound lifts** (use +2.5 kg progression): barbell bench press, incline barbell press, back squat, deadlift, Romanian deadlift, barbell row, overhead press, Arnold press, pull-ups, bulgarian split squat, walking lunges. Everything else is **isolation** (+1 rep, then +1 kg).


---

## Data Model

Define in `lib/db.ts` using Dexie.

```
UserProfile      — height, starting_weight, current_weight, units, protein_target, active_plan_id, notification_prefs
Exercise         — id, name, muscle_groups[], equipment, instructions, tutorial_url, is_compound, is_custom
WorkoutPlan      — id, name, is_active, days[] (7)
PlannedDay       — day_of_week (0-6), type ('workout'|'rest'), name, planned_exercises[]
PlannedExercise  — exercise_id, target_sets, target_rep_min, target_rep_max, target_weight (nullable), order, rest_seconds, suggested_next_weight, suggested_next_reps
WorkoutSession   — id, date, plan_id, day_name, start_time, end_time, duration_sec, total_volume, notes
LoggedExercise   — id, session_id, exercise_id, logged_sets[], notes, completed
LoggedSet        — weight, reps, rpe (optional), timestamp
ActionItem       — id, name, type ('supplement'|'habit'), schedule ('daily'|'training_days'|'rest_days'), suggested_time, dose
ActionItemLog    — action_item_id, date (YYYY-MM-DD), completed_at
ProteinEntry     — date, grams, source_label, timestamp
BodyweightEntry  — date, weight_kg
BodyMeasurement  — date, chest, waist, left_arm, right_arm, left_thigh, right_thigh (all optional, cm)
PRLog            — exercise_id, type ('max_weight'|'1rm'|'reps_at_weight'), value, reference_weight, reference_reps, achieved_at
```

PRs can be computed on the fly or stored in PRLog for fast access — use PRLog for Phase 2 to avoid recomputation on every render.


---

## App Behavior Rules (non-negotiable)

### Today's workout logic

Home always shows *today*, never yesterday or a carried-over session. Missed workouts stay missed — the plan doesn't shift forward. Users can retroactively log a workout from the calendar.

### Timer behavior

Session timer runs continuously from "Start Workout" to "Finish" — idle time between sets counts. Rest timer persists across tab/app changes (service worker + timestamp-based tracking, not naive setInterval). Audio alert is non-negotiable and must fire with screen off.

### Progression automation

After each session, for each exercise where all target reps were hit across all sets:

* Compound lifts → suggest +2.5 kg next session
* Isolation lifts → suggest +1 rep (until top of range), then +1 kg

If the same exercise fails target reps at the same weight 2 sessions in a row → suggest deload 10%.

### Supplements & action items

Checklists reset at local midnight. "training_days" items only appear on workout days per the active plan. "rest_days" items only appear on rest days.

### Streaks

Workout streak = consecutive days matching the plan (rest day on a planned rest day still counts). Breaks if a planned workout day is missed (no session logged by end of day).

### Protein nudge (Phase 2)

If 8 PM local time and protein < 80% of target (< 104 g), send gentle notification. Skip if at target or opted out.

### Bodyweight feedback (Phase 2)

Weekly delta from trailing 7-day average. < 0.25 kg/week → suggest +200 kcal/day. > 0.5 kg/week → suggest -200 kcal/day. Between → "on track."

### Units

Store everything internally in kg. Display conversion is presentation-layer only. 1 kg = 2.2046 lbs.


---

## Information Architecture

Bottom tab bar (mobile-first), five tabs:

* **Today** — today's workout + protein counter + supplement checklist + bodyweight prompt if due
* **Plans** — active plan view, plan editor, plan switcher
* **Stats** — weekly summary, per-exercise progression, PRs (Phase 2: charts)
* **History** — recent sessions (Phase 1: list) / calendar (Phase 2)
* **More** — Exercise Library, Action Items settings, Body Measurements, Bodyweight, Settings

Active workout session is a **full-screen modal** layered over Today, preventing accidental navigation mid-set.


---

## Non-Functional Requirements

* Mobile-first responsive (phones primary, desktop works)
* Initial load < 2 seconds on 4G
* Fully offline after first visit (Phase 2)
* Installable as PWA (Phase 2)
* **Dark mode by default** — gym lighting varies
* Logging a set: ≤ 2 taps + numeric input
* Timer audio fires with screen off, other apps foregrounded
* All numeric inputs use `type="number"` or `inputMode="decimal"` for correct mobile keyboard


---

## File / Folder Conventions

```
app/                    — Next.js App Router pages
  (tabs)/               — grouped tab routes
    today/
    plans/
    stats/
    history/
    more/
  session/              — full-screen workout session route
  layout.tsx            — root layout with bottom tab bar
components/
  ui/                   — shadcn components
  session/              — session-specific components (timer, set input, etc.)
  charts/               — chart wrappers (Phase 2)
lib/
  db.ts                 — Dexie schema + instance
  seed.ts               — seed data loader
  progression.ts        — progression/PR logic (Phase 2)
  timer.ts              — timer utilities
  notifications.ts      — notification scheduling (Phase 2)
public/
  icons/                — PWA icons
  sounds/               — timer beep mp3
```


---

## Coding Conventions

* TypeScript strict mode on
* Prefer server components where possible; client components only when needed (any hooks, browser APIs, timers → client)
* All database access goes through `lib/db.ts` — never open Dexie directly from components
* Keep components focused: one responsibility each
* No inline styles; Tailwind classes only
* Commit messages: conventional commits style (`feat:`, `fix:`, `chore:`, `refactor:`)
* Commit after each working increment; never leave main branch broken


---

## Known Decisions

* **kg is the primary unit** (user is metric)
* **Hand-seed exercise library** for v1 (don't wire in [wger.de](http://wger.de) API — adds complexity)
* **Missed workouts stay missed** — don't shift the schedule forward
* **Weekly bodyweight prompt on Sunday mornings** (or trigger if 7+ days since last log)
* **Phase 2 is a separate git branch** (`phase-2`) until each chunk is stable enough to merge
* **No backend in Phase 1 or 2** — add Supabase later only if multi-device sync is needed


---

## Project Status (update this section as the build progresses)

**Current phase:** *Not started — about to scaffold Phase 1.*

**Phase 1 progress:**

- [ ] Scaffold (Next.js + Tailwind + shadcn + Dexie)
- [ ] Data model + seed
- [ ] Today's workout screen
- [ ] Session logging + timers
- [ ] Supplements + protein tracker
- [ ] Bodyweight log
- [ ] Basic stats
- [ ] Deploy to Vercel

**Phase 2 progress:** *not started*

**Deviations from spec:** *none yet*

**Outstanding issues:** *none yet*


---

## Instructions for Claude Code

When working on this project:


1. **Respect the phase.** Don't implement Phase 2 features during Phase 1 work unless explicitly asked. Keep MVP lean.
2. **Ask before adding dependencies.** This is a small personal project — bloat is the enemy.
3. **Mobile-first always.** Test every UI at \~375px width mentally. If it doesn't work on a phone, it doesn't work.
4. **Test the timer rigorously.** This is the most failure-prone piece (tab switching, screen lock, audio policies). Use timestamp-based tracking, not naive intervals.
5. **Update the Project Status section** at the end of each work session so context stays fresh.
6. **When in doubt, refer back to this [CLAUDE.md](http://CLAUDE.md)**, especially sections on behavior rules and the data model.
7. **Don't invent features.** If the user asks for something not covered here, confirm before implementing — it may need to go in the spec first.


