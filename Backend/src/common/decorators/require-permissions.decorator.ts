import { SetMetadata } from '@nestjs/common';

import { PermissionCode } from '../../shared/constants/permissions';

export const REQUIRED_PERMISSIONS_KEY = 'requiredPermissions';

/**
 * Declares the exact permission codes a route needs. All listed codes are
 * required (AND, not OR) — a route that wants alternatives should be two routes
 * or check inside the service.
 *
 * Codes come from the `PERMISSIONS` catalogue so a typo is a compile error
 * rather than a silently unguarded endpoint.
 */
export const RequirePermissions = (...permissions: PermissionCode[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
