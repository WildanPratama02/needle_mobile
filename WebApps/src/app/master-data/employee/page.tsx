import { AppShell } from "@/shared/components/app-shell";
import { EmployeeScreen } from "@/features/master-data";
import { RequireAuth } from "@/features/auth";

export default function EmployeePage() {
  return (
    <RequireAuth>
      <AppShell>
        <EmployeeScreen />
      </AppShell>
    </RequireAuth>
  );
}
