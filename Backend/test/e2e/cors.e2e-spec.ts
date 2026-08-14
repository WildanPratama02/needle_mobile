import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';

const ALLOWED = 'http://localhost:5173';
const ALSO_ALLOWED = 'http://webapp.needle.local';
const DENIED = 'http://evil.example.com';

/**
 * Browser access for the WebApp client.
 *
 * The allow-list comes from `CORS_ORIGINS`, set in `setup-env.ts`. These
 * assertions are what a browser actually enforces: an origin is permitted only
 * if it is echoed back in `Access-Control-Allow-Origin`.
 */
describe('CORS (e2e)', () => {
  let app: INestApplication;

  const server = () => app.getHttpServer() as Server;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('preflight', () => {
    it('approves a configured origin', async () => {
      const response = await request(server())
        .options('/api/v1/auth/login')
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe(ALLOWED);
    });

    it('approves every configured origin, not just the first', async () => {
      const response = await request(server())
        .options('/api/v1/auth/login')
        .set('Origin', ALSO_ALLOWED)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe(ALSO_ALLOWED);
    });

    // No echoed origin is what makes the browser block the real request.
    it('does not approve an origin outside the allow-list', async () => {
      const response = await request(server())
        .options('/api/v1/auth/login')
        .set('Origin', DENIED)
        .set('Access-Control-Request-Method', 'POST');

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    // Docs/12 §5 common headers — a browser refuses the request if any header
    // it intends to send is missing from this list.
    it.each(['authorization', 'content-type', 'idempotency-key', 'x-request-id', 'x-device-id'])(
      'permits the %s header',
      async (header) => {
        const response = await request(server())
          .options('/api/v1/exchanges')
          .set('Origin', ALLOWED)
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', header)
          .expect(204);

        expect(response.headers['access-control-allow-headers'].toLowerCase()).toContain(header);
      },
    );

    it('permits the verbs the API actually uses', async () => {
      const response = await request(server())
        .options('/api/v1/exchanges')
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      const methods = response.headers['access-control-allow-methods'];
      for (const method of ['GET', 'POST']) {
        expect(methods).toContain(method);
      }
    });

    it('caches the preflight so every call does not pay for one', async () => {
      const response = await request(server())
        .options('/api/v1/exchanges')
        .set('Origin', ALLOWED)
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(Number(response.headers['access-control-max-age'])).toBeGreaterThan(0);
    });
  });

  describe('actual requests', () => {
    it('allows a configured origin through', async () => {
      const response = await request(server())
        .post('/api/v1/auth/login')
        .set('Origin', ALLOWED)
        .send({ username: 'no_such_user', password: 'whatever' })
        .expect(401);

      // The 401 is the point of the request; the header is the point of the test.
      expect(response.headers['access-control-allow-origin']).toBe(ALLOWED);
    });

    /**
     * Without this the browser hides `X-Request-ID` from the page, and a
     * client could never quote the id that ties its report to an audit row.
     */
    it('exposes X-Request-ID to the page', async () => {
      const response = await request(server())
        .get('/api/v1/auth/me')
        .set('Origin', ALLOWED)
        .expect(401);

      expect(response.headers['access-control-expose-headers']).toContain('X-Request-ID');
    });

    it('sends no allow-origin header to a denied origin', async () => {
      const response = await request(server())
        .get('/api/v1/auth/me')
        .set('Origin', DENIED)
        .expect(401);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    // CORS is a browser mechanism; a request with no Origin is unaffected,
    // which is why the Android client never needed any of this.
    it('leaves a request without an Origin alone', async () => {
      const response = await request(server()).get('/api/v1/auth/me').expect(401);

      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
