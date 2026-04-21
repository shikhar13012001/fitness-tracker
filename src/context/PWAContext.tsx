'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextValue {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isInstalled: boolean;
  isOnline: boolean;
  clearPrompt: () => void;
}

const PWAContext = createContext<PWAContextValue>({
  deferredPrompt: null,
  isInstalled: false,
  isOnline: true,
  clearPrompt: () => {},
});

export function PWAProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  // Start optimistic (true) to avoid SSR flash; corrected on first client effect.
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // next-pwa is disabled in development; only register in production.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    setIsOnline(navigator.onLine);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <PWAContext.Provider value={{ deferredPrompt, isInstalled, isOnline, clearPrompt: () => setDeferredPrompt(null) }}>
      {children}
    </PWAContext.Provider>
  );
}

export const usePWA = () => useContext(PWAContext);
