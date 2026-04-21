"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowLeft, Bell, Check, ChevronDown, ChevronUp } from "lucide-react";
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function permissionLabel(p: NotificationPermission): string {
  if (p === "granted") return "Granted ✓";
  if (p === "denied") return "Blocked — enable in browser settings";
  return "Not requested";
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

function ProfileSection({
  profile,
}: {
  profile: UserProfile | undefined;
}) {
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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Profile
      </h2>
      <div className="bg-card rounded-2xl divide-y divide-border overflow-hidden">
        <Field label="Height (cm)">
          <input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-24 text-right bg-transparent text-sm text-foreground focus:outline-none"
          />
        </Field>
        <Field label="Daily protein target (g)">
          <input
            type="number"
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
        {saved ? <Check size={15} /> : null}
        {saved ? "Saved" : "Save profile"}
      </button>
    </section>
  );
}

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

  // keep local in sync if parent re-renders
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
    const next: NotificationPrefs = {
      ...local,
      workoutTimes: { ...local.workoutTimes, [String(dow)]: time },
    };
    persist(next);
  }

  const masterBlocked = permission === "denied";
  const masterOff = !local.enabled;

  return (
    <section className="px-4 pb-2">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Notifications
        </h2>
        {saved && (
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Check size={12} /> Saved
          </span>
        )}
      </div>

      {/* Permission banner */}
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
        {/* Master toggle */}
        <Field label="Enable all notifications">
          <Toggle
            on={local.enabled && permission === "granted"}
            onClick={() => {
              if (permission !== "granted") {
                requestPerm();
                return;
              }
              toggle("enabled");
            }}
          />
        </Field>

        {/* Workout reminders */}
        <div>
          <Field label="Workout reminders" muted={masterOff || masterBlocked}>
            <div className="flex items-center gap-2">
              <Toggle
                on={local.workoutReminders && local.enabled && permission === "granted"}
                onClick={() => {
                  if (masterOff || masterBlocked) return;
                  toggle("workoutReminders");
                }}
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
              <p className="pt-2 text-xs text-muted-foreground">
                Set a daily reminder time for each workout day:
              </p>
              {workoutDays.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  No workout days in active plan.
                </p>
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

        {/* Protein nudge */}
        <Field
          label="Evening protein nudge (8 PM)"
          sub="Reminds you if you haven't hit 80% of your target"
          muted={masterOff || masterBlocked}
        >
          <Toggle
            on={local.proteinNudge && local.enabled && permission === "granted"}
            onClick={() => {
              if (masterOff || masterBlocked) return;
              toggle("proteinNudge");
            }}
            disabled={masterOff || masterBlocked}
          />
        </Field>

        {/* Supplement reminder */}
        <Field
          label="Supplement reminder (9 PM)"
          sub="Reminds you to take creatine if not logged"
          muted={masterOff || masterBlocked}
        >
          <Toggle
            on={local.supplementReminder && local.enabled && permission === "granted"}
            onClick={() => {
              if (masterOff || masterBlocked) return;
              toggle("supplementReminder");
            }}
            disabled={masterOff || masterBlocked}
          />
        </Field>
      </div>
    </section>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────

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

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsScreen() {
  const profile = useLiveQuery(() => db.userProfile.get(1));

  const activePlan = useLiveQuery(async () => {
    const p = await db.userProfile.get(1);
    if (!p?.activePlanId) return null;
    return db.workoutPlans.get(p.activePlanId) ?? null;
  });

  const workoutDays: number[] =
    activePlan?.days
      .filter((d) => d.type === "workout")
      .map((d) => d.dayOfWeek) ?? [];

  const prefs: NotificationPrefs = profile?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;

  return (
    <div className="min-h-svh bg-background pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Link href="/more" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      <div className="space-y-6 pt-5">
        {profile !== undefined && <ProfileSection profile={profile} />}
        <NotificationsSection prefs={prefs} workoutDays={workoutDays} />
      </div>
    </div>
  );
}
