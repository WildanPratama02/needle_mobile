import { AppShell } from "@/shared/components/app-shell";
import { RfidScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function RfidPage() {
  return (
    <RequireAuth>
      <AppShell>
        <RfidScreen />
      </AppShell>
    </RequireAuth>
  );
}
