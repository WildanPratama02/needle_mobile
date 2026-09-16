import { AppShell } from "@/shared/components/app-shell";
import { TransferScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

/** `?id=` opens that transfer's detail — the Stock Movement ledger links here. */
export default function TransferPage({ searchParams }: { searchParams?: { id?: string | string[] } }) {
  const id = typeof searchParams?.id === "string" ? searchParams.id : undefined;
  return (
    <RequireAuth>
      <AppShell>
        <TransferScreen initialDetailId={id} />
      </AppShell>
    </RequireAuth>
  );
}
