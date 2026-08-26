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
import { Input } from "@/components/ui/input";
import { getApiErrorMessage } from "@/core/api/client";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useRegisterDevice } from "../api/device-queries";

const formSchema = z.object({
  deviceCode: z.string().min(1, "Device ID is required").max(100, "Max 100 characters"),
  deviceName: z.string().min(1, "Device name is required").max(150, "Max 150 characters"),
  serialNumber: z.string().min(1, "Serial number is required").max(150, "Max 150 characters"),
  factoryId: z.string().min(1, "Factory is required"),
  trolleyId: z.string().min(1, "Trolley is required"),
});
type FormValues = z.infer<typeof formSchema>;

const EMPTY_VALUES: FormValues = {
  deviceCode: "",
  deviceName: "",
  serialNumber: "",
  factoryId: "",
  trolleyId: "",
};

/** Routes a 400/409's message to the field it names, same pattern `StorageMappingFormDialog` established. */
function applySubmitError(form: UseFormReturn<FormValues>, message: string) {
  if (message.includes("trolleyId") || message.includes("factory")) {
    form.setError("trolleyId", { message });
  } else if (message.includes("deviceCode")) {
    form.setError("deviceCode", { message });
  } else if (message.includes("serialNumber")) {
    form.setError("serialNumber", { message });
  } else {
    return false;
  }
  return true;
}

/**
 * Register a new device (Device story 6/29). Factory-then-Trolley is the
 * same cascading select `StorageMappingFormDialog` uses — only guidance, the
 * backend re-validates the trolley-belongs-to-factory pair regardless
 * (Device story 7).
 */
export function DeviceRegisterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const registerMutation = useRegisterDevice();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    setSubmitError(null);
    form.reset(EMPTY_VALUES);
  }, [open, form]);

  const factoryId = form.watch("factoryId");

  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("trolleyId", "");
    }
  }, [factoryId, form]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      await registerMutation.mutateAsync(values);
      toast.success("Device registered.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const routed = (status === 400 || status === 409) && applySubmitError(form, message);
      if (!routed) {
        setSubmitError(message);
      }
    }
  }

  const isSaving = registerMutation.isPending;

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
          <DialogTitle>Register Device</DialogTitle>
          <DialogDescription>Bind a new tablet to a factory and trolley so it can start transacting.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="deviceCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device ID *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. DEV-001" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deviceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Device Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Trolley A-01 Tablet" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Manufacturer serial number" />
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
                    <FactorySelect value={field.value} onChange={field.onChange} id="device-factory" />
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
                {isSaving ? "Registering…" : "Register Device"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
