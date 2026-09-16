import { AppShell } from "@/shared/components/app-shell";
import { AdjustmentScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

/** `?id=` (an ADJUSTMENT movement id) opens that adjustment's detail — the ledger and count sessions link here. */
export default function AdjustmentPage({ searchParams }: { searchParams?: { id?: string | string[] } }) {
  const id = typeof searchParams?.id === "string" ? searchParams.id : undefined;
  return (
    <RequireAuth>
      <AppShell>
        <AdjustmentScreen initialDetailId={id} />
      </AppShell>
    </RequireAuth>
  );
}
