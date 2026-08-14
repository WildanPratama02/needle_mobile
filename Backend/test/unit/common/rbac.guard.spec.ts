import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RbacGuard } from '../../../src/common/guards/rbac.guard';
import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../src/shared/constants/permissions';

function contextWith(user?: Partial<AuthenticatedUser>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

function guardWith(metadata: Record<string, unknown>): RbacGuard {
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;

  return new RbacGuard(reflector);
}

const picTroli: Partial<AuthenticatedUser> = {
  id: 'user-1',
  permissions: [PERMISSIONS.EXCHANGE_CREATE, PERMISSIONS.STOCK_VIEW],
};

describe('RbacGuard', () => {
  it('allows a public route without inspecting the user', () => {
    const guard = guardWith({ isPublic: true });

    expect(guard.canActivate(contextWith())).toBe(true);
  });

  it('allows an authenticated route that declares no permissions', () => {
    const guard = guardWith({ requiredPermissions: [] });

    expect(guard.canActivate(contextWith(picTroli))).toBe(true);
  });

  it('allows when the user holds the declared permission', () => {
    const guard = guardWith({ requiredPermissions: [PERMISSIONS.EXCHANGE_CREATE] });

    expect(guard.canActivate(contextWith(picTroli))).toBe(true);
  });

  it('requires every declared permission, not just one', () => {
    const guard = guardWith({
      requiredPermissions: [PERMISSIONS.EXCHANGE_CREATE, PERMISSIONS.STOCK_ADJUST],
    });

    expect(() => guard.canActivate(contextWith(picTroli))).toThrow(ForbiddenException);
  });

  // The core rule from Backend/CLAUDE.md §5: no permission implies another.
  it('does not let STOCK_VIEW stand in for STOCK_ADJUST', () => {
    const guard = guardWith({ requiredPermissions: [PERMISSIONS.STOCK_ADJUST] });

    expect(() => guard.canActivate(contextWith(picTroli))).toThrow(/STOCK_ADJUST/);
  });

  it('does not treat EXCHANGE_CREATE as covering TRANSFER or MASTER_EDIT', () => {
    for (const permission of [PERMISSIONS.STOCK_TRANSFER, PERMISSIONS.MASTER_EDIT]) {
      const guard = guardWith({ requiredPermissions: [permission] });

      expect(() => guard.canActivate(contextWith(picTroli))).toThrow(ForbiddenException);
    }
  });

  it('gives SYSTEM_ADMIN no implicit bypass — only its explicit grants count', () => {
    const adminWithoutGrant: Partial<AuthenticatedUser> = {
      id: 'admin-1',
      roles: ['SYSTEM_ADMIN'],
      permissions: [PERMISSIONS.USER_MANAGE],
    };
    const guard = guardWith({ requiredPermissions: [PERMISSIONS.STOCK_ADJUST] });

    expect(() => guard.canActivate(contextWith(adminWithoutGrant))).toThrow(ForbiddenException);
  });

  it('refuses when no user was resolved', () => {
    const guard = guardWith({ requiredPermissions: [PERMISSIONS.EXCHANGE_CREATE] });

    expect(() => guard.canActivate(contextWith(undefined))).toThrow(ForbiddenException);
  });
});
