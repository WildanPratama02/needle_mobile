import { AppShell } from "@/shared/components/app-shell";
import { DashboardScreen } from "@/features/dashboard";
import { RequireAuth } from "@/features/auth";

export default function DashboardPage() {
  return (
    <RequireAuth>
      <AppShell>
        <DashboardScreen />
      </AppShell>
    </RequireAuth>
  );
}
