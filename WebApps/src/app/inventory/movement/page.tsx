import { AppShell } from "@/shared/components/app-shell";
import { StockMovementScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function StockMovementPage() {
  return (
    <RequireAuth>
      <AppShell>
        <StockMovementScreen />
      </AppShell>
    </RequireAuth>
  );
}
