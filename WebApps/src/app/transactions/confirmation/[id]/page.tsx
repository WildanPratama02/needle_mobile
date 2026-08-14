import { AppShell } from "@/shared/components/app-shell";
import { ConfirmationDetailScreen } from "@/features/confirmation";
import { RequireAuth } from "@/features/auth";

export default function ConfirmationDetailPage({ params }: { params: { id: string } }) {
  return (
    <RequireAuth>
      <AppShell>
        <ConfirmationDetailScreen confirmationId={params.id} />
      </AppShell>
    </RequireAuth>
  );
}
