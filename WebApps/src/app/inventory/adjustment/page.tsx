import { AppShell } from "@/shared/components/app-shell";
import { AdjustmentScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function AdjustmentPage() {
  return (
    <RequireAuth>
      <AppShell>
        <AdjustmentScreen />
      </AppShell>
    </RequireAuth>
  );
}
