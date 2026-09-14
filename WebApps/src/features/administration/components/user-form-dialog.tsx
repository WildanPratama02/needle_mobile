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
import { PasswordInput } from "@/components/ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/core/api/client";
import { useAuthorizedFactories } from "@/core/permissions/factory-scope";
import type { UserRow } from "@/core/users";
import { useCreateUser, useUpdateUser } from "../api/user-write-queries";

/**
 * Mirrors `CreateUserDto` (`Backend/src/modules/identity/dto/user-request.dto.ts`)
 * exactly. `z.guid()` is the any-version 8-4-4-4-12 hex check, same as the
 * DTO's `@IsUUID('all', { each: true })`.
 */
const createSchema = z.object({
  username: z.string().min(1, "Username is required").max(64, "Max 64 characters"),
  name: z.string().min(1, "Name is required").max(255, "Max 255 characters"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(255, "Max 255 characters")
    .regex(/\d/, "Password must contain at least 1 number"),
  factoryIds: z
    .array(z.guid())
    .min(1, "Select at least one factory")
    .refine((ids) => new Set(ids).size === ids.length, "Each factory can only be selected once"),
});
type CreateFormValues = z.infer<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Max 255 characters"),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
type EditFormValues = z.infer<typeof editSchema>;

/**
 * Create form. The admin sets the account's first password here (the user's
 * decision on ticket 06; see `user-write-types.ts`'s header comment), and
 * picks at least one factory scope, because the backend refuses a user with
 * none. The factory choices come from `useAuthorizedFactories()`, the
 * caller's own scope, rendered in the same row shape as Manage Access's
 * factory list, so the form can never offer a factory the admin cannot see.
 * Roles are still assigned afterward, through Manage Access.
 */
function CreateUserForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateUser();
  const authorizedFactories = useAuthorizedFactories();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const factoryScopeLabelId = React.useId();

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { username: "", name: "", password: "", factoryIds: [] },
  });

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync(values);
      toast.success("User created with its factory scope. Assign a role next, from Manage Access.");
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password *</FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <p className="text-xs text-slate-500">At least 8 characters, including a number.</p>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="factoryIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel id={factoryScopeLabelId}>Factory Scope *</FormLabel>
              <FormControl>
                <div role="group" aria-labelledby={factoryScopeLabelId}>
                  <ul className="space-y-1.5">
                    {authorizedFactories.map((factory) => {
                      const checked = field.value.includes(factory.id);
                      return (
                        <li key={factory.id}>
                          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-slate-300 accent-ocean-600"
                              checked={checked}
                              onChange={() =>
                                field.onChange(
                                  checked
                                    ? field.value.filter((id) => id !== factory.id)
                                    : [...field.value, factory.id],
                                )
                              }
                            />
                            <span>
                              {factory.code} — {factory.name}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                    {authorizedFactories.length === 0 && (
                      <li className="text-sm text-slate-400">No factories in your own scope to assign.</li>
                    )}
                  </ul>
                </div>
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
              ? "Sets the first password and factory scope. Assign a role afterward from Manage Access."
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
