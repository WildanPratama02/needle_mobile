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
import type { NeedleType } from "@/core/master-data";
import { useCreateNeedleType, useUpdateNeedleType } from "../api/needle-type-queries";

const createSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  category: z.string().max(100, "Max 100 characters").optional(),
  unit: z.string().min(1, "Unit is required").max(20, "Max 20 characters"),
  minimumStock: z.coerce.number().min(0, "Minimum stock cannot be negative"),
  description: z.string().max(500, "Max 500 characters").optional(),
});
type CreateFormInput = z.input<typeof createSchema>;
type CreateFormValues = z.output<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  category: z.string().max(100, "Max 100 characters").optional(),
  unit: z.string().min(1, "Unit is required").max(20, "Max 20 characters"),
  minimumStock: z.coerce.number().min(0, "Minimum stock cannot be negative"),
  description: z.string().max(500, "Max 500 characters").optional(),
});
type EditFormInput = z.input<typeof editSchema>;
type EditFormValues = z.output<typeof editSchema>;

/**
 * Create form. `code` is required and only editable here — ticket 01's
 * acceptance criteria makes it immutable after create, the same
 * identity-field-is-set-once precedent Employee's `employeeNumber` follows.
 */
function CreateNeedleTypeForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateNeedleType();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormInput, unknown, CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { code: "", name: "", category: "", unit: "", minimumStock: 0, description: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        code: values.code,
        name: values.name,
        category: values.category || undefined,
        unit: values.unit,
        minimumStock: values.minimumStock,
        description: values.description || undefined,
      });
      toast.success("Needle type created.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        form.setError("code", { message });
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
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. DBX1" />
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
                <Input {...field} placeholder="e.g. Sewing Needle DBX1" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Sewing" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. PCS" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minimumStock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Stock *</FormLabel>
              <FormControl>
                <Input type="number" min={0} step={1} {...field} value={field.value as number | string} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Optional" />
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
            {isSaving ? "Creating…" : "Create Needle Type"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Edit form. `code` renders read-only — `UpdateNeedleTypeDto` does not carry it. */
function EditNeedleTypeForm({
  needleType,
  onOpenChange,
}: {
  needleType: NeedleType;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateNeedleType();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormInput, unknown, EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: needleType.name,
      category: needleType.category ?? "",
      unit: needleType.unit,
      minimumStock: needleType.minimumStock,
      description: needleType.description ?? "",
    },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({
      name: needleType.name,
      category: needleType.category ?? "",
      unit: needleType.unit,
      minimumStock: needleType.minimumStock,
      description: needleType.description ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needleType.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: needleType.id,
        input: {
          name: values.name,
          category: values.category || undefined,
          unit: values.unit,
          minimumStock: values.minimumStock,
          description: values.description || undefined,
        },
      });
      toast.success("Needle type updated.");
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
          <label className="text-sm font-medium text-slate-700">Code</label>
          <Input value={needleType.code} disabled readOnly />
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
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="unit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unit *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="minimumStock"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Minimum Stock *</FormLabel>
              <FormControl>
                <Input type="number" min={0} step={1} {...field} value={field.value as number | string} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input {...field} />
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

export function NeedleTypeFormDialog({
  mode,
  open,
  onOpenChange,
  needleType,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  needleType?: NeedleType | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Needle Type" : "Edit Needle Type"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adds an entry to the business-wide needle catalogue."
              : "Code cannot change after creation — it is referenced by historical transactions."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateNeedleTypeForm onOpenChange={onOpenChange} />
        ) : needleType ? (
          <EditNeedleTypeForm needleType={needleType} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
