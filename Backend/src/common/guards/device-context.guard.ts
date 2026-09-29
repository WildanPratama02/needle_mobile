import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';
import { isUUID } from 'class-validator';

import { PrismaService } from '../../database/prisma.service';
import { DomainException, ERROR_CODES } from '../errors/domain.exception';
import { RequestWithContext } from '../interfaces/request-context.interface';
import { assertFactoryScope } from './factory-scope';

export const DEVICE_ID_HEADER = 'x-device-id';

/**
 * Resolves and validates the calling tablet for tablet-only routes (Docs/12 §9
 * "Device context", Docs/07 FR-MOB-002, Docs/13 §12).
 *
 * Re-checked on every request rather than trusted from login, the same way
 * `JwtAuthGuard` reloads grants: revoking a device in the WebApp stops the
 * tablet at its next call, without waiting for any token to expire.
 *
 * Opt-in per route through `@RequireDeviceContext()`, never global — the
 * WebApp sends no device id. Runs after the global guards, so the caller is
 * already authenticated and holds the route's permission.
 */
@Injectable()
export class DeviceContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authenticated user not resolved');
    }

    const deviceId = (request.header(DEVICE_ID_HEADER) ?? '').trim();

    if (!isUUID(deviceId)) {
      throw new DomainException(
        ERROR_CODES.DEVICE_CONTEXT_REQUIRED,
        'The X-Device-ID header must carry the registered device id',
        HttpStatus.BAD_REQUEST,
      );
    }

    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      include: { factory: true, trolley: true },
    });

    if (!device) {
      throw new DomainException(
        ERROR_CODES.DEVICE_NOT_FOUND,
        'This device is not registered',
        HttpStatus.NOT_FOUND,
      );
    }

    if (device.status !== DeviceStatus.ACTIVE) {
      // The status travels in `context`: the tablet shows "revoked" and
      // "inactive" differently (FR-MOB-002), and it cannot ask otherwise.
      throw new DomainException(
        ERROR_CODES.DEVICE_INACTIVE,
        `This device is ${device.status}`,
        HttpStatus.FORBIDDEN,
        { deviceId: device.id, status: device.status },
      );
    }

    assertFactoryScope(user, device.factoryId);

    // A user with location scopes is limited to them; one without any is
    // limited by factory alone, as on every list endpoint.
    if (user.locationIds.length > 0 && !user.locationIds.includes(device.trolley.locationId)) {
      throw new ForbiddenException(`Out of location scope: ${device.trolley.locationId}`);
    }

    const { factory, trolley, ...plain } = device;
    request.deviceContext = { device: plain, factory, trolley };

    return true;
  }
}
