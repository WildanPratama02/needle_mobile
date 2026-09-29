import { AppShell } from "@/shared/components/app-shell";
import { SupplierScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function SupplierPage() {
  return (
    <RequireAuth>
      <AppShell>
        <SupplierScreen />
      </AppShell>
    </RequireAuth>
  );
}
