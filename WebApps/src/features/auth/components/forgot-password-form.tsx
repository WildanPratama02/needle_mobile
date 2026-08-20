"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getApiErrorMessage } from "@/core/api/client";
import { useForgotPassword } from "@/core/auth/queries";

/** Mirrors the backend's `ForgotPasswordDto` (see `Docs/12` gap note in `core/auth/types.ts`). */
const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Anti-enumeration (Docs/09 identity flows, agreed with the user): the
 * backend always responds 200 with the same generic message whether or not
 * the email belongs to an account, so this form shows that one message on
 * success and never reveals which branch happened.
 */
export function ForgotPasswordForm() {
  const forgotPassword = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    try {
      await forgotPassword.mutateAsync(values);
    } catch {
      // Surfaced via forgotPassword.error below — no further action needed here.
    }
  }

  if (forgotPassword.isSuccess) {
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <MailCheck className="h-10 w-10 text-success-500" />
        <p className="text-sm text-slate-700">
          If an account exists for that email, a reset link has been sent.
        </p>
        <Link href="/login" className="mt-2 text-sm font-medium text-ocean-600 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-danger-500">*</span>
              </FormLabel>
              <FormControl>
                {/* type="text", not "email" — native browser constraint validation would
                    block the submit event (and show its own non-design-system tooltip)
                    before Zod ever gets a chance to render our error text. */}
                <Input type="text" autoComplete="email" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {forgotPassword.isError && (
          <p className="text-sm text-danger-600">{getApiErrorMessage(forgotPassword.error)}</p>
        )}

        <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
          {forgotPassword.isPending ? "Sending…" : "Send reset link"}
        </Button>

        <Link href="/login" className="block text-center text-sm font-medium text-ocean-600 hover:underline">
          Back to sign in
        </Link>
      </form>
    </Form>
  );
}
