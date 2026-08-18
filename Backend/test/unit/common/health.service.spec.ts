import { ServiceUnavailableException } from '@nestjs/common';

import { HealthService } from '../../../src/common/health/health.service';
import { PrismaService } from '../../../src/database/prisma.service';

/**
 * The readiness failure path.
 *
 * It cannot be reached from the e2e suite — that runs against a database and
 * queue that are up — so the dependency is stubbed here instead. Same shape as
 * every other service unit test in this project: construct the service by hand
 * with a stub cast to the real type, rather than booting a module.
 *
 * A readiness probe that always succeeds is a liveness probe with a longer
 * name, so these are the assertions that give the endpoint its reason to exist.
 */
describe('HealthService', () => {
  const workingPrisma = () =>
    ({ $queryRaw: jest.fn().mockResolvedValue([{ ok: 1 }]) }) as unknown as PrismaService;

  const brokenPrisma = () =>
    ({
      $queryRaw: jest.fn().mockRejectedValue(new Error('connection refused')),
    }) as unknown as PrismaService;

  const workingQueue = () => ({ getJobCountByTypes: jest.fn().mockResolvedValue(0) });

  const brokenQueue = () => ({
    getJobCountByTypes: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
  });

  describe('liveness', () => {
    // Touches no dependency, so it cannot fail for a reason outside the
    // process — which is what makes it safe as a restart trigger.
    it('reports UP without consulting any dependency', () => {
      const queryRaw = jest.fn();
      const service = new HealthService(
        { $queryRaw: queryRaw } as unknown as PrismaService,
        workingQueue() as never,
      );

      const result = service.liveness();

      expect(result.status).toBe('UP');
      expect(queryRaw).not.toHaveBeenCalled();
    });

    it('timestamps its answer', () => {
      const service = new HealthService(workingPrisma(), workingQueue() as never);

      expect(Number.isNaN(Date.parse(service.liveness().timestamp))).toBe(false);
    });
  });

  describe('readiness', () => {
    it('reports UP when every dependency answers', async () => {
      const service = new HealthService(workingPrisma(), workingQueue() as never);

      await expect(service.readiness()).resolves.toEqual(expect.objectContaining({ status: 'UP' }));
    });

    it('refuses when the database is unreachable', async () => {
      const service = new HealthService(brokenPrisma(), workingQueue() as never);

      await expect(service.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('refuses when the queue backend is unreachable', async () => {
      const service = new HealthService(workingPrisma(), brokenQueue() as never);

      await expect(service.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('refuses when both are unreachable', async () => {
      const service = new HealthService(brokenPrisma(), brokenQueue() as never);

      await expect(service.readiness()).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    /**
     * The failure reaches an operator as a status code, and the detail stays
     * out of the body — an unauthenticated endpoint should not describe which
     * internal dependency is down.
     */
    it('does not name the failing dependency in the refusal', async () => {
      const service = new HealthService(brokenPrisma(), workingQueue() as never);

      const error = await service.readiness().catch((thrown: Error) => thrown);

      expect(error).toBeInstanceOf(ServiceUnavailableException);
      expect(JSON.stringify(error)).not.toMatch(/prisma|postgres|redis|connection refused/i);
    });
  });
});
