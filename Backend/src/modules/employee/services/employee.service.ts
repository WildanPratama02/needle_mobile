import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Employee, EntityStatus, Prisma } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { ScopedMasterDataQueryDto } from '../../master-data/dto/master-data-query.dto';
import { RfidCardService } from '../../rfid/services/rfid-card.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from '../dto/employee-request.dto';

const MAX_PAGE_SIZE = 100;

export interface PagedRows<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Moved from `master-data` (`.scratch/master-data-storage-rfid/spec.md`
 * decision #15) and given its first write path. The inline "Scan RFID Card"
 * field on create, and the deactivate cascade on update, both delegate to
 * `RfidCardService` rather than reimplementing the one-active-card/conflict/
 * revoke rules (decisions #12-#13) — this service owns Employee only.
 */
@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rfidCards: RfidCardService,
  ) {}

  private static paging(query: { page?: number; pageSize?: number }) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private static scopedFactoryIds(user: AuthenticatedUser, requested?: string): string[] {
    return requested ? user.factoryIds.filter((id) => id === requested) : user.factoryIds;
  }

  async findMany(
    query: ScopedMasterDataQueryDto,
    user: AuthenticatedUser,
  ): Promise<PagedRows<Employee>> {
    const { page, pageSize, skip, take } = EmployeeService.paging(query);
    const where = {
      factoryId: { in: EmployeeService.scopedFactoryIds(user, query.factoryId) },
      status: query.status,
    };

    // `employeeNumber` is what the response exposes as `code`, so ordering
    // follows the column the client actually sees sorted.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        orderBy: [{ employeeNumber: 'asc' }, { id: 'asc' }],
        skip,
        take,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Employee> {
    const row = await this.prisma.employee.findUnique({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Employee not found: ${id}`);
    }
    assertFactoryScope(user, row.factoryId);
    return row;
  }

  async create(dto: CreateEmployeeDto, user: AuthenticatedUser): Promise<Employee> {
    assertFactoryScope(user, dto.factoryId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const employee = await tx.employee.create({
          data: {
            employeeNumber: dto.employeeNumber,
            name: dto.name,
            department: dto.department,
            factoryId: dto.factoryId,
          },
        });

        if (dto.rfidUid) {
          await this.rfidCards.enroll(employee.id, dto.rfidUid, user, tx);
        }

        return employee;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(`Employee number already in use: ${dto.employeeNumber}`);
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateEmployeeDto, user: AuthenticatedUser): Promise<Employee> {
    const existing = await this.findOne(id, user);

    const deactivating = dto.status === EntityStatus.INACTIVE && existing.status !== EntityStatus.INACTIVE;

    return this.prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { id },
        data: { name: dto.name, department: dto.department, status: dto.status },
      });

      if (deactivating) {
        await this.rfidCards.revokeActiveCardsForEmployee(tx, id);
      }

      return employee;
    });
  }
}
