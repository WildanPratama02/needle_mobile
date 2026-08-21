import { AppShell } from "@/shared/components/app-shell";
import { StorageScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function StoragePage() {
  return (
    <RequireAuth>
      <AppShell>
        <StorageScreen />
      </AppShell>
    </RequireAuth>
  );
}
