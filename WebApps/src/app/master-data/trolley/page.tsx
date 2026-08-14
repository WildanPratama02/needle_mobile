import { AppShell } from "@/shared/components/app-shell";
import { TrolleyScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function TrolleyPage() {
  return (
    <RequireAuth>
      <AppShell>
        <TrolleyScreen />
      </AppShell>
    </RequireAuth>
  );
}
