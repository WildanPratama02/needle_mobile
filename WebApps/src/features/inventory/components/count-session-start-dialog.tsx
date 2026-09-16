"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { FactorySelect } from "@/shared/components/factory-select";
import { MasterDataSelect } from "@/shared/components/master-data-select";
import { getApiErrorMessage } from "@/core/api/client";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCreateCountSession } from "../api/count-session-queries";

/** Mirrors `CreateCountSessionDto`. */
const startSchema = z.object({
  factoryId: z.string().min(1, "Factory is required"),
  locationId: z.string().min(1, "Location is required"),
});
type StartFormValues = z.infer<typeof startSchema>;

function emptyValues(): StartFormValues {
  const topBarFactoryId = useFactoryScopeStore.getState().selectedFactoryId;
  return { factoryId: topBarFactoryId === "all" ? "" : topBarFactoryId, locationId: "" };
}

/** "Start Count" creates the session server-side and opens its route, so a refresh resumes it (ticket 02). */
export function CountSessionStartDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const createSession = useCreateCountSession();
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const form = useForm<StartFormValues>({ resolver: zodResolver(startSchema), defaultValues: emptyValues() });

  React.useEffect(() => {
    if (!open) return;
    form.reset(emptyValues());
    setSubmitError(null);
  }, [open, form]);

  const factoryId = form.watch("factoryId");
  const previousFactoryId = React.useRef(factoryId);
  React.useEffect(() => {
    if (previousFactoryId.current !== factoryId) {
      previousFactoryId.current = factoryId;
      form.setValue("locationId", "");
    }
  }, [factoryId, form]);

  async function onSubmit(values: StartFormValues) {
    setSubmitError(null);
    try {
      const created = await createSession.mutateAsync(values);
      toast.success("Count session started.");
      onOpenChange(false);
      router.push(`/inventory/count/${created.id}`);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Count Session</DialogTitle>
          <DialogDescription>Pick the location you are about to count. You can leave and resume it later.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
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

            {submitError && (
              <p role="alert" className="rounded-md border border-danger-500 bg-danger-50 px-3 py-2 text-sm text-danger-700">
                {submitError}
              </p>
            )}

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={createSession.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createSession.isPending}>
                {createSession.isPending ? "Starting…" : "Start Session"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
