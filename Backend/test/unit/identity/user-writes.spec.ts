import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { compare } from 'bcryptjs';

import { AuthenticatedUser } from '../../../src/common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../../src/database/prisma.service';
import { UserService } from '../../../src/modules/identity/services/user.service';

/**
 * `/users` writes (`.scratch/admin-panel-crud/issues/06`). Every grant follows
 * the never-widen rule: a caller can only hand out factories they are scoped
 * to and roles whose permissions they already hold.
 */

const FACTORY = 'factory-a';
const OTHER_FACTORY = 'factory-b';

const caller: AuthenticatedUser = {
  id: 'admin-1',
  username: 'admin',
  name: 'Admin',
  roles: ['FACTORY_ADMIN'],
  permissions: ['USER_MANAGE', 'EXCHANGE_VIEW', 'STOCK_VIEW'],
  factoryIds: [FACTORY],
  locationIds: [],
};

const target = {
  id: 'user-1',
  username: 'budi',
  name: 'Budi',
  status: 'ACTIVE',
  roles: [{ role: { code: 'PIC_TROLI' } }],
  factoryScopes: [{ factoryId: FACTORY }],
};

const p2002 = () =>
  new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: '6.19.3',
  });

function build(
  options: {
    user?: Record<string, unknown> | null;
    role?: Record<string, unknown> | null;
    factoryCount?: number;
    createError?: Error;
    deleteCount?: number;
    /** Permission codes the target holds through its active roles. */
    targetPermissions?: string[];
  } = {},
) {
  const prisma = {
    permission: {
      findMany: jest
        .fn()
        .mockResolvedValue((options.targetPermissions ?? []).map((code) => ({ code }))),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue(options.user === undefined ? target : options.user),
      findUniqueOrThrow: jest.fn().mockResolvedValue(target),
      create: options.createError
        ? jest.fn().mockRejectedValue(options.createError)
        : jest.fn().mockResolvedValue(target),
      update: jest.fn().mockResolvedValue(target),
    },
    role: {
      findUnique: jest.fn().mockResolvedValue(
        options.role === undefined
          ? {
              id: 'role-viewer',
              code: 'MANAGEMENT',
              status: 'ACTIVE',
              permissions: [
                { permission: { code: 'EXCHANGE_VIEW' } },
                { permission: { code: 'STOCK_VIEW' } },
              ],
            }
          : options.role,
      ),
    },
    factory: { count: jest.fn().mockResolvedValue(options.factoryCount ?? 1) },
    userRole: {
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: options.deleteCount ?? 1 }),
    },
    userFactoryScope: {
      upsert: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({ count: options.deleteCount ?? 1 }),
    },
  };

  const service = new UserService(prisma as unknown as PrismaService);
  return { service, prisma };
}

describe('UserService.create', () => {
  const dto = { username: 'budi', name: 'Budi', password: 'Password1', factoryIds: [FACTORY] };

  it('creates the user with a hashed password and the requested factory scopes', async () => {
    const { service, prisma } = build();

    await service.create(dto, caller);

    const [[{ data }]] = prisma.user.create.mock.calls as [
      [{ data: { username: string; name: string; passwordHash: string; factoryScopes: unknown } }],
    ];
    expect(data.username).toBe('budi');
    expect(data.name).toBe('Budi');
    expect(data.passwordHash).not.toBe('Password1');
    expect(await compare('Password1', data.passwordHash)).toBe(true);
    expect(data.factoryScopes).toEqual({ create: [{ factoryId: FACTORY }] });
  });

  it('refuses a factory outside the caller scope', async () => {
    const { service, prisma } = build();

    await expect(
      service.create({ ...dto, factoryIds: [FACTORY, OTHER_FACTORY] }, caller),
    ).rejects.toThrow(ForbiddenException);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('maps a duplicate username to 409', async () => {
    const { service } = build({ createError: p2002() });

    await expect(service.create(dto, caller)).rejects.toThrow(ConflictException);
  });
});

describe('UserService.update', () => {
  it('updates name and status', async () => {
    const { service, prisma } = build();

    await service.update('user-1', { name: 'Budi S', status: 'INACTIVE' }, caller);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: { name: 'Budi S', status: 'INACTIVE' },
      }),
    );
  });

  it('refuses a user outside the caller scope', async () => {
    const { service } = build({
      user: { ...target, factoryScopes: [{ factoryId: OTHER_FACTORY }] },
    });

    await expect(service.update('user-1', { name: 'x' }, caller)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuses to change the status of a user holding a permission the caller lacks', async () => {
    const { service, prisma } = build({ targetPermissions: ['EXCHANGE_VIEW', 'ROLE_MANAGE'] });

    await expect(service.update('user-1', { status: 'INACTIVE' }, caller)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('renames without the privilege check — only status switches access on or off', async () => {
    const { service, prisma } = build({ targetPermissions: ['ROLE_MANAGE'] });

    await service.update('user-1', { name: 'Budi S' }, caller);

    expect(prisma.permission.findMany).not.toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('refuses to deactivate the caller own account', async () => {
    const { service } = build({ user: { ...target, id: caller.id } });

    await expect(service.update(caller.id, { status: 'INACTIVE' }, caller)).rejects.toThrow(
      BadRequestException,
    );
  });
});

describe('UserService role assignment', () => {
  it('assigns a role whose permissions the caller already holds', async () => {
    const { service, prisma } = build();

    await service.assignRole('user-1', 'MANAGEMENT', caller);

    expect(prisma.userRole.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { userId: 'user-1', roleId: 'role-viewer' } }),
    );
  });

  it('refuses a role that would grant a permission the caller lacks', async () => {
    const { service, prisma } = build({
      role: {
        id: 'role-admin',
        code: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
        permissions: [{ permission: { code: 'ROLE_MANAGE' } }],
      },
    });

    await expect(service.assignRole('user-1', 'SYSTEM_ADMIN', caller)).rejects.toThrow(
      ForbiddenException,
    );
    expect(prisma.userRole.upsert).not.toHaveBeenCalled();
  });

  it('rejects an unknown role code with 404', async () => {
    const { service } = build({ role: null });

    await expect(service.assignRole('user-1', 'NOPE', caller)).rejects.toThrow(NotFoundException);
  });

  it('rejects an inactive role with 400', async () => {
    const { service } = build({
      role: { id: 'role-x', code: 'MANAGEMENT', status: 'INACTIVE', permissions: [] },
    });

    await expect(service.assignRole('user-1', 'MANAGEMENT', caller)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('revokes a held role, 404 when the user does not hold it', async () => {
    const held = build();
    await held.service.revokeRole('user-1', 'MANAGEMENT', caller);
    expect(held.prisma.userRole.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', roleId: 'role-viewer' },
    });

    const notHeld = build({ deleteCount: 0 });
    await expect(notHeld.service.revokeRole('user-1', 'MANAGEMENT', caller)).rejects.toThrow(
      NotFoundException,
    );
  });
});

describe('UserService factory scope assignment', () => {
  it('assigns a factory inside the caller scope', async () => {
    const { service, prisma } = build();

    await service.assignFactoryScope('user-1', FACTORY, caller);

    expect(prisma.userFactoryScope.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { userId: 'user-1', factoryId: FACTORY } }),
    );
  });

  it('refuses a factory outside the caller scope', async () => {
    const { service } = build();

    await expect(service.assignFactoryScope('user-1', OTHER_FACTORY, caller)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refuses to remove a user last factory scope', async () => {
    const { service, prisma } = build();

    await expect(service.revokeFactoryScope('user-1', FACTORY, caller)).rejects.toThrow(
      BadRequestException,
    );
    expect(prisma.userFactoryScope.deleteMany).not.toHaveBeenCalled();
  });

  it('removes one of several factory scopes', async () => {
    const scopedTwice = {
      ...target,
      factoryScopes: [{ factoryId: FACTORY }, { factoryId: OTHER_FACTORY }],
    };
    const { service, prisma } = build({ user: scopedTwice });

    await service.revokeFactoryScope('user-1', FACTORY, caller);

    expect(prisma.userFactoryScope.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', factoryId: FACTORY },
    });
  });
});
