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
import type { Trolley } from "@/core/master-data";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataName } from "@/shared/components/master-data-name";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useCreateTrolley, useUpdateTrolley } from "../api/trolley-queries";

const createSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  code: z.string().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
});
type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  locationId: z.string().min(1, "Location is required"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
type EditFormValues = z.infer<typeof editSchema>;

/** Create form. Factory is the existing `FactorySelect`, scoped to the caller's own factories — reused, not rebuilt (ticket 03 acceptance). */
function CreateTrolleyForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateTrolley();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { factoryId: "", code: "", name: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        factoryId: values.factoryId,
        code: values.code,
        name: values.name,
      });
      toast.success("Trolley created.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        form.setError("code", { message });
      } else if (status === 400) {
        form.setError("factoryId", { message });
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
          name="factoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factory *</FormLabel>
              <FormControl>
                <FactorySelect value={field.value} onChange={field.onChange} id="trolley-factory" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trolley Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. TR-01" />
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
              <FormLabel>Trolley Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Trolley 01" />
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
            {isSaving ? "Creating…" : "Create Trolley"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/**
 * Edit form. Status change goes through this same form's `status` field —
 * no separate activate/deactivate button pair, since `Docs/12` doesn't
 * contract one for Trolley (ticket 03 acceptance).
 */
function EditTrolleyForm({ trolley, onOpenChange }: { trolley: Trolley; onOpenChange: (open: boolean) => void }) {
  const updateMutation = useUpdateTrolley();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: trolley.name, locationId: trolley.locationId, status: trolley.status },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({ name: trolley.name, locationId: trolley.locationId, status: trolley.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trolley.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: trolley.id,
        input: { name: values.name, locationId: values.locationId, status: values.status },
      });
      toast.success("Trolley updated.");
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
          <label className="text-sm font-medium text-slate-700">Trolley Code</label>
          <Input value={trolley.code} disabled readOnly />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Factory</label>
          <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
            <MasterDataName collection="factories" id={trolley.factoryId} withCode />
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trolley Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="locationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location *</FormLabel>
              <FormControl>
                <MasterDataSelect
                  collection="locations"
                  query={{ factoryId: trolley.factoryId }}
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Location"
                  placeholder="Select location"
                />
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

export function TrolleyFormDialog({
  mode,
  open,
  onOpenChange,
  trolley,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trolley?: Trolley | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Trolley" : "Edit Trolley"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adds a trolley to the chosen factory. Each trolley is its own inventory location (ADR-003)."
              : "Trolley Code and Factory cannot change after creation."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateTrolleyForm onOpenChange={onOpenChange} />
        ) : trolley ? (
          <EditTrolleyForm trolley={trolley} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
