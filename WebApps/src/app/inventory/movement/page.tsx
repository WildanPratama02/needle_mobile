import { AppShell } from "@/shared/components/app-shell";
import { StockMovementScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

/** `?referenceId=` narrows the ledger to one operation's movements — the Receiving detail links here. */
export default function StockMovementPage({
  searchParams,
}: {
  searchParams?: { referenceId?: string | string[] };
}) {
  const referenceId = typeof searchParams?.referenceId === "string" ? searchParams.referenceId : undefined;
  return (
    <RequireAuth>
      <AppShell>
        <StockMovementScreen referenceId={referenceId} />
      </AppShell>
    </RequireAuth>
  );
}
