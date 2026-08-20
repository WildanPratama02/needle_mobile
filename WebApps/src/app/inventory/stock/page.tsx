import { AppShell } from "@/shared/components/app-shell";
import { StockOverviewScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function StockOverviewPage() {
  return (
    <RequireAuth>
      <AppShell>
        <StockOverviewScreen />
      </AppShell>
    </RequireAuth>
  );
}
