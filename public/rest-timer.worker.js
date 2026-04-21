/**
 * rest-timer.worker.js
 *
 * Runs in a dedicated Web Worker so it is NOT throttled when the tab is
 * backgrounded or the phone screen locks.
 *
 * Protocol
 * ─────────
 * IN   { type: 'start',  endAt: number }   — absolute ms timestamp when rest ends
 * IN   { type: 'pause' }
 * IN   { type: 'resume', endAt: number }   — new endAt after re-calculating from paused remaining
 * IN   { type: 'stop' }
 *
 * OUT  { type: 'tick', remaining: number } — every ~250 ms while running
 * OUT  { type: 'done' }                    — when remaining reaches 0
 */

let intervalId = null;

function tick(endAt) {
  const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
  self.postMessage({ type: "tick", remaining });
  if (remaining <= 0) {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    self.postMessage({ type: "done" });
  }
}

self.onmessage = function (e) {
  const { type, endAt } = e.data;

  if (type === "start" || type === "resume") {
    if (intervalId !== null) clearInterval(intervalId);
    // Tick immediately so the UI updates at once, then every 250 ms
    tick(endAt);
    intervalId = setInterval(() => tick(endAt), 250);
  } else if (type === "pause" || type === "stop") {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }
};
