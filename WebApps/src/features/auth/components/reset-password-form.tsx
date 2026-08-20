"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { getApiErrorMessage } from "@/core/api/client";
import { useResetPassword } from "@/core/auth/queries";

/**
 * Mirrors the backend's `ResetPasswordDto` (see `Docs/12` gap note in
 * `core/auth/types.ts`): at least 8 characters, at least one digit.
 */
const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/\d/, "Password must contain at least one digit"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const resetPassword = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    try {
      const response = await resetPassword.mutateAsync({ token, newPassword: values.newPassword });
      // The backend has already revoked every existing session for this
      // user — no auto-login, land back on /login with a success toast
      // showing the backend's own message (`auth.controller.ts`'s
      // `resetPassword`: "Password updated. Sign in with your new password.").
      toast.success(response.message);
      router.push("/login");
    } catch {
      // Surfaced via resetPassword.error below — no further action needed here.
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                New password <span className="text-danger-500">*</span>
              </FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" autoFocus {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Confirm new password <span className="text-danger-500">*</span>
              </FormLabel>
              <FormControl>
                <PasswordInput autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {resetPassword.isError && (
          <div className="space-y-1">
            <p className="text-sm text-danger-600">
              {getApiErrorMessage(
                resetPassword.error,
                "This reset link is invalid or has expired."
              )}
            </p>
            <Link href="/forgot-password" className="block text-sm font-medium text-ocean-600 hover:underline">
              Request a new reset link
            </Link>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
          {resetPassword.isPending ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </Form>
  );
}
