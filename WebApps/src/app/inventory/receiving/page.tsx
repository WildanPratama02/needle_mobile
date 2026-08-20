import { AppShell } from "@/shared/components/app-shell";
import { ReceivingScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function ReceivingPage() {
  return (
    <RequireAuth>
      <AppShell>
        <ReceivingScreen />
      </AppShell>
    </RequireAuth>
  );
}
