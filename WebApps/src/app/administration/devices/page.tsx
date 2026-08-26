import { AppShell } from "@/shared/components/app-shell";
import { DevicesScreen } from "@/features/administration";
import { RequireAuth } from "@/features/auth";

export default function DevicesPage() {
  return (
    <RequireAuth>
      <AppShell>
        <DevicesScreen />
      </AppShell>
    </RequireAuth>
  );
}
