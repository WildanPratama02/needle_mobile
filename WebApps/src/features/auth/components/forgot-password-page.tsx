"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ForgotPasswordForm } from "./forgot-password-form";

/**
 * No Docs/18 mockup exists for this screen (same gap as `LoginScreen` —
 * checked, forgot/reset-password isn't in the doc's screen inventory).
 * Centered-card layout matches `LoginScreen` for visual consistency.
 */
export function ForgotPasswordScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>Enter your account email and we&apos;ll send you a reset link.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
