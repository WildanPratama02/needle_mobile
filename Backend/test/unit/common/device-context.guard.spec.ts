import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { DeviceStatus } from '@prisma/client';

import { DomainException } from '../../../src/common/errors/domain.exception';
import { DeviceContextGuard } from '../../../src/common/guards/device-context.guard';
import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { RequestWithContext } from '../../../src/common/interfaces/request-context.interface';
import { PrismaService } from '../../../src/database/prisma.service';

const DEVICE_ID = '11111111-1111-4111-8111-111111111111';

const user: AuthenticatedUser = {
  id: 'pic-1',
  username: 'pic',
  name: 'PIC',
  roles: ['PIC_TROLI'],
  permissions: ['MOBILE_OPERATE'],
  factoryIds: ['factory-a'],
  locationIds: [],
};

const device = {
  id: DEVICE_ID,
  factoryId: 'factory-a',
  trolleyId: 'trolley-1',
  status: DeviceStatus.ACTIVE,
  factory: { id: 'factory-a' },
  trolley: { id: 'trolley-1', locationId: 'loc-trolley-1' },
};

function build(options: {
  header?: string;
  found?: Record<string, unknown> | null;
  caller?: AuthenticatedUser;
}) {
  const request = {
    user: options.caller ?? user,
    header: (name: string) => (name === 'x-device-id' ? options.header : undefined),
  } as unknown as RequestWithContext;
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  const findUnique = jest
    .fn()
    .mockResolvedValue(options.found === undefined ? device : options.found);
  const guard = new DeviceContextGuard({ device: { findUnique } } as unknown as PrismaService);

  return { guard, context, request };
}

async function failure(promise: Promise<unknown>) {
  return promise.then(
    () => {
      throw new Error('expected a rejection');
    },
    (error: unknown) => error,
  );
}

describe('DeviceContextGuard', () => {
  it('attaches device, factory and trolley for an ACTIVE device in scope', async () => {
    const { guard, context, request } = build({ header: DEVICE_ID });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.deviceContext?.device.id).toBe(DEVICE_ID);
    expect(request.deviceContext?.factory.id).toBe('factory-a');
    expect(request.deviceContext?.trolley.locationId).toBe('loc-trolley-1');
    expect(request.deviceContext?.device).not.toHaveProperty('trolley');
  });

  it.each([undefined, '', 'not-a-uuid'])(
    'refuses header %p with 400 DEVICE_CONTEXT_REQUIRED',
    async (header) => {
      const { guard, context } = build({ header });

      const error = (await failure(guard.canActivate(context))) as DomainException;
      expect(error.getStatus()).toBe(400);
      expect(error.code).toBe('DEVICE_CONTEXT_REQUIRED');
    },
  );

  it('refuses an unknown device with 404 DEVICE_NOT_FOUND', async () => {
    const { guard, context } = build({ header: DEVICE_ID, found: null });

    const error = (await failure(guard.canActivate(context))) as DomainException;
    expect(error.getStatus()).toBe(404);
    expect(error.code).toBe('DEVICE_NOT_FOUND');
  });

  it.each([DeviceStatus.REVOKED, DeviceStatus.INACTIVE])(
    'refuses a %s device with 403 DEVICE_INACTIVE naming the status',
    async (status) => {
      const { guard, context } = build({ header: DEVICE_ID, found: { ...device, status } });

      const error = (await failure(guard.canActivate(context))) as DomainException;
      expect(error.getStatus()).toBe(403);
      expect(error.code).toBe('DEVICE_INACTIVE');
      expect(error.context).toEqual({ deviceId: DEVICE_ID, status });
    },
  );

  it('refuses a device of a factory outside the caller scope', async () => {
    const { guard, context } = build({
      header: DEVICE_ID,
      caller: { ...user, factoryIds: ['factory-b'] },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('refuses a trolley outside the caller location scope when the caller has one', async () => {
    const { guard, context } = build({
      header: DEVICE_ID,
      caller: { ...user, locationIds: ['loc-other'] },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('accepts a trolley inside the caller location scope', async () => {
    const { guard, context } = build({
      header: DEVICE_ID,
      caller: { ...user, locationIds: ['loc-trolley-1'] },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
