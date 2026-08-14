import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ScopeGuard } from '../../../src/common/guards/scope.guard';
import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';

const FACTORY_A = 'factory-a';
const FACTORY_B = 'factory-b';
const TROLLEY_1 = 'trolley-a-01';

function contextWith(
  request: Record<string, unknown>,
  user?: Partial<AuthenticatedUser>,
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ ...request, user }) }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

function guardWith(metadata: Record<string, unknown>): ScopeGuard {
  const reflector = {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;

  return new ScopeGuard(reflector);
}

const picFactoryA: Partial<AuthenticatedUser> = {
  id: 'user-1',
  factoryIds: [FACTORY_A],
  locationIds: [TROLLEY_1],
};

describe('ScopeGuard', () => {
  it('passes through routes that declare no scope', () => {
    const guard = guardWith({});

    expect(guard.canActivate(contextWith({ params: { factoryId: FACTORY_B } }, picFactoryA))).toBe(
      true,
    );
  });

  it('allows a factory the user is scoped to', () => {
    const guard = guardWith({ factoryScopeSource: { in: 'params', key: 'factoryId' } });

    expect(guard.canActivate(contextWith({ params: { factoryId: FACTORY_A } }, picFactoryA))).toBe(
      true,
    );
  });

  // FR-AUTH-003: PIC Inventory for Factory A must not reach Factory B.
  it('refuses a factory outside the user scope', () => {
    const guard = guardWith({ factoryScopeSource: { in: 'params', key: 'factoryId' } });

    expect(() =>
      guard.canActivate(contextWith({ params: { factoryId: FACTORY_B } }, picFactoryA)),
    ).toThrow(/Out of factory scope/);
  });

  it('reads the id from the body when the route says so', () => {
    const guard = guardWith({ locationScopeSource: { in: 'body', key: 'locationId' } });

    expect(guard.canActivate(contextWith({ body: { locationId: TROLLEY_1 } }, picFactoryA))).toBe(
      true,
    );
  });

  it('refuses when the declared id is absent rather than skipping the check', () => {
    const guard = guardWith({ factoryScopeSource: { in: 'params', key: 'factoryId' } });

    expect(() => guard.canActivate(contextWith({ params: {} }, picFactoryA))).toThrow(
      /Missing factory id/,
    );
  });

  it('grants nothing to a user with an empty scope list', () => {
    const guard = guardWith({ factoryScopeSource: { in: 'params', key: 'factoryId' } });
    const unscoped: Partial<AuthenticatedUser> = { id: 'user-2', factoryIds: [], locationIds: [] };

    expect(() =>
      guard.canActivate(contextWith({ params: { factoryId: FACTORY_A } }, unscoped)),
    ).toThrow(ForbiddenException);
  });

  it('checks factory and location together when both are declared', () => {
    const guard = guardWith({
      factoryScopeSource: { in: 'params', key: 'factoryId' },
      locationScopeSource: { in: 'body', key: 'locationId' },
    });

    expect(() =>
      guard.canActivate(
        contextWith(
          { params: { factoryId: FACTORY_A }, body: { locationId: 'trolley-b-09' } },
          picFactoryA,
        ),
      ),
    ).toThrow(/Out of location scope/);
  });
});
