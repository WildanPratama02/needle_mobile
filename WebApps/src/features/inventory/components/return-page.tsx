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
import { useCreateReturn, useCurrentBalance } from "../api/queries";

/**
 * FR-WEB-013 (`Docs/08-SRS-WebApps.md` §17): "Input: Source, Destination,
 * Needle Type, Quantity, Reason, Reference." `reason` is required per the
 * documented `POST /inventory/returns` payload (`Docs/12` §13); there is no
 * separate "Reference" field in the documented DTO, so this schema does not
 * invent one — Reason covers the same free-text purpose here.
 */
const returnSchema = z
  .object({
    factoryId: z.string().min(1, "Factory is required"),
    sourceLocationId: z.string().min(1, "Source location is required"),
    destinationLocationId: z.string().min(1, "Destination location is required"),
    needleTypeId: z.string().min(1, "Needle type is required"),
    quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
    reason: z.string().min(1, "Reason is required").max(500, "Max 500 characters"),
  })
  .refine((data) => data.sourceLocationId === "" || data.sourceLocationId !== data.destinationLocationId, {
    message: "Source and destination must be different locations",
    path: ["destinationLocationId"],
  });

type ReturnFormInput = z.input<typeof returnSchema>;
type ReturnFormValues = z.output<typeof returnSchema>;

/**
 * `STOCK_RETURN` (ticket 04, FR-WEB-013). Structurally the same shape as
 * `TransferScreen` — source/destination pickers scoped to the selected
 * factory, mutually distinct — with a mandatory `reason` the transfer form
 * does not carry.
 *
 * The backend route (`POST /inventory/returns`) is documented in `Docs/12`
 * §13 but not yet implemented server-side — see this ticket's status note.
 */
export function ReturnScreen() {
  const topBarFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const createReturn = useCreateReturn();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<ReturnFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<ReturnFormInput, unknown, ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
      sourceLocationId: "",
      destinationLocationId: "",
      needleTypeId: "",
      quantity: 1,
      reason: "",
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

  function handleReview(values: ReturnFormValues) {
    setSubmitError(null);
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      await createReturn.mutateAsync({
        factoryId: pendingValues.factoryId,
        sourceLocationId: pendingValues.sourceLocationId,
        destinationLocationId: pendingValues.destinationLocationId,
        needleTypeId: pendingValues.needleTypeId,
        quantity: pendingValues.quantity,
        reason: pendingValues.reason,
      });
      toast.success("Return recorded. Both balances updated.");
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
        reason: "",
      });
    } catch (err) {
      setConfirmOpen(false);
      setSubmitError(getApiErrorMessage(err));
      setPendingValues(null);
    }
  }

  const sourceCurrent = sourceBalance.data ?? 0;
  const destinationCurrent = destinationBalance.data ?? 0;
  const returnQty = pendingValues?.quantity ?? 0;

  return (
    <>
      <PageHeader
        title="Stock Return"
        description="Move stock back from a trolley or issue point to a source location, with a recorded reason."
        breadcrumb={[{ label: "Inventory" }, { label: "Stock Return" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_RETURN}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create Return</CardTitle>
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
                        <FactorySelect value={field.value} onChange={field.onChange} id="return-factory" />
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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g. Excess stock" {...field} />
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

                <Button type="submit">Review Return</Button>
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
        title="Confirm Return"
        description="This immediately moves stock between the two locations and records the reason."
        impact={[
          { label: "Source Current", value: sourceBalance.isLoading ? "…" : sourceCurrent },
          { label: "Source After", value: sourceCurrent - returnQty },
          { label: "Destination Current", value: destinationBalance.isLoading ? "…" : destinationCurrent },
          { label: "Destination After", value: destinationCurrent + returnQty, emphasize: true },
          { label: "Reason", value: pendingValues?.reason ?? "" },
        ]}
        confirmLabel="Confirm Return"
        onConfirm={handleConfirm}
        isConfirming={createReturn.isPending}
      />
    </>
  );
}
