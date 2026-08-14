import { AppShell } from "@/shared/components/app-shell";
import { ExchangeTransactionsScreen } from "@/features/transactions";
import { RequireAuth } from "@/features/auth";

export default function ExchangeTransactionsPage() {
  return (
    <RequireAuth>
      <AppShell>
        <ExchangeTransactionsScreen />
      </AppShell>
    </RequireAuth>
  );
}
