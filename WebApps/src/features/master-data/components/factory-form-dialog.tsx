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
import type { Factory } from "@/core/master-data";
import { useCreateFactory, useUpdateFactory } from "../api/factory-queries";

/**
 * `timezone` accepts any non-empty string here — the backend re-validates
 * against the real IANA zone list (ticket 02 acceptance: "reuse whatever
 * validation the backend applies rather than inventing a separate
 * whitelist"), so a bad value surfaces as the backend's own 400, not a
 * client-invented rejection.
 */
const createSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  timezone: z.string().min(1, "Timezone is required").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
});
type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  timezone: z.string().min(1, "Timezone is required").max(100, "Max 100 characters"),
  description: z.string().max(500, "Max 500 characters").optional(),
});
type EditFormValues = z.infer<typeof editSchema>;

function CreateFactoryForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateFactory();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { code: "", name: "", timezone: "Asia/Jakarta", description: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        code: values.code,
        name: values.name,
        timezone: values.timezone,
        description: values.description || undefined,
      });
      toast.success("Factory created.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        form.setError("code", { message });
      } else if (status === 400 && message.toLowerCase().includes("timezone")) {
        form.setError("timezone", { message });
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
              <FormLabel>Factory Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. FACTORY-01" />
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
              <FormLabel>Factory Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Factory 01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Asia/Jakarta" />
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
            {isSaving ? "Creating…" : "Create Factory"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditFactoryForm({ factory, onOpenChange }: { factory: Factory; onOpenChange: (open: boolean) => void }) {
  const updateMutation = useUpdateFactory();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: factory.name,
      timezone: factory.timezone,
      description: factory.description ?? "",
    },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({ name: factory.name, timezone: factory.timezone, description: factory.description ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factory.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: factory.id,
        input: {
          name: values.name,
          timezone: values.timezone,
          description: values.description || undefined,
        },
      });
      toast.success("Factory updated.");
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
          <label className="text-sm font-medium text-slate-700">Factory Code</label>
          <Input value={factory.code} disabled readOnly />
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Factory Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Timezone *</FormLabel>
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

export function FactoryFormDialog({
  mode,
  open,
  onOpenChange,
  factory,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  factory?: Factory | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Factory" : "Edit Factory"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adds a site to the factory catalogue."
              : "Factory Code cannot change after creation."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateFactoryForm onOpenChange={onOpenChange} />
        ) : factory ? (
          <EditFactoryForm factory={factory} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
