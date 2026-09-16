import { AppShell } from "@/shared/components/app-shell";
import { ReturnScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

/** `?id=` opens that return's detail — the Stock Movement ledger links here. */
export default function ReturnPage({ searchParams }: { searchParams?: { id?: string | string[] } }) {
  const id = typeof searchParams?.id === "string" ? searchParams.id : undefined;
  return (
    <RequireAuth>
      <AppShell>
        <ReturnScreen initialDetailId={id} />
      </AppShell>
    </RequireAuth>
  );
}
