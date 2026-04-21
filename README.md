# FitTrack — Personal Fitness Trainer PWA

A mobile-first progressive web app for tracking workouts, protein intake, bodyweight, and supplements. Built with Next.js 14, Dexie (IndexedDB), and Tailwind CSS. Fully offline-capable — all data lives in the browser, no backend required.


---

## Features

| Screen | What it does |
|----|----|
| **Today** | Today's workout plan, supplement checklist, protein counter |
| **Active Session** | Full-screen workout: set logging with weight/reps, exercise navigation (swipe or tap), rest timer |
| **Rest Timer** | Web Worker-powered (no drift when phone locks), floating pill persists across all screens, pause / +30s / skip |
| **Stats** | Weekly workouts, current streak, weekly volume, last 5 sessions |
| **Bodyweight** | Daily weight log, lean-bulk pace tracker (+0.25–0.5 kg/wk) |


---

## Tech Stack

* **Next.js 14** (App Router, static export compatible)
* **Dexie v4** — IndexedDB ORM, all data local
* **Tailwind CSS** + shadcn/ui design tokens, dark mode by default
* **Lucide React** icons
* **TypeScript** throughout


---

## Local Development

### Prerequisites

* Node.js 18+
* npm 9+

### Setup

```bash
git clone <repo-url>
cd fitness-trainer
npm install
npm run dev
```

Open <http://localhost:3000> — it redirects to `/today` automatically.

### Seeded data

On first load the app seeds:

* **"Aesthetic Lean Bulk"** workout plan — Push / Pull / Legs / Upper Aesthetic / Lower+Core
* **30+ exercises** with muscle groups, instructions, and rest times
* **Supplements checklist** — Creatine, Whey, Water intake

**Reset the database:** DevTools → Application → IndexedDB → `FitTrackDB` → Delete database → reload.


---

## Deploy to Vercel

```bash
npm run build   # confirm it passes locally first
```


1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo
3. Framework: **Next.js** (auto-detected)
4. No environment variables needed
5. Click **Deploy**

> All data is stored in each user's browser IndexedDB — there is no server-side storage or sync between devices.


---

## Project Structure

```
src/
├── app/
│   ├── (app)/                    # Layout: BottomNav + RestTimerProvider
│   │   ├── today/
│   │   ├── session/[id]/         # Active workout screen
│   │   ├── stats/
│   │   └── more/bodyweight/
│   └── globals.css
├── components/
│   ├── session/
│   │   ├── WorkoutSessionView.tsx
│   │   └── FloatingRestTimer.tsx
│   ├── today/TodayView.tsx
│   ├── stats/StatsView.tsx
│   ├── more/BodyweightScreen.tsx
│   └── nav/BottomNav.tsx
├── context/
│   └── RestTimerContext.tsx      # Web Worker bridge + global timer state
└── lib/
    ├── db.ts                     # Dexie schema & TypeScript types
    ├── seed.ts                   # Default exercises, plan, supplements
    └── dateUtils.ts
public/
└── rest-timer.worker.js          # Drift-free countdown (runs off main thread)
```


---

## Data Model

| Table | Key info |
|----|----|
| `exercises` | Library, seeded on first run |
| `workoutPlans` | 7-day plans with per-day exercise targets |
| `workoutSessions` | One row per session, stores `totalVolume` & `duration` |
| `loggedExercises` | Per-session exercise with `loggedSets[]` |
| `actionItems` | Supplement / habit definitions |
| `actionItemLogs` | Daily completion records (reset each day) |
| `proteinEntries` | Per-entry protein log with source label |
| `bodyweightEntries` | Daily weight entries |
| `userProfile` | Single row — protein target, active plan, units |


---

## Scripts

```bash
npm run dev        # dev server on :3000
npm run build      # production build
npm run start      # serve production build
npm run lint       # ESLint
npx tsc --noEmit   # type-check only
```


