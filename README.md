# FitTrack — Personal Fitness Trainer PWA

A mobile-first progressive web app for tracking workouts, protein intake, bodyweight, body measurements, and supplements. Built with Next.js 14, Dexie (IndexedDB), and Tailwind CSS. Fully offline-capable — all data lives in the browser, no backend required. Installable as a PWA on iOS and Android.

---

## Table of Contents

1. [Features Overview](#features-overview)
2. [Detailed Feature Guide](#detailed-feature-guide)
   - [Today](#today)
   - [Active Session](#active-session)
   - [Rest Timer](#rest-timer)
   - [History](#history)
   - [Stats](#stats)
   - [Workout Plans](#workout-plans)
   - [Bodyweight Tracking](#bodyweight-tracking)
   - [Body Measurements](#body-measurements)
   - [Plate Calculator](#plate-calculator)
   - [Settings](#settings)
3. [Tech Stack](#tech-stack)
4. [Local Development](#local-development)
5. [Deploy to Vercel](#deploy-to-vercel)
6. [Project Structure](#project-structure)
7. [Data Model](#data-model)
8. [Scripts](#scripts)

---

## Features Overview

| Screen | Route | Summary |
|---|---|---|
| **Today** | `/today` | Daily hub — workout plan, supplement checklist, protein counter |
| **Active Session** | `/session/[id]` | Full-screen workout logger with set tracking, rest timer, progression suggestions |
| **History** | `/history` | Calendar heatmap + per-session exercise log |
| **Stats** | `/stats` | Streak, volume charts, PR highlights, weekly check-in card |
| **Plans** | `/plans` | View and manage workout plans; create custom plans |
| **Bodyweight** | `/more/bodyweight` | Daily weigh-in, trend chart, lean-bulk pace tracker |
| **Measurements** | `/more/measurements` | Body tape measurements (chest, waist, hips, arms, etc.) with trend charts |
| **Plate Calculator** | `/more/plates` | Instantly calculate plate loading for any target weight |
| **Settings** | `/more/settings` | Theme, units, profile, notifications, data export/reset |

---

## Detailed Feature Guide

### Today

The landing screen (`/today`) is your daily command centre.

**Workout Card**
- Shows the exercise plan scheduled for today based on your active workout plan's day rotation.
- Each exercise card displays target sets × reps, a suggested starting weight (in your chosen unit), and any available progression suggestion.
- Tap **Start Workout** to launch the active session.
- If no workout is scheduled today (rest day), the card shows a rest day message.

**Supplement / Action Checklist**
- Lists all daily action items (e.g., Creatine 5 g, Whey shake, Water check-in).
- Tap any item to toggle it complete — persisted in IndexedDB and resets each calendar day.
- Completed items are visually struck through and counted in the progress badge.

**Protein Counter**
- Shows today's total protein logged vs. your target (e.g., `88 / 130 g`).
- Tap the `+` button to log a protein entry: enter grams and an optional source label (e.g., "chicken breast", "whey shake").
- Entries accumulate during the day; the counter resets at midnight.

---

### Active Session

Launched from the Today screen or History. Full-screen, immersive workout logger.

**Exercise Navigation**
- Swipe left/right or tap the arrow buttons to move between exercises in the session.
- A progress indicator at the top shows which exercise you're on (e.g., `2 / 7`).
- Each exercise shows its name, muscle group badge, and target sets × reps.

**Set Logging**
- Each row in the set table corresponds to one working set.
- Tap a row to enter weight (in your display unit) and reps using a numeric keyboard.
- Tap the checkmark to mark a set complete — it locks the row and logs the data.
- The column header shows the current unit (`kg` or `lbs`).
- Add extra sets with the `+ Add Set` button.

**Progression Suggestion Bar**
- Appears automatically when the app detects you're ready to progress (e.g., hit all reps last session on a compound lift).
- Shows the suggested new weight and the rule that triggered it (e.g., "+2.5 kg — all reps hit").
- Tap **Accept** to pre-fill all set weights with the new target; tap **Dismiss** to ignore.

**Target Badge**
- Displays the planned target weight for the current exercise so you always know the goal.

**Rest Timer Integration**
- After completing a set, a rest timer starts automatically (default 90 s, configurable per exercise).
- The floating pill persists if you navigate away — the timer keeps running.

**Finishing the Session**
- Tap **Finish** (or complete the last exercise) to open the Session Summary screen.
- Summary shows total volume lifted, duration, exercises completed, and any new PRs set.
- Tap **Save** to write the session to the database; the session then appears in History.

---

### Rest Timer

A global, drift-free rest timer powered by a Web Worker (runs off the main thread — survives phone lock screen).

- **Floating pill** — visible on every screen inside the app while a timer is running. Shows remaining time and a pulsing indicator.
- **Controls:** Pause / Resume, +30 s, Skip (end timer early).
- **Auto-start** — fires automatically after a set is completed during a session.
- **Manual start** — tap the pill to expand controls at any time.
- Timer state survives navigation between tabs.

---

### History

Route: `/history`

**Calendar Heatmap**
- Displays the current month with colour-coded tiles: deeper colour = more volume lifted.
- Tap a day to see a summary of that session below the calendar.
- Navigate months with the `‹` / `›` arrows.

**Session Detail**
- Selecting a day (that has a session) expands an accordion showing every exercise logged: exercise name, sets completed, weight × reps for each set.
- Duration and total volume are shown in the header.

---

### Stats

Route: `/stats`

**Summary Cards**
- Current streak (consecutive days with a logged session).
- Weekly workouts completed.
- Total volume lifted this week (in your display unit).
- Best single-session volume.

**Volume Chart**
- Line chart of total volume per session over the last 30 days.
- Helps visualise progressive overload trends at a glance.

**PR Highlights**
- Lists recent personal records set — exercise name, new weight × reps, date.
- PRs are detected automatically when a set exceeds any previous logged set for that exercise.

**Weekly Check-in Card**
- Summarises the current week: sessions done, protein average vs. target, bodyweight change.
- Designed to give a quick health-check every Sunday.

---

### Workout Plans

Route: `/plans`

**Viewing Plans**
- Lists all saved workout plans. The active plan is highlighted.
- Tap a plan to expand its 7-day schedule — each day shows the assigned workout name and exercises.

**Creating a Plan**
- Tap **New Plan** to open the plan builder.
- Set a plan name, then for each day of the week choose a workout type (Push / Pull / Legs / Rest / etc.) and add exercises from the library.
- For each exercise set: target sets, rep range, starting weight, and rest time.

**Seeded Default Plan**
- On first install the app seeds the **"Aesthetic Lean Bulk"** plan: Push · Pull · Legs · Upper Aesthetic · Lower+Core · Rest · Rest — with 30+ pre-loaded exercises.

---

### Bodyweight Tracking

Route: `/more/bodyweight`

**Logging**
- Enter your bodyweight in the input field (uses your display unit — kg or lbs).
- Tap **Log** — the entry is validated (range: 20–300 kg / 44–660 lbs), then stored in kg internally.
- Invalid entries show an inline error message.
- Duplicate same-day entries are permitted (shows the most recent in calculations).

**Trend Chart**
- Recharts line chart of the last 30 days of bodyweight.
- Displays your **goal pace band** (+0.25 to +0.5 kg/week from your first entry) so you can visually verify you're in the lean-bulk sweet spot.
- Y-axis and tooltips show values in your chosen unit.

**Stats Row**
- Latest weight, total change since first entry, weekly rate of change.
- Rate is colour-coded: green = on pace, amber = too slow/fast.

**History List**
- Scrollable list of all entries with date and delta vs. previous entry.
- Long-press (or tap the trash icon) to delete an entry — a confirmation dialog appears first.

---

### Body Measurements

Route: `/more/measurements`

Track tape measurements for multiple body sites: chest, waist, hips, left arm, right arm, left thigh, right thigh, neck.

**Logging**
- Select a body site from the tab bar.
- Enter a value (cm) and tap **Log**.

**Trend Chart**
- Line chart per site showing change over time.
- Useful for verifying muscle growth (arms, chest up) while waist stays controlled.

**History**
- Per-site scrollable entry list with dates and deltas.

---

### Plate Calculator

Route: `/more/plates`

Quickly answers "which plates do I put on the bar?"

**Inputs**
- **Target weight** — total barbell weight you want to lift (in your display unit).
- **Bar weight** — defaults to 20 kg (44 lbs). Editable.
- **Available plates** — comma-separated list of plate sizes you own. Defaults to `25, 20, 15, 10, 5, 2.5, 1.25` kg (auto-converted to your display unit).

**Calculation**
- Greedy algorithm: fills each side of the bar largest-to-smallest.
- Shows the remainder if an exact load isn't achievable.

**Visual Stack**
- Colour-coded plate divs stacked to represent what the loaded bar looks like:
  - 🔴 25 kg · 🔵 20 kg · 🟡 15 kg · 🟢 10 kg · ⚪ 5 kg · ⬜ 2.5 / 1.25 kg
- Proportional heights give an at-a-glance sense of the loading.

**Text Breakdown**
- e.g., `3×25 + 1×10 = 85 kg per side` — easy to read at a glance on the gym floor.

---

### Settings

Route: `/more/settings`

**Profile**
- Set your height (cm) and daily protein target (g).
- Tap **Save** to persist.

**Appearance**
- Theme selector: **Dark** / **Light** / **System**.
- Change takes effect immediately; no page reload needed.
- System mode follows your OS light/dark preference and updates live if you switch.
- Selection is persisted in both IndexedDB and `localStorage` (prevents flash on reload).

**Units**
- Toggle between **kg** and **lbs**.
- All weight displays throughout the app update instantly: Today suggestions, active session weights, bodyweight chart, plate calculator.
- All values are stored in kg internally; conversion is display-only.

**Notifications**
- Master toggle to enable/disable workout reminders.
- Per-day-of-week scheduled times — set a reminder for each workout day independently.
- **Protein nudge** — opt-in reminder at a set time if you haven't hit your daily protein target.
- **Supplement reminder** — daily reminder at a custom time to take your supplements.
- Requires notification permission from the browser.

**Data & About**
- **Export JSON** — downloads a full backup of all your data (sessions, exercises, bodyweight, protein, measurements, PRs, supplements) as a timestamped `.json` file.
- **Reset All Data** — triple-confirm destructive action that wipes all logged data (sessions, sets, protein, bodyweight, measurements, PRs, supplement logs). The exercise library, workout plans, and profile are preserved.

---

## Tech Stack

| Layer | Library / Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | Dexie v4 (IndexedDB ORM) |
| Styling | Tailwind CSS + shadcn/ui tokens |
| Charts | Recharts |
| Icons | Lucide React |
| Language | TypeScript |
| PWA | `next-pwa` (service worker, offline, installable) |

All data is stored in the **browser's IndexedDB**. There is no backend, no accounts, and no network required after the first page load.

---

## Local Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
git clone <repo-url>
cd fitness-trainer
npm install
npm run dev
```

Open <http://localhost:3000> — it redirects to `/today` automatically.

### Seeded data

On first load the app automatically seeds:

- **"Aesthetic Lean Bulk"** workout plan — Push / Pull / Legs / Upper Aesthetic / Lower+Core
- **30+ exercises** with muscle groups, rep ranges, instructions, and default rest times
- **Supplements checklist** — Creatine 5 g, Whey shake (post-workout), Water check-in

**Manually reset the database:** DevTools → Application → IndexedDB → `FitTrackDB` → Delete database → Reload.  
Or use **Settings → Reset All Data** inside the app.

---

## Deploy to Vercel

```bash
npm run build   # confirm it passes locally first
```

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework: **Next.js** (auto-detected).
4. No environment variables needed.
5. Click **Deploy**.

> All data lives in each user's browser IndexedDB — there is no server-side storage or sync between devices.

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                # Root layout — theme init script (no flash)
│   ├── globals.css               # CSS variables, dark/light themes
│   └── (app)/                    # Shell layout: BottomNav + RestTimerProvider
│       ├── today/
│       ├── session/[id]/         # Active workout screen
│       ├── history/
│       ├── stats/
│       ├── plans/
│       └── more/
│           ├── bodyweight/
│           ├── measurements/
│           ├── plates/
│           └── settings/
├── components/
│   ├── session/
│   │   ├── WorkoutSessionView.tsx
│   │   └── FloatingRestTimer.tsx
│   ├── today/TodayView.tsx
│   ├── stats/StatsView.tsx
│   ├── more/
│   │   ├── BodyweightScreen.tsx
│   │   ├── MeasurementsScreen.tsx
│   │   ├── PlateCalculator.tsx
│   │   └── SettingsScreen.tsx
│   ├── pwa/ThemeApplier.tsx      # DB → DOM theme sync
│   └── nav/BottomNav.tsx
├── context/
│   └── RestTimerContext.tsx      # Web Worker bridge + global timer state
└── lib/
    ├── db.ts                     # Dexie schema & TypeScript types
    ├── seed.ts                   # Default exercises, plan, supplements
    ├── units.ts                  # kg ↔ lbs conversion helpers
    └── dateUtils.ts
public/
└── rest-timer.worker.js          # Drift-free countdown (runs off main thread)
```

---

## Data Model

| Table | Key info |
|---|---|
| `exercises` | Exercise library — name, muscle group, instructions, default rest |
| `workoutPlans` | 7-day plans with per-day exercise targets (sets, reps, weight) |
| `workoutSessions` | One row per completed session — total volume, duration, date |
| `loggedExercises` | Per-session exercise record with `loggedSets[]` |
| `actionItems` | Supplement / habit definitions (name, frequency) |
| `actionItemLogs` | Daily completion records — resets each calendar day |
| `proteinEntries` | Per-entry protein log with grams and source label |
| `bodyweightEntries` | Daily weight entries (stored in kg) |
| `bodyMeasurements` | Tape measurements per body site (stored in cm) |
| `prLogs` | Personal record events — exercise, weight, reps, date |
| `userProfile` | Single row — protein target, height, active plan, units, theme |

---

## Scripts

```bash
npm run dev        # dev server on :3000
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npx tsc --noEmit   # type-check only
```


