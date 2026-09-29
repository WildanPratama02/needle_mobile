import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { AuditAction } from '../decorators/audit.decorator';

/** Fields worth keeping from a response; the rest is noise or duplication. */
const SNAPSHOT_FIELDS = [
  'id',
  'status',
  'exchangeNumber',
  'confirmationNumber',
  'exchangeId',
  'factoryId',
  'trolleyId',
  'operatorId',
  'newNeedleTypeId',
  'fragmentStatus',
  'cancelledAt',
  'completedAt',
  // Inventory writes (Receiving/Transfer/Adjustment) — movementNumber doubles
  // as the entity id there is no separate row for; the quantity fields are
  // what an auditor actually wants to see for a ledger change.
  'movementId',
  'movementNumber',
  'transferId',
  'returnId',
  'adjustmentMovementIds',
  'outMovementNumber',
  'inMovementNumber',
  'quantity',
  'balanceQuantity',
  'sourceBalanceQuantity',
  'destinationBalanceQuantity',
  'systemQuantity',
  'actualQuantity',
  'varianceQuantity',
  'locationId',
  'sourceLocationId',
  'destinationLocationId',
  'needleTypeId',
  // Device lifecycle (`.scratch/device-and-inventory/spec.md`) — `deviceCode`
  // is the human-readable identifier an auditor actually recognizes;
  // `factoryId`/`trolleyId` above already double as the reassign diff's
  // "after" side.
  'deviceCode',
];

/** One audited action, described independently of how it arrived. */
export interface AuditRecord {
  action: AuditAction;
  /** Domain entity the action operated on, e.g. `Exchange`. */
  entityType: string;
  /** The action's result (the plain response DTO); reduced to `SNAPSHOT_FIELDS`. */
  result: unknown;
  /** Fallback entity id when the result carries none (a route's `:id`). */
  fallbackEntityId?: string;
  actorUserId?: string;
  requestId?: string;
  metadata: Record<string, unknown>;
}

/**
 * The one place an `audit_logs` row is written (Backend/CLAUDE.md §4).
 *
 * `AuditLogInterceptor` calls it for routes carrying `@Audit(...)`; the mobile
 * sync engine calls it for commands that run the same service methods without
 * passing through a route. Both callers invoke it only after the action's
 * transaction committed, so no row ever describes a rolled-back action.
 */
@Injectable()
export class AuditWriter {
  private readonly logger = new Logger(AuditWriter.name);

  constructor(private readonly prisma: PrismaService) {}

  async write(record: AuditRecord): Promise<void> {
    try {
      const snapshot = AuditWriter.snapshot(record.result);

      await this.prisma.auditLog.create({
        data: {
          action: record.action,
          entityType: record.entityType,
          // Inventory writes (Receiving/Adjustment key on `movementId`,
          // Transfer on `transferId` for its paired OUT/IN rows) carry no
          // `id` field and their routes carry no `:id` param — without this,
          // every RECEIVE_STOCK/TRANSFER_STOCK/ADJUST_STOCK row would land
          // with entityId null, breaking the [entityType, entityId] lookup.
          entityId:
            (snapshot.id as string) ??
            (snapshot.movementId as string) ??
            (snapshot.transferId as string) ??
            (snapshot.returnId as string) ??
            record.fallbackEntityId,
          actorUserId: record.actorUserId,
          actorDeviceId: undefined,
          factoryId: (snapshot.factoryId as string) ?? undefined,
          requestId: record.requestId,
          // `beforeData` stays null: the writer sees only the result.
          // Capturing the prior state would mean services logging their own
          // changes, which CLAUDE.md §4 rules out.
          afterData: snapshot as Prisma.InputJsonValue,
          metadata: record.metadata as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Never turn a successful business action into a failed response
      // because bookkeeping had a problem.
      this.logger.error(`Audit write failed for ${record.action}: ${(error as Error).message}`);
    }
  }

  /** Keeps identifiers and state, drops everything bulky or irrelevant. */
  static snapshot(body: unknown): Record<string, unknown> {
    if (!body || typeof body !== 'object') {
      return {};
    }

    const source = body as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const field of SNAPSHOT_FIELDS) {
      if (source[field] !== undefined) {
        result[field] = source[field];
      }
    }

    return result;
  }
}
