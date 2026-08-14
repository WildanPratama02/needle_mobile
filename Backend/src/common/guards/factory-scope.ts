import { ForbiddenException } from '@nestjs/common';

import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * The factory dimension of authorization, checked inside a service.
 *
 * `ScopeGuard` enforces the same rule at the HTTP layer for routes that name
 * their factory in the request. Services need it too, because most routes
 * identify the factory only after loading the entity — `/exchanges/{id}/issue`
 * carries no factory id a guard could read. This is the one implementation of
 * that check for the service side; no service should re-derive it.
 *
 * A plain function rather than an injectable: it needs nothing but its two
 * arguments, so DI would add wiring without adding capability, and it stays
 * trivially unit-testable. It lives beside `scope.guard.ts` because the two
 * are the same rule applied at different layers.
 *
 * **403, not 400.** The request is well-formed; the caller simply may not act
 * in that factory. Returning 400 conflated "you sent something wrong" with
 * "you are not allowed here", and disagreed with `ScopeGuard`, which has
 * always returned 403 for the identical failure (FR-AUTH-003, CLAUDE.md §5).
 */
export function isInFactoryScope(user: AuthenticatedUser, factoryId: string): boolean {
  return user.factoryIds.includes(factoryId);
}

/** @throws ForbiddenException when the caller is not scoped to that factory. */
export function assertFactoryScope(user: AuthenticatedUser, factoryId: string): void {
  if (!isInFactoryScope(user, factoryId)) {
    throw new ForbiddenException(`Out of factory scope: ${factoryId}`);
  }
}
