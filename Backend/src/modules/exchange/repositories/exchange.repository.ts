import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../../database/prisma.service';

/** Everything the state machine needs to judge a transition, in one read. */
export const EXCHANGE_CONTEXT_INCLUDE = {
  exchangeType: true,
  confirmation: true,
  evidence: true,
} satisfies Prisma.ExchangeInclude;

export type ExchangeWithContext = Prisma.ExchangeGetPayload<{
  include: typeof EXCHANGE_CONTEXT_INCLUDE;
}>;

@Injectable()
export class ExchangeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findWithContext(id: string): Promise<ExchangeWithContext | null> {
    return this.prisma.exchange.findUnique({
      where: { id },
      include: EXCHANGE_CONTEXT_INCLUDE,
    });
  }

  findByClientTransaction(
    deviceId: string,
    clientTransactionId: string,
  ): Promise<ExchangeWithContext | null> {
    return this.prisma.exchange.findUnique({
      where: { deviceId_clientTransactionId: { deviceId, clientTransactionId } },
      include: EXCHANGE_CONTEXT_INCLUDE,
    });
  }

  async findPaged(where: Prisma.ExchangeWhereInput, page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.exchange.findMany({
        where,
        // Newest first, with the id as a tiebreaker: two exchanges created in
        // the same instant would otherwise be free to swap places between
        // pages and silently hide or repeat one. Same discipline the audit
        // list already applies.
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: EXCHANGE_CONTEXT_INCLUDE,
      }),
      this.prisma.exchange.count({ where }),
    ]);

    return { items, total };
  }
}
