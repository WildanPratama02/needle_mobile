import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Paginated } from '../../../common/decorators/paginated.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../../../shared/constants/permissions';
import { ListUsersQueryDto } from '../dto/user-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserDirectoryService } from '../services/user-directory.service';

const NOT_FOUND = { status: 404, description: 'No such user' };
const FORBIDDEN = { status: 403, description: 'Missing USER_MANAGE, or outside factory scope' };

const uuid = () => new ParseUUIDPipe({ errorHttpStatusCode: 400 });

/**
 * Read-only user directory (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * Lives beside `AuthController` — both read the same `User` table — rather
 * than opening a thirteenth domain module for two `GET` routes.
 *
 * No write verb here. Create, update, role and factory-scope reassignment
 * need `CHANGE_MASTER`-style audit wiring and a separate authorization
 * conversation about who may grant `USER_MANAGE` to whom.
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly userDirectory: UserDirectoryService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @Paginated()
  @ApiOperation({ summary: 'List users within the caller factory scope' })
  @ApiResponse({ status: 200, type: [UserResponseDto] })
  @ApiResponse(FORBIDDEN)
  async findMany(@Query() query: ListUsersQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.userDirectory.findMany(query, user);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USER_MANAGE)
  @ApiOperation({ summary: 'Fetch one user' })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse(FORBIDDEN)
  @ApiResponse(NOT_FOUND)
  async findOne(
    @Param('id', uuid()) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<UserResponseDto> {
    return this.userDirectory.findOne(id, user);
  }
}
