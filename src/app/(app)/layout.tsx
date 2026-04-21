import { BottomNav } from "@/components/nav/BottomNav";
import { RestTimerProvider } from "@/context/RestTimerContext";
import { FloatingRestTimer } from "@/components/session/FloatingRestTimer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <RestTimerProvider>
      <div className="flex flex-col min-h-svh">
        <main className="flex-1 overflow-y-auto pb-16">
          {children}
        </main>
        <BottomNav />
        <FloatingRestTimer />
      </div>
    </RestTimerProvider>
  );
}
