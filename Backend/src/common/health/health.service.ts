import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Queue } from 'bullmq';

import { PrismaService } from '../../database/prisma.service';
import { NOTIFICATION_QUEUE } from '../../jobs/notification.constants';

export interface HealthStatus {
  status: 'UP';
  timestamp: string;
}

/**
 * Liveness and readiness, per `Docs/12` §29.
 *
 * Lives under `common/` rather than `src/modules/`: it owns no business
 * concept, so a thirteenth domain module would misrepresent it and cut against
 * the module boundary in `Backend/CLAUDE.md` §3 — the same reasoning that put
 * `RetentionModule` in `jobs/`.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(NOTIFICATION_QUEUE) private readonly queue: Queue,
  ) {}

  private static now(): HealthStatus {
    return { status: 'UP', timestamp: new Date().toISOString() };
  }

  /**
   * Is the process answering?
   *
   * Touches no dependency on purpose. A liveness probe that can fail because
   * something *else* is down will restart a healthy process for a fault a
   * restart cannot fix.
   */
  liveness(): HealthStatus {
    return HealthService.now();
  }

  /**
   * Can the process actually serve?
   *
   * Checks the database and the queue backend, because those are the two whose
   * absence makes the service useless — a container with a dead database
   * connection otherwise keeps reporting healthy and keeps receiving traffic.
   * A readiness probe that always succeeds is a liveness probe with a longer
   * name.
   */
  async readiness(): Promise<HealthStatus> {
    const [database, queue] = await Promise.allSettled([this.pingDatabase(), this.pingQueue()]);

    const failures = [database, queue].filter((result) => result.status === 'rejected');

    if (failures.length > 0) {
      for (const failure of failures) {
        // The operator gets the detail from the logs; the response does not
        // carry it. An unauthenticated endpoint should not describe which
        // internal dependency is down.
        this.logger.error('Readiness check failed', failure.reason);
      }

      throw new ServiceUnavailableException('Service is not ready');
    }

    return HealthService.now();
  }

  /** Cheapest round-trip that proves the connection is usable, not just open. */
  private async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  /**
   * A real command rather than a connection-state flag. BullMQ v6 keeps the
   * raw client on the backend implementation, and `waitUntilReady()` can
   * resolve from a connection that has since dropped — counting jobs actually
   * goes to Redis and back.
   */
  private async pingQueue(): Promise<void> {
    await this.queue.getJobCountByTypes('waiting');
  }
}
