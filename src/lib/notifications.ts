/**
 * notifications.ts
 *
 * Utilities for browser notification permission, display, and same-day
 * scheduling via setTimeout (no server push required).
 *
 * Design: when the app is open/visible the scheduler arms setTimeout handles
 * for each pending notification today. Closing the tab cancels them — this is
 * intentional; we rely on the user opening the app daily (fitness use-case).
 */

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "denied";
  return Notification.permission;
}

// ─── Display ──────────────────────────────────────────────────────────────────

/**
 * Show a notification. Prefers SW registration `showNotification` (works when
 * tab is backgrounded on Android PWA) and falls back to `new Notification`.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  tag: string
): Promise<void> {
  if (typeof window === "undefined") return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker?.ready;
    if (reg) {
      await reg.showNotification(title, {
        body,
        tag,
        icon: "/icons/icon-192.svg",
        badge: "/icons/icon-192.svg",
        silent: false,
      });
      return;
    }
  } catch {
    // SW not available — fall through
  }
  new Notification(title, { body, tag, icon: "/icons/icon-192.svg" });
}

// ─── Scheduling ───────────────────────────────────────────────────────────────

/** Parse "HH:MM" into a timestamp for today in local time. Returns null if invalid. */
export function todayAt(hhmm: string): number | null {
  const [hh, mm] = hhmm.split(":").map(Number);
  if (isNaN(hh) || isNaN(mm)) return null;
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
}

/** How many ms until a given ms timestamp? Negative if already past. */
function msUntil(ts: number): number {
  return ts - Date.now();
}

export interface NotificationScheduleParams {
  prefs: {
    enabled: boolean;
    workoutReminders: boolean;
    workoutTimes: Partial<Record<string, string>>;
    proteinNudge: boolean;
    supplementReminder: boolean;
  };
  // Today's context
  todayDow: number;           // 0=Sun … 6=Sat
  isWorkoutDay: boolean;
  sessionStarted: boolean;    // true if a session exists for today
  dayName: string;            // e.g. "Push"
  exerciseCount: number;
  proteinTotal: number;       // g logged today
  proteinTarget: number;      // g target
  creatineLogged: boolean;
}

/**
 * Arm setTimeout handles for today's pending notifications.
 * Returns a cleanup function that cancels all handles.
 */
export function scheduleTodayNotifications(
  params: NotificationScheduleParams
): () => void {
  const handles: ReturnType<typeof setTimeout>[] = [];

  if (!params.prefs.enabled) return () => {};

  // ── 6.2 Workout reminder ─────────────────────────────────────────────────
  if (
    params.prefs.workoutReminders &&
    params.isWorkoutDay &&
    !params.sessionStarted
  ) {
    const timeStr = params.prefs.workoutTimes[String(params.todayDow)];
    if (timeStr) {
      const fireAt = todayAt(timeStr);
      if (fireAt !== null) {
        const delay = msUntil(fireAt);
        if (delay > 0) {
          const estMin = Math.round(params.exerciseCount * 8);
          handles.push(
            setTimeout(
              () =>
                showLocalNotification(
                  `Time for ${params.dayName} Day 💪`,
                  `${params.exerciseCount} exercises — est. ${estMin} min. Let's go!`,
                  "workout-reminder"
                ),
              delay
            )
          );
        }
      }
    }
  }

  // ── 6.3 Protein evening nudge — 20:00 ────────────────────────────────────
  if (params.prefs.proteinNudge) {
    const fireAt = todayAt("20:00");
    if (fireAt !== null) {
      const delay = msUntil(fireAt);
      const pct = params.proteinTarget > 0 ? params.proteinTotal / params.proteinTarget : 1;
      if (delay > 0 && pct < 0.8) {
        const gap = Math.round(params.proteinTarget - params.proteinTotal);
        handles.push(
          setTimeout(
            () =>
              showLocalNotification(
                "Protein check 🥤",
                `${params.proteinTotal} g so far — ${gap} g to go. One shake would close the gap.`,
                "protein-nudge"
              ),
            delay
          )
        );
      }
    }
  }

  // ── 6.4 Supplement reminder — 21:00 ──────────────────────────────────────
  if (params.prefs.supplementReminder && !params.creatineLogged) {
    const fireAt = todayAt("21:00");
    if (fireAt !== null) {
      const delay = msUntil(fireAt);
      if (delay > 0) {
        handles.push(
          setTimeout(
            () =>
              showLocalNotification(
                "Creatine pending ⚡",
                "5 g before bed works fine — don't skip it.",
                "creatine-reminder"
              ),
            delay
          )
        );
      }
    }
  }

  return () => handles.forEach(clearTimeout);
}
