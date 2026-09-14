import { AppShell } from "@/shared/components/app-shell";
import { ReturnScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function ReturnPage() {
  return (
    <RequireAuth>
      <AppShell>
        <ReturnScreen />
      </AppShell>
    </RequireAuth>
  );
}
