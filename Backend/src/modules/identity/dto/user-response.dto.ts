import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

/**
 * `.scratch/users-read-api/spec.md` (GAP-06). Excludes every credential-
 * bearing field on purpose — never `passwordHash`, `refreshTokens`,
 * `lastLoginAt`, `email` or `phoneNumber`. Adding one of those later is a
 * strictly additive change; this response shape is deliberately the
 * minimum a screen needs today.
 */
export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'budi.santoso' })
  username!: string;

  @ApiProperty({ example: 'Budi Santoso' })
  name!: string;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;

  @ApiProperty({
    example: ['PIC_TROLI'],
    type: [String],
    description:
      'Role codes only, mirroring how AuthenticatedUser.roles and /auth/me already expose roles.',
  })
  roles!: string[];

  @ApiProperty({
    format: 'uuid',
    isArray: true,
    description:
      'Factory scope. Resolve to a name via the master-data factory lookup — factories are not users.',
  })
  factoryIds!: string[];
}
