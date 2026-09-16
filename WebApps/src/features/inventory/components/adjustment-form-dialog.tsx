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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/shared/components/confirm-dialog";
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { getApiErrorMessage } from "@/core/api/client";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import {
  ADJUSTMENT_REASON_CODES,
  ADJUSTMENT_REASON_LABELS,
  EVIDENCE_MAX_FILES,
} from "../api/operation-history-types";
import { useCreateAdjustment, useCurrentBalance } from "../api/queries";
import { EvidenceUploadField } from "./evidence-upload-field";
import { VarianceValue } from "./variance-value";

/**
 * Mirrors `CreateAdjustmentDto` (operation-history spec decisions 3–4):
 * reason code required; note ≤ 500 and required only for `OTHER`; 1–5
 * uploaded evidence ids; integer `actualQuantity` ≥ 0.
 *
 * The `OTHER`-needs-a-note rule is object-level, so (as with every zod
 * object refinement) it reports once the individual fields are valid.
 */
const adjustmentSchema = z
  .object({
    factoryId: z.string().min(1, "Factory is required"),
    locationId: z.string().min(1, "Location is required"),
    needleTypeId: z.string().min(1, "Needle type is required"),
    actualQuantity: z.coerce.number().int("Must be a whole number").min(0, "Cannot be negative"),
    reasonCode: z.string().min(1, "Reason code is required").pipe(z.enum(ADJUSTMENT_REASON_CODES)),
    reason: z.string().max(500, "Max 500 characters"),
    evidence: z
      .array(
        z.object({
          id: z.string(),
          fileName: z.string(),
          mimeType: z.string(),
          fileSize: z.number(),
          createdAt: z.string(),
        }),
      )
      .min(1, "Upload at least one evidence file (photo or PDF)")
      .max(EVIDENCE_MAX_FILES, `At most ${EVIDENCE_MAX_FILES} evidence files`),
  })
  .superRefine((values, ctx) => {
    if (values.reasonCode === "OTHER" && values.reason.trim() === "") {
      ctx.addIssue({ code: "custom", path: ["reason"], message: "A note is required when the reason code is Other" });
    }
  });

type AdjustmentFormInput = z.input<typeof adjustmentSchema>;
type AdjustmentFormValues = z.output<typeof adjustmentSchema>;

function emptyValues(): AdjustmentFormInput {
  const topBarFactoryId = useFactoryScopeStore.getState().selectedFactoryId;
  return {
    factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId,
    locationId: "",
    needleTypeId: "",
    actualQuantity: 0,
    reasonCode: "",
    reason: "",
    evidence: [],
  };
}

/**
 * `STOCK_ADJUST`. **Applies immediately on confirm — no pending/approval UI**
 * (CONTEXT.md: Adjustment). System vs. actual vs. variance is shown live in
 * the form and again in the ConfirmDialog before the write happens.
 */
export function AdjustmentFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const createAdjustment = useCreateAdjustment();

  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<AdjustmentFormValues | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<AdjustmentFormInput, unknown, AdjustmentFormValues>({
    resolver: zodResolver(adjustmentSchema),
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
  const locationId = form.watch("locationId");
  const needleTypeId = form.watch("needleTypeId");
  const reasonCode = form.watch("reasonCode");
  const actualQuantity = Number(form.watch("actualQuantity")) || 0;

  // Evidence is uploaded for a factory — switching factory invalidates it
  // (the backend would refuse ids uploaded for another factory).
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("locationId", "");
      form.setValue("evidence", []);
    }
  }, [factoryId, form]);

  // Live preview from the same `GET /inventory/balances` read Stock Overview uses — never invented.
  const liveBalance = useCurrentBalance(locationId, needleTypeId, open && locationId !== "" && needleTypeId !== "");
  const systemQuantity = liveBalance.data ?? 0;
  const variance = actualQuantity - systemQuantity;

  const confirmSystemQuantity = systemQuantity;
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
        reasonCode: pendingValues.reasonCode,
        reason: pendingValues.reason.trim() === "" ? undefined : pendingValues.reason,
        evidenceIds: pendingValues.evidence.map((item) => item.id),
      });
      toast.success("Adjustment applied. Balance updated immediately.");
      setConfirmOpen(false);
      setPendingValues(null);
      onOpenChange(false);
    } catch (err) {
      setConfirmOpen(false);
      setPendingValues(null);
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Adjustment</DialogTitle>
            <DialogDescription>
              Set a location&apos;s balance to what is physically there. Applies immediately — no approval step.
            </DialogDescription>
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
                      <FactorySelect value={field.value} onChange={field.onChange} id="adjustment-factory" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
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
                          placeholder={factoryId ? "Select location" : "Select a factory first"}
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
              </div>

              {locationId !== "" && needleTypeId !== "" && (
                <dl className="grid grid-cols-3 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
                  <div>
                    <dt className="text-xs text-slate-500">System Quantity</dt>
                    <dd className="font-medium text-slate-900">{liveBalance.isLoading ? "…" : systemQuantity}</dd>
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

              <div className="grid grid-cols-2 gap-4">
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
                  name="reasonCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reason Code *</FormLabel>
                      <Select value={field.value === "" ? undefined : field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger aria-label="Reason Code">
                            <SelectValue placeholder="Select reason code" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ADJUSTMENT_REASON_CODES.map((code) => (
                            <SelectItem key={code} value={code}>
                              {ADJUSTMENT_REASON_LABELS[code]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note{reasonCode === "OTHER" ? " *" : ""}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={reasonCode === "OTHER" ? "Explain the discrepancy" : "Optional note"}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Evidence *</FormLabel>
                    <FormControl>
                      <EvidenceUploadField
                        factoryId={factoryId}
                        value={field.value ?? []}
                        onChange={field.onChange}
                        disabled={createAdjustment.isPending}
                      />
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
                  disabled={createAdjustment.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createAdjustment.isPending}>
                  Review Adjustment
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
        title="Confirm Stock Adjustment"
        description="Applies immediately — the balance updates now, with no approval step."
        tone={confirmVariance < 0 ? "destructive" : "impact"}
        impact={[
          { label: "System Quantity", value: liveBalance.isLoading ? "…" : confirmSystemQuantity },
          { label: "Actual Quantity", value: confirmActualQuantity },
          { label: "Variance", value: <VarianceValue variance={confirmVariance} />, emphasize: true },
          {
            label: "Reason Code",
            value: pendingValues ? ADJUSTMENT_REASON_LABELS[pendingValues.reasonCode] : "",
          },
          ...(pendingValues?.reason ? [{ label: "Note", value: pendingValues.reason }] : []),
          { label: "Evidence", value: `${pendingValues?.evidence.length ?? 0} file(s)` },
        ]}
        confirmLabel="Confirm Adjustment"
        onConfirm={handleConfirm}
        isConfirming={createAdjustment.isPending}
      />
    </>
  );
}
