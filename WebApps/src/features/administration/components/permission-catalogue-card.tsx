"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getApiErrorMessage } from "@/core/api/client";
import { usePermissionCatalogue } from "@/core/roles";
import { EmptyState } from "@/shared/components/empty-state";
import { ErrorState } from "@/shared/components/error-state";

/**
 * `.scratch/roles-permissions/spec.md` story 3: the full permission
 * catalogue as a standalone reference, independent of any one role's grant
 * — every distinct code `RbacGuard` enforces, not only the ones a role
 * happens to hold. Sits below the role table on the Roles & Permissions
 * list screen.
 */
export function PermissionCatalogueCard({ enabled }: { enabled: boolean }) {
  const { data, isPending, isError, error, refetch } = usePermissionCatalogue(enabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Catalogue</CardTitle>
        <CardDescription>Every permission code the system enforces.</CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState message={getApiErrorMessage(error)} onRetry={() => refetch()} />
        ) : isPending ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-6 w-24" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.map((permission) => (
              <Badge key={permission.code} variant="outline">
                {permission.code}
              </Badge>
            ))}
          </div>
        ) : (
          <EmptyState title="No permissions found." />
        )}
      </CardContent>
    </Card>
  );
}
