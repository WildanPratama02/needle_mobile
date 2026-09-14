import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AUDIT_ACTIONS, Audit } from '../../../common/decorators/audit.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { UserQueryDto } from '../dto/user-query.dto';
import {
  AssignFactoryScopeDto,
  AssignRoleDto,
  CreateUserDto,
  UpdateUserDto,
} from '../dto/user-request.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserService, UserWithRolesAndScopes } from '../services/user.service';

const FORBIDDEN = { status: 403, description: 'Missing USER_MANAGE, or outside factory scope' };
const NOT_FOUND = { status: 404, description: 'No such user' };
const GRANT_FORBIDDEN = {
  status: 403,
  description: 'Missing USER_MANAGE, outside factory scope, or granting beyond your own access',
};

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * User directory (`.scratch/users-read-api/spec.md`, GAP-06) plus its writes
 * (`.scratch/admin-panel-crud/issues/06`).
 *
 * A separate controller beside `AuthController` rather than a new module —
 * both operate on the same `User` table `AuthService` already queries for
 * login (Backend/CLAUDE.md §3 keeps `identity` at twelve domain modules).
 *
 * Reads are unaudited. Every write is audited under `CHANGE_CONFIGURATION`
 * (Backend/CLAUDE.md §4). Roles are addressed by code, not id — the code is
 * what `/users` and `/auth/me` already expose.
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

  @Post()
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Audit(AUDIT_ACTIONS.CHANGE_CONFIGURATION, 'User')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a user with an initial password and factory scope',
    description: 'Every factoryId must be inside the caller factory scope.',
  })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse(GRANT_FORBIDDEN)
  @ApiResponse({ status: 409, description: 'username already in use' })
  async create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return UserController.toResponse(await this.users.create(dto, user));
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Audit(AUDIT_ACTIONS.CHANGE_CONFIGURATION, 'User')
  @ApiOperation({
    summary: 'Edit a user — name and status (activate/deactivate)',
    description: 'username is immutable. You cannot deactivate your own account.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async update(
    @Param('id', uuid()) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return UserController.toResponse(await this.users.update(id, dto, user));
  }

  @Post(':id/roles')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Audit(AUDIT_ACTIONS.CHANGE_CONFIGURATION, 'User')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Assign a role to a user',
    description: 'Idempotent. Refused when the role carries a permission the caller does not hold.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse(GRANT_FORBIDDEN)
  @ApiResponse({ status: 404, description: 'No such user or role' })
  async assignRole(
    @Param('id', uuid()) id: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return UserController.toResponse(await this.users.assignRole(id, dto.roleCode, user));
  }

  @Delete(':id/roles/:roleCode')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Audit(AUDIT_ACTIONS.CHANGE_CONFIGURATION, 'User')
  @ApiOperation({ summary: 'Remove a role from a user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse(GRANT_FORBIDDEN)
  @ApiResponse({ status: 404, description: 'No such user or role, or the user does not hold it' })
  async revokeRole(
    @Param('id', uuid()) id: string,
    @Param('roleCode') roleCode: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return UserController.toResponse(await this.users.revokeRole(id, roleCode, user));
  }

  @Post(':id/factory-scopes')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Audit(AUDIT_ACTIONS.CHANGE_CONFIGURATION, 'User')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Grant a user factory scope',
    description: 'Idempotent. The factory must be inside the caller factory scope.',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse(GRANT_FORBIDDEN)
  @ApiResponse({ status: 404, description: 'No such user or factory' })
  async assignFactoryScope(
    @Param('id', uuid()) id: string,
    @Body() dto: AssignFactoryScopeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return UserController.toResponse(await this.users.assignFactoryScope(id, dto.factoryId, user));
  }

  @Delete(':id/factory-scopes/:factoryId')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Audit(AUDIT_ACTIONS.CHANGE_CONFIGURATION, 'User')
  @ApiOperation({ summary: 'Remove a factory from a user scope' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'It is the user last factory scope' })
  @ApiResponse(GRANT_FORBIDDEN)
  @ApiResponse({ status: 404, description: 'No such user, or the user is not scoped to it' })
  async revokeFactoryScope(
    @Param('id', uuid()) id: string,
    @Param('factoryId', uuid()) factoryId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return UserController.toResponse(await this.users.revokeFactoryScope(id, factoryId, user));
  }
}
