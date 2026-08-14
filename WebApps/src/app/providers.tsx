"use client";

import * as React from "react";
import { QueryProvider } from "@/core/providers/query-provider";
import { ThemeProvider } from "@/core/providers/theme-provider";
import { SessionProvider } from "@/core/providers/session-provider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
