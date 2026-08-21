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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getApiErrorMessage } from "@/core/api/client";
import { displayLabel, useLookup, useMasterData } from "@/core/master-data";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataName } from "@/shared/components/master-data-name";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { useCreateStorageMapping, useUpdateStorageMapping } from "../api/storage-queries";
import type { StorageMapping } from "../api/storage-types";

const formSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  trolleyId: z.string().min(1, "Trolley is required"),
  exchangeTypeId: z.string().min(1, "Exchange type is required"),
  storageLocationId: z.string().min(1, "Storage location is required"),
});
type FormValues = z.infer<typeof formSchema>;

/**
 * Client-side guidance only (ticket 05) — filters `locations` to
 * `USED_NEEDLE_STORAGE` in the chosen factory. The backend re-validates both
 * the type and the same-factory rule regardless
 * (`MasterDataService.loadTrolleyAndValidateStorageLocation`), so a bypass
 * here is never a security gap, only a worse error message.
 */
const UsedNeedleStorageLocationSelect = React.forwardRef<
  HTMLButtonElement,
  {
    factoryId: string;
    value: string;
    onChange: (value: string) => void;
  } & Omit<React.ComponentPropsWithoutRef<typeof SelectTrigger>, "children" | "value" | "onChange">
>(({ factoryId, value, onChange, ...triggerProps }, ref) => {
  const { data, isLoading } = useMasterData("locations", factoryId ? { factoryId } : {}, factoryId !== "");
  const options = (data ?? []).filter((location) => location.locationType === "USED_NEEDLE_STORAGE");
  const selectValue = value === "" ? undefined : value;

  return (
    <Select value={selectValue} onValueChange={onChange} disabled={!factoryId || isLoading}>
      <SelectTrigger ref={ref} aria-label="Storage Location" {...triggerProps}>
        <SelectValue
          placeholder={!factoryId ? "Select a factory first" : isLoading ? "Loading…" : "Select storage location"}
        />
      </SelectTrigger>
      <SelectContent>
        {options.map((location) => (
          <SelectItem key={location.id} value={location.id}>
            {displayLabel(location, location.id)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
UsedNeedleStorageLocationSelect.displayName = "UsedNeedleStorageLocationSelect";

/** Routes a 400's message text to the field it actually complains about — the backend names the field in the message itself. */
function applyBadRequestError(form: UseFormReturn<FormValues>, message: string) {
  if (message.includes("exchangeTypeId")) {
    form.setError("exchangeTypeId", { message });
  } else if (message.includes("storageLocationId")) {
    form.setError("storageLocationId", { message });
  } else {
    form.setError("storageLocationId", { message });
  }
}

/**
 * Create/edit for `StorageMapping`. Edit only ever changes
 * `storageLocationId` (spec decision #2) — Trolley/Exchange Type render
 * read-only in that mode rather than as editable selects.
 */
export function StorageMappingFormDialog({
  mode,
  open,
  onOpenChange,
  mapping,
}: {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mapping?: StorageMapping | null;
}) {
  const createMutation = useCreateStorageMapping();
  const updateMutation = useUpdateStorageMapping();
  const trolleys = useLookup("trolleys");
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { factoryId: "", trolleyId: "", exchangeTypeId: "", storageLocationId: "" },
  });

  // Populate (or reset) the form every time the dialog opens for a target row.
  React.useEffect(() => {
    if (!open) return;
    setSubmitError(null);

    if (mode === "edit" && mapping) {
      const trolleyFactoryId = trolleys.get(mapping.trolleyId)?.factoryId ?? "";
      form.reset({
        factoryId: trolleyFactoryId,
        trolleyId: mapping.trolleyId,
        exchangeTypeId: mapping.exchangeTypeId,
        storageLocationId: mapping.storageLocationId,
      });
    } else if (mode === "create") {
      form.reset({ factoryId: "", trolleyId: "", exchangeTypeId: "", storageLocationId: "" });
    }
    // Re-run once the trolley lookup finishes loading too, so an edit opened
    // before the collection resolved still gets the right factory scope.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, mapping?.id, trolleys.isLoading]);

  const factoryId = form.watch("factoryId");

  // A factory change in create mode invalidates whatever trolley/location was
  // picked under the previous factory.
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (mode !== "create") {
      previousFactoryId.current = factoryId;
      return;
    }
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("trolleyId", "");
      form.setValue("storageLocationId", "");
    }
  }, [factoryId, mode, form]);

  async function onSubmit(values: FormValues) {
    setSubmitError(null);
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          trolleyId: values.trolleyId,
          exchangeTypeId: values.exchangeTypeId,
          storageLocationId: values.storageLocationId,
        });
        toast.success("Storage mapping created.");
      } else if (mapping) {
        await updateMutation.mutateAsync({
          id: mapping.id,
          input: { storageLocationId: values.storageLocationId },
        });
        toast.success("Storage mapping updated.");
      }
      onOpenChange(false);
    } catch (err) {
      const message = getApiErrorMessage(err);
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      if (status === 400) {
        applyBadRequestError(form, message);
      } else {
        // 409 (duplicate trolley + exchange type pair) names a combination,
        // not one field — surfaced as a form-level banner instead.
        setSubmitError(message);
      }
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

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
          <DialogTitle>{mode === "create" ? "New Storage Mapping" : "Edit Storage Mapping"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Assign a trolley + exchange type its used-needle storage location."
              : "Only the destination location can change here — trolley and exchange type are fixed."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {mode === "create" && (
              <FormField
                control={form.control}
                name="factoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factory *</FormLabel>
                    <FormControl>
                      <FactorySelect value={field.value} onChange={field.onChange} id="storage-factory" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="trolleyId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Trolley *</FormLabel>
                  <FormControl>
                    {mode === "edit" ? (
                      <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                        <MasterDataName collection="trolleys" id={field.value} withCode />
                      </div>
                    ) : (
                      <MasterDataSelect
                        collection="trolleys"
                        query={factoryId ? { factoryId } : undefined}
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Trolley"
                        placeholder={factoryId ? "Select trolley" : "Select a factory first"}
                        disabled={!factoryId}
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="exchangeTypeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exchange Type *</FormLabel>
                  <FormControl>
                    {mode === "edit" ? (
                      <div className="flex h-9 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700">
                        <MasterDataName collection="exchange-types" id={field.value} withCode />
                      </div>
                    ) : (
                      <MasterDataSelect
                        collection="exchange-types"
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Exchange Type"
                        placeholder="Select exchange type"
                      />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storageLocationId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage Location *</FormLabel>
                  <FormControl>
                    <UsedNeedleStorageLocationSelect
                      factoryId={factoryId}
                      value={field.value}
                      onChange={field.onChange}
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
                {isSaving ? "Saving…" : mode === "create" ? "Create Mapping" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
