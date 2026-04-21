import { BottomNav } from "@/components/nav/BottomNav";
import { RestTimerProvider } from "@/context/RestTimerContext";
import { FloatingRestTimer } from "@/components/session/FloatingRestTimer";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RestTimerProvider>
      <div className="flex flex-col min-h-svh">
        <OfflineIndicator />
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        <BottomNav />
        <FloatingRestTimer />
        <InstallPrompt />
      </div>
    </RestTimerProvider>
  );
}
