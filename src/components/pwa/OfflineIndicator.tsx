'use client';

import { useEffect, useRef, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { usePWA } from '@/context/PWAContext';

type BannerState = 'hidden' | 'offline' | 'reconnected';

export function OfflineIndicator() {
  const { isOnline } = usePWA();
  const [banner, setBanner] = useState<BannerState>('hidden');
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);

    if (!isOnline) {
      setBanner('offline');
    } else if (banner === 'offline') {
      // Was offline, now back — show confirmation briefly then hide
      setBanner('reconnected');
      dismissTimer.current = setTimeout(() => setBanner('hidden'), 2500);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  // banner intentionally omitted — we only want to react to isOnline changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  if (banner === 'hidden') return null;

  const isOffline = banner === 'offline';

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'fixed top-0 inset-x-0 z-[60] flex items-center gap-2 px-4 py-2 text-sm',
        'backdrop-blur-sm',
        isOffline
          ? 'bg-amber-950/95 text-amber-100 border-b border-amber-800/50'
          : 'bg-emerald-950/95 text-emerald-100 border-b border-emerald-800/50',
      ].join(' ')}
    >
      {isOffline
        ? <WifiOff className="w-4 h-4 shrink-0" aria-hidden />
        : <Wifi className="w-4 h-4 shrink-0" aria-hidden />}
      <span>
        {isOffline
          ? "You're offline — workouts save locally, nothing is lost."
          : 'Back online.'}
      </span>
    </div>
  );
}
