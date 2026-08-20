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
import { DataTable } from "@/shared/tables";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCreateReceiving, useCurrentBalance, useMovements } from "../api/queries";
import type { MovementListFilters } from "../api/types";
import { movementColumns } from "./columns";

const receivingSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  destinationLocationId: z.string().min(1, "Destination location is required"),
  needleTypeId: z.string().min(1, "Needle type is required"),
  quantity: z.coerce.number().int("Quantity must be a whole number").min(1, "Quantity must be at least 1"),
  referenceDocument: z.string().max(100, "Max 100 characters").optional(),
  note: z.string().max(500, "Max 500 characters").optional(),
});

type ReceivingFormInput = z.input<typeof receivingSchema>;
type ReceivingFormValues = z.output<typeof receivingSchema>;

const RECENT_RECEIVINGS_FILTERS: MovementListFilters = {
  factoryId: "all",
  locationId: "",
  trolleyId: "",
  needleTypeId: "",
  movementType: "RECEIVING",
  dateFrom: "",
  dateTo: "",
  page: 1,
  pageSize: 10,
};

/**
 * `STOCK_RECEIVE` gates create; the recent-receivings list below reuses
 * `GET /inventory/movements?movementType=RECEIVING` (ticket 08: no separate
 * receivings-list endpoint exists or is planned) and is gated on `STOCK_VIEW`
 * separately, since a receiving clerk may hold one grant without the other.
 */
export function ReceivingScreen() {
  const canViewStock = usePermission(PERMISSIONS.STOCK_VIEW);
  const topBarFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const createReceiving = useCreateReceiving();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<ReceivingFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<ReceivingFormInput, unknown, ReceivingFormValues>({
    resolver: zodResolver(receivingSchema),
    defaultValues: {
      factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
      destinationLocationId: "",
      needleTypeId: "",
      quantity: 1,
      referenceDocument: "",
      note: "",
    },
  });

  const factoryId = form.watch("factoryId");
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("destinationLocationId", "");
    }
  }, [factoryId, form]);

  const currentBalance = useCurrentBalance(
    pendingValues?.destinationLocationId ?? "",
    pendingValues?.needleTypeId ?? "",
    confirmOpen,
  );

  const recent = useMovements(RECENT_RECEIVINGS_FILTERS, canViewStock);

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
        referenceDocument: pendingValues.referenceDocument || undefined,
        note: pendingValues.note || undefined,
      });
      toast.success("Receiving recorded. Stock balance updated.");
      setConfirmOpen(false);
      setSubmitError(null);
      setPendingValues(null);
      form.reset({
        factoryId: pendingValues.factoryId,
        destinationLocationId: "",
        needleTypeId: "",
        quantity: 1,
        referenceDocument: "",
        note: "",
      });
    } catch (err) {
      // Backend crafts a distinct, human-readable message per status
      // (`Backend/src/common/filters/http-exception.filter.ts`) — trusted
      // rather than re-derived per status code here. Surfaced back in the
      // form itself (ticket 08: "not a generic failure toast"), not as a
      // toast — the dialog closes so the offending field is reachable again.
      setConfirmOpen(false);
      setSubmitError(getApiErrorMessage(err));
    }
  }

  const current = currentBalance.data ?? 0;
  const receiveQty = pendingValues?.quantity ?? 0;

  return (
    <>
      <PageHeader
        title="Receiving"
        description="Receive stock into a location."
        breadcrumb={[{ label: "Inventory" }, { label: "Receiving" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_RECEIVE}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
          <Card>
            <CardHeader>
              <CardTitle>Create Receiving</CardTitle>
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
                          <FactorySelect value={field.value} onChange={field.onChange} id="receiving-factory" />
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
                        <FormLabel>Destination Location *</FormLabel>
                        <FormControl>
                          <MasterDataSelect
                            collection="locations"
                            query={factoryId ? { factoryId } : undefined}
                            value={field.value}
                            onChange={field.onChange}
                            ariaLabel="Destination Location"
                            placeholder="Select destination location"
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
                          <Input
                            type="number"
                            min={1}
                            step={1}
                            {...field}
                            value={field.value as number | string}
                          />
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
                        <FormLabel>Reference / Document</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. GR-00001" {...field} />
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

                  <Button type="submit">Review Receiving</Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Receivings</CardTitle>
            </CardHeader>
            <CardContent>
              {canViewStock ? (
                <DataTable
                  columns={movementColumns}
                  data={recent.data?.items ?? []}
                  isLoading={recent.isPending}
                  isError={recent.isError}
                  errorMessage={recent.isError ? getApiErrorMessage(recent.error) : undefined}
                  onRetry={() => recent.refetch()}
                  emptyTitle="No receivings yet."
                  pageIndex={0}
                  pageSize={RECENT_RECEIVINGS_FILTERS.pageSize}
                  pageCount={recent.data?.totalPages ?? 0}
                  totalRows={recent.data?.total ?? 0}
                  onPageChange={() => {}}
                />
              ) : (
                <p className="text-sm text-slate-500">
                  You do not have permission to view stock movement history.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </RequirePermission>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setPendingValues(null);
        }}
        title="Confirm Receiving"
        description="This immediately increases the destination location's balance."
        impact={[
          { label: "Current Balance", value: currentBalance.isLoading ? "…" : current },
          { label: "Receive", value: `+${receiveQty}` },
          { label: "New Balance", value: current + receiveQty, emphasize: true },
        ]}
        confirmLabel="Confirm Receiving"
        onConfirm={handleConfirm}
        isConfirming={createReceiving.isPending}
      />
    </>
  );
}
