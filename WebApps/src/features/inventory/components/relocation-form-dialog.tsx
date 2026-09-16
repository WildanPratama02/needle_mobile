"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { getApiErrorMessage } from "@/core/api/client";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import type { RelocationKind } from "../api/operation-history-types";
import { useCreateReturn, useCreateTransfer, useCurrentBalance } from "../api/queries";
import { RELOCATION_CONFIG } from "./relocation-config";

/**
 * Mirrors `CreateTransferDto` / `CreateReturnDto`: every id required, integer
 * quantity ≥ 1, optional `referenceDocument` ≤ 100, `note`/`reason` ≤ 500 —
 * mandatory for Return. The distinct-locations `refine` is a UX guard; the
 * backend still enforces it (400), plus Return's trolley → warehouse rule
 * (400) and insufficient source stock (409).
 */
function buildRelocationSchema(noteRequired: boolean) {
  return z
    .object({
      factoryId: z.string().min(1, "Factory is required"),
      sourceLocationId: z.string().min(1, "Source location is required"),
      destinationLocationId: z.string().min(1, "Destination location is required"),
      needleTypeId: z.string().min(1, "Needle type is required"),
      quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
      referenceDocument: z.string().max(100, "Max 100 characters"),
      note: noteRequired
        ? z.string().min(1, "Reason is required").max(500, "Max 500 characters")
        : z.string().max(500, "Max 500 characters"),
    })
    .refine((data) => data.sourceLocationId === "" || data.sourceLocationId !== data.destinationLocationId, {
      message: "Source and destination must be different locations",
      path: ["destinationLocationId"],
    });
}

const SCHEMAS = {
  transfer: buildRelocationSchema(false),
  return: buildRelocationSchema(true),
} as const;

type RelocationFormInput = z.input<typeof SCHEMAS.transfer>;
type RelocationFormValues = z.output<typeof SCHEMAS.transfer>;

function emptyValues(): RelocationFormInput {
  const topBarFactoryId = useFactoryScopeStore.getState().selectedFactoryId;
  return {
    factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
    sourceLocationId: "",
    destinationLocationId: "",
    needleTypeId: "",
    quantity: 1,
    referenceDocument: "",
    note: "",
  };
}

/**
 * The create form for Transfer (`STOCK_TRANSFER`) and Stock Return
 * (`STOCK_RETURN`), in a dialog over the history. Review → ConfirmDialog with
 * both balances' impact → submit; on success the dialog closes, a toast
 * confirms, and the `inventory` key invalidation refreshes the history.
 */
export function RelocationFormDialog({
  kind,
  open,
  onOpenChange,
}: {
  kind: RelocationKind;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const config = RELOCATION_CONFIG[kind];
  const createTransfer = useCreateTransfer();
  const createReturn = useCreateReturn();
  const isSubmitting = kind === "transfer" ? createTransfer.isPending : createReturn.isPending;

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<RelocationFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<RelocationFormInput, unknown, RelocationFormValues>({
    resolver: zodResolver(SCHEMAS[kind]),
    defaultValues: emptyValues(),
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(emptyValues());
    setSubmitError(null);
    setPendingValues(null);
    setConfirmOpen(false);
  }, [open, form]);

  const factoryId = form.watch("factoryId");
  const sourceLocationId = form.watch("sourceLocationId");
  const needleTypeId = form.watch("needleTypeId");
  const quantity = Number(form.watch("quantity")) || 0;

  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("sourceLocationId", "");
      form.setValue("destinationLocationId", "");
    }
  }, [factoryId, form]);

  // Live source availability while typing (ticket 02) — the same
  // `GET /inventory/balances` read Adjustment uses. Informational only: the
  // backend's 409 is the authority on "enough stock", never this number.
  const hasSourceAndNeedle = sourceLocationId !== "" && needleTypeId !== "";
  const sourceBalance = useCurrentBalance(sourceLocationId, needleTypeId, open && hasSourceAndNeedle);
  const sourceAvailable = sourceBalance.data ?? 0;
  const exceedsSource = hasSourceAndNeedle && !sourceBalance.isLoading && quantity > sourceAvailable;

  const destinationBalance = useCurrentBalance(
    pendingValues?.destinationLocationId ?? "",
    pendingValues?.needleTypeId ?? "",
    confirmOpen,
  );

  function handleReview(values: RelocationFormValues) {
    setSubmitError(null);
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    const base = {
      factoryId: pendingValues.factoryId,
      sourceLocationId: pendingValues.sourceLocationId,
      destinationLocationId: pendingValues.destinationLocationId,
      needleTypeId: pendingValues.needleTypeId,
      quantity: pendingValues.quantity,
      referenceDocument: pendingValues.referenceDocument || undefined,
    };
    try {
      if (kind === "transfer") {
        await createTransfer.mutateAsync({ ...base, note: pendingValues.note || undefined });
      } else {
        await createReturn.mutateAsync({ ...base, reason: pendingValues.note });
      }
      toast.success(config.successToast);
      setConfirmOpen(false);
      setPendingValues(null);
      onOpenChange(false);
    } catch (err) {
      // 400 (same location / wrong location type) and 409 (insufficient
      // stock) each carry their own backend message — surfaced back in the
      // form, not a generic toast, so the offending field is reachable.
      setConfirmOpen(false);
      setPendingValues(null);
      setSubmitError(getApiErrorMessage(err));
    }
  }

  const sourceFilter = config.sourceType
    ? (row: { locationType: string }) => row.locationType === config.sourceType
    : undefined;
  const destinationFilter = config.destinationType
    ? (row: { locationType: string }) => row.locationType === config.destinationType
    : undefined;

  const destinationCurrent = destinationBalance.data ?? 0;
  const pendingQty = pendingValues?.quantity ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{config.formTitle}</DialogTitle>
            <DialogDescription>{config.formDescription}</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(handleReview)}>
              <FormField
                control={form.control}
                name="factoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factory *</FormLabel>
                    <FormControl>
                      <FactorySelect value={field.value} onChange={field.onChange} id={`${kind}-factory`} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sourceLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{config.sourceType === "TROLLEY" ? "Source Trolley *" : "Source *"}</FormLabel>
                      <FormControl>
                        <MasterDataSelect
                          collection="locations"
                          query={factoryId ? { factoryId } : undefined}
                          filter={sourceFilter}
                          value={field.value}
                          onChange={field.onChange}
                          ariaLabel="Source Location"
                          placeholder={factoryId ? "Select source" : "Select a factory first"}
                          disabled={!factoryId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {config.destinationType === "WAREHOUSE" ? "Destination Warehouse *" : "Destination *"}
                      </FormLabel>
                      <FormControl>
                        <MasterDataSelect
                          collection="locations"
                          query={factoryId ? { factoryId } : undefined}
                          filter={destinationFilter}
                          value={field.value}
                          onChange={field.onChange}
                          ariaLabel="Destination Location"
                          placeholder={factoryId ? "Select destination" : "Select a factory first"}
                          disabled={!factoryId}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="needleTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Needle Type *</FormLabel>
                    <FormControl>
                      <MasterDataSelect
                        collection="needle-types"
                        value={field.value}
                        onChange={field.onChange}
                        ariaLabel="Needle Type"
                        placeholder="Select needle type"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} step={1} {...field} value={field.value as number | string} />
                    </FormControl>
                    {hasSourceAndNeedle && (
                      <p className="text-sm text-slate-600" aria-live="polite" data-testid="source-available">
                        Available at source:{" "}
                        <span className="font-semibold text-slate-900">
                          {sourceBalance.isLoading ? "…" : sourceAvailable}
                        </span>
                        {exceedsSource && (
                          <span className="ml-1 text-warning-700">
                            — more than the source currently holds; this will be refused.
                          </span>
                        )}
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceDocument"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Document</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DO-0012" maxLength={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {config.noteLabel}
                      {config.noteRequired ? " *" : ""}
                    </FormLabel>
                    <FormControl>
                      <Textarea placeholder={config.notePlaceholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {submitError && (
                <p
                  role="alert"
                  className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                >
                  {submitError}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {config.reviewLabel}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(next) => {
          setConfirmOpen(next);
          if (!next) setPendingValues(null);
        }}
        title={config.confirmTitle}
        description={config.confirmDescription}
        impact={[
          { label: "Source Current", value: sourceBalance.isLoading ? "…" : sourceAvailable },
          { label: "Source After", value: sourceAvailable - pendingQty },
          { label: "Destination Current", value: destinationBalance.isLoading ? "…" : destinationCurrent },
          { label: "Destination After", value: destinationCurrent + pendingQty, emphasize: true },
          ...(pendingValues?.referenceDocument
            ? [{ label: "Reference Document", value: pendingValues.referenceDocument }]
            : []),
          ...(config.noteRequired ? [{ label: config.noteLabel, value: pendingValues?.note ?? "" }] : []),
        ]}
        confirmLabel={config.confirmLabel}
        onConfirm={handleConfirm}
        isConfirming={isSubmitting}
      />
    </>
  );
}
