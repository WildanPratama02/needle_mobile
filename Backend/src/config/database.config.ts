import { registerAs } from '@nestjs/config';

/**
 * Namespaced database config, injectable as `ConfigType<typeof databaseConfig>`.
 * Prisma reads DATABASE_URL directly from the environment; this exists so
 * application code (health checks, seed scripts, tooling) has one typed source
 * for the same value.
 */
export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL as string,
}));

export default databaseConfig;
