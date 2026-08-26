import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { UserQueryDto } from '../dto/user-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserService, UserWithRolesAndScopes } from '../services/user.service';

const FORBIDDEN = { status: 403, description: 'Missing USER_MANAGE, or outside factory scope' };
const NOT_FOUND = { status: 404, description: 'No such user' };

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * Read-only user directory (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * A separate controller beside `AuthController` rather than a new module —
 * both operate on the same `User` table `AuthService` already queries for
 * login (Backend/CLAUDE.md §3 keeps `identity` at twelve domain modules).
 *
 * Read-only in this spec: no create, update, role reassignment or
 * factory-scope reassignment. Unaudited — a read is not one of the mandatory
 * audit events (Backend/CLAUDE.md §4), matching the master-data precedent.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly users: UserService) {}

  static toResponse(row: UserWithRolesAndScopes): UserResponseDto {
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      status: row.status,
      roles: row.roles.map((link) => link.role.code),
      factoryIds: row.factoryScopes.map((scope) => scope.factoryId),
    };
  }

  @Get()
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Paginated()
  @ApiOperation({ summary: 'List users within the caller factory scope' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: UserQueryDto, @CurrentUser() user: AuthenticatedUser) {
    const { items, ...page } = await this.users.findMany(query, user);
    return { items: items.map((item) => UserController.toResponse(item)), ...page };
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'Fetch one user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(@Param('id', uuid()) id: string, @CurrentUser() user: AuthenticatedUser) {
    return UserController.toResponse(await this.users.findOne(id, user));
  }
}
