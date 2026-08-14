import { ForbiddenException } from '@nestjs/common';

import { assertFactoryScope, isInFactoryScope } from '../../../src/common/guards/factory-scope';
import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';

const FACTORY_A = 'factory-a';
const FACTORY_B = 'factory-b';

const scopedToA: AuthenticatedUser = {
  id: 'user-1',
  username: 'pic',
  name: 'PIC',
  roles: ['PIC_TROLI'],
  permissions: ['EXCHANGE_CREATE'],
  factoryIds: [FACTORY_A],
  locationIds: [],
};

const unscoped: AuthenticatedUser = { ...scopedToA, id: 'user-2', factoryIds: [] };
const scopedToBoth: AuthenticatedUser = {
  ...scopedToA,
  id: 'user-3',
  factoryIds: [FACTORY_A, FACTORY_B],
};

describe('isInFactoryScope', () => {
  it('accepts a factory the user holds', () => {
    expect(isInFactoryScope(scopedToA, FACTORY_A)).toBe(true);
  });

  it('rejects a factory the user does not hold', () => {
    expect(isInFactoryScope(scopedToA, FACTORY_B)).toBe(false);
  });

  it('accepts any of several held factories', () => {
    expect(isInFactoryScope(scopedToBoth, FACTORY_A)).toBe(true);
    expect(isInFactoryScope(scopedToBoth, FACTORY_B)).toBe(true);
  });

  // An empty scope list grants nothing rather than everything.
  it('rejects everything for a user with no scopes', () => {
    expect(isInFactoryScope(unscoped, FACTORY_A)).toBe(false);
  });

  it('does not match on a prefix or a substring', () => {
    expect(isInFactoryScope(scopedToA, 'factory-a-2')).toBe(false);
    expect(isInFactoryScope(scopedToA, 'factory')).toBe(false);
  });
});

describe('assertFactoryScope', () => {
  it('passes silently for a factory in scope', () => {
    expect(() => assertFactoryScope(scopedToA, FACTORY_A)).not.toThrow();
  });

  // The heart of this ticket: an authorization failure is 403, not 400. It
  // used to be BadRequestException in three separate services, which
  // disagreed with ScopeGuard doing the same check at the HTTP layer.
  it('throws ForbiddenException for a factory out of scope', () => {
    expect(() => assertFactoryScope(scopedToA, FACTORY_B)).toThrow(ForbiddenException);
  });

  it('names the refused factory in the message', () => {
    expect(() => assertFactoryScope(scopedToA, FACTORY_B)).toThrow(
      `Out of factory scope: ${FACTORY_B}`,
    );
  });

  it('throws for a user holding no scopes at all', () => {
    expect(() => assertFactoryScope(unscoped, FACTORY_A)).toThrow(ForbiddenException);
  });

  it('reports 403 as the HTTP status', () => {
    try {
      assertFactoryScope(scopedToA, FACTORY_B);
      fail('expected the check to refuse');
    } catch (error) {
      expect((error as ForbiddenException).getStatus()).toBe(403);
    }
  });
});
