'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { usePWA } from '@/context/PWAContext';
import { db } from '@/lib/db';

const DISMISSED_KEY = 'pwa-install-dismissed';
const SESSION_THRESHOLD = 3;

export function InstallPrompt() {
  const { deferredPrompt, isInstalled, clearPrompt } = usePWA();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!deferredPrompt || isInstalled) return;
    if (typeof localStorage !== 'undefined' && localStorage.getItem(DISMISSED_KEY)) return;

    db.workoutSessions.count().then((count) => {
      if (count >= SESSION_THRESHOLD) setVisible(true);
    });
  }, [deferredPrompt, isInstalled]);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      clearPrompt();
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-card border border-border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
            <rect x="5" y="15" width="6" height="10" rx="1.5" fill="white" />
            <rect x="29" y="15" width="6" height="10" rx="1.5" fill="white" />
            <rect x="11" y="18" width="18" height="4" rx="2" fill="white" />
            <rect x="14" y="16" width="3" height="8" rx="1" fill="#a1a1aa" />
            <rect x="23" y="16" width="3" height="8" rx="1" fill="#a1a1aa" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-foreground leading-tight">Add to Home Screen</p>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground shrink-0 -mt-0.5"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-snug">
            Install FitTrack for instant launch, offline workouts, and reliable rest-timer alerts.
          </p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleInstall}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-medium active:opacity-80"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
        <button
          onClick={handleDismiss}
          className="px-4 rounded-xl border border-border text-sm text-muted-foreground active:opacity-80"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
