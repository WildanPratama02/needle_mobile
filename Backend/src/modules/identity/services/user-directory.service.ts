import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';

import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { ListUsersQueryDto } from '../dto/user-query.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { UserRepository, UserWithRolesAndScopes } from '../repositories/user.repository';

const MAX_PAGE_SIZE = 100;

export interface PagedUsers {
  items: UserResponseDto[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Read-only user directory (`.scratch/users-read-api/spec.md`, GAP-06).
 *
 * A separate service from `AuthService` on purpose: that one answers "who is
 * making this request" for the caller's own session; this one answers "which
 * users may this caller see" for anyone holding `USER_MANAGE`. Different
 * question, different permission, different audience.
 *
 * No audit decoration — these are reads, and `Backend/CLAUDE.md` §4's
 * mandatory audit event list has no "read user" entry.
 */
@Injectable()
export class UserDirectoryService {
  constructor(private readonly users: UserRepository) {}

  private static toResponse(row: UserWithRolesAndScopes): UserResponseDto {
    return {
      id: row.id,
      username: row.username,
      name: row.name,
      status: row.status,
      roles: row.roles.map((link) => link.role.code),
      factoryIds: row.factoryScopes.map((scope) => scope.factoryId),
    };
  }

  /**
   * A requested factory is intersected with the caller's scope rather than
   * replacing it, so the filter can only ever narrow what they may see —
   * the same rule `master-data.service.ts`'s `scopedFactoryIds` applies.
   */
  private static scopedFactoryIds(user: AuthenticatedUser, requested?: string): string[] {
    return requested ? user.factoryIds.filter((id) => id === requested) : user.factoryIds;
  }

  async findMany(query: ListUsersQueryDto, user: AuthenticatedUser): Promise<PagedUsers> {
    const page = query.page ?? 1;
    const pageSize = Math.min(query.pageSize ?? 20, MAX_PAGE_SIZE);
    const factoryIds = UserDirectoryService.scopedFactoryIds(user, query.factoryId);

    const { items, total } = await this.users.findManyInFactoryScope(
      factoryIds,
      query.status,
      (page - 1) * pageSize,
      pageSize,
    );

    return {
      items: items.map((row) => UserDirectoryService.toResponse(row)),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Scope is checked after loading, so a caller cannot use the difference
   * between 404 and 403 to discover which ids exist outside their scope —
   * both answers are equally available to anyone holding `USER_MANAGE`,
   * matching `MasterDataService`'s single-row lookups.
   */
  async findOne(id: string, user: AuthenticatedUser): Promise<UserResponseDto> {
    const row = await this.users.findByIdWithRolesAndScopes(id);
    if (!row) {
      throw new NotFoundException(`User not found: ${id}`);
    }

    const inScope = row.factoryScopes.some((scope) => user.factoryIds.includes(scope.factoryId));
    if (!inScope) {
      throw new ForbiddenException(`Out of factory scope: ${id}`);
    }

    return UserDirectoryService.toResponse(row);
  }
}
