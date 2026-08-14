"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useCurrentUser } from "@/core/auth/queries";
import { hasPermission } from "@/core/permissions";
import { NAV_SECTIONS } from "./nav-config";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const { data: user, isPending } = useCurrentUser();

  /**
   * An entry the user lacks the permission for is removed, not disabled — a
   * greyed-out entry still enumerates capabilities they do not have. A section
   * whose every entry went is dropped with them, so no heading is left above
   * an empty list.
   */
  const sections = React.useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.permission || hasPermission(user, item.permission),
        ),
      })).filter((section) => section.items.length > 0),
    [user],
  );

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-slate-200 bg-white transition-[width]",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
    >
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-slate-200">
        {!collapsed && <span className="text-sm font-semibold text-ocean-700">Needle Management</span>}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4" aria-busy={isPending}>
        {/*
          The permission list arrives asynchronously. Rendering the menu first
          and removing entries once it lands would show every user things they
          cannot have, however briefly — so hold the shape until the session
          resolves rather than animating entries away.
        */}
        {isPending
          ? Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-9 w-full rounded-md" />
            ))
          : sections.map((section, sectionIndex) => (
          <div key={section.label ?? `section-${sectionIndex}`}>
            {section.label && !collapsed && (
              <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wide text-slate-400 first:pt-0">
                {section.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname?.startsWith(item.href);
                const Icon = item.icon;
                const unavailable = item.available === false;

                // An entry whose route does not exist yet stays listed but is
                // not a link — following it would only reach a 404.
                const link = unavailable ? (
                  <span
                    aria-disabled="true"
                    title={`${item.label} is not available yet`}
                    className={cn(
                      "relative flex cursor-not-allowed items-center gap-2.5 rounded-md px-3 py-2 text-sm text-slate-300",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-ocean-50 font-medium text-ocean-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {active && !collapsed && (
                      <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-ocean-600" />
                    )}
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );

                return (
                  <li key={item.href}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">
                          {unavailable ? `${item.label} (not available yet)` : item.label}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="flex h-12 shrink-0 items-center justify-center border-t border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
      </button>
    </aside>
  );
}
