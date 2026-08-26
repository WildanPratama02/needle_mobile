import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Device, DeviceStatus, Prisma, Trolley } from '@prisma/client';

import { assertFactoryScope } from '../../../common/guards/factory-scope';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../database/prisma.service';
import { RegisterDeviceDto, ReassignDeviceDto } from '../dto/device-request.dto';
import { DeviceQueryDto } from '../dto/device-query.dto';

const MAX_PAGE_SIZE = 100;

export interface PagedRows<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** `deviceCode` ascending, `id` as a tiebreaker — same paging-safety rule every list in this system follows. */
const BY_DEVICE_CODE = [{ deviceCode: 'asc' as const }, { id: 'asc' as const }];

/**
 * Device lifecycle (`.scratch/device-and-inventory/spec.md`, GAP-13 Phase 1).
 * Full CRUD-ish lifecycle in one service because a wrong device registration
 * is embarrassing and reversible — revoke it, register the right one —
 * unlike a stock mutation, which is why Inventory (same spec) stays
 * read-only for now.
 *
 * `POST /devices/:id/heartbeat` is deliberately not implemented here — it's
 * the one endpoint a tablet calls on its own cadence, mobile/Flutter's
 * concern, not this spec's WebApps surface (Device story 13).
 *
 * **Scope is two-dimensional**, resolving PD-4 for this resource (Device
 * story 15/16): a device is in scope only if its own `factoryId` is in the
 * caller's factory scope *and* — when the caller carries a non-empty
 * `locationIds` (i.e. is scoped to specific trolleys, not a whole factory)
 * — its `trolley.locationId` is in that list too. An empty `locationIds`
 * means factory-wide access, matching how the seed's admin account is
 * scoped today.
 */
@Injectable()
export class DeviceService {
  constructor(private readonly prisma: PrismaService) {}

  private static paging(query: DeviceQueryDto) {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
  }

  private static scopedFactoryIds(user: AuthenticatedUser, requested?: string): string[] {
    return requested ? user.factoryIds.filter((id) => id === requested) : user.factoryIds;
  }

  /** `null` means "no location narrowing" — factory scope alone governs. */
  private static scopedLocationIds(user: AuthenticatedUser): string[] | null {
    return user.locationIds.length > 0 ? user.locationIds : null;
  }

  private static assertLocationScope(user: AuthenticatedUser, locationId: string): void {
    if (user.locationIds.length > 0 && !user.locationIds.includes(locationId)) {
      throw new ForbiddenException(`Out of location scope: ${locationId}`);
    }
  }

  async findMany(query: DeviceQueryDto, user: AuthenticatedUser): Promise<PagedRows<Device>> {
    const { page, pageSize, skip, take } = DeviceService.paging(query);
    const scopedLocationIds = DeviceService.scopedLocationIds(user);

    const where: Prisma.DeviceWhereInput = {
      factoryId: { in: DeviceService.scopedFactoryIds(user, query.factoryId) },
      trolleyId: query.trolleyId,
      status: query.status,
      ...(scopedLocationIds ? { trolley: { locationId: { in: scopedLocationIds } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.device.findMany({ where, orderBy: BY_DEVICE_CODE, skip, take }),
      this.prisma.device.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string, user: AuthenticatedUser): Promise<Device> {
    const row = await this.prisma.device.findUnique({
      where: { id },
      include: { trolley: true },
    });
    if (!row) {
      throw new NotFoundException(`Device not found: ${id}`);
    }

    // Scope is checked after loading, so a caller cannot use the difference
    // between 404 and 403 to discover which ids exist outside their scope —
    // same rule master-data's/users' by-id reads already apply.
    assertFactoryScope(user, row.factoryId);
    DeviceService.assertLocationScope(user, row.trolley.locationId);

    return row;
  }

  /** Loads the target trolley and validates it belongs to `factoryId` (Device story 7/11). */
  private async loadAndValidateTrolley(factoryId: string, trolleyId: string): Promise<Trolley> {
    const trolley = await this.prisma.trolley.findUnique({ where: { id: trolleyId } });
    if (!trolley) {
      throw new NotFoundException(`Trolley not found: ${trolleyId}`);
    }
    if (trolley.factoryId !== factoryId) {
      throw new BadRequestException('trolleyId must belong to factoryId');
    }
    return trolley;
  }

  async register(dto: RegisterDeviceDto, user: AuthenticatedUser): Promise<Device> {
    assertFactoryScope(user, dto.factoryId);
    const trolley = await this.loadAndValidateTrolley(dto.factoryId, dto.trolleyId);
    DeviceService.assertLocationScope(user, trolley.locationId);

    try {
      return await this.prisma.device.create({
        data: {
          deviceCode: dto.deviceCode,
          deviceName: dto.deviceName,
          serialNumber: dto.serialNumber,
          factoryId: dto.factoryId,
          trolleyId: dto.trolleyId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(
          `Device code or serial number already in use: ${dto.deviceCode} / ${dto.serialNumber}`,
        );
      }
      throw error;
    }
  }

  async activate(id: string, user: AuthenticatedUser): Promise<Device> {
    await this.findOne(id, user);
    return this.prisma.device.update({ where: { id }, data: { status: DeviceStatus.ACTIVE } });
  }

  async revoke(id: string, user: AuthenticatedUser): Promise<Device> {
    await this.findOne(id, user);
    return this.prisma.device.update({ where: { id }, data: { status: DeviceStatus.REVOKED } });
  }

  /**
   * Moves a device to a different trolley/factory in place — no revoke/
   * re-register round trip, no gap in the device's ability to transact
   * (Device story 10). Both the device's current binding and the requested
   * target factory are scope-checked, so a caller cannot use reassign to
   * either read or write outside their own scope.
   */
  async reassign(id: string, dto: ReassignDeviceDto, user: AuthenticatedUser): Promise<Device> {
    await this.findOne(id, user);
    assertFactoryScope(user, dto.factoryId);
    const trolley = await this.loadAndValidateTrolley(dto.factoryId, dto.trolleyId);
    DeviceService.assertLocationScope(user, trolley.locationId);

    return this.prisma.device.update({
      where: { id },
      data: { factoryId: dto.factoryId, trolleyId: dto.trolleyId },
    });
  }
}
