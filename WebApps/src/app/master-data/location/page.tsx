import { AppShell } from "@/shared/components/app-shell";
import { LocationScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function LocationPage() {
  return (
    <RequireAuth>
      <AppShell>
        <LocationScreen />
      </AppShell>
    </RequireAuth>
  );
}
