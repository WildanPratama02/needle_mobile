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
import type { Supplier } from "@/core/master-data";
import { useCreateSupplier, useUpdateSupplier } from "../api/supplier-queries";

/**
 * Limits mirror `CreateSupplierDto`/`UpdateSupplierDto` exactly: `code` ≤ 50,
 * `name` ≤ 150, `contact` ≤ 150. `description` carries no `@MaxLength` on the
 * backend and no length in Prisma either (plain `String?`), so none is imposed
 * here — a client-side cap the server does not have would refuse input the
 * server would accept.
 */
const createSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  contact: z.string().max(150, "Max 150 characters").optional(),
  description: z.string().optional(),
});
type CreateFormInput = z.input<typeof createSchema>;
type CreateFormValues = z.output<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  contact: z.string().max(150, "Max 150 characters").optional(),
  description: z.string().optional(),
});
type EditFormInput = z.input<typeof editSchema>;
type EditFormValues = z.output<typeof editSchema>;

/**
 * Create form. `code` is required and only editable here — ticket 01's
 * acceptance criteria makes it immutable after create, the same
 * identity-field-is-set-once precedent Factory, Location and Needle Type
 * follow.
 *
 * There is no status control on either form: a supplier has no lifecycle
 * (spec decision 6).
 */
function CreateSupplierForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateSupplier();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormInput, unknown, CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { code: "", name: "", contact: "", description: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        code: values.code,
        name: values.name,
        contact: values.contact || undefined,
        description: values.description || undefined,
      });
      toast.success("Supplier created.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // A duplicate code is a fact about one field, so it is answered on that
      // field with the dialog still open and the rest of the input intact —
      // never a toast the user has to re-derive the cause from.
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
                <Input {...field} placeholder="e.g. SUP-001" />
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
                <Input {...field} placeholder="e.g. PT Jarum Makmur" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <Input {...field} placeholder="A phone number or an email" />
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
            {isSaving ? "Creating…" : "Create Supplier"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Edit form. `code` renders read-only — `UpdateSupplierDto` does not carry it. */
function EditSupplierForm({
  supplier,
  onOpenChange,
}: {
  supplier: Supplier;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateSupplier();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormInput, unknown, EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: supplier.name,
      contact: supplier.contact ?? "",
      description: supplier.description ?? "",
    },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({
      name: supplier.name,
      contact: supplier.contact ?? "",
      description: supplier.description ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: supplier.id,
        input: {
          name: values.name,
          contact: values.contact || undefined,
          description: values.description || undefined,
        },
      });
      toast.success("Supplier updated.");
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
          <label className="text-sm font-medium text-slate-700" htmlFor="supplier-code-readonly">
            Code
          </label>
          <Input id="supplier-code-readonly" value={supplier.code} disabled readOnly />
        </div>

        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Code cannot change after creation: receivings point at this supplier by row, so changing its
          code would rewrite what past deliveries say they came from. Rename the supplier instead — the
          name is what reports show.
        </p>

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
          name="contact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact</FormLabel>
              <FormControl>
                <Input {...field} />
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

export function SupplierFormDialog({
  mode,
  open,
  onOpenChange,
  supplier,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier?: Supplier | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Supplier" : "Edit Supplier"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adds a supplier a receiving can name as its source. Business-wide — not tied to a factory."
              : "Name, contact and description only — the code is fixed at creation."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateSupplierForm onOpenChange={onOpenChange} />
        ) : supplier ? (
          <EditSupplierForm supplier={supplier} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
