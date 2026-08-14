import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
  className?: string;
}

/**
 * Docs/design.md §9.8 + Docs/18 §54: business-language message only, never a
 * stack trace or internal error detail.
 */
export function ErrorState({
  message = "Something went wrong. Please try again.",
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-1 py-10 text-center", className)}>
      <CircleAlert className="mb-2 h-10 w-10 text-danger-500" />
      <p className="text-sm text-slate-600">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
      {action}
    </div>
  );
}
