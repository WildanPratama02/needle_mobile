"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useCurrentUser } from "@/core/auth/queries";
import { LoginForm } from "./login-form";

/**
 * No Docs/18 mockup exists for the login screen (checked — the doc jumps
 * straight from "Login" as a UAT scenario name to the authenticated shell).
 * Centered-card layout follows Docs/design.md's Card/Form conventions
 * (§7, §9.6) rather than a spec that doesn't exist.
 */
export function LoginScreen() {
  const router = useRouter();
  const { data: user, isSuccess } = useCurrentUser();

  React.useEffect(() => {
    if (isSuccess && user) {
      router.replace("/dashboard");
    }
  }, [isSuccess, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Needle Management</CardTitle>
          <CardDescription>Sign in to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
