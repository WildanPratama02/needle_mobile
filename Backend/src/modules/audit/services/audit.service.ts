import { Injectable } from '@nestjs/common';
import { AuditLog, Prisma } from '@prisma/client';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { AuditQueryDto } from '../dto/audit-query.dto';

const MAX_PAGE_SIZE = 100;

export interface PagedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Read side of the audit trail.
 *
 * Query only — audit rows are written solely by `AuditLogInterceptor`
 * (Backend/CLAUDE.md §5) and are never updated or deleted here. That is what
 * makes them evidence rather than mutable state.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lists audit records the caller is allowed to see.
   *
   * **Scope is applied to the query, not to the results**, so a caller can
   * never page through another factory's history — and the database does the
   * filtering rather than the process loading the table into memory.
   *
   * Records with no `factoryId` are excluded. They cannot be attributed to a
   * factory, so there is no way to establish they are in scope; excluding them
   * fails closed, the same way an empty scope list grants nothing.
   */
  async findMany(query: AuditQueryDto, user: AuthenticatedUser): Promise<PagedAuditLogs> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);

    // A requested factory is intersected with the caller's scope rather than
    // replacing it, so the filter can only ever narrow what they may see.
    const factoryIds = query.factoryId
      ? user.factoryIds.filter((id) => id === query.factoryId)
      : user.factoryIds;

    const where: Prisma.AuditLogWhereInput = {
      factoryId: { in: factoryIds },
      actorUserId: query.actorUserId,
      entityType: query.entityType,
      entityId: query.entityId,
      action: query.action,
      timestamp:
        query.dateFrom || query.dateTo ? { gte: query.dateFrom, lte: query.dateTo } : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        // Newest first, with the id as a tiebreaker: two rows written in the
        // same millisecond would otherwise be free to swap places between
        // pages and silently hide or repeat a record.
        orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }
}
