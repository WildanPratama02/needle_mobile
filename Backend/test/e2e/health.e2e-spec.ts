import { INestApplication } from '@nestjs/common';
import type { Server } from 'http';
import request from 'supertest';

import { createTestApp } from './create-test-app';

/**
 * Liveness and readiness probes (`.scratch/backend-correctness/spec.md`,
 * `Docs/12` §29).
 *
 * These are the two routes deliberately excluded from the API prefix and from
 * versioning: an orchestrator's probe URL must not move when the API version
 * bumps, because that breaks the deployment rather than the API.
 *
 * The unhealthy readiness path cannot be reached from here — this suite runs
 * against dependencies that are up — so it is covered by a unit test that
 * stubs the dependency instead.
 */
describe('Health probes (e2e)', () => {
  let app: INestApplication;

  const server = () => app.getHttpServer() as Server;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('liveness', () => {
    it('answers at an unversioned, unprefixed path', async () => {
      await request(server()).get('/health').expect(200);
    });

    it('needs no credentials', async () => {
      const response = await request(server()).get('/health').expect(200);

      expect(response.body).toBeDefined();
    });

    it('reports a status and the moment it answered', async () => {
      const response = await request(server()).get('/health').expect(200);
      const body = response.body as { data: { status: string; timestamp: string } };

      expect(body.data.status).toBe('UP');
      expect(Number.isNaN(Date.parse(body.data.timestamp))).toBe(false);
    });

    /**
     * An unauthenticated endpoint should hand an attacker nothing — no
     * version, no dependency list, no hostnames.
     */
    it('reveals nothing beyond status and timestamp', async () => {
      const response = await request(server()).get('/health').expect(200);
      const body = response.body as { data: Record<string, unknown> };

      expect(Object.keys(body.data).sort()).toEqual(['status', 'timestamp']);
    });

    it('is not reachable under the versioned API prefix', async () => {
      await request(server()).get('/api/v1/health').expect(404);
    });
  });

  describe('readiness', () => {
    it('answers at an unversioned, unprefixed path', async () => {
      await request(server()).get('/ready').expect(200);
    });

    it('reports UP while its dependencies are reachable', async () => {
      const response = await request(server()).get('/ready').expect(200);
      const body = response.body as { data: { status: string; timestamp: string } };

      expect(body.data.status).toBe('UP');
      expect(Number.isNaN(Date.parse(body.data.timestamp))).toBe(false);
    });

    it('reveals nothing beyond status and timestamp', async () => {
      const response = await request(server()).get('/ready').expect(200);
      const body = response.body as { data: Record<string, unknown> };

      expect(Object.keys(body.data).sort()).toEqual(['status', 'timestamp']);
    });

    it('is not reachable under the versioned API prefix', async () => {
      await request(server()).get('/api/v1/ready').expect(404);
    });
  });

  describe('read-only', () => {
    it.each(['post', 'put', 'patch', 'delete'] as const)(
      'exposes no %s verb on the probes',
      async (method) => {
        await request(server())[method]('/health').expect(404);
      },
    );
  });
});
