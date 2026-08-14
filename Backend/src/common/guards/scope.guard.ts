import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

import { FACTORY_SCOPE_KEY, LOCATION_SCOPE_KEY, ScopeSource } from '../decorators/scope.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/**
 * Enforces the factory / location dimensions of authorization: holding
 * `STOCK_TRANSFER` says *what* you may do, this says *where*.
 *
 * Only routes that declare `@RequireFactoryScope` / `@RequireLocationScope`
 * are checked — the guard cannot invent which id a route operates on. Where a
 * route does declare one, the id must be present and must appear in the user's
 * scope list. An empty scope list therefore grants nothing rather than
 * everything, and no role is exempt: a SYSTEM_ADMIN reaches every factory only
 * by holding a scope row for each.
 */
@Injectable()
export class ScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const factorySource = this.reflector.getAllAndOverride<ScopeSource>(FACTORY_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const locationSource = this.reflector.getAllAndOverride<ScopeSource>(LOCATION_SCOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!factorySource && !locationSource) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authenticated user not resolved');
    }

    if (factorySource) {
      this.assertInScope(request, factorySource, user.factoryIds, 'factory');
    }

    if (locationSource) {
      this.assertInScope(request, locationSource, user.locationIds, 'location');
    }

    return true;
  }

  private assertInScope(
    request: Request,
    source: ScopeSource,
    allowedIds: string[],
    label: string,
  ): void {
    const container = request[source.in] as Record<string, unknown> | undefined;
    const value = container?.[source.key];

    // A route that declares a scope but receives no id is a bug, not an open
    // door — refuse rather than skip the check.
    if (typeof value !== 'string' || value.length === 0) {
      throw new ForbiddenException(`Missing ${label} id in request ${source.in}.${source.key}`);
    }

    if (!allowedIds.includes(value)) {
      throw new ForbiddenException(`Out of ${label} scope: ${value}`);
    }
  }
}
