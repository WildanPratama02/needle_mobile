import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuditLog } from '@prisma/client';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { AuditQueryDto } from '../dto/audit-query.dto';
import { AuditLogResponseDto } from '../dto/audit-response.dto';
import { AuditService } from '../services/audit.service';

/**
 * Read-only audit access (`Docs/12` §17).
 *
 * `Docs/05` §24 lists this group as `/audit`; Docs/12 names it `/audit-logs`
 * and is canonical for API contracts (round 4 Q4), so that is the path.
 *
 * There is deliberately no write endpoint here. Rows arrive through
 * `AuditLogInterceptor` alone (Backend/CLAUDE.md §5); an audit trail that the
 * API could edit would not be one.
 */
@ApiTags('audit')
@ApiBearerAuth()
@Controller({ path: 'audit-logs', version: '1' })
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  private static toResponse(row: AuditLog): AuditLogResponseDto {
    return {
      id: row.id,
      timestamp: row.timestamp,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      actorUserId: row.actorUserId,
      actorDeviceId: row.actorDeviceId,
      factoryId: row.factoryId,
      requestId: row.requestId,
      beforeData: row.beforeData,
      afterData: row.afterData,
      metadata: row.metadata,
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.AUDIT_VIEW)
  @Paginated()
  @ApiOperation({
    summary: 'Query the audit trail within the caller factory scope',
    description:
      'Filters per Docs/12 §17. Newest first. Records in `data`, page counters in `meta`.',
  })
  @ApiResponse({ status: 200, type: [AuditLogResponseDto] })
  @ApiResponse({ status: 403, description: 'Missing AUDIT_VIEW' })
  async findMany(@Query() query: AuditQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, total, page, pageSize } = await this.audit.findMany(query, user);

    return {
      items: items.map((item) => AuditController.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }
}
