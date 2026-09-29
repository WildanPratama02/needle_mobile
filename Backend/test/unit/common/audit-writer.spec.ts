import { AuditWriter } from '../../../src/common/audit/audit-writer';
import { AUDIT_ACTIONS } from '../../../src/common/decorators/audit.decorator';
import { PrismaService } from '../../../src/database/prisma.service';

function build(create = jest.fn().mockResolvedValue({})) {
  return { writer: new AuditWriter({ auditLog: { create } } as unknown as PrismaService), create };
}

describe('AuditWriter', () => {
  it('writes the snapshot, entity, actor and metadata it is given', async () => {
    const { writer, create } = build();

    await writer.write({
      action: AUDIT_ACTIONS.ISSUE_NEEDLE,
      entityType: 'Exchange',
      result: { id: 'exchange-1', status: 'NEEDLE_ISSUED', factoryId: 'factory-a', bulky: 'x' },
      actorUserId: 'user-1',
      requestId: 'req-1',
      metadata: { source: 'MOBILE_SYNC', commandId: 'cmd-1' },
    });

    expect(create).toHaveBeenCalledWith({
      data: {
        action: 'ISSUE_NEEDLE',
        entityType: 'Exchange',
        entityId: 'exchange-1',
        actorUserId: 'user-1',
        actorDeviceId: undefined,
        factoryId: 'factory-a',
        requestId: 'req-1',
        afterData: { id: 'exchange-1', status: 'NEEDLE_ISSUED', factoryId: 'factory-a' },
        metadata: { source: 'MOBILE_SYNC', commandId: 'cmd-1' },
      },
    });
  });

  it('falls back to the given entity id when the result has none', async () => {
    const { writer, create } = build();

    await writer.write({
      action: AUDIT_ACTIONS.DEVICE_REVOKE,
      entityType: 'Device',
      result: undefined,
      fallbackEntityId: 'device-1',
      metadata: {},
    });

    expect(create).toHaveBeenCalledWith({
      data: expect.objectContaining({ entityId: 'device-1' }) as unknown,
    });
  });

  it('never throws when the insert fails', async () => {
    const { writer } = build(jest.fn().mockRejectedValue(new Error('db down')));

    await expect(
      writer.write({
        action: AUDIT_ACTIONS.CREATE_EXCHANGE,
        entityType: 'Exchange',
        result: { id: 'e' },
        metadata: {},
      }),
    ).resolves.toBeUndefined();
  });
});
