import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';

/**
 * Boot smoke test: the application starts with a valid environment and the
 * prefix / versioning wiring is in place, so an unrouted path under the prefix
 * still 404s rather than erroring.
 *
 * Uses `createTestApp`, which shares `configureApp` with main.ts — the point is
 * that this asserts the real HTTP surface, not a test-only approximation.
 */
describe('AppModule (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Env comes from test/e2e/setup-env.ts — it must land before the module
    // graph is imported, since ConfigModule validates at decorator evaluation.
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('boots', () => {
    expect(app).toBeDefined();
  });

  it('404s on an unimplemented route', async () => {
    await request(app.getHttpServer() as Server)
      .get('/api/v1/not-implemented')
      .expect(404);
  });
});
