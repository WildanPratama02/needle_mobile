import { AppShell } from "@/shared/components/app-shell";
import { RoleDetailScreen } from "@/features/administration";
import { RequireAuth } from "@/features/auth";

export default function RoleDetailPage({ params }: { params: { code: string } }) {
  return (
    <RequireAuth>
      <AppShell>
        <RoleDetailScreen code={params.code} />
      </AppShell>
    </RequireAuth>
  );
}
