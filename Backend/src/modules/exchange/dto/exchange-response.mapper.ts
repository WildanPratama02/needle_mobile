import { ExchangeWithContext } from '../repositories/exchange.repository';
import { ExchangeResponseDto } from './exchange-response.dto';

/**
 * Shapes an exchange for the wire; `state` is exposed as `status` per Docs/12.
 *
 * Shared by the exchange routes and the mobile sync engine, so a command's
 * result and the matching HTTP endpoint's response cannot drift apart.
 */
export function toExchangeResponse(exchange: ExchangeWithContext): ExchangeResponseDto {
  return {
    id: exchange.id,
    exchangeNumber: exchange.exchangeNumber,
    status: exchange.state,
    factoryId: exchange.factoryId,
    trolleyId: exchange.trolleyId,
    deviceId: exchange.deviceId,
    operatorId: exchange.operatorId,
    exchangeTypeId: exchange.exchangeTypeId,
    // `exchangeType` is eager-loaded on every read because the state machine
    // needs it to judge fragment rules — these labels were being loaded and
    // then discarded. Reading them here costs no additional query.
    exchangeTypeCode: exchange.exchangeType?.code ?? null,
    exchangeTypeName: exchange.exchangeType?.name ?? null,
    oldNeedleTypeId: exchange.oldNeedleTypeId,
    newNeedleTypeId: exchange.newNeedleTypeId,
    fragmentStatus: exchange.fragmentStatus,
    confirmationId: exchange.confirmation?.id ?? null,
    createdAt: exchange.createdAt,
    completedAt: exchange.completedAt,
    cancelledAt: exchange.cancelledAt,
  };
}
