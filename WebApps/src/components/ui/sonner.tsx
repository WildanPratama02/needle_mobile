"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-lg border border-slate-200 bg-white text-slate-900 shadow-md",
          description: "text-slate-500",
          actionButton: "bg-primary text-primary-foreground",
          cancelButton: "bg-slate-100 text-slate-600",
          success: "border-l-4 !border-l-success-500",
          warning: "border-l-4 !border-l-warning-500",
          error: "border-l-4 !border-l-danger-500",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
