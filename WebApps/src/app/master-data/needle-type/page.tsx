import { AppShell } from "@/shared/components/app-shell";
import { NeedleTypeScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function NeedleTypePage() {
  return (
    <RequireAuth>
      <AppShell>
        <NeedleTypeScreen />
      </AppShell>
    </RequireAuth>
  );
}
