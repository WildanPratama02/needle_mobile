import { AppShell } from "@/shared/components/app-shell";
import { TransferScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function TransferPage() {
  return (
    <RequireAuth>
      <AppShell>
        <TransferScreen />
      </AppShell>
    </RequireAuth>
  );
}
