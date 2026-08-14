import { AppShell } from "@/shared/components/app-shell";
import { AuditLogScreen } from "@/features/audit";
import { RequireAuth } from "@/features/auth";

export default function AuditLogPage() {
  return (
    <RequireAuth>
      <AppShell>
        <AuditLogScreen />
      </AppShell>
    </RequireAuth>
  );
}
