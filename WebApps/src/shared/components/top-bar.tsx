"use client";

import { useRouter } from "next/navigation";
import { Bell, ChevronDown, UserRound } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuthorizedFactories } from "@/core/permissions/factory-scope";
import { useFactoryScopeStore } from "@/core/permissions/factory-scope-store";
import { useCurrentUser, useLogout } from "@/core/auth/queries";

/**
 * Docs/18-WebApps-UI-UX-Specification.md §5-6: Logo/System name, factory
 * scope selector, notification bell, user menu. This is THE factory scope
 * control — global-header state per §6, not a per-screen filter — every
 * feature reads the current selection from core/permissions/factory-scope-store
 * instead of rendering its own.
 */
export function TopBar() {
  const router = useRouter();
  const factories = useAuthorizedFactories();
  const selectedFactoryId = useFactoryScopeStore((s) => s.selectedFactoryId);
  const setSelectedFactoryId = useFactoryScopeStore((s) => s.setSelectedFactoryId);
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  async function handleLogout() {
    await logout.mutateAsync();
    router.push("/login");
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      <Select value={selectedFactoryId} onValueChange={setSelectedFactoryId}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Factory" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Factories</SelectItem>
          {factories.map((factory) => (
            <SelectItem key={factory.id} value={factory.id}>
              {factory.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-5 w-5 text-slate-500" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <UserRound className="h-5 w-5 text-slate-500" />
              <span className="text-sm text-slate-700">{user?.name ?? "Account"}</span>
              <ChevronDown className="h-4 w-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user ? user.roles.join(", ") : "Signed in"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} disabled={logout.isPending}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
