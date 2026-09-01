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
import type { UserRow } from "@/core/users";
import { useCreateUser, useUpdateUser } from "../api/user-write-queries";

const createSchema = z.object({
  username: z.string().min(1, "Username is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
});
type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
type EditFormValues = z.infer<typeof editSchema>;

/**
 * Create form. Deliberately no password/credential field — see
 * `user-write-types.ts`'s header comment (ticket 06: the first-credential
 * mechanism is an open product decision, not guessed here). Role and
 * factory-scope assignment happen afterward, through the access dialog —
 * this only creates the bare account.
 */
function CreateUserForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateUser();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", name: "" },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(values);
      toast.success("User created. Assign a role and factory scope next, from Manage Access.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        form.setError("username", { message });
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
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. budi.santoso" />
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
                <Input {...field} placeholder="e.g. Budi Santoso" />
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
            {isSaving ? "Creating…" : "Create User"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Edit form. `username` renders read-only — `UpdateUserDto` does not carry it. */
function EditUserForm({ user, onOpenChange }: { user: UserRow; onOpenChange: (open: boolean) => void }) {
  const updateMutation = useUpdateUser();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: { name: user.name, status: user.status },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({ name: user.name, status: user.status });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({ id: user.id, input: values });
      toast.success("User updated.");
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
          <label className="text-sm font-medium text-slate-700">Username</label>
          <Input value={user.username} disabled readOnly />
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

export function UserFormDialog({
  mode,
  open,
  onOpenChange,
  user,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserRow | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New User" : "Edit User"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Creates the account only. Assign a role and factory scope afterward from Manage Access."
              : "Username cannot change after creation."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateUserForm onOpenChange={onOpenChange} />
        ) : user ? (
          <EditUserForm user={user} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
