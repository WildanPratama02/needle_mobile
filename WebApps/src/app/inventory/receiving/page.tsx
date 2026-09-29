import { AppShell } from "@/shared/components/app-shell";
import { ReceivingScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

/** `?id=` opens that receiving's detail — the Stock Movement ledger links here. */
export default function ReceivingPage({ searchParams }: { searchParams?: { id?: string | string[] } }) {
  const id = typeof searchParams?.id === "string" ? searchParams.id : undefined;
  return (
    <RequireAuth>
      <AppShell>
        <ReceivingScreen initialDetailId={id} />
      </AppShell>
    </RequireAuth>
  );
}
