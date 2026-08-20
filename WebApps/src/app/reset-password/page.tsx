import { Suspense } from "react";

import { ResetPasswordScreen } from "@/features/auth";

/**
 * `ResetPasswordScreen` reads `token` via `useSearchParams` — Next.js
 * requires a Suspense boundary around any client component that calls it
 * during prerendering (Docs/design.md's stack is App Router/Next 14).
 */
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordScreen />
    </Suspense>
  );
}
