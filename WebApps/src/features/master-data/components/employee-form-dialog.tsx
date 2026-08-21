"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/core/api/client";
import type { Employee } from "@/core/master-data";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataName } from "@/shared/components/master-data-name";
import { useCreateEmployee, useUpdateEmployee } from "../api/employee-queries";

const createSchema = z.object({
  employeeNumber: z.string().min(1, "Employee ID is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  department: z.string().max(100, "Max 100 characters").optional(),
  factoryId: z.string().min(1, "Factory is required"),
  rfidUid: z.string().max(150, "Max 150 characters").optional(),
});
type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  department: z.string().max(100, "Max 100 characters").optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
type EditFormValues = z.infer<typeof editSchema>;

/**
 * Create form for `Employee`. The optional "Scan RFID Card" field enrolls
 * the first card in the same backend transaction as the employee create
 * (spec decision #12) — a conflicting UID fails the whole request, so no
 * employee is left dangling without the card the admin thought they scanned.
 */
function CreateEmployeeForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateEmployee();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { employeeNumber: "", name: "", department: "", factoryId: "", rfidUid: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        employeeNumber: values.employeeNumber,
        name: values.name,
        department: values.department || undefined,
        factoryId: values.factoryId,
        rfidUid: values.rfidUid || undefined,
      });
      toast.success(
        values.rfidUid ? "Employee created with an active RFID card." : "Employee created.",
      );
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        // Two distinct 409s on one form (ticket 06) — routed by what the
        // backend's message actually names, never collapsed into one banner.
        if (message.toLowerCase().includes("employee number")) {
          form.setError("employeeNumber", { message });
        } else if (message.toLowerCase().includes("already assigned to")) {
          form.setError("rfidUid", { message });
        } else {
          setSubmitError(message);
        }
      } else {
        setSubmitError(message);
      }
    }
  }

  const isSaving = createMutation.isPending;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="employeeNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. EMP-0001" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Siti Operator" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Sewing Line 1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="factoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factory *</FormLabel>
              <FormControl>
                <FactorySelect value={field.value} onChange={field.onChange} id="employee-factory" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rfidUid"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scan RFID Card (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  placeholder="Tap the reader, or leave blank to enroll later"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {submitError}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating…" : "Create Employee"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/**
 * Edit form. `employeeNumber`/Factory render read-only, not just
 * server-rejected (ticket 06 acceptance) — `UpdateEmployeeDto` does not even
 * carry those fields. Setting Status to Inactive auto-revokes the active
 * RFID card, if any, in the same backend transaction (spec decision #13).
 */
function EditEmployeeForm({
  employee,
  onOpenChange,
}: {
  employee: Employee;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateEmployee();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: employee.name,
      department: employee.department ?? "",
      status: employee.status,
    },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({ name: employee.name, department: employee.department ?? "", status: employee.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: employee.id,
        input: {
          name: values.name,
          department: values.department || undefined,
          status: values.status,
        },
      });
      toast.success("Employee updated.");
      onOpenChange(false);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  const isSaving = updateMutation.isPending;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Employee ID</label>
          <Input value={employee.employeeNumber} disabled readOnly />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Factory</label>
          <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            <MasterDataName collection="factories" id={employee.factoryId} withCode />
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="department"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status *</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            {submitError}
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function EmployeeFormDialog({
  mode,
  open,
  onOpenChange,
  employee,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: Employee | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Employee" : "Edit Employee"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Factory-floor operators, identified by RFID during an exchange. Scanning a card is optional here."
              : "Employee ID and Factory cannot change after creation."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateEmployeeForm onOpenChange={onOpenChange} />
        ) : employee ? (
          <EditEmployeeForm employee={employee} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
