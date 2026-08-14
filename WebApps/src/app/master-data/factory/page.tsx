import { AppShell } from "@/shared/components/app-shell";
import { FactoryScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function FactoryPage() {
  return (
    <RequireAuth>
      <AppShell>
        <FactoryScreen />
      </AppShell>
    </RequireAuth>
  );
}
