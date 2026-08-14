import { AppShell } from "@/shared/components/app-shell";
import { ConfirmationMonitoringScreen } from "@/features/confirmation";
import { RequireAuth } from "@/features/auth";

export default function ConfirmationMonitoringPage() {
  return (
    <RequireAuth>
      <AppShell>
        <ConfirmationMonitoringScreen />
      </AppShell>
    </RequireAuth>
  );
}
