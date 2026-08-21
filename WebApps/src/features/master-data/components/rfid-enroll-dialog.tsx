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
import { getApiErrorMessage } from "@/core/api/client";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useEnrollRfidCard } from "../api/rfid-queries";

const formSchema = z.object({
  employeeId: z.string().min(1, "Employee is required"),
  rfidUid: z.string().min(1, "Tap the reader, or type the UID").max(150, "Max 150 characters"),
});
type FormValues = z.infer<typeof formSchema>;

/**
 * Enroll form. The reader is HID keyboard-wedge (spec decision #4) — it
 * types the UID as keystrokes + Enter into whatever input has focus, so the
 * UID field auto-focuses on open and again after a failed submit, so a
 * re-tap never needs a manual click first (ticket 07 acceptance).
 */
export function RfidEnrollDialog({
  open,
  onOpenChange,
  defaultEmployeeId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select an employee — used when opened from the Employee screen context, if ever. Optional. */
  defaultEmployeeId?: string;
}) {
  const enrollMutation = useEnrollRfidCard();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { employeeId: defaultEmployeeId ?? "", rfidUid: "" },
  });

  React.useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    form.reset({ employeeId: defaultEmployeeId ?? "", rfidUid: "" });
    // Ready for a tap the moment the dialog opens.
    form.setFocus("rfidUid");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultEmployeeId]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await enrollMutation.mutateAsync(values);
      toast.success("RFID card enrolled.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        // "RFID {uid} is already assigned to {name} ({employeeNumber})" —
        // the named-holder conflict, inline on the UID field (ticket 07).
        form.setError("rfidUid", { message });
      } else {
        setSubmitError(message);
      }
      // A re-tap should land straight in the field again, no manual click.
      form.setFocus("rfidUid");
    }
  }

  const isSaving = enrollMutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSubmitError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll RFID Card</DialogTitle>
          <DialogDescription>
            Select the employee, then tap the card against the reader — the UID field is already focused.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee *</FormLabel>
                  <FormControl>
                    <MasterDataSelect
                      collection="employees"
                      value={field.value}
                      onChange={field.onChange}
                      ariaLabel="Employee"
                      placeholder="Select employee"
                      disabled={defaultEmployeeId !== undefined}
                    />
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
                  <FormLabel>RFID UID *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      autoComplete="off"
                      placeholder="Tap the reader, or type the UID"
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
                {isSaving ? "Enrolling…" : "Enroll Card"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
