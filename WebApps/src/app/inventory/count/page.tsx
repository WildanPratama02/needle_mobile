import { AppShell } from "@/shared/components/app-shell";
import { CountSessionScreen } from "@/features/inventory";
import { RequireAuth } from "@/features/auth";

export default function CountSessionPage() {
  return (
    <RequireAuth>
      <AppShell>
        <CountSessionScreen />
      </AppShell>
    </RequireAuth>
  );
}
