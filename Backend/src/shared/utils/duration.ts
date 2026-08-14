const UNIT_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

/**
 * Converts a JWT-style duration (`15m`, `7d`, `3600`) into seconds.
 *
 * `@nestjs/jwt` accepts these strings directly, but the login response has to
 * report `expiresIn` as a number and refresh tokens need a concrete
 * `expires_at`, so the same string has to be readable as a number too.
 *
 * @throws Error on an unparseable value — a malformed token lifetime should
 * surface at boot, not silently become a default.
 */
export function parseDurationToSeconds(duration: string): number {
  const trimmed = duration.trim();

  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  const match = /^(\d+)([smhd])$/.exec(trimmed);

  if (!match) {
    throw new Error(`Unsupported duration format: "${duration}" (expected e.g. 30s, 15m, 12h, 7d)`);
  }

  return parseInt(match[1], 10) * UNIT_SECONDS[match[2]];
}
