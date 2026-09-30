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
import type { LocationsQuery } from "@/core/master-data";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCreateReceiving, useCurrentBalance } from "../api/queries";

/** Today in the browser's own zone, as the `yyyy-MM-dd` a date input speaks. */
export function today(): string {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Mirrors `CreateReceivingDto`: every id required — `supplierId` included,
 * since a receiving that cannot say where the stock came from is the defect
 * this feature exists to fix — integer quantity ≥ 1, `referenceDocument` ≤ 100,
 * `note` ≤ 500.
 *
 * The received-date rule is the backend's, restated: backdating is accepted
 * (spec decision 4), the future is not. Compared as `yyyy-MM-dd` strings,
 * where lexical order *is* chronological order, so no timezone can turn
 * "today" into tomorrow. A UX guard either way — the backend still answers a
 * future date with a 400.
 */
const receivingSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  destinationLocationId: z.string().min(1, "Destination warehouse is required"),
  needleTypeId: z.string().min(1, "Needle type is required"),
  quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  supplierId: z.string().min(1, "Supplier is required"),
  receivedDate: z
    .string()
    .min(1, "Received date is required")
    .refine((value) => value <= today(), "Received date cannot be in the future"),
  referenceDocument: z.string().max(100, "Max 100 characters"),
  note: z.string().max(500, "Max 500 characters"),
});

type ReceivingFormInput = z.input<typeof receivingSchema>;
type ReceivingFormValues = z.output<typeof receivingSchema>;

function emptyValues(): ReceivingFormInput {
  const topBarFactoryId = useFactoryScopeStore.getState().selectedFactoryId;
  return {
    factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
    destinationLocationId: "",
    needleTypeId: "",
    quantity: 1,
    supplierId: "",
    receivedDate: today(),
    referenceDocument: "",
    note: "",
  };
}

/**
 * The create form for Receiving (`STOCK_RECEIVE`), in a dialog over the
 * history. Review → ConfirmDialog with the destination's balance impact →
 * submit; on success the dialog closes, a toast confirms, and the `inventory`
 * key invalidation refreshes the history.
 */
export function ReceivingFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createReceiving = useCreateReceiving();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<ReceivingFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<ReceivingFormInput, unknown, ReceivingFormValues>({
    resolver: zodResolver(receivingSchema),
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
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("destinationLocationId", "");
    }
  }, [factoryId, form]);

  const destinationBalance = useCurrentBalance(
    pendingValues?.destinationLocationId ?? "",
    pendingValues?.needleTypeId ?? "",
    confirmOpen,
  );

  function handleReview(values: ReceivingFormValues) {
    setSubmitError(null);
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      await createReceiving.mutateAsync({
        factoryId: pendingValues.factoryId,
        destinationLocationId: pendingValues.destinationLocationId,
        needleTypeId: pendingValues.needleTypeId,
        quantity: pendingValues.quantity,
        supplierId: pendingValues.supplierId,
        // Always sent, never left to the server's default: the form showed a
        // date, so that is the date recorded.
        receivedDate: pendingValues.receivedDate,
        referenceDocument: pendingValues.referenceDocument || undefined,
        note: pendingValues.note || undefined,
      });
      toast.success("Receiving recorded. Stock balance updated.");
      setConfirmOpen(false);
      setPendingValues(null);
      onOpenChange(false);
    } catch (err) {
      // The backend crafts a distinct, human-readable message per status
      // (unknown supplier and a future received date are both 400s with their
      // own wording) — surfaced back in the form, not as a generic toast, so
      // the offending field is reachable again.
      setConfirmOpen(false);
      setPendingValues(null);
      setSubmitError(getApiErrorMessage(err));
    }
  }

  // Receiving lands in a warehouse and nowhere else (`Docs/02` Process F), so
  // the picker asks `/locations` for that type rather than filtering a fetched
  // collection. The backend's 400 on a trolley or used-needle destination
  // stays the authority, now a backstop instead of the normal path.
  const destinationQuery: LocationsQuery | undefined = factoryId
    ? { factoryId, locationType: "WAREHOUSE" }
    : undefined;

  const destinationCurrent = destinationBalance.data ?? 0;
  const pendingQty = pendingValues?.quantity ?? 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Receiving</DialogTitle>
            <DialogDescription>Record stock arriving from a supplier into a warehouse.</DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form noValidate className="space-y-4" onSubmit={form.handleSubmit(handleReview)}>
              <FormField
                control={form.control}
                name="factoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Factory *</FormLabel>
                    <FormControl>
                      <FactorySelect value={field.value} onChange={field.onChange} id="receiving-factory" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier *</FormLabel>
                      <FormControl>
                        {/*
                          No `query`: `/suppliers` takes no filter at all — a
                          supplier is business-wide and has no status to be
                          active or inactive (`.scratch/receiving-supplier`
                          decision 6), and `SupplierQuery` makes sending one a
                          compile error rather than a 400 found at runtime.
                        */}
                        <MasterDataSelect
                          collection="suppliers"
                          value={field.value}
                          onChange={field.onChange}
                          ariaLabel="Supplier"
                          placeholder="Select supplier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Date *</FormLabel>
                      <FormControl>
                        {/*
                          Deliberately no native `max`: the future-date rule
                          lives in the schema above, and the form sets
                          `noValidate` so react-hook-form owns the refusal.
                          A `max` here would add nothing but a second,
                          browser-worded way to say the same thing.
                          One refusal, written in this app's own idiom.
                        */}
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="destinationLocationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destination Warehouse *</FormLabel>
                    <FormControl>
                      <MasterDataSelect
                        collection="locations"
                        query={destinationQuery}
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
                      <Input placeholder="e.g. GR-00001" maxLength={100} {...field} />
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
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional note" {...field} />
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
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  disabled={createReceiving.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createReceiving.isPending}>
                  Review Receiving
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
        title="Confirm Receiving"
        description="This immediately increases the destination warehouse's balance."
        impact={[
          { label: "Current Balance", value: destinationBalance.isLoading ? "…" : destinationCurrent },
          { label: "Receive", value: `+${pendingQty}` },
          { label: "New Balance", value: destinationCurrent + pendingQty, emphasize: true },
        ]}
        confirmLabel="Confirm Receiving"
        onConfirm={handleConfirm}
        isConfirming={createReceiving.isPending}
      />
    </>
  );
}
