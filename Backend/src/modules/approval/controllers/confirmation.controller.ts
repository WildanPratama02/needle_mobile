import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import {
  ApproveConfirmationDto,
  ListConfirmationsQueryDto,
  RejectConfirmationDto,
} from '../dto/confirmation-request.dto';
import { ConfirmationResponseDto, PagedConfirmationsDto } from '../dto/confirmation-response.dto';
import { ConfirmationService, ConfirmationWithContext } from '../services/confirmation.service';

/**
 * Paths per Docs/12 §11. Docs/05 §24 also lists an `/approvals` group; Docs/12
 * is canonical for API contracts (round 4 Q4), so `/approvals` is treated as
 * stale and not implemented.
 *
 * These are the only way a Confirmation gets decided. Docs/14 §7-8 proposes
 * WhatsApp buttons calling approve/reject inbound — explicitly overridden by
 * ADR-006 and round 4 Q12: no inbound message ever triggers a mutation.
 */
@ApiTags('confirmations')
@ApiBearerAuth()
@Controller({ path: 'confirmations', version: '1' })
export class ConfirmationController {
  constructor(private readonly confirmations: ConfirmationService) {}

  private static toResponse(confirmation: ConfirmationWithContext): ConfirmationResponseDto {
    return {
      id: confirmation.id,
      confirmationNumber: confirmation.confirmationNumber,
      exchangeId: confirmation.exchangeId,
      exchangeNumber: confirmation.exchange.exchangeNumber,
      exchangeStatus: confirmation.exchange.state,
      factoryId: confirmation.exchange.factoryId,
      status: confirmation.status,
      requestedToUserId: confirmation.requestedToUserId,
      requestedAt: confirmation.requestedAt,
      dueAt: confirmation.dueAt,
      decidedAt: confirmation.decidedAt,
      decisions: confirmation.decisions.map((decision) => ({
        id: decision.id,
        decision: decision.decision,
        decidedBy: decision.decidedBy,
        reason: decision.reason,
        decidedAt: decision.decidedAt,
      })),
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.CONFIRMATION_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'List confirmations within the caller factory scope',
    description: 'Items arrive in `data`; page counters in `meta` (Docs/12 §7).',
  })
  @ApiResponse({ status: 200, type: [ConfirmationResponseDto] })
  async findMany(
    @Query() query: ListConfirmationsQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PagedConfirmationsDto> {
    const { items, total, page, pageSize } = await this.confirmations.findMany(query, user);

    return {
      items: items.map((item) => ConfirmationController.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CONFIRMATION_VIEW)
  @ApiOperation({ summary: 'Fetch one confirmation with its decision history' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfirmationResponseDto> {
    return ConfirmationController.toResponse(await this.confirmations.findOne(id, user));
  }

  @Post(':id/approve')
  @RequirePermissions(PERMISSIONS.CONFIRMATION_APPROVE)
  @Audit(AUDIT_ACTIONS.APPROVE_CONFIRMATION, 'Confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a confirmation',
    description:
      'Releases the exchange to capture evidence. The exchange itself stays at CONFIRMATION_PENDING until that happens.',
  })
  @ApiResponse({ status: 409, description: 'Already decided or expired' })
  async approve(
    @Param('id') id: string,
    @Body() dto: ApproveConfirmationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfirmationResponseDto> {
    return ConfirmationController.toResponse(await this.confirmations.approve(id, dto, user));
  }

  @Post(':id/reject')
  @RequirePermissions(PERMISSIONS.CONFIRMATION_REJECT)
  @Audit(AUDIT_ACTIONS.REJECT_CONFIRMATION, 'Confirmation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject a confirmation (reason mandatory)',
    description:
      'The exchange stops advancing and stays at CONFIRMATION_PENDING until an admin cancels it (issue 09).',
  })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectConfirmationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConfirmationResponseDto> {
    return ConfirmationController.toResponse(await this.confirmations.reject(id, dto, user));
  }
}
