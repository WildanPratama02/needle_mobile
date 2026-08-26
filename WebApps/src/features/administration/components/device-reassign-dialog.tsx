"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useForm, type UseFormReturn } from "react-hook-form";
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
import { getApiErrorMessage } from "@/core/api/client";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useReassignDevice } from "../api/device-queries";
import type { Device } from "../api/device-types";

const formSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  trolleyId: z.string().min(1, "Trolley is required"),
});
type FormValues = z.infer<typeof formSchema>;

function applySubmitError(form: UseFormReturn<FormValues>, message: string) {
  form.setError("trolleyId", { message });
}

/**
 * Move a device to a different trolley/factory (Device story 10/31) —
 * `POST /devices/:id/reassign` with the exact same `{ factoryId, trolleyId }`
 * shape and trolley-belongs-to-factory validation registration uses (Device
 * story 11), sourced from the same `core/master-data` lookups so a value
 * this dialog can produce is never one the API would reject for being an
 * inconsistent pair by construction — only the cross-collection relationship
 * is left for the backend to confirm.
 */
export function DeviceReassignDialog({
  device,
  open,
  onOpenChange,
}: {
  device: Device | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const reassignMutation = useReassignDevice();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { factoryId: "", trolleyId: "" },
  });

  React.useEffect(() => {
    if (!open || !device) return;
    setSubmitError(null);
    form.reset({ factoryId: device.factoryId, trolleyId: device.trolleyId });
  }, [open, device, form]);

  const factoryId = form.watch("factoryId");

  async function onSubmit(values: FormValues) {
    if (!device) return;
    setSubmitError(null);
    try {
      await reassignMutation.mutateAsync({ id: device.id, input: values });
      toast.success("Device reassigned.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 400) {
        applySubmitError(form, message);
      } else {
        setSubmitError(message);
      }
    }
  }

  const isSaving = reassignMutation.isPending;

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
          <DialogTitle>Reassign Device</DialogTitle>
          <DialogDescription>
            {device
              ? `Move ${device.deviceCode} to a different trolley or factory. No revoke/re-register round trip.`
              : "Move this device to a different trolley or factory."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="factoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Factory *</FormLabel>
                  <FormControl>
                    <FactorySelect
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        // Only a real, user-driven factory change invalidates
                        // the previously picked trolley — wiring this through
                        // the select's own `onChange` rather than a `watch`
                        // effect means `form.reset`'s prefill (which never
                        // calls this handler) can never be mistaken for one.
                        form.setValue("trolleyId", "");
                      }}
                      id="reassign-factory"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="trolleyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trolley *</FormLabel>
                  <FormControl>
                    <MasterDataSelect
                      collection="trolleys"
                      query={factoryId ? { factoryId } : undefined}
                      value={field.value}
                      onChange={field.onChange}
                      ariaLabel="Trolley"
                      placeholder={factoryId ? "Select trolley" : "Select a factory first"}
                      disabled={!factoryId}
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
                {isSaving ? "Reassigning…" : "Confirm Reassignment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
