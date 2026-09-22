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
import { LOCATION_TYPE_LABELS, type Location } from "@/core/master-data";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataName } from "@/shared/components/master-data-name";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useCreateLocation, useUpdateLocation } from "../api/location-queries";
import { CREATABLE_LOCATION_TYPES } from "../api/location-types";

/**
 * Radix Select refuses "" as an item value, so "no parent" needs a sentinel.
 * It never reaches the wire — `toParentLocationId` maps it back to `null`.
 */
const NO_PARENT = "none";

function toParentLocationId(value: string): string | null {
  return value === NO_PARENT || value === "" ? null : value;
}

/** Mirrors `CreateLocationDto` — same required fields, limits and creatable types. */
const createSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  locationType: z.enum(CREATABLE_LOCATION_TYPES, { message: "Type is required" }),
  code: z.string().trim().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().trim().min(1, "Name is required").max(150, "Max 150 characters"),
  parentLocationId: z.string(),
});
type CreateFormValues = z.infer<typeof createSchema>;

/** Mirrors `UpdateLocationDto` — `code`/`factoryId`/`locationType` are immutable and absent. */
const editSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(150, "Max 150 characters"),
  parentLocationId: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
type EditFormValues = z.infer<typeof editSchema>;

/**
 * Parent picker: WAREHOUSE locations of one factory, the only parent the
 * backend accepts. A UX guard only — the backend re-validates type, factory
 * and cycles regardless. `excludeId` keeps a location from being offered as
 * its own parent; `keepId` keeps an already-set (possibly INACTIVE) parent
 * visible so the edit form does not open on a blank value.
 */
function ParentLocationSelect({
  factoryId,
  value,
  onChange,
  excludeId,
  keepId,
  ...triggerProps
}: {
  factoryId: string;
  value: string;
  onChange: (value: string) => void;
  excludeId?: string;
  keepId?: string | null;
} & Omit<React.ComponentPropsWithoutRef<typeof SelectTrigger>, "children" | "value" | "onChange">) {
  const filter = React.useCallback(
    (row: Location) =>
      row.locationType === "WAREHOUSE" &&
      row.id !== excludeId &&
      (row.status === "ACTIVE" || row.id === keepId),
    [excludeId, keepId],
  );

  return (
    <MasterDataSelect
      collection="locations"
      query={factoryId ? { factoryId } : undefined}
      value={factoryId ? value : ""}
      onChange={onChange}
      ariaLabel="Parent Location"
      placeholder="Select a factory first"
      includeAllOption
      allLabel="No parent"
      allValue={NO_PARENT}
      disabled={!factoryId}
      filter={filter}
      {...triggerProps}
    />
  );
}

function SubmitErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">{message}</p>
  );
}

function ReadOnlyField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
        {children}
      </div>
    </div>
  );
}

function CreateLocationForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateLocation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      factoryId: "",
      locationType: "USED_NEEDLE_STORAGE",
      code: "",
      name: "",
      parentLocationId: NO_PARENT,
    },
  });

  // A parent picked under one factory is meaningless under another.
  const factoryId = form.watch("factoryId");
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("parentLocationId", NO_PARENT);
    }
  }, [factoryId, form]);

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);
    const parentLocationId = toParentLocationId(values.parentLocationId);
    try {
      await createMutation.mutateAsync({
        factoryId: values.factoryId,
        locationType: values.locationType,
        code: values.code,
        name: values.name,
        ...(parentLocationId ? { parentLocationId } : {}),
      });
      toast.success("Location created.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        // Duplicate code within the factory.
        form.setError("code", { message });
      } else if (status === 400 && message.includes("parentLocationId")) {
        form.setError("parentLocationId", { message });
      } else if (status === 400 && message.includes("factoryId")) {
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
                <FactorySelect value={field.value} onChange={field.onChange} id="location-factory" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-label="Type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CREATABLE_LOCATION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LOCATION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. UNS-01" />
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
              <FormLabel>Location Name *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Used Needle Storage" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="parentLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Location</FormLabel>
              <FormControl>
                <ParentLocationSelect factoryId={factoryId} value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitErrorBanner message={submitError} />

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Creating…" : "Create Location"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditLocationForm({ location, onOpenChange }: { location: Location; onOpenChange: (open: boolean) => void }) {
  const updateMutation = useUpdateLocation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const initialValues = React.useCallback(
    (): EditFormValues => ({
      name: location.name,
      parentLocationId: location.parentLocationId ?? NO_PARENT,
      status: location.status,
    }),
    [location],
  );

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: initialValues(),
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset(initialValues());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: location.id,
        input: {
          name: values.name,
          parentLocationId: toParentLocationId(values.parentLocationId),
          status: values.status,
        },
      });
      toast.success("Location updated.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 409) {
        // Deactivating a storage location an ACTIVE mapping still targets —
        // the message itself tells the user to remap first.
        form.setError("status", { message });
      } else if (status === 400 && message.includes("parentLocationId")) {
        form.setError("parentLocationId", { message });
      } else {
        setSubmitError(message);
      }
    }
  }

  const isSaving = updateMutation.isPending;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700" htmlFor="location-code-readonly">
            Location Code
          </label>
          <Input id="location-code-readonly" value={location.code} disabled readOnly />
        </div>

        <ReadOnlyField label="Factory">
          <MasterDataName collection="factories" id={location.factoryId} withCode />
        </ReadOnlyField>

        <ReadOnlyField label="Type">{LOCATION_TYPE_LABELS[location.locationType] ?? location.locationType}</ReadOnlyField>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location Name *</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="parentLocationId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Parent Location</FormLabel>
              <FormControl>
                <ParentLocationSelect
                  factoryId={location.factoryId}
                  value={field.value}
                  onChange={field.onChange}
                  excludeId={location.id}
                  keepId={location.parentLocationId}
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
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger aria-label="Status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <SubmitErrorBanner message={submitError} />

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

/**
 * Create/edit for `Location` (WAREHOUSE / USED_NEEDLE_STORAGE only). TROLLEY
 * locations never reach this dialog — they are created and managed with
 * their trolley (ADR-003), and the backend refuses them here with a 400.
 */
export function LocationFormDialog({
  mode,
  open,
  onOpenChange,
  location,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "New Location" : "Edit Location"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Adds a warehouse or used-needle storage location to the chosen factory. Trolley locations are created with their trolley."
              : "Location Code, Factory and Type cannot change after creation."}
          </DialogDescription>
        </DialogHeader>

        {mode === "create" ? (
          <CreateLocationForm onOpenChange={onOpenChange} />
        ) : location ? (
          <EditLocationForm location={location} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
