import { useMutation, useQueryClient } from "@tanstack/react-query";

import { masterDataKeys } from "@/core/master-data";
import { createEmployee, updateEmployee } from "./employee-data-source";
import { rfidCardKeys } from "./rfid-queries";

/**
 * Invalidates the whole `master-data` key space (every collection, every
 * query variant) rather than one exact key — the same "reference data is one
 * shared resource" convention Inventory's mutations use for the `inventory`
 * key space. A create can also enroll an RFID card inline (spec decision
 * #12) and an update to INACTIVE can auto-revoke one (decision #13), so the
 * `rfid-cards` list is invalidated alongside it either way.
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.all });
      queryClient.invalidateQueries({ queryKey: rfidCardKeys.all });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateEmployee>[1] }) =>
      updateEmployee(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: masterDataKeys.all });
      queryClient.invalidateQueries({ queryKey: rfidCardKeys.all });
    },
  });
}
