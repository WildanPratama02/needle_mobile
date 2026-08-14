/**
 * `ConfigModule.forRoot` validates the environment while the decorator on
 * AppModule is evaluated — i.e. at import time, before any `beforeAll` runs.
 * So the test environment has to be in place before the module graph is
 * imported, which is what a jest `setupFiles` entry guarantees.
 *
 * The developer's `.env` is loaded first: e2e talks to a real PostgreSQL, and
 * hardcoding a port here would break on any machine whose 5432 is taken.
 * Only genuinely missing values get a fallback.
 */
import 'dotenv/config';

const fallbacks: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://needle:needle_dev_password@localhost:5432/needle_dev?schema=public',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
  MINIO_ROOT_USER: 'needle_minio',
  MINIO_ROOT_PASSWORD: 'needle_minio_password',
};

for (const [key, value] of Object.entries(fallbacks)) {
  process.env[key] ??= value;
}

// Short access-token lifetime keeps expiry-related assertions quick.
process.env.JWT_EXPIRES_IN = '15m';

// A known allow-list so the CORS suite has something deterministic to assert.
process.env.CORS_ORIGINS = 'http://localhost:5173,http://webapp.needle.local';
