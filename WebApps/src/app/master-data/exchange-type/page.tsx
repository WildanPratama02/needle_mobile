import { AppShell } from "@/shared/components/app-shell";
import { ExchangeTypeScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function ExchangeTypePage() {
  return (
    <RequireAuth>
      <AppShell>
        <ExchangeTypeScreen />
      </AppShell>
    </RequireAuth>
  );
}
