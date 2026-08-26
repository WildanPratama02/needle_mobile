import { AppShell } from "@/shared/components/app-shell";
import { UsersScreen } from "@/features/administration";
import { RequireAuth } from "@/features/auth";

export default function UsersPage() {
  return (
    <RequireAuth>
      <AppShell>
        <UsersScreen />
      </AppShell>
    </RequireAuth>
  );
}
