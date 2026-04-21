"use client";

/**
 * NotificationScheduler
 *
 * Null-rendering client component mounted once in the app layout.
 * Live-queries today's context from Dexie and re-arms setTimeout handles
 * whenever any relevant value changes or the tab regains focus.
 */

import { useEffect, useRef } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { todayString } from "@/lib/dateUtils";
import { scheduleTodayNotifications } from "@/lib/notifications";
import type { NotificationPrefs } from "@/lib/db";
import { DEFAULT_NOTIFICATION_PREFS } from "@/lib/db";

export function NotificationScheduler() {
  const today = todayString();
  const dow = new Date().getDay();

  const profile = useLiveQuery(() => db.userProfile.get(1));

  const activePlan = useLiveQuery(async () => {
    const p = await db.userProfile.get(1);
    if (!p?.activePlanId) return null;
    return db.workoutPlans.get(p.activePlanId) ?? null;
  });

  const todaySession = useLiveQuery(
    () => db.workoutSessions.where("date").equals(today).first(),
    [today]
  );

  const proteinEntries = useLiveQuery(
    () => db.proteinEntries.where("date").equals(today).toArray(),
    [today]
  );

  const actionLogs = useLiveQuery(
    () => db.actionItemLogs.where("date").equals(today).toArray(),
    [today]
  );

  const actionItems = useLiveQuery(() => db.actionItems.toArray());

  const cleanupRef = useRef<(() => void) | null>(null);

  function arm() {
    // Cancel previous handles
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (
      profile === undefined ||
      activePlan === undefined ||
      proteinEntries === undefined ||
      actionLogs === undefined ||
      actionItems === undefined
    )
      return;

    const prefs: NotificationPrefs = profile?.notificationPrefs ?? DEFAULT_NOTIFICATION_PREFS;
    if (!prefs.enabled) return;

    const todayPlan = activePlan?.days[dow] ?? null;
    const isWorkoutDay = todayPlan?.type === "workout";
    const exerciseCount = todayPlan?.plannedExercises.length ?? 0;
    const dayName = todayPlan?.name ?? "Workout";

    const proteinTotal = (proteinEntries ?? []).reduce((s, e) => s + e.grams, 0);
    const proteinTarget = profile?.proteinTargetG ?? 130;

    // Find creatine action item and check if it's logged today
    const creatineItem = (actionItems ?? []).find(
      (i) => i.name.toLowerCase().includes("creatine")
    );
    const creatineLogged = creatineItem
      ? (actionLogs ?? []).some((l) => l.actionItemId === creatineItem.id)
      : true; // No creatine item → skip reminder

    const cleanup = scheduleTodayNotifications({
      prefs,
      todayDow: dow,
      isWorkoutDay,
      sessionStarted: !!todaySession,
      dayName,
      exerciseCount,
      proteinTotal,
      proteinTarget,
      creatineLogged,
    });

    cleanupRef.current = cleanup;
  }

  // Re-arm whenever live data changes
  useEffect(() => {
    arm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, activePlan, todaySession, proteinEntries, actionLogs, actionItems]);

  // Re-arm when tab regains focus (handles "checked after midnight" scenario)
  useEffect(() => {
    const onFocus = () => arm();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, activePlan, todaySession, proteinEntries, actionLogs, actionItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupRef.current?.();
  }, []);

  return null;
}
