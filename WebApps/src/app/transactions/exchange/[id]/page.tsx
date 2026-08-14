import { AppShell } from "@/shared/components/app-shell";
import { ExchangeDetailScreen } from "@/features/transactions";
import { RequireAuth } from "@/features/auth";

export default function ExchangeDetailPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth>
      <AppShell>
        <ExchangeDetailScreen exchangeId={params.id} />
      </AppShell>
    </RequireAuth>
  );
}
