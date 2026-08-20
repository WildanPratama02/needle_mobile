"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ErrorState } from "@/shared/components/error-state";
import { ResetPasswordForm } from "./reset-password-form";

/**
 * No Docs/18 mockup exists for this screen (same gap noted on
 * `ForgotPasswordScreen`/`LoginScreen`). A `token` missing from the query
 * string is treated the same as a rejected token — the form never renders
 * without one, since submitting would only round-trip to the same 400.
 */
export function ResetPasswordScreen() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>Choose a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {token ? (
            <ResetPasswordForm token={token} />
          ) : (
            <ErrorState
              message="This password reset link is invalid or has expired."
              action={
                <Link href="/forgot-password" className="mt-1 text-sm font-medium text-ocean-600 hover:underline">
                  Request a new reset link
                </Link>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
