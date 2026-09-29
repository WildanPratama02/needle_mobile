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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/core/api/client";
import type { Location } from "@/core/master-data";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataName } from "@/shared/components/master-data-name";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useCreateLocation, useUpdateLocation } from "../api/location-queries";
import {
  CREATABLE_LOCATION_TYPES,
  LOCATION_TYPE_LABELS,
  type CreatableLocationType,
} from "../api/location-types";

/**
 * Radix's Select refuses an empty item value, and `parentLocationId` is
 * optional — so "no parent" needs a non-empty sentinel that is translated back
 * to "omit the field" before the request leaves.
 */
const NO_PARENT = "none";

const READ_ONLY_FIELD_CLASS =
  "flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700";

const createSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  code: z.string().min(1, "Code is required").max(50, "Max 50 characters"),
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  /**
   * Mirrors `CreateLocationDto.locationType` — the enum minus `TROLLEY`, which
   * the backend refuses with a 400. `""` is Radix's "nothing chosen yet"
   * state, and the predicate both rejects it and narrows what survives.
   */
  locationType: z
    .string()
    .refine(
      (value): value is CreatableLocationType =>
        (CREATABLE_LOCATION_TYPES as readonly string[]).includes(value),
      { message: "Type is required" },
    ),
  parentLocationId: z.string(),
});
type CreateFormValues = z.input<typeof createSchema>;

const editSchema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Max 150 characters"),
  parentLocationId: z.string(),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});
type EditFormValues = z.infer<typeof editSchema>;

/**
 * Routes a refusal to the field it actually complains about — the backend
 * names the field in its own message (`MasterDataService.createLocation` /
 * `updateLocation`), so this reads that rather than re-deriving copy. Returns
 * false when no field owns the message, and the caller shows it form-level.
 */
function applyCreateError(form: UseFormReturn<CreateFormValues>, message: string, status?: number): boolean {
  if (status === 409) {
    // `Location code already in use in this factory: …` — @@unique([factoryId, code]).
    form.setError("code", { message });
    return true;
  }
  if (status !== 400) return false;
  if (message.includes("parentLocationId")) {
    form.setError("parentLocationId", { message });
    return true;
  }
  if (message.includes("TROLLEY")) {
    form.setError("locationType", { message });
    return true;
  }
  if (message.includes("factoryId")) {
    form.setError("factoryId", { message });
    return true;
  }
  return false;
}

function CreateLocationForm({ onOpenChange }: { onOpenChange: (open: boolean) => void }) {
  const createMutation = useCreateLocation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<CreateFormValues>({
    resolver: zodResolver(createSchema),
    defaultValues: { factoryId: "", code: "", name: "", locationType: "", parentLocationId: NO_PARENT },
  });

  const factoryId = form.watch("factoryId");

  // A factory change invalidates a parent picked under the previous factory —
  // the backend refuses a parent from another factory with a 400.
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("parentLocationId", NO_PARENT);
    }
  }, [factoryId, form]);

  async function onSubmit(values: CreateFormValues) {
    setSubmitError(null);

    // The resolver has already refused anything outside the two creatable
    // types; this re-find is what narrows `string` back to the enum without a
    // cast.
    const locationType = CREATABLE_LOCATION_TYPES.find((type) => type === values.locationType);
    if (!locationType) {
      form.setError("locationType", { message: "Type is required" });
      return;
    }

    try {
      await createMutation.mutateAsync({
        factoryId: values.factoryId,
        code: values.code,
        name: values.name,
        locationType,
        parentLocationId: values.parentLocationId === NO_PARENT ? undefined : values.parentLocationId,
      });
      toast.success("Location created.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (!applyCreateError(form, message, status)) {
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
                <FactorySelect value={field.value} onChange={field.onChange} id="location-factory-field" />
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
              <FormLabel>Location Code *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. WH-02" />
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
                <Input {...field} placeholder="e.g. Secondary Warehouse" />
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
              <FormControl>
                <Select value={field.value === "" ? undefined : field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-label="Type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {CREATABLE_LOCATION_TYPES.map((locationType) => (
                      <SelectItem key={locationType} value={locationType}>
                        {LOCATION_TYPE_LABELS[locationType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <p className="text-xs text-slate-500">
                A trolley owns its own location, so trolleys are created on the Trolley screen — not here.
              </p>
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
                {/*
                  `includeAllOption` supplies the sentinel item; here it reads
                  "No parent" rather than "All", since this field is optional
                  rather than a filter. Options are limited to the chosen
                  factory — the backend refuses a parent from another one.
                */}
                <MasterDataSelect
                  collection="locations"
                  query={factoryId ? { factoryId } : undefined}
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Parent Location"
                  placeholder={factoryId ? "No parent" : "Select a factory first"}
                  disabled={!factoryId}
                  includeAllOption
                  allLabel="No parent"
                  allValue={NO_PARENT}
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
            {isSaving ? "Creating…" : "Create Location"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/**
 * Edit. `code` and `locationType` render read-only rather than being hidden —
 * they are what people quote about a location, and hiding them would leave the
 * reason they cannot change unexplained.
 */
function EditLocationForm({
  location,
  onOpenChange,
}: {
  location: Location;
  onOpenChange: (open: boolean) => void;
}) {
  const updateMutation = useUpdateLocation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<EditFormValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      name: location.name,
      parentLocationId: location.parentLocationId ?? NO_PARENT,
      status: location.status,
    },
  });

  React.useEffect(() => {
    setSubmitError(null);
    form.reset({
      name: location.name,
      parentLocationId: location.parentLocationId ?? NO_PARENT,
      status: location.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.id]);

  async function onSubmit(values: EditFormValues) {
    setSubmitError(null);
    try {
      await updateMutation.mutateAsync({
        id: location.id,
        input: {
          name: values.name,
          parentLocationId: values.parentLocationId === NO_PARENT ? undefined : values.parentLocationId,
          status: values.status,
        },
      });
      toast.success("Location updated.");
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 400 && message.includes("parentLocationId")) {
        form.setError("parentLocationId", { message });
      } else {
        // A `TROLLEY` refusal names the row, not a field on this form — and
        // the screen never offers Edit on one, so it can only arrive if the
        // row changed underneath us.
        setSubmitError(message);
      }
    }
  }

  const isSaving = updateMutation.isPending;

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Location Code</label>
          <Input value={location.code} disabled readOnly />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Type</label>
          <div className={READ_ONLY_FIELD_CLASS}>
            {LOCATION_TYPE_LABELS[location.locationType] ?? location.locationType}
          </div>
        </div>

        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
          Code and Type cannot change after creation: every stock movement points at this row, so changing
          what it is would rewrite the meaning of history rather than correct it. Create a new location
          instead.
        </p>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Factory</label>
          <div className={READ_ONLY_FIELD_CLASS}>
            <MasterDataName collection="factories" id={location.factoryId} withCode />
          </div>
        </div>

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
                <MasterDataSelect
                  collection="locations"
                  query={{ factoryId: location.factoryId }}
                  value={field.value}
                  onChange={field.onChange}
                  ariaLabel="Parent Location"
                  placeholder="No parent"
                  includeAllOption
                  allLabel="No parent"
                  allValue={NO_PARENT}
                  // A location cannot be its own parent (400) — so it is not offered.
                  filter={(row) => row.id !== location.id}
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
              ? "Adds a warehouse or used-needle storage location to the chosen factory."
              : "Name, parent and status only — Location Code and Type are fixed at creation."}
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
