/**
 * The caller, as resolved from the access token on every request.
 *
 * Roles, permissions and scopes are read from the database per request rather
 * than carried inside the JWT. A token that outlived a revoked permission must
 * not still grant it — ADR-004 puts authority in the backend, and a self-
 * describing token would move it into the client's pocket for the token's whole
 * lifetime.
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  name: string;
  /** Role codes, e.g. `PIC_TROLI`. Informational — never gate on these. */
  roles: string[];
  /** Permission codes, e.g. `EXCHANGE_CREATE`. This is what RbacGuard checks. */
  permissions: string[];
  /** Factory ids this user may act within. */
  factoryIds: string[];
  /** Location ids (warehouse / trolley / used-needle storage) this user may act within. */
  locationIds: string[];
}

/** Shape of the signed access-token body. Deliberately minimal — see above. */
export interface JwtPayload {
  /** User id. */
  sub: string;
  username: string;
  /** Distinguishes an access token from a refresh token. */
  type: 'access';
}
