import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { PermissionResponseDto } from '../dto/permission-response.dto';
import { RoleResponseDto } from '../dto/role-response.dto';
import { RoleService } from '../services/role.service';

const FORBIDDEN = { status: 403, description: 'Missing USER_MANAGE' };

/**
 * Read-only role/permission catalogue (`.scratch/roles-permissions/spec.md`).
 *
 * Two GET routes beside `UserController` in `identity` — no new module, no
 * mutation. Neither route paginates: five roles and the fixed permission
 * catalogue are small, in-memory lists. Unaudited, matching the `GET /users`
 * precedent (Backend/CLAUDE.md §4 has no "read role catalogue" event).
 */
@ApiTags('roles')
@ApiBearerAuth()
@Controller({ version: '1' })
export class RoleController {
  constructor(private readonly roles: RoleService) {}

  @Get('roles')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'List roles with their permission grants and scoped member counts' })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findAll(@CurrentUser() user: AuthenticatedUser): Promise<RoleResponseDto[]> {
    return this.roles.findAll(user);
  }

  @Get('permissions')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'List every permission code the system enforces' })
  @ApiResponse({ status: 200, type: [PermissionResponseDto] })
  @ApiResponse(FORBIDDEN)
  findAllPermissions(): PermissionResponseDto[] {
    return this.roles.findAllPermissions().map((code) => ({ code }));
  }
}
