import { AppShell } from "@/shared/components/app-shell";
import { RolesScreen } from "@/features/administration";
import { RequireAuth } from "@/features/auth";

export default function RolesPage() {
  return (
    <RequireAuth>
      <AppShell>
        <RolesScreen />
      </AppShell>
    </RequireAuth>
  );
}
