"use client";

import * as React from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { DetailField } from "@/shared/components/detail-field";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";
import { MasterDataName } from "@/shared/components/master-data-name";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { StatusBadge } from "@/shared/components/status-badge";
import { UserName } from "@/shared/components/user-name";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS, usePermission } from "@/core/permissions";
import {
  useAddCountItem,
  useCancelCountSession,
  useCompleteCountSession,
  useCountSession,
} from "../api/count-session-queries";
import type { CountItemResult, CountSessionDetail } from "../api/count-session-types";
import { useCurrentBalance } from "../api/queries";
import { LocationWithType } from "./location-with-type";
import { formatDateTime } from "./relocation-columns";
import { VarianceValue } from "./variance-value";

/** Mirrors `AddCountItemDto`. */
const itemSchema = z.object({
  needleTypeId: z.string().min(1, "Needle type is required"),
  physicalQuantity: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative"),
});
type ItemFormInput = z.input<typeof itemSchema>;
type ItemFormValues = z.output<typeof itemSchema>;

const ERROR_BOX = "rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700";

function CountItemsTable({ items, emptyTitle }: { items: CountItemResult[]; emptyTitle: string }) {
  if (items.length === 0) {
    return <EmptyState title={emptyTitle} className="py-6" />;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Needle Type</TableHead>
          <TableHead>System</TableHead>
          <TableHead>Physical</TableHead>
          <TableHead>Variance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.needleTypeId}>
            <TableCell>
              <MasterDataName collection="needle-types" id={item.needleTypeId} withCode />
            </TableCell>
            <TableCell>{item.systemQuantity}</TableCell>
            <TableCell>{item.physicalQuantity}</TableCell>
            <TableCell>
              <VarianceValue variance={item.varianceQuantity} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SessionSummary({ session }: { session: CountSessionDetail }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle>
          <MasterDataName collection="locations" id={session.locationId} withCode />
        </CardTitle>
        <StatusBadge status={session.status} />
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-3 gap-4">
          <DetailField label="Location" value={<LocationWithType id={session.locationId} />} />
          <DetailField label="Factory" value={<MasterDataName collection="factories" id={session.factoryId} />} />
          <DetailField label="Counter" value={<UserName id={session.createdBy} />} />
          <DetailField label="Started" value={formatDateTime(session.createdAt)} />
          {session.completedAt && <DetailField label="Completed" value={formatDateTime(session.completedAt)} />}
          {session.cancelledAt && <DetailField label="Cancelled" value={formatDateTime(session.cancelledAt)} />}
        </dl>
      </CardContent>
    </Card>
  );
}

/**
 * An `OPEN` session: record a physical count per needle type (live
 * system-vs-physical variance, same read Adjustment uses), then Complete —
 * reconciled into Adjustment movements server-side — or Cancel, which really
 * cancels it server-side (`POST …/cancel`), never just clears the screen.
 */
function OpenSessionPanel({ session }: { session: CountSessionDetail }) {
  const addItem = useAddCountItem();
  const completeSession = useCompleteCountSession();
  const cancelSession = useCancelCountSession();

  const [itemError, setItemError] = React.useState<string | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);
  const [completeOpen, setCompleteOpen] = React.useState(false);
  const [cancelOpen, setCancelOpen] = React.useState(false);

  const itemForm = useForm<ItemFormInput, unknown, ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { needleTypeId: "", physicalQuantity: 0 },
  });
  const needleTypeId = itemForm.watch("needleTypeId");
  const physicalQuantity = Number(itemForm.watch("physicalQuantity")) || 0;

  const liveBalance = useCurrentBalance(session.locationId, needleTypeId, needleTypeId !== "");
  const systemQuantity = liveBalance.data ?? 0;
  const variance = physicalQuantity - systemQuantity;

  const busy = completeSession.isPending || cancelSession.isPending;
  const varianceCount = session.items.filter((item) => item.varianceQuantity !== 0).length;

  async function handleAddItem(values: ItemFormValues) {
    setItemError(null);
    try {
      await addItem.mutateAsync({ sessionId: session.id, input: values });
      itemForm.reset({ needleTypeId: "", physicalQuantity: 0 });
      toast.success("Count recorded for this needle type.");
    } catch (err) {
      setItemError(getApiErrorMessage(err));
    }
  }

  async function handleComplete() {
    setActionError(null);
    try {
      const result = await completeSession.mutateAsync(session.id);
      const adjustmentCount = result.adjustmentMovementIds.length;
      toast.success(
        adjustmentCount > 0
          ? `Count complete. ${adjustmentCount} adjustment(s) created for the variance found.`
          : "Count complete. No variance found — no adjustment needed.",
      );
      setCompleteOpen(false);
    } catch (err) {
      setCompleteOpen(false);
      setActionError(getApiErrorMessage(err));
    }
  }

  async function handleCancel() {
    setActionError(null);
    try {
      await cancelSession.mutateAsync(session.id);
      toast.success("Count session cancelled. No stock was changed.");
      setCancelOpen(false);
    } catch (err) {
      setCancelOpen(false);
      setActionError(getApiErrorMessage(err));
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Record a Count</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...itemForm}>
            <form className="space-y-4" onSubmit={itemForm.handleSubmit(handleAddItem)}>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={itemForm.control}
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
                  control={itemForm.control}
                  name="physicalQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Physical Quantity *</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} {...field} value={field.value as number | string} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {needleTypeId !== "" && (
                <dl className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">System Quantity</dt>
                    <dd className="font-medium text-slate-900">{liveBalance.isLoading ? "…" : systemQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Physical Quantity</dt>
                    <dd className="font-medium text-slate-900">{physicalQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-500">Variance</dt>
                    <dd>
                      <VarianceValue variance={variance} />
                    </dd>
                  </div>
                </dl>
              )}

              {itemError && (
                <p role="alert" className={ERROR_BOX}>
                  {itemError}
                </p>
              )}

              <Button type="submit" variant="secondary" disabled={addItem.isPending || busy}>
                {addItem.isPending ? "Recording…" : "Record Count"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Counted So Far</CardTitle>
        </CardHeader>
        <CardContent>
          <CountItemsTable items={session.items} emptyTitle="Nothing counted yet." />
        </CardContent>
      </Card>

      {actionError && (
        <p role="alert" className={ERROR_BOX}>
          {actionError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setCancelOpen(true)} disabled={busy}>
          Cancel Session
        </Button>
        <Button type="button" onClick={() => setCompleteOpen(true)} disabled={busy}>
          Complete Count
        </Button>
      </div>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete Count Session"
        description="Every variance is written as a Physical Count adjustment immediately. The session cannot be changed afterwards."
        impact={[
          { label: "Needle Types Counted", value: session.items.length },
          { label: "With Variance", value: varianceCount, emphasize: true },
        ]}
        confirmLabel="Complete Count"
        onConfirm={handleComplete}
        isConfirming={completeSession.isPending}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        tone="destructive"
        title="Cancel Count Session"
        description="The session is closed as Cancelled. No stock is changed, and it cannot be reopened."
        impact={[{ label: "Needle Types Counted", value: session.items.length }]}
        confirmLabel="Cancel Session"
        cancelLabel="Keep Counting"
        onConfirm={handleCancel}
        isConfirming={cancelSession.isPending}
      />
    </>
  );
}

/** A `COMPLETED` or `CANCELLED` session — read-only items, and (completed) the adjustments it wrote. */
function ClosedSessionPanel({ session }: { session: CountSessionDetail }) {
  return (
    <>
      {session.status === "CANCELLED" && (
        <p className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          This session was cancelled. No stock was changed.
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Counted Items</CardTitle>
        </CardHeader>
        <CardContent>
          <CountItemsTable items={session.items} emptyTitle="No needle types were counted." />
        </CardContent>
      </Card>

      {session.status === "COMPLETED" && (
        <Card>
          <CardHeader>
            <CardTitle>Adjustments Created</CardTitle>
          </CardHeader>
          <CardContent>
            {session.adjustments.length === 0 ? (
              <EmptyState title="No variance found — no adjustment was needed." className="py-6" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movement No.</TableHead>
                    <TableHead>Needle Type</TableHead>
                    <TableHead>Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {session.adjustments.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>
                        <Link
                          href={`/inventory/adjustment?id=${encodeURIComponent(adjustment.id)}`}
                          className="font-mono text-xs font-medium text-ocean-700 underline-offset-4 hover:underline"
                        >
                          {adjustment.movementNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <MasterDataName collection="needle-types" id={adjustment.needleTypeId} withCode />
                      </TableCell>
                      <TableCell>
                        <VarianceValue variance={adjustment.varianceQuantity} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </>
  );
}

/**
 * `/inventory/count/[id]` — one count session, read from the server so a page
 * refresh resumes an open count (`.scratch/inventory-operation-history`
 * decision 6). `STOCK_COUNT`. No `Docs/18` ASCII layout exists for Physical
 * Count; modelled on §24 Adjustment's shape, as ticket 05 already flagged.
 */
export function CountSessionDetailScreen({ sessionId }: { sessionId: string }) {
  const canCount = usePermission(PERMISSIONS.STOCK_COUNT);
  const { data: session, isPending, isError, error, refetch } = useCountSession(sessionId, canCount);

  return (
    <>
      <PageHeader
        title="Count Session"
        description={
          session?.status === "OPEN"
            ? "Record what is physically at this location, then complete to reconcile the variance."
            : "A closed count session and what it reconciled."
        }
        breadcrumb={[
          { label: "Inventory" },
          { label: "Physical Count", href: "/inventory/count" },
          { label: "Session" },
        ]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_COUNT} isError={isError} error={error}>
        {isError ? (
          <Card>
            <CardContent className="pt-5">
              <ErrorState
                message={getApiErrorMessage(error, "This count session could not be loaded.")}
                onRetry={() => refetch()}
              />
            </CardContent>
          </Card>
        ) : isPending || !session ? (
          <div className="max-w-3xl space-y-4" aria-label="Loading">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <div className="max-w-3xl space-y-4">
            <SessionSummary session={session} />
            {session.status === "OPEN" ? <OpenSessionPanel session={session} /> : <ClosedSessionPanel session={session} />}
          </div>
        )}
      </RequirePermission>
    </>
  );
}
