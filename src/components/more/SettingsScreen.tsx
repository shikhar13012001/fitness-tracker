"use client";

import { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Bell, Check, ChevronDown, ChevronUp, Download, Trash2, Moon, Sun, Monitor } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  DEFAULT_NOTIFICATION_PREFS,
  type NotificationPrefs,
  type UserProfile,
} from "@/lib/db";
import {
  requestNotificationPermission,
  getNotificationPermission,
} from "@/lib/notifications";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
type Theme = "dark" | "light" | "system";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function permissionLabel(p: NotificationPermission): string {
  if (p === "granted") return "Granted ✓";
  if (p === "denied") return "Blocked — enable in browser settings";
  return "Not requested";
}

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
      {children}
    </h2>
  );
}

function Field({
  label,
  sub,
  muted,
  children,
}: {
  label: string;
  sub?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3.5 ${muted ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {sub && <p className="text-xs text-muted-foreground leading-snug mt-0.5">{sub}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({
  on,
  onClick,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
        on ? "bg-green-500" : "bg-border"
      } ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted p-1 rounded-xl">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-colors ${
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.icon}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ─── Section: Profile ─────────────────────────────────────────────────────────

function ProfileSection({ profile }: { profile: UserProfile | undefined }) {
  const [height, setHeight] = useState(String(profile?.heightCm ?? 175));
  const [protein, setProtein] = useState(String(profile?.proteinTargetG ?? 130));
  const [saved, setSaved] = useState(false);

  async function save() {
    await db.userProfile.update(1, {
      heightCm: Number(height) || 175,
      proteinTargetG: Number(protein) || 130,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <section className="px-4 pb-2">
      <SectionHeader>Profile</SectionHeader>
      <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden">
        <Field label="Height (cm)">
          <input
            type="number"
            inputMode="numeric"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-24 text-right bg-transparent text-sm text-foreground focus:outline-none"
          />
        </Field>
        <Field label="Daily protein target (g)">
          <input
            type="number"
            inputMode="numeric"
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            className="w-24 text-right bg-transparent text-sm text-foreground focus:outline-none"
          />
        </Field>
      </div>
      <button
        onClick={save}
        className="mt-3 w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium active:scale-[.98] transition-transform flex items-center justify-center gap-2"
      >
        {saved && <Check size={15} />}
        {saved ? "Saved" : "Save profile"}
      </button>
    </section>
  );
}

// ─── Section: Appearance ─────────────────────────────────────────────────────

function AppearanceSection({ profile }: { profile: UserProfile | undefined }) {
  const theme: Theme = (profile?.theme ?? "dark") as Theme;

  async function setTheme(t: Theme) {
    await db.userProfile.update(1, { theme: t });
  }

  return (
    <section className="px-4 pb-2">
      <SectionHeader>Appearance</SectionHeader>
      <div className="bg-card rounded-2xl p-4">
        <SegmentedControl<Theme>
          value={theme}
          onChange={setTheme}
          options={[
            { value: "dark", label: "Dark", icon: <Moon size={13} /> },
            { value: "light", label: "Light", icon: <Sun size={13} /> },
            { value: "system", label: "System", icon: <Monitor size={13} /> },
          ]}
        />
      </div>
    </section>
  );
}

// ─── Section: Units ──────────────────────────────────────────────────────────

function UnitsSection({ profile }: { profile: UserProfile | undefined }) {
  const unit = profile?.units ?? "kg";

  async function setUnit(u: "kg" | "lbs") {
    await db.userProfile.update(1, { units: u });
  }

  return (
    <section className="px-4 pb-2">
      <SectionHeader>Units</SectionHeader>
      <div className="bg-card rounded-2xl p-4">
        <SegmentedControl<"kg" | "lbs">
          value={unit}
          onChange={setUnit}
          options={[
            { value: "kg", label: "Kilograms (kg)" },
            { value: "lbs", label: "Pounds (lbs)" },
          ]}
        />
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
          Stored values always stay in kg. This setting converts all displayed weights throughout the app.
        </p>
      </div>
    </section>
  );
}

// ─── Section: Notifications ──────────────────────────────────────────────────

function NotificationsSection({
  prefs,
  workoutDays,
}: {
  prefs: NotificationPrefs;
  workoutDays: number[];
}) {
  const [local, setLocal] = useState<NotificationPrefs>(prefs);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [requesting, setRequesting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showWorkoutTimes, setShowWorkoutTimes] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    setLocal(prefs);
  }, [prefs]);

  async function requestPerm() {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    setRequesting(false);
    if (result === "granted" && !local.enabled) {
      const next = { ...local, enabled: true };
      setLocal(next);
      await db.userProfile.update(1, { notificationPrefs: next });
    }
  }

  async function persist(next: NotificationPrefs) {
    setLocal(next);
    await db.userProfile.update(1, { notificationPrefs: next });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function toggle(key: keyof Omit<NotificationPrefs, "workoutTimes">) {
    persist({ ...local, [key]: !local[key] });
  }

  function setWorkoutTime(dow: number, time: string) {
    persist({ ...local, workoutTimes: { ...local.workoutTimes, [String(dow)]: time } });
  }

  const masterBlocked = permission === "denied";
  const masterOff = !local.enabled;

  return (
    <section className="px-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <SectionHeader>Notifications</SectionHeader>
        {saved && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      {permission !== "granted" && (
        <div className="mb-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
          <p className="text-sm text-yellow-300 mb-1 font-medium">
            {masterBlocked ? "Notifications blocked" : "Enable browser notifications"}
          </p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            {masterBlocked
              ? "Notifications are blocked by your browser. Open browser settings → Site settings to allow them for this app."
              : "Allow notifications to get workout reminders, protein nudges, and supplement reminders. We never spam — one notification per type, per day."}
          </p>
          {!masterBlocked && (
            <button
              onClick={requestPerm}
              disabled={requesting}
              className="text-sm font-medium text-yellow-300 bg-yellow-500/20 px-4 py-1.5 rounded-lg active:scale-[.98] transition-transform"
            >
              {requesting ? "Requesting…" : "Allow notifications"}
            </button>
          )}
        </div>
      )}

      {permission === "granted" && (
        <div className="mb-3 flex items-center gap-2 text-xs text-green-400">
          <Bell size={13} /> {permissionLabel(permission)}
        </div>
      )}

      <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden">
        <Field label="Enable all notifications">
          <Toggle
            on={local.enabled && permission === "granted"}
            onClick={() => {
              if (permission !== "granted") { requestPerm(); return; }
              toggle("enabled");
            }}
          />
        </Field>

        <div>
          <Field label="Workout reminders" muted={masterOff || masterBlocked}>
            <div className="flex items-center gap-2">
              <Toggle
                on={local.workoutReminders && local.enabled && permission === "granted"}
                onClick={() => { if (masterOff || masterBlocked) return; toggle("workoutReminders"); }}
                disabled={masterOff || masterBlocked}
              />
              {local.workoutReminders && !masterOff && !masterBlocked && (
                <button
                  onClick={() => setShowWorkoutTimes((v) => !v)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showWorkoutTimes ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              )}
            </div>
          </Field>

          {showWorkoutTimes && local.workoutReminders && !masterOff && !masterBlocked && (
            <div className="px-4 pb-3 space-y-2 border-t border-border">
              <p className="pt-2 text-xs text-muted-foreground">Set a reminder time for each workout day:</p>
              {workoutDays.length === 0 && (
                <p className="text-xs text-muted-foreground italic">No workout days in active plan.</p>
              )}
              {workoutDays.map((dow) => (
                <div key={dow} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{DAY_LABELS[dow]}</span>
                  <input
                    type="time"
                    value={local.workoutTimes[String(dow)] ?? "07:00"}
                    onChange={(e) => setWorkoutTime(dow, e.target.value)}
                    className="bg-background border border-border rounded-lg px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <Field label="Evening protein nudge (8 PM)" sub="Reminds you if you haven't hit 80% of your target" muted={masterOff || masterBlocked}>
          <Toggle
            on={local.proteinNudge && local.enabled && permission === "granted"}
            onClick={() => { if (masterOff || masterBlocked) return; toggle("proteinNudge"); }}
            disabled={masterOff || masterBlocked}
          />
        </Field>

        <Field label="Supplement reminder (9 PM)" sub="Reminds you to take creatine if not logged" muted={masterOff || masterBlocked}>
          <Toggle
            on={local.supplementReminder && local.enabled && permission === "granted"}
            onClick={() => { if (masterOff || masterBlocked) return; toggle("supplementReminder"); }}
            disabled={masterOff || masterBlocked}
          />
        </Field>
      </div>
    </section>
  );
}

// ─── Section: About & Reset ───────────────────────────────────────────────────

function AboutSection() {
  const [exporting, setExporting] = useState(false);
  const [resetStep, setResetStep] = useState<0 | 1 | 2>(0);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState("");

  const handleExport = useCallback(async () => {
    setExporting(true);
    setError("");
    try {
      const [
        exercises, workoutPlans, workoutSessions, loggedExercises,
        actionItems, actionItemLogs, proteinEntries, bodyweightEntries,
        bodyMeasurements, userProfile, prLogs,
      ] = await Promise.all([
        db.exercises.toArray(), db.workoutPlans.toArray(),
        db.workoutSessions.toArray(), db.loggedExercises.toArray(),
        db.actionItems.toArray(), db.actionItemLogs.toArray(),
        db.proteinEntries.toArray(), db.bodyweightEntries.toArray(),
        db.bodyMeasurements.toArray(), db.userProfile.toArray(), db.prLogs.toArray(),
      ]);

      const blob = new Blob(
        [JSON.stringify({
          exportedAt: new Date().toISOString(), version: 2,
          exercises, workoutPlans, workoutSessions, loggedExercises,
          actionItems, actionItemLogs, proteinEntries, bodyweightEntries,
          bodyMeasurements, userProfile, prLogs,
        }, null, 2)],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fittrack-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError("Export failed: " + String(e));
    } finally {
      setExporting(false);
    }
  }, []);

  const handleReset = useCallback(async () => {
    if (resetStep < 2) { setResetStep((s) => (s + 1) as 0 | 1 | 2); return; }
    setResetting(true);
    setError("");
    try {
      await Promise.all([
        db.workoutSessions.clear(), db.loggedExercises.clear(),
        db.actionItemLogs.clear(), db.proteinEntries.clear(),
        db.bodyweightEntries.clear(), db.bodyMeasurements.clear(),
        db.prLogs.clear(),
      ]);
      setResetStep(0);
    } catch (e) {
      setError("Reset failed: " + String(e));
    } finally {
      setResetting(false);
    }
  }, [resetStep]);

  const resetLabel =
    resetStep === 0 ? "Reset All Data" :
    resetStep === 1 ? "Are you sure? Tap again to confirm" :
    "This cannot be undone — tap to erase";

  return (
    <section className="px-4 pb-8">
      <SectionHeader>About & Data</SectionHeader>
      <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden mb-3">
        <div className="px-4 py-3.5">
          <p className="text-sm text-foreground">FitTrack</p>
          <p className="text-xs text-muted-foreground mt-0.5">PWA — data stored locally in IndexedDB</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/40 transition-colors disabled:opacity-40"
        >
          <Download size={16} className="text-blue-400 shrink-0" />
          <span className="text-sm text-foreground text-left flex-1">
            {exporting ? "Exporting…" : "Export data to JSON"}
          </span>
        </button>
      </div>

      {error && <p className="text-xs text-red-400 mb-3 px-1">{error}</p>}

      <button
        onClick={handleReset}
        disabled={resetting}
        className={`w-full py-3 rounded-2xl text-sm font-semibold border transition-colors active:scale-[.98] ${
          resetStep > 0
            ? "bg-red-500/20 border-red-500/40 text-red-300"
            : "bg-card border-border text-red-400 hover:bg-red-500/10"
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          <Trash2 size={15} />
          {resetting ? "Resetting…" : resetLabel}
        </span>
      </button>
      {resetStep > 0 && (
        <button onClick={() => setResetStep(0)} className="mt-2 w-full text-xs text-muted-foreground py-2">
          Cancel
        </button>
      )}
      <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
        Exercises, plans, and settings are preserved. Only your logged sessions and entries are erased.
      </p>
    </section>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsScreen() {
  const profile = useLiveQuery(() => db.userProfile.get(1));

  const activePlan = useLiveQuery(async () => {
    const p = await db.userProfile.get(1);
    if (!p?.activePlanId) return null;
    return db.workoutPlans.get(p.activePlanId) ?? null;
  });

  const workoutDays: number[] =
    activePlan?.days.filter((d) => d.type === "workout").map((d) => d.dayOfWeek) ?? [];

  const prefs: NotificationPrefs = profile?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;

  return (
    <div className="min-h-svh bg-background pb-8">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/more" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="space-y-6 pt-5">
        {profile !== undefined && <ProfileSection profile={profile} />}
        {profile !== undefined && <AppearanceSection profile={profile} />}
        {profile !== undefined && <UnitsSection profile={profile} />}
        <NotificationsSection prefs={prefs} workoutDays={workoutDays} />
        <AboutSection />
      </div>
    </div>
  );
}
