/**
 * Mirrors `Backend/src/modules/identity/dto/{login,refresh-token,auth-response}.dto.ts`
 * exactly — real, implemented, registered (`IdentityModule` in `app.module.ts`).
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginUser {
  id: string;
  username: string;
  name: string;
  roles: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse extends TokenPair {
  user: LoginUser;
}

/**
 * `GET /auth/me` — the full session: identity, roles, permissions, and both
 * scope dimensions in one call. This is what replaces the hardcoded
 * factory-scope fixture and every "no client permission model yet" caveat
 * elsewhere in the app.
 */
export interface CurrentUser {
  id: string;
  username: string;
  name: string;
  roles: string[];
  permissions: string[];
  factoryIds: string[];
  locationIds: string[];
}
