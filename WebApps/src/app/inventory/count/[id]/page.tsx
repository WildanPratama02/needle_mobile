import { AppShell } from "@/shared/components/app-shell";
import { CountSessionDetailScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function CountSessionDetailPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth>
      <AppShell>
        <CountSessionDetailScreen sessionId={params.id} />
      </AppShell>
    </RequireAuth>
  );
}
