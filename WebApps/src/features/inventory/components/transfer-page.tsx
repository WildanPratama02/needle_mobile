"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCreateTransfer, useCurrentBalance } from "../api/queries";

const transferSchema = z
  .object({
    factoryId: z.string().min(1, "Factory is required"),
    sourceLocationId: z.string().min(1, "Source location is required"),
    destinationLocationId: z.string().min(1, "Destination location is required"),
    needleTypeId: z.string().min(1, "Needle type is required"),
    quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
    note: z.string().max(500, "Max 500 characters").optional(),
  })
  .refine((data) => data.sourceLocationId === "" || data.sourceLocationId !== data.destinationLocationId, {
    message: "Source and destination must be different locations",
    path: ["destinationLocationId"],
  });

type TransferFormInput = z.input<typeof transferSchema>;
type TransferFormValues = z.output<typeof transferSchema>;

/**
 * `STOCK_TRANSFER`. Source/destination pickers scoped to the selected
 * factory only (ticket 09) and mutually distinct — the `refine` above is the
 * client-side UX guard; the backend still enforces both independently
 * (400 same-location, 409 `INVENTORY_INSUFFICIENT_STOCK`).
 */
export function TransferScreen() {
  const topBarFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const createTransfer = useCreateTransfer();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<TransferFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<TransferFormInput, unknown, TransferFormValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
      sourceLocationId: "",
      destinationLocationId: "",
      needleTypeId: "",
      quantity: 1,
      note: "",
    },
  });

  const factoryId = form.watch("factoryId");
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("sourceLocationId", "");
      form.setValue("destinationLocationId", "");
    }
  }, [factoryId, form]);

  const sourceBalance = useCurrentBalance(
    pendingValues?.sourceLocationId ?? "",
    pendingValues?.needleTypeId ?? "",
    confirmOpen,
  );
  const destinationBalance = useCurrentBalance(
    pendingValues?.destinationLocationId ?? "",
    pendingValues?.needleTypeId ?? "",
    confirmOpen,
  );

  function handleReview(values: TransferFormValues) {
    setSubmitError(null);
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      await createTransfer.mutateAsync({
        factoryId: pendingValues.factoryId,
        sourceLocationId: pendingValues.sourceLocationId,
        destinationLocationId: pendingValues.destinationLocationId,
        needleTypeId: pendingValues.needleTypeId,
        quantity: pendingValues.quantity,
        note: pendingValues.note || undefined,
      });
      toast.success("Transfer complete. Both balances updated.");
      setConfirmOpen(false);
      setSubmitError(null);
      const completed = pendingValues;
      setPendingValues(null);
      form.reset({
        factoryId: completed.factoryId,
        sourceLocationId: "",
        destinationLocationId: "",
        needleTypeId: "",
        quantity: 1,
        note: "",
      });
    } catch (err) {
      // 400 (same-location) and 409 (INVENTORY_INSUFFICIENT_STOCK) each carry
      // their own distinct message from the backend — surfaced as-is, back in
      // the form (not a generic toast), so the offending field is reachable.
      setConfirmOpen(false);
      setSubmitError(getApiErrorMessage(err));
    }
  }

  const sourceCurrent = sourceBalance.data ?? 0;
  const destinationCurrent = destinationBalance.data ?? 0;
  const transferQty = pendingValues?.quantity ?? 0;

  return (
    <>
      <PageHeader
        title="Transfer"
        description="Move stock between two locations within the same factory."
        breadcrumb={[{ label: "Inventory" }, { label: "Transfer" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_TRANSFER}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-4" onSubmit={form.handleSubmit(handleReview)}>
                <FormField
                  control={form.control}
                  name="factoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Factory *</FormLabel>
                      <FormControl>
                        <FactorySelect value={field.value} onChange={field.onChange} id="transfer-factory" />
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
                        <FormLabel>Source *</FormLabel>
                        <FormControl>
                          <MasterDataSelect
                            collection="locations"
                            query={factoryId ? { factoryId } : undefined}
                            value={field.value}
                            onChange={field.onChange}
                            ariaLabel="Source Location"
                            placeholder="Select source"
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
                        <FormLabel>Destination *</FormLabel>
                        <FormControl>
                          <MasterDataSelect
                            collection="locations"
                            query={factoryId ? { factoryId } : undefined}
                            value={field.value}
                            onChange={field.onChange}
                            ariaLabel="Destination Location"
                            placeholder="Select destination"
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
                  <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                    {submitError}
                  </p>
                )}

                <Button type="submit">Review Transfer</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </RequirePermission>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingValues(null);
        }}
        title="Confirm Transfer"
        description="This immediately moves stock between the two locations."
        impact={[
          { label: "Source Current", value: sourceBalance.isLoading ? "…" : sourceCurrent },
          { label: "Source After", value: sourceCurrent - transferQty },
          { label: "Destination Current", value: destinationBalance.isLoading ? "…" : destinationCurrent },
          { label: "Destination After", value: destinationCurrent + transferQty, emphasize: true },
        ]}
        confirmLabel="Confirm Transfer"
        onConfirm={handleConfirm}
        isConfirming={createTransfer.isPending}
      />
    </>
  );
}
