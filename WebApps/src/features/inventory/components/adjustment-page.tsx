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
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCreateAdjustment, useCurrentBalance } from "../api/queries";

const adjustmentSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  locationId: z.string().min(1, "Location is required"),
  needleTypeId: z.string().min(1, "Needle type is required"),
  actualQuantity: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative"),
  reason: z.string().min(1, "Reason is required").max(500, "Max 500 characters"),
});

type AdjustmentFormInput = z.input<typeof adjustmentSchema>;
type AdjustmentFormValues = z.output<typeof adjustmentSchema>;

function VarianceValue({ variance }: { variance: number }) {
  const sign = variance > 0 ? "+" : "";
  return (
    <span className={cn("font-bold", variance < 0 ? "text-danger-600" : variance > 0 ? "text-success-600" : "text-slate-700")}>
      {sign}
      {variance}
    </span>
  );
}

/**
 * `STOCK_ADJUST`. **Applies immediately on submit — no pending/approval UI**
 * (CONTEXT.md: Adjustment, spec decision #3). System quantity vs. actual
 * quantity vs. variance is shown live in the form (ticket 10) and again in
 * the ConfirmDialog impact summary before the write actually happens.
 */
export function AdjustmentScreen() {
  const topBarFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const createAdjustment = useCreateAdjustment();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<AdjustmentFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<AdjustmentFormInput, unknown, AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
      locationId: "",
      needleTypeId: "",
      actualQuantity: 0,
      reason: "",
    },
  });

  const factoryId = form.watch("factoryId");
  const locationId = form.watch("locationId");
  const needleTypeId = form.watch("needleTypeId");
  const actualQuantityRaw = form.watch("actualQuantity");
  const actualQuantity = Number(actualQuantityRaw) || 0;

  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("locationId", "");
    }
  }, [factoryId, form]);

  // Live preview in the form itself (ticket 10 acceptance), sourced from the
  // same `GET /inventory/balances` read Stock Overview uses — never invented.
  const liveBalance = useCurrentBalance(locationId, needleTypeId, locationId !== "" && needleTypeId !== "");
  const systemQuantity = liveBalance.data ?? 0;
  const variance = actualQuantity - systemQuantity;

  // Frozen at "Review" time, same value the ConfirmDialog and the actual
  // submit both use — the two must never disagree.
  const confirmBalance = useCurrentBalance(
    pendingValues?.locationId ?? "",
    pendingValues?.needleTypeId ?? "",
    confirmOpen,
  );
  const confirmSystemQuantity = confirmBalance.data ?? 0;
  const confirmActualQuantity = pendingValues?.actualQuantity ?? 0;
  const confirmVariance = confirmActualQuantity - confirmSystemQuantity;

  function handleReview(values: AdjustmentFormValues) {
    setSubmitError(null);
    setPendingValues(values);
    setConfirmOpen(true);
  }

  async function handleConfirm() {
    if (!pendingValues) return;
    try {
      await createAdjustment.mutateAsync({
        factoryId: pendingValues.factoryId,
        locationId: pendingValues.locationId,
        needleTypeId: pendingValues.needleTypeId,
        actualQuantity: pendingValues.actualQuantity,
        reason: pendingValues.reason,
      });
      toast.success("Adjustment applied. Balance updated immediately.");
      setConfirmOpen(false);
      setSubmitError(null);
      const completed = pendingValues;
      setPendingValues(null);
      form.reset({
        factoryId: completed.factoryId,
        locationId: "",
        needleTypeId: "",
        actualQuantity: 0,
        reason: "",
      });
    } catch (err) {
      // Surfaced back in the form (not a generic toast) — same convention as
      // Receiving/Transfer.
      setConfirmOpen(false);
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Adjustment"
        description="Reconcile a location's recorded balance to a physical count. Applies immediately — no approval step."
        breadcrumb={[{ label: "Inventory" }, { label: "Adjustment" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_ADJUST}>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Create Adjustment</CardTitle>
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
                        <FactorySelect value={field.value} onChange={field.onChange} id="adjustment-factory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="locationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location *</FormLabel>
                      <FormControl>
                        <MasterDataSelect
                          collection="locations"
                          query={factoryId ? { factoryId } : undefined}
                          value={field.value}
                          onChange={field.onChange}
                          ariaLabel="Location"
                          placeholder="Select location"
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

                {locationId !== "" && needleTypeId !== "" && (
                  <dl className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">System Quantity</dt>
                      <dd className="font-medium text-slate-900">
                        {liveBalance.isLoading ? "…" : systemQuantity}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Actual Quantity</dt>
                      <dd className="font-medium text-slate-900">{actualQuantity}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Variance</dt>
                      <dd>
                        <VarianceValue variance={variance} />
                      </dd>
                    </div>
                  </dl>
                )}

                <FormField
                  control={form.control}
                  name="actualQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Quantity (physical count) *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} value={field.value as number | string} />
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
                        <Textarea placeholder="e.g. Physical count discrepancy" {...field} />
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

                <Button type="submit">Review Adjustment</Button>
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
        title="Confirm Stock Adjustment"
        description="Applies immediately — the balance updates now, with no approval step."
        tone={confirmVariance < 0 ? "destructive" : "impact"}
        impact={[
          { label: "System Quantity", value: confirmBalance.isLoading ? "…" : confirmSystemQuantity },
          { label: "Actual Quantity", value: confirmActualQuantity },
          { label: "Variance", value: <VarianceValue variance={confirmVariance} />, emphasize: true },
          { label: "Reason", value: pendingValues?.reason ?? "" },
        ]}
        confirmLabel="Confirm Adjustment"
        onConfirm={handleConfirm}
        isConfirming={createAdjustment.isPending}
      />
    </>
  );
}
