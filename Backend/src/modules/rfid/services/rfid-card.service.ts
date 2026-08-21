import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EntityStatus, Prisma, RfidCard } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { RfidCardQueryDto } from '../dto/rfid-query.dto';

const MAX_PAGE_SIZE = 100;

export interface PagedRows<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * `RfidCard` lifecycle: enroll, revoke, list/read. Independent of `Employee`
 * — `EmployeeService` (the `employee` module) calls `enroll`/
 * `revokeActiveCardsForEmployee` on this service rather than reimplementing
 * either rule, so there is exactly one place the one-active-card and
 * ACTIVE-only-conflict rules live
 * (`.scratch/master-data-storage-rfid/spec.md` decisions #7-#9, #12-#13).
 *
 * Not built here: `GET /rfid/cards/{rfidUid}`, Doc 13 §8's mobile
 * operator-identification lookup — different client, different flow, out of
 * scope for this module (it already lives in `ExchangeService.identifyOperator`).
 */
@Injectable()
export class RfidCardService {
  constructor(private readonly prisma: PrismaService) {}

  private static paging(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  async findMany(query: RfidCardQueryDto, user: AuthenticatedUser): Promise<PagedRows<RfidCard>> {
    const { page, pageSize, skip, take } = RfidCardService.paging(query);
    const where: Prisma.RfidCardWhereInput = {
      employeeId: query.employeeId,
      status: query.status,
      employee: { factoryId: { in: user.factoryIds } },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.rfidCard.findMany({
        where,
        orderBy: [{ issuedAt: 'desc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.rfidCard.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<RfidCard> {
    const row = await this.prisma.rfidCard.findUnique({ where: { id }, include: { employee: true } });
    if (!row) {
      throw new NotFoundException(`RFID card not found: ${id}`);
    }
    assertFactoryScope(user, row.employee.factoryId);
    return row;
  }

  /**
   * Enroll a UID against an employee.
   *
   * Accepts an optional transaction client so `EmployeeService.create` can
   * run this inside its own employee-creation transaction for the inline
   * "Scan RFID Card" field (spec decision #12) — enroll-on-create and
   * enroll-from-the-RFID-screen are the same code path either way.
   */
  async enroll(
    employeeId: string,
    rfidUid: string,
    user: AuthenticatedUser,
    tx?: Prisma.TransactionClient,
  ): Promise<RfidCard> {
    const run = async (client: Prisma.TransactionClient | PrismaService) => {
      const employee = await client.employee.findUnique({ where: { id: employeeId } });
      if (!employee) {
        throw new NotFoundException(`Employee not found: ${employeeId}`);
      }
      assertFactoryScope(user, employee.factoryId);

      // ACTIVE-only conflict check (spec decision #14 / #7) — a revoked UID
      // is free to be re-enrolled, to the same or a different employee.
      const conflict = await client.rfidCard.findFirst({
        where: { rfidUid, status: EntityStatus.ACTIVE },
        include: { employee: true },
      });
      if (conflict) {
        throw new ConflictException(
          `RFID ${rfidUid} is already assigned to ${conflict.employee.name} (${conflict.employee.employeeNumber})`,
        );
      }

      // One ACTIVE card per employee (spec decision #8) — revoke the
      // employee's current active card, if any, before creating the new one.
      await client.rfidCard.updateMany({
        where: { employeeId, status: EntityStatus.ACTIVE },
        data: { status: EntityStatus.INACTIVE, revokedAt: new Date() },
      });

      return client.rfidCard.create({
        data: { employeeId, rfidUid, status: EntityStatus.ACTIVE },
      });
    };

    return tx ? run(tx) : this.prisma.$transaction((client) => run(client));
  }

  /** Terminal — no endpoint ever flips a revoked card back to ACTIVE (spec decision #9). */
  async revoke(id: string, user: AuthenticatedUser): Promise<RfidCard> {
    return this.prisma.$transaction(async (tx) => {
      const card = await tx.rfidCard.findUnique({ where: { id }, include: { employee: true } });
      if (!card) {
        throw new NotFoundException(`RFID card not found: ${id}`);
      }
      assertFactoryScope(user, card.employee.factoryId);

      if (card.status === EntityStatus.INACTIVE) {
        throw new ConflictException('RFID card is already revoked');
      }

      return tx.rfidCard.update({
        where: { id },
        data: { status: EntityStatus.INACTIVE, revokedAt: new Date() },
      });
    });
  }

  /**
   * Shared cascade helper: revokes every ACTIVE card an employee holds
   * (in practice, zero or one — see `enroll`'s one-active-card rule). Called
   * both by `revoke`'s own logic-equivalent path and by `EmployeeService`
   * when an employee is deactivated (spec decision #13).
   */
  async revokeActiveCardsForEmployee(tx: Prisma.TransactionClient, employeeId: string): Promise<void> {
    await tx.rfidCard.updateMany({
      where: { employeeId, status: EntityStatus.ACTIVE },
      data: { status: EntityStatus.INACTIVE, revokedAt: new Date() },
    });
  }
}
