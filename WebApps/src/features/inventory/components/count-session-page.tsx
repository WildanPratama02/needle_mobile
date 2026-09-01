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
import { cn } from "@/lib/utils";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataName } from "@/shared/components/master-data-name";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { PageHeader } from "@/shared/components/page-header";
import { RequirePermission } from "@/shared/components/require-permission";
import { getApiErrorMessage } from "@/core/api/client";
import { PERMISSIONS } from "@/core/permissions";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useAddCountItem, useCompleteCountSession, useCreateCountSession } from "../api/count-session-queries";
import type { CountSessionDetail } from "../api/count-session-types";
import { useCurrentBalance } from "../api/queries";

const startSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  locationId: z.string().min(1, "Location is required"),
});
type StartFormValues = z.infer<typeof startSchema>;

const itemSchema = z.object({
  needleTypeId: z.string().min(1, "Needle type is required"),
  physicalQuantity: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative"),
});
type ItemFormInput = z.input<typeof itemSchema>;
type ItemFormValues = z.output<typeof itemSchema>;

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
 * FR-WEB-015 (`Docs/08-SRS-WebApps.md` §19): "Counting session: Factory,
 * Location, Trolley, Needle Type, Count Date, Counter. Flow: Create Count ->
 * Physical Quantity -> Compare System Quantity -> Variance ->
 * Reconciliation." `STOCK_COUNT` (ticket 05).
 *
 * **No `Docs/18` ASCII layout exists for this screen** — flagged in the
 * ticket rather than invented silently. This UI is modeled on §24
 * Adjustment's shape (location + needle-type selection, quantity input,
 * live variance, reason via the eventual Adjustment) per the ticket's own
 * guidance, not treated as if that section were authoritative for Physical
 * Count. `Docs/12` §14 also documents no response shape for any of the four
 * routes and no list route — see `count-session-types.ts`'s header comment.
 *
 * Flow: start a session (factory + location) -> add one physical count per
 * needle type, each showing a live system-vs-physical variance the same way
 * Adjustment's form does -> Complete, which reconciles into Adjustment
 * movements server-side (this screen never computes or applies that
 * ledger write itself — backend stock authority, ADR-004).
 */
export function CountSessionScreen() {
  const topBarFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);

  const [sessionId, setSessionId] = React.useState<string | null>(null);
  // Driven directly from mutation responses rather than a follow-up
  // `GET /inventory/count-sessions/:id` — that route's response shape is
  // unconfirmed (see `count-session-types.ts`), and every mutation here
  // already returns the session state a caller needs.
  const [activeSession, setActiveSession] = React.useState<CountSessionDetail | null>(null);

  const createSession = useCreateCountSession();
  const addItem = useAddCountItem();
  const completeSession = useCompleteCountSession();

  const startForm = useForm<StartFormValues>({
    resolver: zodResolver(startSchema),
    defaultValues: { factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId, locationId: "" },
  });
  const startFactoryId = startForm.watch("factoryId");
  const previousStartFactoryId = React.useRef(startFactoryId);
  React.useEffect(() => {
    if (previousStartFactoryId.current !== startFactoryId) {
      previousStartFactoryId.current = startFactoryId;
      startForm.setValue("locationId", "");
    }
  }, [startFactoryId, startForm]);

  const itemForm = useForm<ItemFormInput, unknown, ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { needleTypeId: "", physicalQuantity: 0 },
  });
  const itemNeedleTypeId = itemForm.watch("needleTypeId");
  const itemPhysicalRaw = itemForm.watch("physicalQuantity");
  const itemPhysical = Number(itemPhysicalRaw) || 0;

  const [startError, setStartError] = React.useState<string | null>(null);
  const [itemError, setItemError] = React.useState<string | null>(null);
  const [completeError, setCompleteError] = React.useState<string | null>(null);
  const [lastResultSummary, setLastResultSummary] = React.useState<string | null>(null);

  const activeLocationId = activeSession?.locationId ?? "";
  const liveBalance = useCurrentBalance(activeLocationId, itemNeedleTypeId, activeLocationId !== "" && itemNeedleTypeId !== "");
  const systemQuantity = liveBalance.data ?? 0;
  const variance = itemPhysical - systemQuantity;

  async function handleStart(values: StartFormValues) {
    setStartError(null);
    try {
      const created = await createSession.mutateAsync({ factoryId: values.factoryId, locationId: values.locationId });
      setSessionId(created.id);
      setActiveSession({ ...created, items: [] });
      toast.success("Count session started.");
    } catch (err) {
      setStartError(getApiErrorMessage(err));
    }
  }

  async function handleAddItem(values: ItemFormValues) {
    if (!sessionId) return;
    setItemError(null);
    try {
      const updated = await addItem.mutateAsync({ sessionId, input: values });
      setActiveSession(updated);
      itemForm.reset({ needleTypeId: "", physicalQuantity: 0 });
      toast.success("Count recorded for this needle type.");
    } catch (err) {
      setItemError(getApiErrorMessage(err));
    }
  }

  async function handleComplete() {
    if (!sessionId) return;
    setCompleteError(null);
    try {
      const result = await completeSession.mutateAsync(sessionId);
      // `result`'s shape is a best-effort guess (see `count-session-types.ts`'s
      // header comment) — degrade to a generic message rather than throw if
      // the real response doesn't carry `adjustmentMovementIds`.
      const adjustmentCount = result?.adjustmentMovementIds?.length;
      setLastResultSummary(
        adjustmentCount === undefined
          ? "Count complete."
          : adjustmentCount > 0
            ? `Count complete. ${adjustmentCount} adjustment movement(s) created for the variance found.`
            : "Count complete. No variance found — no adjustment needed.",
      );
      toast.success("Count session completed.");
      setSessionId(null);
      setActiveSession(null);
      startForm.reset({ factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId, locationId: "" });
    } catch (err) {
      setCompleteError(getApiErrorMessage(err));
    }
  }

  function handleCancel() {
    setSessionId(null);
    setActiveSession(null);
    setItemError(null);
    itemForm.reset({ needleTypeId: "", physicalQuantity: 0 });
  }

  return (
    <>
      <PageHeader
        title="Physical Count"
        description="Reconcile a location's recorded balance against a physical count. Variance is reconciled into Adjustment movements on Complete."
        breadcrumb={[{ label: "Inventory" }, { label: "Physical Count" }]}
      />

      <RequirePermission permission={PERMISSIONS.STOCK_COUNT}>
        {lastResultSummary && (
          <p className="mb-4 max-w-2xl rounded-md border border-success-500 bg-success-50 px-3 py-2 text-sm text-success-700">
            {lastResultSummary}
          </p>
        )}

        {!sessionId ? (
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Start Count Session</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...startForm}>
                <form className="space-y-4" onSubmit={startForm.handleSubmit(handleStart)}>
                  <FormField
                    control={startForm.control}
                    name="factoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Factory *</FormLabel>
                        <FormControl>
                          <FactorySelect value={field.value} onChange={field.onChange} id="count-factory" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={startForm.control}
                    name="locationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <MasterDataSelect
                            collection="locations"
                            query={startFactoryId ? { factoryId: startFactoryId } : undefined}
                            value={field.value}
                            onChange={field.onChange}
                            ariaLabel="Location"
                            placeholder={startFactoryId ? "Select location" : "Select a factory first"}
                            disabled={!startFactoryId}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {startError && (
                    <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                      {startError}
                    </p>
                  )}

                  <Button type="submit" disabled={createSession.isPending}>
                    {createSession.isPending ? "Starting…" : "Start Count"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <div className="max-w-2xl space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  Counting <MasterDataName collection="locations" id={activeLocationId} withCode />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...itemForm}>
                  <form className="space-y-4" onSubmit={itemForm.handleSubmit(handleAddItem)}>
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

                    {itemNeedleTypeId !== "" && (
                      <dl className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                        <div>
                          <dt className="text-xs text-slate-500">System Quantity</dt>
                          <dd className="font-medium text-slate-900">{liveBalance.isLoading ? "…" : systemQuantity}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-slate-500">Physical Quantity</dt>
                          <dd className="font-medium text-slate-900">{itemPhysical}</dd>
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

                    {itemError && (
                      <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                        {itemError}
                      </p>
                    )}

                    <Button type="submit" variant="secondary" disabled={addItem.isPending}>
                      {addItem.isPending ? "Recording…" : "Record Count"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {activeSession && activeSession.items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Counted so far</CardTitle>
                </CardHeader>
                <CardContent>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                        <th className="pb-2">Needle Type</th>
                        <th className="pb-2">System</th>
                        <th className="pb-2">Physical</th>
                        <th className="pb-2">Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSession.items.map((item) => (
                        <tr key={item.needleTypeId} className="border-b border-slate-100">
                          <td className="py-2">
                            <MasterDataName collection="needle-types" id={item.needleTypeId} withCode />
                          </td>
                          <td className="py-2">{item.systemQuantity}</td>
                          <td className="py-2">{item.physicalQuantity}</td>
                          <td className="py-2">
                            <VarianceValue variance={item.varianceQuantity} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            )}

            {completeError && (
              <p className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                {completeError}
              </p>
            )}

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={handleCancel} disabled={completeSession.isPending}>
                Cancel Session
              </Button>
              <Button type="button" onClick={handleComplete} disabled={completeSession.isPending}>
                {completeSession.isPending ? "Completing…" : "Complete Count"}
              </Button>
            </div>
          </div>
        )}
      </RequirePermission>
    </>
  );
}
