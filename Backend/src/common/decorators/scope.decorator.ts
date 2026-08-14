import { SetMetadata } from '@nestjs/common';

export const FACTORY_SCOPE_KEY = 'factoryScopeSource';
export const LOCATION_SCOPE_KEY = 'locationScopeSource';

/** Where in the request the guard should look for the id being scoped. */
export interface ScopeSource {
  /** Request part holding the id. */
  in: 'params' | 'query' | 'body';
  /** Key within that part, e.g. `factoryId`. */
  key: string;
}

/**
 * Declares that the route acts on one factory, and that the caller must hold
 * that factory in their scope list.
 *
 * Example — `@RequireFactoryScope({ in: 'params', key: 'factoryId' })` on
 * `GET /factories/:factoryId/trolleys`.
 */
export const RequireFactoryScope = (source: ScopeSource) => SetMetadata(FACTORY_SCOPE_KEY, source);

/** Same idea for a location (warehouse, trolley, used-needle storage). */
export const RequireLocationScope = (source: ScopeSource) =>
  SetMetadata(LOCATION_SCOPE_KEY, source);
