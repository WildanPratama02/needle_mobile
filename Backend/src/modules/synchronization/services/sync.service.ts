import {
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validate } from 'class-validator';

import { AuditWriter } from '../../../common/audit/audit-writer';
import { DomainException, ERROR_CODES } from '../../../common/errors/domain.exception';
import { describeError } from '../../../common/filters/http-exception.filter';
import { IdempotencyStore } from '../../../common/idempotency/idempotency-store';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { DeviceContext } from '../../../common/interfaces/device-context.interface';
import { toExchangeResponse } from '../../exchange/dto/exchange-response.mapper';
import {
  ExchangeRepository,
  ExchangeWithContext,
} from '../../exchange/repositories/exchange.repository';
import { ExchangeService } from '../../exchange/services/exchange.service';
import { SyncCommandDto, SyncRequestDto } from '../dto/mobile-request.dto';
import { SyncCommandResultDto, SyncResponseDto } from '../dto/mobile-response.dto';
import { SyncResultStatus } from '../sync.constants';
import { BootstrapService } from './bootstrap.service';
import { SYNC_COMMANDS } from './sync-commands';
import { SyncChangesService, toMobileExchange } from './sync-changes.service';
import { decodeCursor } from './sync-cursor';

export interface SyncCall {
  user: AuthenticatedUser;
  device: DeviceContext;
  requestId?: string;
  path: string;
}

/** Flattens class-validator output the way the global `ValidationPipe` does. */
function messagesOf(errors: ValidationError[]): string[] {
  return errors.flatMap((error) => [
    ...Object.values(error.constraints ?? {}),
    ...messagesOf(error.children ?? []),
  ]);
}

/**
 * `POST /mobile/sync` (Docs/12 §19, Docs/adr/0007): runs a tablet's queued
 * exchange steps, then reports what changed on the server.
 *
 * Commands run in order, one transaction each. When one does not succeed,
 * the rest of *its* exchange is skipped — a later step cannot be valid once an
 * earlier one failed — while other exchanges carry on. Every command is keyed
 * by its `commandId`, so a batch resent after a timeout never executes a step
 * twice.
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly exchanges: ExchangeService,
    private readonly repository: ExchangeRepository,
    private readonly idempotency: IdempotencyStore,
    private readonly audit: AuditWriter,
    private readonly changes: SyncChangesService,
    private readonly bootstrap: BootstrapService,
  ) {}

  async sync(dto: SyncRequestDto, call: SyncCall): Promise<SyncResponseDto> {
    if (dto.deviceId !== call.device.device.id) {
      throw new DomainException(
        ERROR_CODES.DEVICE_MISMATCH,
        'deviceId must equal the X-Device-ID of the calling device',
        HttpStatus.FORBIDDEN,
      );
    }

    // Decoded before any command runs, so a bad cursor refuses the request
    // without half-applying a batch the tablet would then resend.
    const pullFrom = dto.cursor ?? null;
    if (pullFrom) {
      decodeCursor(pullFrom);
    }

    const results: SyncCommandResultDto[] = [];
    const halted = new Set<string>();

    for (const command of dto.commands) {
      if (halted.has(command.clientTransactionId)) {
        results.push(SyncService.result(command, 'SKIPPED', null));
        continue;
      }

      const result = await this.execute(command, call);
      results.push(result);

      if (result.status === 'REJECTED' || result.status === 'FAILED') {
        halted.add(command.clientTransactionId);
      }
    }

    const [pulled, catalogue] = await Promise.all([
      this.changes.changesSince(call.device.device.id, pullFrom),
      this.bootstrap.catalogue(call.device.trolley.id),
    ]);

    return {
      results,
      changes: {
        exchanges: pulled.exchanges,
        hasMore: pulled.hasMore,
        masterDataVersions: catalogue.versions,
      },
      nextCursor: pulled.nextCursor,
      serverTime: new Date(),
    };
  }

  private static result(
    command: SyncCommandDto,
    status: SyncResultStatus,
    exchange: ExchangeWithContext | null,
    error?: SyncCommandResultDto['error'],
  ): SyncCommandResultDto {
    return {
      commandId: command.commandId,
      clientTransactionId: command.clientTransactionId,
      commandType: command.commandType,
      status,
      referenceId: exchange?.id ?? null,
      ...(error ? { error } : {}),
      exchange: exchange ? toMobileExchange(exchange) : null,
    };
  }

  /** The exchange a command belongs to, as the tablet names it. */
  private findExchange(call: SyncCall, clientTransactionId: string) {
    return this.repository.findByClientTransaction(call.device.device.id, clientTransactionId);
  }

  private async execute(command: SyncCommandDto, call: SyncCall): Promise<SyncCommandResultDto> {
    const spec = SYNC_COMMANDS[command.commandType];
    const reject = async (error: unknown): Promise<SyncCommandResultDto> => {
      const described = describeError(error);
      const status: SyncResultStatus = described.status >= 500 ? 'FAILED' : 'REJECTED';

      if (status === 'FAILED') {
        this.logger.error(
          `Sync command ${command.commandType} (${command.commandId}) failed: ${(error as Error)?.message}`,
          (error as Error)?.stack,
        );
      }

      // The tablet refreshes from the authoritative state (Docs/15 §13).
      const current = await this.findExchange(call, command.clientTransactionId).catch(() => null);
      return SyncService.result(command, status, current, described.error);
    };

    // Same permission as the matching HTTP route — holding MOBILE_OPERATE
    // grants no exchange step by itself (exact-match, no implication).
    if (!call.user.permissions.includes(spec.permission)) {
      return reject(new ForbiddenException(`Missing permission ${spec.permission}`));
    }

    const payload = plainToInstance(spec.payload, command.payload ?? {});
    const errors = await validate(payload, {
      whitelist: true,
      forbidNonWhitelisted: true,
      // A payload class with no fields at all (EmptyPayloadDto) is legitimate
      // here; any key sent with it is still refused by forbidNonWhitelisted.
      forbidUnknownValues: false,
    });
    if (errors.length > 0) {
      return reject(new BadRequestException(messagesOf(errors)));
    }

    // Scoped to the device as well as the command type: a commandId arriving
    // from another tablet must never replay this tablet's result.
    const endpoint = `SYNC ${call.device.device.id} ${command.commandType}`;
    const claim = await this.idempotency.claim({
      key: command.commandId,
      endpoint,
      requestHash: IdempotencyStore.hash({
        clientTransactionId: command.clientTransactionId,
        commandType: command.commandType,
        payload: command.payload ?? {},
      }),
      actorUserId: call.user.id,
      deviceId: call.device.device.id,
    });

    switch (claim.outcome) {
      case 'MISMATCH':
        return reject(
          new DomainException(
            ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
            'commandId was already used with a different command',
            HttpStatus.UNPROCESSABLE_ENTITY,
          ),
        );
      case 'IN_PROGRESS': {
        // Transient: an identical command is running right now. FAILED, not
        // REJECTED, so the tablet retries it as is.
        const current = await this.findExchange(call, command.clientTransactionId);
        return SyncService.result(command, 'FAILED', current, {
          code: 'CONFLICT',
          message: 'An identical command is still in progress',
          details: [],
        });
      }
      case 'REPLAY':
        return {
          ...(claim.responseBody as SyncCommandResultDto),
          status: 'IDEMPOTENT_SUCCESS',
        };
      case 'CLAIMED':
        break;
    }

    let exchange: ExchangeWithContext;

    try {
      let exchangeId: string | null = null;

      if (command.commandType !== 'CREATE_EXCHANGE') {
        const existing = await this.findExchange(call, command.clientTransactionId);
        if (!existing) {
          throw new DomainException(
            ERROR_CODES.EXCHANGE_NOT_FOUND,
            'No exchange with this clientTransactionId was created from this device',
            HttpStatus.NOT_FOUND,
          );
        }
        exchangeId = existing.id;
      }

      exchange = await spec.run({
        exchanges: this.exchanges,
        user: call.user,
        device: call.device,
        clientTransactionId: command.clientTransactionId,
        exchangeId,
        payload,
      });
    } catch (error) {
      // A command that did not happen must be re-evaluated on resend.
      await this.idempotency.release(command.commandId, endpoint).catch(() => undefined);
      return reject(error);
    }

    const result = SyncService.result(command, 'SUCCESS', exchange);

    await this.idempotency
      .complete(command.commandId, endpoint, HttpStatus.OK, result)
      .catch(() => undefined);

    if (spec.audit) {
      // After the command's own transaction committed, through the writer the
      // audit interceptor uses — so sync leaves the same trail HTTP does.
      await this.audit.write({
        action: spec.audit,
        entityType: 'Exchange',
        result: toExchangeResponse(exchange),
        actorUserId: call.user.id,
        requestId: call.requestId,
        metadata: {
          method: 'POST',
          path: call.path,
          deviceId: call.device.device.id,
          reason: (payload as { reason?: string }).reason ?? null,
          source: 'MOBILE_SYNC',
          commandId: command.commandId,
          commandType: command.commandType,
          occurredAt: command.occurredAt ?? null,
        },
      });
    }

    return result;
  }
}
