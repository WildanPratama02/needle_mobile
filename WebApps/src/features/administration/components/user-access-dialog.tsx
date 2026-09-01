"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getApiErrorMessage } from "@/core/api/client";
import { useAuthorizedFactories } from "@/core/permissions/factory-scope";
import { useRoles } from "@/core/roles";
import type { UserRow } from "@/core/users";
import {
  useAssignFactoryScope,
  useAssignRole,
  useRevokeFactoryScope,
  useRevokeRole,
} from "../api/user-write-queries";

/**
 * Assign/Unassign Role and Assign/Unassign Factory Scope (ticket 06,
 * FR-WEB-025) — the two `Docs/12` §16-documented assignment pairs. Every
 * mutation targets the row passed in from the list screen, which is
 * re-derived from the freshest `useUsersList` data on every render (never
 * copied into local state) — so a toggle here reflects immediately once the
 * mutation's `onSuccess` invalidates the `users` key space.
 *
 * **Deliberately absent**: Assign Location Scope, Reset Access — no
 * `Docs/12` contract exists for either (ticket 06's explicit carve-out). Not
 * built here, not guessed.
 *
 * Factory scope offered here is restricted to `useAuthorizedFactories()` —
 * the caller's own scope — matching the backend's own never-widen-scope
 * rule for this route (ticket 06 acceptance) rather than the full
 * `factories` catalogue.
 */
export function UserAccessDialog({
  user,
  open,
  onOpenChange,
}: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roles = useRoles(open);
  const authorizedFactories = useAuthorizedFactories();

  const assignRole = useAssignRole();
  const revokeRole = useRevokeRole();
  const assignScope = useAssignFactoryScope();
  const revokeScope = useRevokeFactoryScope();

  const [pendingKey, setPendingKey] = React.useState<string | null>(null);

  async function toggleRole(roleCode: string, held: boolean) {
    if (!user) return;
    setPendingKey(`role:${roleCode}`);
    try {
      if (held) {
        await revokeRole.mutateAsync({ userId: user.id, roleCode });
        toast.success(`${roleCode} removed.`);
      } else {
        await assignRole.mutateAsync({ userId: user.id, roleCode });
        toast.success(`${roleCode} assigned.`);
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPendingKey(null);
    }
  }

  async function toggleFactoryScope(factoryId: string, held: boolean) {
    if (!user) return;
    setPendingKey(`factory:${factoryId}`);
    try {
      if (held) {
        await revokeScope.mutateAsync({ userId: user.id, factoryId });
        toast.success("Factory scope removed.");
      } else {
        await assignScope.mutateAsync({ userId: user.id, factoryId });
        toast.success("Factory scope assigned.");
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err));
    } finally {
      setPendingKey(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Access — {user?.username}</DialogTitle>
          <DialogDescription>
            Roles restricted to the five seeded roles; factory scope restricted to your own scope.
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-6">
            <section>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Roles</h3>
              <ul className="space-y-1.5">
                {(roles.data ?? []).map((role) => {
                  const held = user.roles.includes(role.code);
                  const key = `role:${role.code}`;
                  return (
                    <li
                      key={role.code}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <span className="font-mono">{role.code}</span>
                      <Button
                        type="button"
                        variant={held ? "ghost" : "secondary"}
                        size="sm"
                        disabled={pendingKey === key}
                        onClick={() => toggleRole(role.code, held)}
                      >
                        {held ? (
                          <>
                            <Minus className="h-3.5 w-3.5" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Assign
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-medium text-slate-700">Factory Scope</h3>
              <ul className="space-y-1.5">
                {authorizedFactories.map((factory) => {
                  const held = user.factoryIds.includes(factory.id);
                  const key = `factory:${factory.id}`;
                  return (
                    <li
                      key={factory.id}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <span>
                        {factory.code} — {factory.name}
                      </span>
                      <Button
                        type="button"
                        variant={held ? "ghost" : "secondary"}
                        size="sm"
                        disabled={pendingKey === key}
                        onClick={() => toggleFactoryScope(factory.id, held)}
                      >
                        {held ? (
                          <>
                            <Minus className="h-3.5 w-3.5" />
                            Remove
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" />
                            Assign
                          </>
                        )}
                      </Button>
                    </li>
                  );
                })}
                {authorizedFactories.length === 0 && (
                  <li className="text-sm text-slate-400">No factories in your own scope to assign.</li>
                )}
              </ul>
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
