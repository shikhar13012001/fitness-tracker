"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

// ─── Audio ───────────────────────────────────────────────────────────────────

function playBeep() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctx = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx() as AudioContext;
    // Three short ascending beeps
    const freqs = [660, 880, 1100];
    freqs.forEach((freq, i) => {
      const delay = i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.4, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        ctx.currentTime + delay + 0.3
      );
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    });
  } catch {
    /* AudioContext unavailable */
  }
}

function triggerVibration() {
  try {
    navigator.vibrate?.([200, 80, 200, 80, 300]);
  } catch {
    /* vibrate unavailable */
  }
}

// ─── Context type ─────────────────────────────────────────────────────────────

export interface RestTimerState {
  active: boolean;
  paused: boolean;
  remaining: number; // seconds
  total: number; // seconds (the full duration this run)
  start: (seconds: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  addTime: (seconds: number) => void;
}

const RestTimerContext = createContext<RestTimerState | null>(null);

export function useRestTimer(): RestTimerState {
  const ctx = useContext(RestTimerContext);
  if (!ctx) throw new Error("useRestTimer must be used inside RestTimerProvider");
  return ctx;
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [total, setTotal] = useState(90);

  const workerRef = useRef<Worker | null>(null);
  // The absolute timestamp (ms) when the timer will/would reach zero
  const endAtRef = useRef<number>(0);
  // How many seconds were left when we paused
  const pausedRemainingRef = useRef<number>(0);

  // ── Spawn worker (browser only) ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const worker = new Worker("/rest-timer.worker.js");

    worker.onmessage = (e: MessageEvent<{ type: string; remaining: number }>) => {
      const { type, remaining: r } = e.data;
      if (type === "tick") {
        setRemaining(r);
      } else if (type === "done") {
        setActive(false);
        setPaused(false);
        setRemaining(0);
        playBeep();
        triggerVibration();
      }
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  // ── Re-sync when tab becomes visible again ───────────────────────────────
  useEffect(() => {
    function onVisible() {
      if (document.visibilityState !== "visible") return;
      if (!active || paused || !workerRef.current) return;
      // Re-send the same endAt — worker recalculates remaining correctly
      workerRef.current.postMessage({ type: "start", endAt: endAtRef.current });
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [active, paused]);

  // ── Actions ──────────────────────────────────────────────────────────────
  const start = useCallback((seconds: number) => {
    const endAt = Date.now() + seconds * 1000;
    endAtRef.current = endAt;
    setTotal(seconds);
    setRemaining(seconds);
    setActive(true);
    setPaused(false);
    workerRef.current?.postMessage({ type: "start", endAt });
  }, []);

  const pause = useCallback(() => {
    if (!active || paused) return;
    const rem = Math.max(0, Math.ceil((endAtRef.current - Date.now()) / 1000));
    pausedRemainingRef.current = rem;
    workerRef.current?.postMessage({ type: "pause" });
    setPaused(true);
    setRemaining(rem);
  }, [active, paused]);

  const resume = useCallback(() => {
    if (!active || !paused) return;
    const endAt = Date.now() + pausedRemainingRef.current * 1000;
    endAtRef.current = endAt;
    workerRef.current?.postMessage({ type: "resume", endAt });
    setPaused(false);
  }, [active, paused]);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" });
    setActive(false);
    setPaused(false);
    setRemaining(0);
  }, []);

  const addTime = useCallback(
    (seconds: number) => {
      if (!active) return;
      if (paused) {
        // Extend from the paused position
        const newRem = pausedRemainingRef.current + seconds;
        pausedRemainingRef.current = newRem;
        setRemaining(newRem);
        // Also shift the stored endAt so resume computes correctly
        endAtRef.current = endAtRef.current + seconds * 1000;
      } else {
        const newEndAt = endAtRef.current + seconds * 1000;
        endAtRef.current = newEndAt;
        workerRef.current?.postMessage({ type: "start", endAt: newEndAt });
      }
      setTotal((t) => t + seconds);
    },
    [active, paused]
  );

  return (
    <RestTimerContext.Provider
      value={{ active, paused, remaining, total, start, pause, resume, stop, addTime }}
    >
      {children}
    </RestTimerContext.Provider>
  );
}
