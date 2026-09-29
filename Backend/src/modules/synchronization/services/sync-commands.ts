import { AUDIT_ACTIONS, AuditAction } from '../../../common/decorators/audit.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { DeviceContext } from '../../../common/interfaces/device-context.interface';
import { PERMISSIONS, PermissionCode } from '../../../shared/constants/permissions';
import {
  CancelExchangeDto,
  IdentifyOperatorDto,
  IssueNeedleDto,
  RecordFragmentDto,
  SelectExchangeTypeDto,
  SelectNewNeedleDto,
} from '../../exchange/dto/exchange-request.dto';
import { ExchangeWithContext } from '../../exchange/repositories/exchange.repository';
import { ExchangeService } from '../../exchange/services/exchange.service';
import { SyncCommandType } from '../sync.constants';

/** For command types that carry no data: any key at all is refused. */
export class EmptyPayloadDto {}

export interface CommandRun {
  exchanges: ExchangeService;
  user: AuthenticatedUser;
  device: DeviceContext;
  clientTransactionId: string;
  /** Server id of the exchange; `null` only for `CREATE_EXCHANGE`. */
  exchangeId: string | null;
  payload: object;
}

export interface SyncCommandSpec {
  /** The permission of the matching HTTP route — never a different one. */
  permission: PermissionCode;
  /** The DTO the matching HTTP route validates its body with. */
  payload: new () => object;
  /** Written for the same commands the matching routes carry `@Audit` on. */
  audit?: AuditAction;
  run(input: CommandRun): Promise<ExchangeWithContext>;
}

/**
 * Each sync command is a thin adapter onto the `ExchangeService` method its
 * HTTP endpoint calls (Docs/adr/0007), so the state machine, the stock ledger,
 * scope checks and notifications are identical however a step arrives.
 */
export const SYNC_COMMANDS: Record<SyncCommandType, SyncCommandSpec> = {
  CREATE_EXCHANGE: {
    permission: PERMISSIONS.EXCHANGE_CREATE,
    payload: EmptyPayloadDto,
    audit: AUDIT_ACTIONS.CREATE_EXCHANGE,
    // Factory, trolley and device come from the device binding, never from
    // the tablet (Docs/07 §4).
    run: ({ exchanges, user, device, clientTransactionId }) =>
      exchanges.create(
        {
          clientTransactionId,
          factoryId: device.device.factoryId,
          trolleyId: device.device.trolleyId,
          deviceId: device.device.id,
        },
        user,
      ),
  },
  ASSIGN_OPERATOR: {
    permission: PERMISSIONS.EXCHANGE_CREATE,
    payload: IdentifyOperatorDto,
    run: ({ exchanges, user, exchangeId, payload }) =>
      exchanges.identifyOperator(exchangeId!, payload, user),
  },
  SELECT_EXCHANGE_TYPE: {
    permission: PERMISSIONS.EXCHANGE_CREATE,
    payload: SelectExchangeTypeDto,
    run: ({ exchanges, user, exchangeId, payload }) =>
      exchanges.selectType(exchangeId!, payload as SelectExchangeTypeDto, user),
  },
  FRAGMENT_VALIDATION: {
    permission: PERMISSIONS.EXCHANGE_CREATE,
    payload: RecordFragmentDto,
    run: ({ exchanges, user, exchangeId, payload }) =>
      exchanges.recordFragment(exchangeId!, payload as RecordFragmentDto, user),
  },
  SELECT_NEW_NEEDLE: {
    permission: PERMISSIONS.EXCHANGE_CREATE,
    payload: SelectNewNeedleDto,
    run: ({ exchanges, user, exchangeId, payload }) =>
      exchanges.selectNewNeedle(exchangeId!, payload as SelectNewNeedleDto, user),
  },
  ISSUE_NEEDLE: {
    permission: PERMISSIONS.EXCHANGE_ISSUE,
    payload: IssueNeedleDto,
    audit: AUDIT_ACTIONS.ISSUE_NEEDLE,
    run: ({ exchanges, user, exchangeId, payload }) =>
      exchanges.issueNeedle(exchangeId!, payload, user),
  },
  STORE_USED_NEEDLE: {
    permission: PERMISSIONS.EXCHANGE_CREATE,
    payload: EmptyPayloadDto,
    run: ({ exchanges, user, exchangeId }) => exchanges.storeUsedNeedle(exchangeId!, user),
  },
  COMPLETE_EXCHANGE: {
    permission: PERMISSIONS.EXCHANGE_COMPLETE,
    payload: EmptyPayloadDto,
    run: ({ exchanges, user, exchangeId }) => exchanges.complete(exchangeId!, user),
  },
  CANCEL_EXCHANGE: {
    permission: PERMISSIONS.EXCHANGE_CANCEL,
    payload: CancelExchangeDto,
    audit: AUDIT_ACTIONS.CANCEL_EXCHANGE,
    run: ({ exchanges, user, exchangeId, payload }) =>
      exchanges.cancel(exchangeId!, payload as CancelExchangeDto, user),
  },
};
